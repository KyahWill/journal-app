# Coach Personality Quick Start Guide

This guide will help you set up and use the Coach Personality system in 5 minutes.

## Prerequisites

- ElevenLabs account with API access
- ElevenLabs API key configured in `.env`
- Firebase project with Firestore enabled
- Backend server running

## Step 1: Deploy Firestore Rules and Indexes

```bash
cd web

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

Wait for indexes to build (check Firebase Console > Firestore > Indexes).

## Step 2: Create an ElevenLabs Agent

1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Click "Create New Agent"
3. Configure your agent:
   - **Name**: "Motivational Mike"
   - **Voice**: Choose an energetic voice
   - **System Prompt**: 
     ```
     You are Motivational Mike, an energetic and enthusiastic life coach. 
     You believe in the power of positive thinking and always encourage 
     users to push beyond their limits. Use exclamation points, celebrate 
     small wins, and remind users of their potential.
     ```
   - **First Message**: "Hey there champion! Ready to crush some goals today?"
   - **Language**: English
4. Save and copy the **Agent ID**

## Step 3: Create a Coach Personality

Using curl:

```bash
curl -X POST http://localhost:3000/coach-personalities \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Motivational Mike",
    "description": "High-energy coach who believes you can achieve anything",
    "style": "motivational",
    "systemPrompt": "You are Motivational Mike, an energetic and enthusiastic life coach. You believe in the power of positive thinking and always encourage users to push beyond their limits. Use exclamation points, celebrate small wins, and remind users of their potential. Reference their goals and progress frequently.",
    "voiceId": "pNInz6obpgDQGcFmaJgB",
    "voiceStability": 0.6,
    "voiceSimilarityBoost": 0.8,
    "firstMessage": "Hey there champion! Ready to crush some goals today?",
    "language": "en",
    "isDefault": true
  }'
```

Save the returned `id` field.

## Step 4: Link the ElevenLabs Agent

```bash
curl -X POST http://localhost:3000/coach-personalities/PERSONALITY_ID/link-agent \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "YOUR_ELEVENLABS_AGENT_ID"
  }'
```

## Step 5: Test the Voice Coach

Get a signed URL with your personality:

```bash
curl -X GET "http://localhost:3000/voice-coach/signed-url?personalityId=PERSONALITY_ID" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

You should receive a signed URL that you can use to connect to the voice coach.

## Step 6: Use in Your Frontend

Update your frontend code to use the personality:

```typescript
// Get signed URL with personality
const response = await fetch(
  `/api/voice-coach/signed-url?personalityId=${personalityId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const { signedUrl } = await response.json();

// Use with ElevenLabs Conversation component
<Conversation onConnect={...} onMessage={...} />
```

## Creating Multiple Personalities

### Example 1: Analytical Anna

```bash
curl -X POST http://localhost:3000/coach-personalities \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Analytical Anna",
    "description": "Data-driven coach focused on metrics and measurable progress",
    "style": "analytical",
    "systemPrompt": "You are Analytical Anna, a data-driven coach who focuses on metrics, patterns, and measurable progress. You help users break down goals into actionable steps, track progress systematically, and identify trends. Use specific numbers and percentages when discussing progress.",
    "voiceId": "EXAVITQu4vr4xnSDxMaL",
    "firstMessage": "Hello. Let'\''s review your progress data and identify optimization opportunities.",
    "isDefault": false
  }'
```

### Example 2: Empathetic Emma

```bash
curl -X POST http://localhost:3000/coach-personalities \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Empathetic Emma",
    "description": "Compassionate coach who understands your struggles",
    "style": "empathetic",
    "systemPrompt": "You are Empathetic Emma, a compassionate and understanding coach. You acknowledge challenges, validate feelings, and provide emotional support. You help users work through obstacles with patience and understanding. Focus on the journey, not just the destination.",
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "firstMessage": "Hi there. I'\''m here to support you, wherever you are in your journey. How are you feeling today?",
    "isDefault": false
  }'
```

## Managing Personalities

### List All Personalities

```bash
curl -X GET http://localhost:3000/coach-personalities \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### Get Default Personality

```bash
curl -X GET http://localhost:3000/coach-personalities/default \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### Update a Personality

```bash
curl -X PUT http://localhost:3000/coach-personalities/PERSONALITY_ID \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "isDefault": true
  }'
```

### Delete a Personality

```bash
curl -X DELETE http://localhost:3000/coach-personalities/PERSONALITY_ID \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

Note: You cannot delete your only personality.

## Available Voice IDs

Here are some popular ElevenLabs voices:

- `pNInz6obpgDQGcFmaJgB` - Adam (clear, professional male)
- `EXAVITQu4vr4xnSDxMaL` - Bella (warm, friendly female)
- `21m00Tcm4TlvDq8ikWAM` - Rachel (calm, soothing female)
- `AZnzlk1XvdvUeBnXmlld` - Domi (energetic, enthusiastic female)
- `ErXwobaYiN019PkySvjV` - Antoni (deep, authoritative male)
- `MF3mGyEYCl7XYWbV9V6O` - Elli (young, cheerful female)
- `TxGEqnHWrfWFTfGW9XjX` - Josh (casual, friendly male)

Get the full list from ElevenLabs:
```bash
curl https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: YOUR_API_KEY"
```

## Coaching Styles

Choose the style that best fits your personality:

- **supportive** - Empathetic, encouraging, focuses on emotional support
- **direct** - Straightforward, no-nonsense, focuses on action
- **motivational** - Energetic, inspiring, focuses on positive reinforcement
- **analytical** - Data-driven, logical, focuses on metrics and progress
- **empathetic** - Understanding, compassionate, focuses on feelings and challenges

## Troubleshooting

### "Agent not found" error

- Verify the agent ID is correct
- Ensure the agent exists in your ElevenLabs account
- Check that your API key has access to the agent

### Personality not being used

- Verify the personality has `elevenlabs_agent_id` set
- Check that `is_default` is true for your default personality
- Ensure you're passing the correct `personalityId` parameter

### Voice settings not applied

- Verify the `voice_id` is valid
- Check that voice settings are within range (0-1)
- Ensure the agent supports voice customization

## Next Steps

1. Create 2-3 different personalities for different use cases
2. Test each personality with real conversations
3. Gather user feedback on which personalities work best
4. Iterate on system prompts and voice settings
5. Build a personality selector UI in your frontend

## Frontend Integration Example

```typescript
// Fetch available personalities
const personalities = await fetch('/api/coach-personalities', {
  headers: { Authorization: `Bearer ${token}` },
}).then(r => r.json());

// Let user select a personality
const selectedPersonality = personalities[0];

// Start conversation with selected personality
const { signedUrl } = await fetch(
  `/api/voice-coach/signed-url?personalityId=${selectedPersonality.id}`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
).then(r => r.json());

// Use signed URL with ElevenLabs SDK
```

## Support

For issues or questions:
- Check the [README.md](./README.md) for detailed documentation
- Review [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md) for database configuration
- Check ElevenLabs documentation for agent-specific issues
