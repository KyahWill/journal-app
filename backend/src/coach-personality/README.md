# Coach Personality System

This module enables users to create and manage multiple AI coach personalities, each with customized ElevenLabs agents, voices, and coaching styles.

## Overview

The Coach Personality system allows users to:
- Create multiple coach personalities with different styles and voices
- Link each personality to a unique ElevenLabs agent
- Customize system prompts, first messages, and voice settings
- Set a default personality for voice coaching sessions
- Switch between personalities during conversations

## Architecture

### Components

1. **CoachPersonalityService** - Manages CRUD operations for coach personalities
2. **CoachPersonalityController** - REST API endpoints for personality management
3. **VoiceCoachService** - Updated to support personality-based agent selection
4. **ElevenLabsService** - Handles agent validation and signed URL generation

### Database Schema

**Collection:** `coach_personalities`

```typescript
{
  id: string;                      // Auto-generated document ID
  user_id: string;                 // Firebase Auth UID
  name: string;                    // Personality name (e.g., "Motivational Mike")
  description: string;             // Description of the personality
  style: CoachingStyle;            // Enum: supportive, direct, motivational, analytical, empathetic
  system_prompt: string;           // Custom system prompt for the agent
  voice_id?: string;               // ElevenLabs voice ID
  voice_stability?: number;        // Voice stability (0-1)
  voice_similarity_boost?: number; // Voice similarity boost (0-1)
  first_message?: string;          // Custom first message
  language?: string;               // Language code (default: 'en')
  is_default: boolean;             // Whether this is the default personality
  elevenlabs_agent_id?: string;    // Linked ElevenLabs agent ID
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

## API Endpoints

### Create Coach Personality

```http
POST /coach-personalities
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "name": "Motivational Mike",
  "description": "An energetic and motivational coach who pushes you to achieve your goals",
  "style": "motivational",
  "systemPrompt": "You are Motivational Mike, an energetic coach who believes in the power of positive thinking...",
  "voiceId": "pNInz6obpgDQGcFmaJgB",
  "voiceStability": 0.6,
  "voiceSimilarityBoost": 0.8,
  "firstMessage": "Hey there champion! Ready to crush some goals today?",
  "language": "en",
  "isDefault": true
}
```

### Get All Personalities

```http
GET /coach-personalities
Authorization: Bearer <firebase-token>
```

### Get Default Personality

```http
GET /coach-personalities/default
Authorization: Bearer <firebase-token>
```

### Get Specific Personality

```http
GET /coach-personalities/:id
Authorization: Bearer <firebase-token>
```

### Update Personality

```http
PUT /coach-personalities/:id
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "isDefault": true
}
```

### Delete Personality

```http
DELETE /coach-personalities/:id
Authorization: Bearer <firebase-token>
```

### Link ElevenLabs Agent

```http
POST /coach-personalities/:id/link-agent
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "agentId": "elevenlabs-agent-id-here"
}
```

## Usage with Voice Coach

### Create Session with Personality

```http
POST /voice-coach/session
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "personalityId": "personality-doc-id"
}
```

If `personalityId` is not provided, the default personality will be used.

### Get Signed URL with Personality

```http
GET /voice-coach/signed-url?personalityId=personality-doc-id
Authorization: Bearer <firebase-token>
```

## Coaching Styles

The system supports five coaching styles:

1. **Supportive** - Empathetic, encouraging, focuses on emotional support
2. **Direct** - Straightforward, no-nonsense, focuses on action
3. **Motivational** - Energetic, inspiring, focuses on positive reinforcement
4. **Analytical** - Data-driven, logical, focuses on metrics and progress
5. **Empathetic** - Understanding, compassionate, focuses on feelings and challenges

## ElevenLabs Agent Setup

### Manual Agent Creation

Currently, ElevenLabs agents must be created manually in the ElevenLabs dashboard:

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Create a new Conversational AI agent
3. Configure the agent with:
   - Voice selection
   - System prompt
   - First message
   - Language settings
4. Copy the agent ID
5. Use the `/coach-personalities/:id/link-agent` endpoint to link it

### Agent Configuration Best Practices

- **System Prompt**: Include personality traits, coaching style, and user context handling
- **Voice Selection**: Choose voices that match the personality (energetic, calm, professional, etc.)
- **First Message**: Make it engaging and personality-specific
- **Language**: Ensure consistency between personality language and agent language

## Example Personalities

### 1. Motivational Mike

```json
{
  "name": "Motivational Mike",
  "description": "High-energy coach who believes you can achieve anything",
  "style": "motivational",
  "systemPrompt": "You are Motivational Mike, an energetic and enthusiastic life coach. You believe in the power of positive thinking and always encourage users to push beyond their limits. Use exclamation points, celebrate small wins, and remind users of their potential. Reference their goals and progress frequently.",
  "firstMessage": "Hey there champion! I'm so pumped to work with you today! What goal are we crushing?",
  "voiceId": "pNInz6obpgDQGcFmaJgB"
}
```

### 2. Analytical Anna

```json
{
  "name": "Analytical Anna",
  "description": "Data-driven coach focused on metrics and measurable progress",
  "style": "analytical",
  "systemPrompt": "You are Analytical Anna, a data-driven coach who focuses on metrics, patterns, and measurable progress. You help users break down goals into actionable steps, track progress systematically, and identify trends. Use specific numbers and percentages when discussing progress.",
  "firstMessage": "Hello. Let's review your progress data and identify optimization opportunities.",
  "voiceId": "EXAVITQu4vr4xnSDxMaL"
}
```

### 3. Empathetic Emma

```json
{
  "name": "Empathetic Emma",
  "description": "Compassionate coach who understands your struggles",
  "style": "empathetic",
  "systemPrompt": "You are Empathetic Emma, a compassionate and understanding coach. You acknowledge challenges, validate feelings, and provide emotional support. You help users work through obstacles with patience and understanding. Focus on the journey, not just the destination.",
  "firstMessage": "Hi there. I'm here to support you, wherever you are in your journey. How are you feeling today?",
  "voiceId": "21m00Tcm4TlvDq8ikWAM"
}
```

## Firestore Security Rules

Add these rules to `firestore.rules`:

```javascript
match /coach_personalities/{personalityId} {
  allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
  
  allow create: if isAuthenticated() 
    && request.resource.data.user_id == request.auth.uid
    && request.resource.data.keys().hasAll(['user_id', 'name', 'description', 'style', 'system_prompt', 'created_at', 'updated_at'])
    && request.resource.data.style in ['supportive', 'direct', 'motivational', 'analytical', 'empathetic'];
  
  allow update: if isAuthenticated() 
    && resource.data.user_id == request.auth.uid
    && request.resource.data.user_id == request.auth.uid;
  
  allow delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
}
```

## Firestore Indexes

Add this composite index:

```json
{
  "collectionGroup": "coach_personalities",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "user_id", "order": "ASCENDING" },
    { "fieldPath": "created_at", "order": "DESCENDING" }
  ]
}
```

## Migration Guide

### For Existing Users

Existing users with the default `ELEVENLABS_AGENT_ID` will continue to work. The system falls back to the environment variable if no personality is specified.

### Creating Default Personalities

You can create a migration script to set up default personalities for existing users:

```typescript
// Example migration
async function createDefaultPersonality(userId: string) {
  await coachPersonalityService.create(userId, {
    name: "Default Coach",
    description: "Your friendly AI coach",
    style: CoachingStyle.SUPPORTIVE,
    systemPrompt: "You are a supportive AI coach...",
    isDefault: true,
  });
}
```

## Testing

### Test Agent Validation

```bash
curl -X POST http://localhost:3000/coach-personalities/test-id/link-agent \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "your-agent-id"}'
```

### Test Voice Session with Personality

```bash
curl -X GET "http://localhost:3000/voice-coach/signed-url?personalityId=test-id" \
  -H "Authorization: Bearer <token>"
```

## Future Enhancements

1. **Agent Auto-Creation**: When ElevenLabs API supports it, automatically create agents
2. **Voice Cloning**: Allow users to clone their own voice for personalized coaching
3. **Personality Templates**: Pre-built personality templates users can customize
4. **A/B Testing**: Test different personalities to see which works best
5. **Personality Analytics**: Track which personalities lead to better goal completion
6. **Shared Personalities**: Allow users to share personality configurations
7. **Multi-language Support**: Personalities in different languages
8. **Voice Samples**: Preview voice before selecting

## Troubleshooting

### Agent Not Found Error

If you get "Agent not found" when linking:
- Verify the agent ID is correct
- Ensure the agent is created in your ElevenLabs account
- Check that your API key has access to the agent

### Default Personality Not Working

If the default personality isn't being used:
- Verify `is_default` is set to `true`
- Check that only one personality has `is_default: true`
- Ensure the personality has a valid `elevenlabs_agent_id`

### Voice Settings Not Applied

Voice settings are only applied if:
- The personality has a `voice_id` specified
- The agent supports voice customization
- The voice ID is valid in your ElevenLabs account
