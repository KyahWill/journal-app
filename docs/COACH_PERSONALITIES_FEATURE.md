# Coach Personalities Feature

## Overview

The Coach Personalities feature enables users to create and manage multiple AI coach personalities, each with customized ElevenLabs agents, voices, and coaching styles. This allows for personalized coaching experiences tailored to different user preferences and needs.

## Key Features

### 1. Multiple Personalities
- Users can create unlimited coach personalities
- Each personality has unique characteristics:
  - Name and description
  - Coaching style (supportive, direct, motivational, analytical, empathetic)
  - Custom system prompt
  - Voice settings (voice ID, stability, similarity boost)
  - First message
  - Language preference

### 2. ElevenLabs Agent Integration
- Each personality can be linked to a unique ElevenLabs agent
- Agents are created manually in the ElevenLabs dashboard
- Agent validation ensures proper configuration
- Fallback to environment variable agent if no personality is specified

### 3. Default Personality
- Users can set one personality as default
- Default personality is automatically used when no specific personality is requested
- Only one personality can be default at a time

### 4. Voice Customization
- Each personality can have its own voice
- Configurable voice stability and similarity boost
- Support for all ElevenLabs voices

### 5. Dynamic Context Integration
- Personalities work seamlessly with existing context builder
- User goals, journal entries, and progress are included in conversations
- RAG-powered semantic search for relevant journal entries

## Architecture

### Backend Components

```
backend/src/coach-personality/
├── coach-personality.dto.ts          # Data transfer objects and types
├── coach-personality.service.ts      # Business logic for personality management
├── coach-personality.controller.ts   # REST API endpoints
├── coach-personality.module.ts       # NestJS module configuration
├── README.md                         # Detailed documentation
├── FIRESTORE_SETUP.md               # Database setup guide
└── QUICKSTART.md                    # Quick start guide
```

### Updated Components

- **VoiceCoachService**: Updated to support personality-based agent selection
- **VoiceCoachController**: Updated to accept personalityId parameter
- **ElevenLabsService**: Used for agent validation
- **ContextBuilderService**: Integrated for dynamic context generation

### Database Schema

**Collection**: `coach_personalities`

```typescript
{
  id: string;
  user_id: string;
  name: string;
  description: string;
  style: 'supportive' | 'direct' | 'motivational' | 'analytical' | 'empathetic';
  system_prompt: string;
  voice_id?: string;
  voice_stability?: number;
  voice_similarity_boost?: number;
  first_message?: string;
  language?: string;
  is_default: boolean;
  elevenlabs_agent_id?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

## API Endpoints

### Coach Personality Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/coach-personalities` | Create new personality |
| GET | `/coach-personalities` | List all personalities |
| GET | `/coach-personalities/default` | Get default personality |
| GET | `/coach-personalities/:id` | Get specific personality |
| PUT | `/coach-personalities/:id` | Update personality |
| DELETE | `/coach-personalities/:id` | Delete personality |
| POST | `/coach-personalities/:id/link-agent` | Link ElevenLabs agent |

### Voice Coach Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/voice-coach/session` | Create session with personality |
| GET | `/voice-coach/signed-url` | Get signed URL with personality |

## Usage Flow

### 1. Create a Personality

```typescript
POST /coach-personalities
{
  "name": "Motivational Mike",
  "description": "High-energy coach",
  "style": "motivational",
  "systemPrompt": "You are an energetic coach...",
  "voiceId": "pNInz6obpgDQGcFmaJgB",
  "isDefault": true
}
```

### 2. Create ElevenLabs Agent

1. Go to ElevenLabs dashboard
2. Create new Conversational AI agent
3. Configure with personality settings
4. Copy agent ID

### 3. Link Agent to Personality

```typescript
POST /coach-personalities/:id/link-agent
{
  "agentId": "elevenlabs-agent-id"
}
```

### 4. Start Voice Session

```typescript
GET /voice-coach/signed-url?personalityId=personality-id
```

## Coaching Styles

### Supportive
- **Characteristics**: Empathetic, encouraging, emotionally supportive
- **Best for**: Users needing emotional support and validation
- **Example**: "I understand this is challenging. Let's work through it together."

### Direct
- **Characteristics**: Straightforward, no-nonsense, action-focused
- **Best for**: Users who prefer clear, direct guidance
- **Example**: "Here's what you need to do next. Let's get started."

### Motivational
- **Characteristics**: Energetic, inspiring, positive reinforcement
- **Best for**: Users needing motivation and encouragement
- **Example**: "You've got this! Let's crush these goals together!"

### Analytical
- **Characteristics**: Data-driven, logical, metrics-focused
- **Best for**: Users who prefer systematic, measurable approaches
- **Example**: "Your progress is at 65%. Let's analyze the data to optimize."

### Empathetic
- **Characteristics**: Understanding, compassionate, feelings-focused
- **Best for**: Users working through emotional challenges
- **Example**: "I hear you. It's okay to feel this way. Let's explore this together."

## Implementation Details

### Personality Selection Logic

1. **Explicit Selection**: If `personalityId` is provided, use that personality
2. **Default Personality**: If no `personalityId`, use user's default personality
3. **Fallback**: If no default personality, use environment variable `ELEVENLABS_AGENT_ID`

### Voice Configuration

Voice settings are applied in this order:
1. Personality-specific voice settings (if configured)
2. Agent default voice settings
3. ElevenLabs default voice

### Context Building

Each conversation includes:
- User's active goals with milestones and progress
- Recent journal entries (last 5)
- RAG-retrieved relevant journal entries (if query provided)
- User statistics (goal counts, completion rates)
- Personality-specific system prompt

## Security

### Firestore Rules

- Users can only read/write their own personalities
- Validation on required fields and data types
- Style must be one of the allowed values
- String length limits enforced

### API Security

- All endpoints require Firebase authentication
- User ID extracted from auth token
- Cross-user access prevented at service level

## Deployment

### Prerequisites

1. ElevenLabs API key configured
2. Firebase project with Firestore
3. Backend server running

### Steps

1. Deploy Firestore rules and indexes
2. Update app module to include CoachPersonalityModule
3. Restart backend server
4. Create personalities via API
5. Create and link ElevenLabs agents

### Firestore Setup

```bash
cd web
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Testing

### Unit Tests

```typescript
describe('CoachPersonalityService', () => {
  it('should create a personality', async () => {
    const personality = await service.create(userId, dto);
    expect(personality.id).toBeDefined();
  });

  it('should set default personality', async () => {
    await service.create(userId, { ...dto, isDefault: true });
    const defaultPersonality = await service.findDefault(userId);
    expect(defaultPersonality).toBeDefined();
  });

  it('should prevent deleting only personality', async () => {
    await expect(
      service.delete(userId, personalityId)
    ).rejects.toThrow();
  });
});
```

### Integration Tests

```bash
# Create personality
curl -X POST http://localhost:3000/coach-personalities \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test","style":"supportive",...}'

# Get signed URL
curl -X GET "http://localhost:3000/voice-coach/signed-url?personalityId=$ID" \
  -H "Authorization: Bearer $TOKEN"
```

## Monitoring

### Metrics to Track

- Number of personalities per user
- Most popular coaching styles
- Personality usage frequency
- Agent validation success rate
- Voice session success rate by personality

### Logging

All operations are logged with:
- User ID
- Personality ID
- Operation type
- Timestamp
- Success/failure status

## Future Enhancements

### Phase 2
- Automatic ElevenLabs agent creation via API
- Personality templates library
- Voice cloning for personalized coaching
- A/B testing framework

### Phase 3
- Personality analytics dashboard
- Shared personality marketplace
- Multi-language personality support
- Voice sample previews

### Phase 4
- AI-powered personality recommendations
- Personality effectiveness scoring
- Adaptive personality switching
- Team/organization personality sharing

## Migration Guide

### For Existing Users

Existing users will continue to work with the default agent from environment variables. No migration required.

### Optional: Create Default Personalities

```typescript
// Migration script to create default personalities
async function migrateUsers() {
  const users = await getAllUsers();
  
  for (const user of users) {
    await coachPersonalityService.create(user.id, {
      name: 'Default Coach',
      description: 'Your friendly AI coach',
      style: 'supportive',
      systemPrompt: defaultPrompt,
      isDefault: true,
    });
  }
}
```

## Troubleshooting

### Common Issues

1. **Agent not found**: Verify agent ID and API key access
2. **Default not working**: Check only one personality has `is_default: true`
3. **Voice not applied**: Verify voice ID is valid in your account
4. **Personality not used**: Ensure `elevenlabs_agent_id` is set

### Debug Mode

Enable debug logging:
```typescript
// In voice-coach.service.ts
this.logger.debug(`Using personality: ${personalityId}`);
this.logger.debug(`Agent ID: ${agentId}`);
```

## Documentation

- [README.md](../backend/src/coach-personality/README.md) - Comprehensive documentation
- [QUICKSTART.md](../backend/src/coach-personality/QUICKSTART.md) - Quick start guide
- [FIRESTORE_SETUP.md](../backend/src/coach-personality/FIRESTORE_SETUP.md) - Database setup

## Support

For issues or questions:
- Check documentation in `backend/src/coach-personality/`
- Review ElevenLabs API documentation
- Check Firebase Console for Firestore errors
- Review backend logs for detailed error messages
