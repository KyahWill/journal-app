# ElevenLabs Integration

**Voice AI capabilities for text-to-speech and conversational coaching**

---

**Last Updated**: November 2025  
**Status**: ✅ Production Ready

---

## Table of Contents

- [Overview](#overview)
- [Services Used](#services-used)
- [Setup](#setup)
- [Features](#features)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

ElevenLabs provides voice AI capabilities for the Journal application, including text-to-speech (TTS), speech-to-text (STT), and real-time conversational AI coaching. The integration enables users to interact with their AI coach through voice, making the coaching experience more natural and accessible.

**Key Features**:
- High-quality text-to-speech synthesis
- Speech-to-text transcription
- Real-time conversational AI agents
- Voice customization and selection
- WebSocket-based voice conversations
- Multi-language support

**Use Cases**:
- Voice AI coaching sessions
- Text-to-speech for coach responses
- Voice input for journal entries
- Hands-free interaction

---

## Services Used

### Text-to-Speech (TTS)

**Purpose**: Convert text to natural-sounding speech

**Features**:
- High-quality voice synthesis
- Multiple voice options
- Adjustable voice settings (stability, similarity boost)
- Streaming audio output
- Low latency

**Model**: `eleven_turbo_v2_5` (optimized for speed and quality)

**Default Voice**: Adam (professional, clear male voice)

### Speech-to-Text (STT)

**Purpose**: Transcribe audio to text

**Features**:
- Accurate transcription
- Multi-format support (MP3, WAV, WebM, FLAC, OGG)
- Fast processing
- 25MB file size limit

**Model**: `scribe_v2`

### Conversational AI

**Purpose**: Real-time voice conversations with AI agents

**Features**:
- WebSocket-based real-time communication
- Custom agent personalities
- Context-aware conversations
- Low-latency voice interaction
- Automatic speech recognition and synthesis

**Technology**: WebRTC + WebSocket

---

## Setup

### 1. Create ElevenLabs Account

1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up for an account
3. Choose a plan:
   - **Free**: 10,000 characters/month
   - **Starter**: 30,000 characters/month
   - **Creator**: 100,000 characters/month
   - **Pro**: 500,000 characters/month

### 2. Get API Key

1. Go to [Profile → API Keys](https://elevenlabs.io/app/settings/api-keys)
2. Click "Create API Key"
3. Copy the API key
4. Store securely (never commit to version control)

### 3. Create Conversational AI Agent

1. Go to [Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Click "Create Agent"
3. Configure agent:
   - **Name**: "Voice Coach"
   - **System Prompt**: Your coaching instructions
   - **First Message**: Greeting message
   - **Voice**: Select preferred voice
   - **Language**: English (or other)
4. Save and copy the Agent ID

### 4. Configure Environment Variables

**Backend API** (`.env`):
```env
# ElevenLabs API
ELEVEN_LABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id

# Voice Coach Configuration
VOICE_COACH_RATE_LIMIT_PER_HOUR=10
VOICE_COACH_SESSION_MAX_DURATION=1800
```

### 5. Install SDK

**Backend**:
```bash
cd backend
pnpm add elevenlabs
```

### 6. Initialize Client

**Backend Service** (`backend/src/elevenlabs/elevenlabs.service.ts`):
```typescript
import { ElevenLabsClient } from 'elevenlabs'

@Injectable()
export class ElevenLabsService implements OnModuleInit {
  private client: ElevenLabsClient
  
  async onModuleInit() {
    const apiKey = this.configService.get<string>('ELEVEN_LABS_API_KEY')
    
    if (!apiKey) {
      throw new Error('ELEVEN_LABS_API_KEY not found')
    }
    
    this.client = new ElevenLabsClient({ apiKey })
  }
}
```

---

## Features

### 1. Text-to-Speech (TTS)

**Purpose**: Convert coach responses to speech

**Implementation**:
```typescript
async textToSpeech(text: string, voiceId?: string): Promise<Readable> {
  const effectiveVoiceId = voiceId || this.defaultVoiceId
  
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
  
  return Readable.from(audio)
}
```

**Voice Settings**:
- **stability** (0-1): Lower = more expressive, higher = more consistent
- **similarity_boost** (0-1): How closely to match original voice
- **style** (0-1): Exaggeration of speaking style
- **use_speaker_boost**: Enhance clarity

**Usage in Application**:
- Click speaker icon next to coach messages
- Audio plays in browser
- Visual feedback during playback
- Stop button to interrupt

### 2. Speech-to-Text (STT)

**Purpose**: Transcribe voice input to text

**Implementation**:
```typescript
async speechToText(audioBuffer: Buffer, filename: string): Promise<string> {
  const audioData = new Uint8Array(audioBuffer)
  const blob = new Blob([audioData], { type: this.getMimeType(filename) })
  const audioFile = new File([blob], filename, {
    type: this.getMimeType(filename),
  })
  
  const result = await this.client.speechToText.convert({
    file: audioFile,
    model_id: 'scribe_v2',
  })
  
  return result.text || ''
}
```

**Supported Formats**:
- MP3 (audio/mpeg)
- WAV (audio/wav)
- WebM (audio/webm)
- FLAC (audio/flac)
- OGG (audio/ogg)
- M4A (audio/mp4)

**Usage in Application**:
- Microphone button in journal entry forms
- Record voice for title, content, or mood
- Automatic transcription
- Edit transcribed text before saving

### 3. Conversational AI

**Purpose**: Real-time voice conversations with AI coach

**Architecture**:
```
Client (Browser) ←→ WebSocket ←→ ElevenLabs Conversational AI
                                         ↓
                                   AI Agent
                                   (Custom Personality)
```

**Get Signed URL**:
```typescript
async getSignedUrl(config: ConversationConfig): Promise<string> {
  const overrides: any = {}
  
  if (config.customPrompt) {
    overrides.agent = {
      prompt: { prompt: config.customPrompt },
    }
  }
  
  if (config.voice) {
    overrides.agent = {
      ...overrides.agent,
      tts: {
        voice_id: config.voice.voiceId || this.defaultVoiceId,
        stability: config.voice.stability,
        similarity_boost: config.voice.similarityBoost,
      },
    }
  }
  
  const response = await this.client.conversationalAi.getSignedUrl({
    agent_id: config.agentId,
    ...(Object.keys(overrides).length > 0 && { overrides }),
  })
  
  return response.signed_url
}
```

**Client-Side Connection**:
```typescript
// Get signed URL from backend
const { signedUrl } = await fetch('/api/voice-coach/start-session', {
  method: 'POST',
  body: JSON.stringify({ personalityId }),
})

// Connect to ElevenLabs WebSocket
const conversation = await Conversation.startSession({
  signedUrl,
  onConnect: () => console.log('Connected'),
  onDisconnect: () => console.log('Disconnected'),
  onMessage: (message) => console.log('Message:', message),
  onError: (error) => console.error('Error:', error),
})

// Start conversation
await conversation.startRecording()

// End conversation
await conversation.endSession()
```

### 4. Agent Management

**Create Agent Programmatically**:
```typescript
async createAgent(config: CreateAgentConfig): Promise<string> {
  const agentPayload = {
    name: config.name,
    conversation_config: {
      agent: {
        prompt: { prompt: config.prompt },
        first_message: config.firstMessage || 'Hello! How can I help you today?',
        language: config.language || 'en',
      },
    },
  }
  
  if (config.voiceId) {
    agentPayload.conversation_config.agent.tts = {
      voice_id: config.voiceId,
      model_id: 'eleven_turbo_v2_5',
      stability: config.voiceStability,
      similarity_boost: config.voiceSimilarityBoost,
    }
  }
  
  const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
    method: 'POST',
    headers: {
      'xi-api-key': this.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(agentPayload),
  })
  
  const data = await response.json()
  return data.agent_id
}
```

**Get Agent Details**:
```typescript
async getAgentDetails(agentId: string): Promise<AgentDetails> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
    {
      headers: { 'xi-api-key': this.apiKey },
    }
  )
  
  const data = await response.json()
  
  return {
    id: data.agent_id,
    name: data.name,
    voice: {
      voiceId: data.conversation_config?.agent?.tts?.voice_id,
      stability: data.conversation_config?.agent?.tts?.stability,
      similarityBoost: data.conversation_config?.agent?.tts?.similarity_boost,
    },
    model: data.conversation_config?.agent?.tts?.model_id,
    language: data.conversation_config?.agent?.language,
  }
}
```

### 5. Voice Selection

**Get Available Voices**:
```typescript
async getVoices() {
  const voices = await this.client.voices.getAll()
  return voices.voices
}
```

**Popular Voices**:
- **Adam**: Professional, clear male voice (default)
- **Rachel**: Warm, friendly female voice
- **Domi**: Confident, strong female voice
- **Antoni**: Well-rounded male voice
- **Elli**: Emotional, expressive female voice

---

## Configuration

### API Quotas

**Free Tier**:
- 10,000 characters/month
- 3 custom voices
- Basic features

**Starter ($5/month)**:
- 30,000 characters/month
- 10 custom voices
- Commercial license

**Creator ($22/month)**:
- 100,000 characters/month
- 30 custom voices
- Priority support

**Pro ($99/month)**:
- 500,000 characters/month
- 160 custom voices
- Highest quality

### Rate Limiting

**Application Limits**:
```env
VOICE_COACH_RATE_LIMIT_PER_HOUR=10
VOICE_COACH_SESSION_MAX_DURATION=1800  # 30 minutes
```

**Implementation**:
```typescript
@Injectable()
export class RateLimitService {
  async checkVoiceCoachLimit(userId: string): Promise<void> {
    const limit = this.configService.get<number>('VOICE_COACH_RATE_LIMIT_PER_HOUR')
    const count = await this.getSessionCount(userId, 3600000) // 1 hour
    
    if (count >= limit) {
      throw new RateLimitExceededException(
        `Voice coach limit exceeded. Maximum ${limit} sessions per hour.`
      )
    }
  }
}
```

### Error Handling

**Retry Logic with Exponential Backoff**:
```typescript
private async executeWithRetry<T>(
  fn: () => Promise<T>,
  retryCount = 0,
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (this.isNonRetryableError(error) || retryCount >= this.maxRetries) {
      throw error
    }
    
    const delay = this.baseRetryDelay * Math.pow(2, retryCount)
    await this.sleep(delay)
    
    return this.executeWithRetry(fn, retryCount + 1)
  }
}
```

**Non-Retryable Errors**:
- 400 Bad Request
- 401 Unauthorized
- 404 Not Found
- 429 Rate Limit Exceeded

---

## Usage Examples

### Text-to-Speech

**Backend Endpoint**:
```typescript
@Post('text-to-speech')
async textToSpeech(@Body() dto: TextToSpeechDto, @Res() res: Response) {
  const audioStream = await this.elevenLabsService.textToSpeech(dto.text)
  
  res.set({
    'Content-Type': 'audio/mpeg',
    'Transfer-Encoding': 'chunked',
  })
  
  audioStream.pipe(res)
}
```

**Frontend Usage**:
```typescript
const playAudio = async (text: string) => {
  const response = await fetch('/api/elevenlabs/text-to-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  
  const audioBlob = await response.blob()
  const audioUrl = URL.createObjectURL(audioBlob)
  const audio = new Audio(audioUrl)
  
  await audio.play()
}
```

### Speech-to-Text

**Backend Endpoint**:
```typescript
@Post('speech-to-text')
@UseInterceptors(FileInterceptor('audio'))
async speechToText(@UploadedFile() file: Express.Multer.File) {
  const transcription = await this.elevenLabsService.speechToText(
    file.buffer,
    file.originalname
  )
  
  return { transcription }
}
```

**Frontend Usage**:
```typescript
const transcribeAudio = async (audioBlob: Blob) => {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')
  
  const response = await fetch('/api/elevenlabs/speech-to-text', {
    method: 'POST',
    body: formData,
  })
  
  const { transcription } = await response.json()
  return transcription
}
```

### Voice Conversation

**Start Session**:
```typescript
const startVoiceSession = async (personalityId: string) => {
  // Get signed URL from backend
  const response = await fetch('/api/voice-coach/start-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personalityId }),
  })
  
  const { signedUrl, sessionId } = await response.json()
  
  // Connect to ElevenLabs
  const conversation = await Conversation.startSession({
    signedUrl,
    onConnect: () => setStatus('connected'),
    onDisconnect: () => setStatus('disconnected'),
    onMessage: (message) => addMessage(message),
    onError: (error) => handleError(error),
  })
  
  return { conversation, sessionId }
}
```

**End Session**:
```typescript
const endVoiceSession = async (conversation, sessionId) => {
  await conversation.endSession()
  
  await fetch(`/api/voice-coach/end-session/${sessionId}`, {
    method: 'POST',
  })
}
```

---

## Best Practices

### Performance

1. **Stream audio** for TTS (don't buffer entire response)
2. **Use WebM format** for STT (best browser support)
3. **Implement caching** for frequently used TTS
4. **Limit recording duration** (30 minutes max)
5. **Handle network interruptions** gracefully
6. **Monitor latency** and optimize

### Cost Optimization

1. **Cache TTS audio** for repeated phrases
2. **Implement rate limiting** per user
3. **Set session duration limits**
4. **Monitor character usage** in dashboard
5. **Use appropriate voice quality** (turbo vs standard)
6. **Set up billing alerts**

### User Experience

1. **Show loading states** during TTS generation
2. **Provide visual feedback** during recording
3. **Allow interruption** of playback
4. **Handle microphone permissions** gracefully
5. **Display transcription** before submitting
6. **Provide fallback** for unsupported browsers

### Security

1. **Never expose API key** to clients
2. **Use server-side proxy** for all ElevenLabs calls
3. **Validate audio files** before processing
4. **Implement rate limiting** per user
5. **Monitor for abuse** (excessive usage)
6. **Sanitize transcriptions** before storing

---

## Troubleshooting

### API Key Errors

**Error**: `Invalid API key` or `Unauthorized`

**Solutions**:
1. Verify `ELEVEN_LABS_API_KEY` is set correctly
2. Check API key is active in ElevenLabs dashboard
3. Ensure no extra spaces in key
4. Verify account has sufficient credits
5. Restart server after env changes

### Rate Limit Errors

**Error**: `429 Too Many Requests`

**Solutions**:
1. Implement exponential backoff retry
2. Add rate limiting per user
3. Monitor usage in ElevenLabs dashboard
4. Upgrade plan if needed
5. Cache TTS responses
6. Reduce request frequency

### Audio Quality Issues

**Issue**: Poor audio quality or robotic voice

**Solutions**:
1. Adjust voice settings (stability, similarity_boost)
2. Try different voices
3. Use higher quality model (not turbo)
4. Check audio format compatibility
5. Ensure good network connection
6. Verify browser audio support

### Transcription Errors

**Error**: `Transcription failed` or inaccurate results

**Solutions**:
1. Check audio file format is supported
2. Verify file size under 25MB
3. Ensure audio quality is good
4. Check for background noise
5. Try different audio format
6. Verify microphone permissions

### WebSocket Connection Issues

**Error**: `Connection failed` or `WebSocket closed`

**Solutions**:
1. Check network connectivity
2. Verify signed URL is valid (not expired)
3. Ensure agent ID is correct
4. Check firewall/proxy settings
5. Implement reconnection logic
6. Monitor connection status

### High Costs

**Issue**: Unexpected ElevenLabs charges

**Solutions**:
1. Monitor character usage in dashboard
2. Implement strict rate limiting
3. Cache TTS responses
4. Set session duration limits
5. Review usage patterns
6. Set up billing alerts

---

## Related Documentation

- [Voice Coach Feature](../features/voice-coach.md)
- [Backend Architecture](../architecture/backend-architecture.md)
- [Environment Variables](../setup/environment-variables.md)
- [API Reference](../API_REFERENCE.md#voice-coach)

---

## Additional Resources

- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [Conversational AI Guide](https://elevenlabs.io/docs/conversational-ai/overview)
- [Voice Library](https://elevenlabs.io/voice-library)
- [API Reference](https://elevenlabs.io/docs/api-reference/overview)
- [Pricing](https://elevenlabs.io/pricing)

---

**Last Updated**: November 2025  
**Status**: ✅ Production Ready
