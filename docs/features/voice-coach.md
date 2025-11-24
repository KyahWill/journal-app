# Voice Coach Feature

**Real-time voice coaching with ElevenLabs Conversational AI**

---

**Last Updated**: November 2025  
**Status**: ✅ Complete

---

## Overview

The Voice Coach feature provides real-time voice conversations with AI coaches powered by ElevenLabs Conversational AI. Users can create multiple coach personalities with different styles, voices, and approaches to coaching.

## Key Features

### Voice Interaction

#### Real-time Conversations
- Natural speech recognition
- High-quality voice synthesis
- Low-latency responses (< 1 second)
- WebSocket-based communication
- Continuous conversation flow
- Interrupt handling

#### Audio Quality
- Professional voice quality
- Clear speech recognition
- Noise cancellation
- Echo cancellation
- Automatic gain control

### Coach Personalities

#### Multiple Personalities
- Create unlimited coach personalities
- Customize each personality:
  - Name and description
  - Coaching style
  - System prompt
  - Voice settings
  - First message
  - Language

#### Coaching Styles
- **Supportive**: Warm, encouraging, emotionally supportive
- **Direct**: Straightforward, no-nonsense, action-focused
- **Motivational**: High-energy, inspiring, positive reinforcement
- **Analytical**: Data-driven, logical, metrics-focused
- **Empathetic**: Understanding, compassionate, feelings-focused

#### Default Personalities
Three coaches created automatically on first use:
1. **Supportive Coach** (default)
   - Voice: Adam (professional, clear)
   - Style: Balanced, encouraging, practical
2. **Motivational Coach**
   - Voice: Domi (energetic, enthusiastic)
   - Style: High-energy, celebrates wins
3. **Analytical Coach**
   - Voice: Bella (professional, warm)
   - Style: Data-driven, systematic

### Dynamic Context Integration

#### User Goals
- Active goals with milestones
- Progress percentages
- Target dates
- Completion status
- Recent updates

#### Journal Entries
- Recent entries (last 5)
- RAG-retrieved relevant entries
- Entry summaries
- Mood tracking

#### User Statistics
- Goal counts
- Completion rates
- Writing streaks
- Progress trends

### Session Management

#### Create Sessions
- Start voice coaching session
- Select personality
- Configure settings
- Generate signed URL

#### Session History
- Track all sessions
- Conversation transcripts
- Session duration
- Personality used
- Session analytics

#### Session Controls
- Start/stop conversation
- Pause/resume
- End session
- Switch personality

### Voice Customization

#### Voice Selection
- Choose from ElevenLabs voices
- Preview voices
- Custom voice settings per personality

#### Voice Parameters
- **Stability** (0-1): Consistency vs expressiveness
- **Similarity Boost** (0-1): Voice similarity to original
- **Style** (0-1): Exaggeration of speaking style

#### Language Support
- Multiple language options
- Language-specific voices
- Automatic language detection

## Architecture

### Database Schema

#### Coach Personalities Collection

```typescript
interface CoachPersonality {
  id: string
  user_id: string
  name: string
  description: string
  style: 'supportive' | 'direct' | 'motivational' | 'analytical' | 'empathetic'
  system_prompt: string
  voice_id?: string
  voice_stability?: number
  voice_similarity_boost?: number
  first_message?: string
  language?: string
  is_default: boolean
  elevenlabs_agent_id?: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Indexes**:
- `user_id + created_at` (DESC)
- `user_id + is_default`

#### Voice Sessions Collection

```typescript
interface VoiceSession {
  id: string
  user_id: string
  personality_id: string
  started_at: Timestamp
  ended_at?: Timestamp
  duration_seconds?: number
  transcript?: string
  agent_id: string
}
```

**Indexes**:
- `user_id + started_at` (DESC)
- `personality_id + started_at` (DESC)

### Components

#### VoiceInterface
- Main voice conversation UI
- Microphone controls
- Visual feedback
- Transcript display
- Session controls

#### CoachSessionsSidebar
- Session history list
- Session details
- Transcript viewer
- Session analytics

#### ConversationTranscript
- Real-time transcript
- Speaker identification
- Timestamp display
- Export functionality

#### AudioControls
- Volume control
- Mute/unmute
- Audio quality indicator
- Connection status

#### VoiceCoachOnboarding
- First-time setup
- Personality selection
- Microphone permission
- Quick tutorial

### API Endpoints

#### Personality Management

**GET /coach-personalities**
- Get all personalities for user
- Returns: Array of personalities

**GET /coach-personalities/default**
- Get default personality
- Creates default if none exists
- Returns: Personality object

**GET /coach-personalities/:id**
- Get specific personality
- Returns: Personality object

**POST /coach-personalities**
- Create new personality
- Body: Personality data
- Returns: Created personality

**PUT /coach-personalities/:id**
- Update personality
- Body: Partial personality data
- Returns: Updated personality

**DELETE /coach-personalities/:id**
- Delete personality
- Cannot delete if only personality
- Returns: Success message

**POST /coach-personalities/:id/link-agent**
- Link ElevenLabs agent to personality
- Body: { agentId }
- Returns: Updated personality

**POST /coach-personalities/initialize**
- Create default personalities
- Returns: Array of created personalities

#### Voice Session Management

**POST /voice-coach/session**
- Create voice coaching session
- Body: { personalityId? }
- Returns: Session object

**GET /voice-coach/signed-url**
- Get signed URL for ElevenLabs conversation
- Query: personalityId?
- Returns: { signedUrl, agentId }

**GET /voice-coach/sessions**
- Get session history
- Returns: Array of sessions

**GET /voice-coach/sessions/:id**
- Get specific session
- Returns: Session object with transcript

## Usage Examples

### Creating a Personality

```typescript
import { apiClient } from '@/lib/api/client'

const personality = await apiClient.createCoachPersonality({
  name: 'Motivational Mike',
  description: 'High-energy coach for motivation',
  style: 'motivational',
  systemPrompt: 'You are an energetic coach...',
  voiceId: 'pNInz6obpgDQGcFmaJgB',
  voiceStability: 0.7,
  voiceSimilarityBoost: 0.8,
  firstMessage: 'Hey champion! Ready to crush some goals?',
  language: 'en',
  isDefault: false
})
```

### Starting a Voice Session

```typescript
// Get signed URL for conversation
const { signedUrl, agentId } = await apiClient.getVoiceCoachSignedUrl(
  personalityId
)

// Use ElevenLabs SDK to start conversation
const conversation = await ElevenLabs.Conversation.startSession({
  signedUrl,
  onConnect: () => console.log('Connected'),
  onMessage: (message) => console.log('AI:', message),
  onDisconnect: () => console.log('Disconnected')
})

// Start speaking
await conversation.startListening()
```

### Using Default Personality

```typescript
// Get or create default personality
const defaultPersonality = await apiClient.getDefaultCoachPersonality()

// Start session with default
const { signedUrl } = await apiClient.getVoiceCoachSignedUrl(
  defaultPersonality.id
)
```

## Features in Detail

### Automatic Personality Initialization

On first use, the system automatically creates 3 default personalities:

**Process**:
1. User accesses voice coach
2. System checks for existing personalities
3. If none exist, creates 3 defaults
4. Generates ElevenLabs agents for each
5. Sets Supportive Coach as default
6. User can immediately start coaching

**Benefits**:
- No setup required
- Instant access to coaching
- Multiple styles to try
- Professional configuration

### Personality Selection Logic

The system selects personalities in this order:

1. **Explicit Selection**: If `personalityId` provided, use that
2. **Default Personality**: If no `personalityId`, use user's default
3. **Fallback**: If no default, use environment variable agent

This ensures users always have a working coach.

### Context Building

Each conversation includes rich context:

**Goal Context**:
```typescript
{
  activeGoals: [
    {
      title: "Complete React Course",
      progress: 60,
      milestones: [
        { title: "Module 1", completed: true },
        { title: "Module 2", completed: false }
      ]
    }
  ],
  completedGoals: 5,
  totalGoals: 8
}
```

**Journal Context**:
```typescript
{
  recentEntries: [
    {
      date: "2024-11-20",
      title: "Great progress today",
      content: "Completed 3 lessons..."
    }
  ],
  relevantEntries: [
    // RAG-retrieved entries based on conversation
  ]
}
```

**User Stats**:
```typescript
{
  totalGoals: 8,
  completedGoals: 5,
  completionRate: 62.5,
  totalEntries: 45,
  writingStreak: 7
}
```

### Voice Configuration

Each personality can have custom voice settings:

**Voice ID**: Choose from ElevenLabs voices
- Adam: Professional, clear male voice
- Bella: Warm, professional female voice
- Domi: Energetic, enthusiastic female voice
- Rachel: Calm, soothing female voice
- Antoni: Authoritative, deep male voice

**Stability** (0-1):
- Low (0.3): More expressive, varied
- Medium (0.5): Balanced
- High (0.8): Consistent, predictable

**Similarity Boost** (0-1):
- Low (0.3): More creative interpretation
- Medium (0.5): Balanced
- High (0.8): Closer to original voice

### ElevenLabs Agent Integration

Each personality links to an ElevenLabs Conversational AI agent:

**Agent Creation**:
1. Create agent in ElevenLabs dashboard
2. Configure with personality settings
3. Copy agent ID
4. Link to personality via API

**Agent Configuration**:
- System prompt from personality
- Voice settings from personality
- First message from personality
- Language from personality

**Agent Validation**:
- Verify agent exists before linking
- Check agent accessibility
- Validate agent configuration

## Performance Optimizations

### Low Latency
- WebSocket communication
- Optimized audio encoding
- Efficient context building
- Cached personality data

### Bandwidth Optimization
- Compressed audio streams
- Efficient transcript encoding
- Minimal context updates
- Selective data sync

### Battery Optimization
- Efficient audio processing
- Sleep mode detection
- Background task management
- Power-aware quality settings

## Testing

### Manual Testing Checklist

- [ ] Create custom personality
- [ ] Edit personality settings
- [ ] Delete personality
- [ ] Set default personality
- [ ] Start voice session with default
- [ ] Start voice session with custom personality
- [ ] Have conversation with coach
- [ ] Test microphone input
- [ ] Test speaker output
- [ ] View session history
- [ ] View conversation transcript
- [ ] Test on mobile device
- [ ] Test with poor network
- [ ] Test with no microphone permission
- [ ] Test personality switching mid-session

### API Testing

```bash
# Create personality
curl -X POST http://localhost:3001/api/v1/coach-personalities \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Coach",
    "style": "supportive",
    "systemPrompt": "You are a supportive coach...",
    "isDefault": true
  }'

# Get signed URL
curl "http://localhost:3001/api/v1/voice-coach/signed-url?personalityId=$ID" \
  -H "Authorization: Bearer $TOKEN"

# Get session history
curl http://localhost:3001/api/v1/voice-coach/sessions \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Voice not working

**Symptoms**: Can't hear coach or coach can't hear user

**Possible Causes**:
1. Microphone permission denied
2. Speaker/headphones not connected
3. Browser doesn't support WebRTC
4. Network firewall blocking WebSocket

**Solutions**:
1. Grant microphone permission
2. Check audio devices
3. Use supported browser
4. Check network configuration

### Personality not found

**Symptoms**: Error when starting session

**Possible Causes**:
1. Personality deleted
2. Invalid personality ID
3. No default personality set

**Solutions**:
1. Create new personality
2. Verify personality ID
3. Set default personality
4. Use automatic initialization

### Poor audio quality

**Symptoms**: Choppy or unclear audio

**Possible Causes**:
1. Poor network connection
2. Low bandwidth
3. Background noise
4. Microphone quality

**Solutions**:
1. Check network speed
2. Close other applications
3. Use quiet environment
4. Use better microphone

## Future Enhancements

### Planned Features

- [ ] Voice cloning for personalized coaching
- [ ] Multi-language support
- [ ] Voice sample previews
- [ ] Personality effectiveness scoring
- [ ] Adaptive personality switching
- [ ] Group coaching sessions
- [ ] Scheduled coaching sessions
- [ ] Session reminders
- [ ] Session goals
- [ ] Session summaries

### Potential Improvements

- [ ] Emotion detection in voice
- [ ] Sentiment analysis
- [ ] Conversation insights
- [ ] Coaching recommendations
- [ ] Progress tracking
- [ ] Goal integration
- [ ] Habit tracking
- [ ] Mood analysis
- [ ] Voice journaling
- [ ] Voice notes

## Related Documentation

- [API Reference](../API_REFERENCE.md#voice-coach)
- [ElevenLabs Integration](../integrations/elevenlabs.md)
- [Chat Feature](./chat.md)
- [RAG System](./rag-system.md)

