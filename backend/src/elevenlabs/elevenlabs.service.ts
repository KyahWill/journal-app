import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ElevenLabsClient, stream } from 'elevenlabs'
import { Readable } from 'stream'

@Injectable()
export class ElevenLabsService implements OnModuleInit {
  private client: ElevenLabsClient
  private readonly logger = new Logger(ElevenLabsService.name)
  private readonly defaultVoiceId = 'pNInz6obpgDQGcFmaJgB' // Adam voice - clear, professional

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
}

