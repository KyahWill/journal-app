import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ElevenLabsClient, stream } from 'elevenlabs'
import { Readable } from 'stream'
import { ElevenLabsApiException } from '@/voice-coach/exceptions/voice-coach.exceptions'

export interface AgentDetails {
  id: string;
  name: string;
  voice?: {
    voiceId: string;
    stability?: number;
    similarityBoost?: number;
  };
  model?: string;
  language?: string;
}

export interface CreateAgentConfig {
  name: string;
  prompt: string;
  firstMessage?: string;
  language?: string;
  voiceId?: string;
  voiceStability?: number;
  voiceSimilarityBoost?: number;
}

export interface ConversationConfig {
  agentId: string;
  customPrompt?: string;
  language?: string;
  voice?: {
    voiceId?: string;
    stability?: number;
    similarityBoost?: number;
  };
  firstMessage?: string;
}

@Injectable()
export class ElevenLabsService implements OnModuleInit {
  private client: ElevenLabsClient
  private readonly logger = new Logger(ElevenLabsService.name)
  private readonly defaultVoiceId = 'pNInz6obpgDQGcFmaJgB' // Adam voice - clear, professional
  private readonly maxRetries = 3
  private readonly baseRetryDelay = 1000 // 1 second

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const apiKey = this.configService.get<string>('ELEVEN_LABS_API_KEY')

      if (!apiKey) {
        throw new Error('ELEVEN_LABS_API_KEY not found in environment variables')
      }

      this.client = new ElevenLabsClient({
        apiKey: apiKey,
      })

      this.logger.log('ElevenLabs client initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize ElevenLabs client', error)
      throw error
    }
  }

  /**
   * Convert text to speech and return audio stream
   */
  async textToSpeech(text: string, voiceId?: string): Promise<Readable> {
    try {
      const effectiveVoiceId = voiceId || this.defaultVoiceId

      this.logger.log(`Converting text to speech with voice: ${effectiveVoiceId}`)

      // Use the ElevenLabs stream helper to get audio
      const audio = await this.client.textToSpeech.convert(effectiveVoiceId, {
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      })

      // Convert async iterable to Node.js Readable stream
      const readable = Readable.from(audio)

      this.logger.log('Text-to-speech conversion successful')
      return readable
    } catch (error) {
      this.logger.error('Error in text-to-speech conversion', error)
      throw error
    }
  }

  /**
   * Convert speech to text from audio buffer
   */
  async speechToText(audioBuffer: Buffer, filename: string): Promise<string> {
    try {
      this.logger.log(`Converting speech to text from file: ${filename}`)

      // Convert Buffer to Uint8Array for compatibility
      const audioData = new Uint8Array(audioBuffer)
      
      // Create a Blob from the audio data
      const blob = new Blob([audioData], { type: this.getMimeType(filename) })
      
      // Create a File object from the Blob
      const audioFile = new File([blob], filename, {
        type: this.getMimeType(filename),
      })

      // Call ElevenLabs speech-to-text API
      const result = await this.client.speechToText.convert({
        file: audioFile,
        model_id: 'scribe_v2',
      })

      const transcription = result.text || ''

      this.logger.log('Speech-to-text conversion successful')
      return transcription
    } catch (error) {
      this.logger.error('Error in speech-to-text conversion', error)
      throw error
    }
  }

  /**
   * Get MIME type from filename extension
   */
  private getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop()
    const mimeTypes: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      webm: 'audio/webm',
      flac: 'audio/flac',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
    }
    return mimeTypes[ext || ''] || 'audio/mpeg'
  }

  /**
   * Get list of available voices (optional feature for later)
   */
  async getVoices() {
    try {
      const voices = await this.client.voices.getAll()
      return voices.voices
    } catch (error) {
      this.logger.error('Error fetching voices', error)
      throw error
    }
  }

  /**
   * Get signed URL for ElevenLabs Conversational AI WebSocket connection
   * This URL allows the client to establish a direct WebRTC/WebSocket connection
   * with ElevenLabs for real-time voice conversations
   */
  async getSignedUrl(config: ConversationConfig): Promise<string> {
    return this.executeWithRetry(async () => {
      try {
        this.logger.log(`Generating signed URL for agent: ${config.agentId}`);

        // Build the conversation override payload
        const overrides: any = {};

        if (config.customPrompt) {
          overrides.agent = {
            prompt: {
              prompt: config.customPrompt,
            },
          };
        }

        if (config.firstMessage) {
          overrides.agent = {
            ...overrides.agent,
            first_message: config.firstMessage,
          };
        }

        if (config.language) {
          overrides.agent = {
            ...overrides.agent,
            language: config.language,
          };
        }

        if (config.voice) {
          overrides.agent = {
            ...overrides.agent,
            tts: {
              voice_id: config.voice.voiceId || this.defaultVoiceId,
              ...(config.voice.stability !== undefined && {
                stability: config.voice.stability,
              }),
              ...(config.voice.similarityBoost !== undefined && {
                similarity_boost: config.voice.similarityBoost,
              }),
            },
          };
        }

        // Call ElevenLabs API to get signed URL
        const response = await this.client.conversationalAi.getSignedUrl({
          agent_id: config.agentId,
          ...(Object.keys(overrides).length > 0 && { overrides }),
        });

        if (!response || !response.signed_url) {
          throw new ElevenLabsApiException(
            'Failed to get signed URL from ElevenLabs',
          );
        }

        this.logger.log('Signed URL generated successfully');
        return response.signed_url;
      } catch (error) {
        this.logger.error('Error generating signed URL', error);
        
        // Enhanced error handling with user-friendly messages
        if (error.status === 429 || error.statusCode === 429) {
          throw new ElevenLabsApiException(
            'ElevenLabs API rate limit exceeded. Please try again in a few minutes.',
            error,
          );
        } else if (error.status === 401 || error.statusCode === 401) {
          throw new ElevenLabsApiException(
            'ElevenLabs API authentication failed. Please contact support.',
            error,
          );
        } else if (error.status === 404 || error.statusCode === 404) {
          throw new ElevenLabsApiException(
            'Voice agent not found. Please contact support.',
            error,
          );
        } else if (error.status === 503 || error.statusCode === 503) {
          throw new ElevenLabsApiException(
            'ElevenLabs service is temporarily unavailable. Please try again later.',
            error,
          );
        }
        
        throw new ElevenLabsApiException(
          `Failed to generate signed URL: ${error.message}`,
          error,
        );
      }
    });
  }

  /**
   * Validate that an agent exists and is properly configured
   */
  async validateAgent(agentId: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      try {
        this.logger.log(`Validating agent: ${agentId}`);

        // Try to get agent details - if it fails, agent doesn't exist or isn't accessible
        const details = await this.getAgentDetails(agentId);

        if (!details || !details.id) {
          this.logger.warn(`Agent validation failed: ${agentId}`);
          return false;
        }

        this.logger.log(`Agent validated successfully: ${agentId}`);
        return true;
      } catch (error) {
        this.logger.error(`Error validating agent: ${agentId}`, error);
        return false;
      }
    });
  }

  /**
   * Create a new conversational AI agent via ElevenLabs API
   */
  async createAgent(config: CreateAgentConfig): Promise<string> {
    return this.executeWithRetry(async () => {
      try {
        this.logger.log(`Creating ElevenLabs agent: ${config.name}`);

        const apiKey = this.configService.get<string>('ELEVEN_LABS_API_KEY');
        
        // Build agent configuration according to ElevenLabs API spec
        const agentPayload: any = {
          name: config.name,
          conversation_config: {
            agent: {
              prompt: {
                prompt: config.prompt,
              },
              first_message: config.firstMessage || 'Hello! How can I help you today?',
              language: config.language || 'en',
            },
          },
        };

        // Add TTS configuration if voice settings provided
        if (config.voiceId) {
          agentPayload.conversation_config.agent.tts = {
            voice_id: config.voiceId,
            model_id: 'eleven_turbo_v2_5',
          };

          if (config.voiceStability !== undefined) {
            agentPayload.conversation_config.agent.tts.stability = config.voiceStability;
          }

          if (config.voiceSimilarityBoost !== undefined) {
            agentPayload.conversation_config.agent.tts.similarity_boost = config.voiceSimilarityBoost;
          }
        }

        // Call ElevenLabs REST API to create agent
        const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(agentPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { raw: errorText };
          }
          
          this.logger.error('ElevenLabs agent creation failed:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            config: {
              name: config.name,
              hasPrompt: !!config.prompt,
              promptLength: config.prompt?.length,
              voiceId: config.voiceId,
            },
          });
          
          throw new Error(
            `Failed to create agent: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
          );
        }

        const data = await response.json();
        const agentId = data.agent_id;

        if (!agentId) {
          throw new Error('Agent creation succeeded but no agent_id returned');
        }

        this.logger.log(`Agent created successfully: ${agentId}`);
        return agentId;
      } catch (error) {
        this.logger.error('Error creating agent', error);
        throw new ElevenLabsApiException(
          `Failed to create agent: ${error.message}`,
          error,
        );
      }
    });
  }

  /**
   * Get agent details from ElevenLabs
   */
  async getAgentDetails(agentId: string): Promise<AgentDetails> {
    return this.executeWithRetry(async () => {
      try {
        this.logger.log(`Fetching agent details: ${agentId}`);

        const apiKey = this.configService.get<string>('ELEVEN_LABS_API_KEY');

        // Call ElevenLabs REST API to get agent details
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
          method: 'GET',
          headers: {
            'xi-api-key': apiKey!,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get agent: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        const details: AgentDetails = {
          id: data.agent_id,
          name: data.name || 'Voice Coach Agent',
          voice: {
            voiceId: data.conversation_config?.agent?.tts?.voice_id || this.defaultVoiceId,
            stability: data.conversation_config?.agent?.tts?.stability || 0.5,
            similarityBoost: data.conversation_config?.agent?.tts?.similarity_boost || 0.75,
          },
          model: data.conversation_config?.agent?.tts?.model_id || 'eleven_turbo_v2_5',
          language: data.conversation_config?.agent?.language || 'en',
        };

        this.logger.log('Agent details retrieved successfully');
        return details;
      } catch (error) {
        this.logger.error('Error fetching agent details', error);
        throw new ElevenLabsApiException(
          `Failed to get agent details: ${error.message}`,
          error,
        );
      }
    });
  }

  /**
   * Execute a function with exponential backoff retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retryCount = 0,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on certain errors
      if (this.isNonRetryableError(error)) {
        throw error;
      }

      // Check if we've exceeded max retries
      if (retryCount >= this.maxRetries) {
        this.logger.error(
          `Max retries (${this.maxRetries}) exceeded`,
          error,
        );
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = this.baseRetryDelay * Math.pow(2, retryCount);
      this.logger.warn(
        `Retry attempt ${retryCount + 1}/${this.maxRetries} after ${delay}ms`,
      );

      // Wait before retrying
      await this.sleep(delay);

      // Retry
      return this.executeWithRetry(fn, retryCount + 1);
    }
  }

  /**
   * Check if an error should not be retried
   */
  private isNonRetryableError(error: any): boolean {
    // Don't retry on authentication errors (401)
    if (error.status === 401 || error.statusCode === 401) {
      return true;
    }

    // Don't retry on bad request errors (400)
    if (error.status === 400 || error.statusCode === 400) {
      return true;
    }

    // Don't retry on not found errors (404)
    if (error.status === 404 || error.statusCode === 404) {
      return true;
    }

    // Don't retry on rate limit errors (429) - these should be handled differently
    if (error.status === 429 || error.statusCode === 429) {
      return true;
    }

    return false;
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

