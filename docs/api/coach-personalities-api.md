# Coach Personalities API

**Last Updated**: November 2025

## Overview

The Coach Personalities API allows users to create and manage AI coach personality configurations for voice coaching sessions. Each personality defines the coaching style, tone, and behavior of the voice AI coach. All endpoints require authentication.

**Base Path**: `/api/v1/coach-personalities`

## What are Coach Personalities?

Coach personalities customize the AI coach's behavior:

- **Coaching Style**: Supportive, challenging, analytical, etc.
- **Tone**: Friendly, professional, casual, formal
- **Focus Areas**: Specific topics or approaches
- **Voice Settings**: Linked to ElevenLabs voice agents

## Endpoints

### Create Coach Personality

Create a new coach personality configuration.

**Endpoint**: `POST /coach-personalities`

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Motivational Coach",
  "description": "An energetic and encouraging coach focused on motivation and positive reinforcement",
  "systemPrompt": "You are an enthusiastic and motivational life coach. Your goal is to inspire and encourage users to achieve their goals. Use positive language, celebrate small wins, and help users overcome obstacles with optimism.",
  "voiceSettings": {
    "stability": 0.7,
    "similarityBoost": 0.8,
    "style": 0.5
  },
  "isDefault": false
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Personality name (1-100 characters) |
| description | string | No | Personality description |
| systemPrompt | string | Yes | System prompt defining coach behavior |
| voiceSettings | object | No | ElevenLabs voice configuration |
| isDefault | boolean | No | Set as default personality (default: false) |

**Voice Settings**:
| Field | Type | Range | Description |
|-------|------|-------|-------------|
| stability | number | 0-1 | Voice stability (higher = more consistent) |
| similarityBoost | number | 0-1 | Voice similarity to original (higher = closer match) |
| style | number | 0-1 | Style exaggeration (higher = more expressive) |

**Response** (200 OK):
```json
{
  "id": "personality_abc123",
  "user_id": "user_xyz789",
  "name": "Motivational Coach",
  "description": "An energetic and encouraging coach...",
  "systemPrompt": "You are an enthusiastic and motivational life coach...",
  "voiceSettings": {
    "stability": 0.7,
    "similarityBoost": 0.8,
    "style": 0.5
  },
  "isDefault": false,
  "agentId": null,
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T10:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid data or validation failed
- `401 Unauthorized` - Missing or invalid token

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/coach-personalities \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Motivational Coach",
    "systemPrompt": "You are an enthusiastic and motivational life coach...",
    "isDefault": false
  }'
```

---

### List All Personalities

Get all coach personalities for the authenticated user.

**Endpoint**: `GET /coach-personalities`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "personalities": [
    {
      "id": "personality_abc123",
      "name": "Motivational Coach",
      "description": "An energetic and encouraging coach",
      "isDefault": true,
      "agentId": "agent_xyz789",
      "created_at": "2025-11-24T10:00:00Z"
    },
    {
      "id": "personality_def456",
      "name": "Analytical Coach",
      "description": "A logical and data-driven coach",
      "isDefault": false,
      "agentId": "agent_abc123",
      "created_at": "2025-11-23T15:00:00Z"
    }
  ],
  "total": 2,
  "default_personality_id": "personality_abc123"
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/coach-personalities \
  -H "Authorization: Bearer <token>"
```

---

### Get Default Personality

Get the user's default coach personality.

**Endpoint**: `GET /coach-personalities/default`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "personality_abc123",
  "user_id": "user_xyz789",
  "name": "Motivational Coach",
  "description": "An energetic and encouraging coach",
  "systemPrompt": "You are an enthusiastic and motivational life coach...",
  "voiceSettings": {
    "stability": 0.7,
    "similarityBoost": 0.8,
    "style": 0.5
  },
  "isDefault": true,
  "agentId": "agent_xyz789",
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T10:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - No default personality set

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/coach-personalities/default \
  -H "Authorization: Bearer <token>"
```

---

### Get Personality by ID

Get detailed information about a specific coach personality.

**Endpoint**: `GET /coach-personalities/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Personality ID |

**Response** (200 OK):
```json
{
  "id": "personality_abc123",
  "user_id": "user_xyz789",
  "name": "Motivational Coach",
  "description": "An energetic and encouraging coach focused on motivation",
  "systemPrompt": "You are an enthusiastic and motivational life coach. Your goal is to inspire and encourage users...",
  "voiceSettings": {
    "stability": 0.7,
    "similarityBoost": 0.8,
    "style": 0.5
  },
  "isDefault": true,
  "agentId": "agent_xyz789",
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T10:00:00Z",
  "usage_count": 15,
  "last_used": "2025-11-24T09:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Personality not found

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/coach-personalities/personality_abc123 \
  -H "Authorization: Bearer <token>"
```

---

### Update Personality

Update an existing coach personality.

**Endpoint**: `PUT /coach-personalities/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Personality ID |

**Request Body**:
```json
{
  "name": "Super Motivational Coach",
  "description": "An extremely energetic and encouraging coach",
  "systemPrompt": "You are a highly enthusiastic and motivational life coach...",
  "voiceSettings": {
    "stability": 0.8,
    "similarityBoost": 0.9,
    "style": 0.6
  },
  "isDefault": true
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | New personality name |
| description | string | No | New description |
| systemPrompt | string | No | New system prompt |
| voiceSettings | object | No | New voice settings |
| isDefault | boolean | No | Set as default |

**Response** (200 OK):
```json
{
  "id": "personality_abc123",
  "name": "Super Motivational Coach",
  "description": "An extremely energetic and encouraging coach",
  "updated_at": "2025-11-24T16:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Personality not found

**Example**:
```bash
curl -X PUT https://api.example.com/api/v1/coach-personalities/personality_abc123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Motivational Coach",
    "isDefault": true
  }'
```

---

### Delete Personality

Delete a coach personality. Cannot delete if it's the only personality or currently set as default.

**Endpoint**: `DELETE /coach-personalities/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Personality ID |

**Response** (204 No Content)

**Error Responses**:
- `400 Bad Request` - Cannot delete default or last personality
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Personality not found

**Example**:
```bash
curl -X DELETE https://api.example.com/api/v1/coach-personalities/personality_abc123 \
  -H "Authorization: Bearer <token>"
```

---

### Link ElevenLabs Agent

Manually link an existing ElevenLabs agent to a personality.

**Endpoint**: `POST /coach-personalities/:id/link-agent`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Personality ID |

**Request Body**:
```json
{
  "agentId": "agent_xyz789"
}
```

**Response** (200 OK):
```json
{
  "id": "personality_abc123",
  "agentId": "agent_xyz789",
  "message": "Agent linked successfully",
  "updated_at": "2025-11-24T16:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid agent ID
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Personality not found

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/coach-personalities/personality_abc123/link-agent \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent_xyz789"
  }'
```

---

### Generate ElevenLabs Agent

Automatically generate and link an ElevenLabs agent for a personality.

**Endpoint**: `POST /coach-personalities/:id/generate-agent`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Personality ID |

**Response** (200 OK):
```json
{
  "id": "personality_abc123",
  "agentId": "agent_xyz789",
  "message": "Agent generated and linked successfully",
  "agent_details": {
    "name": "Motivational Coach Agent",
    "voice_id": "voice_abc123",
    "created_at": "2025-11-24T16:00:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Agent already exists or generation failed
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Personality not found
- `503 Service Unavailable` - ElevenLabs service unavailable

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/coach-personalities/personality_abc123/generate-agent \
  -H "Authorization: Bearer <token>"
```

**Note**: This endpoint creates a new agent in ElevenLabs using the personality's configuration and automatically links it.

---

### Initialize Default Personalities

Initialize default coach personalities for a new user.

**Endpoint**: `POST /coach-personalities/initialize`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Default personalities initialized",
  "personalities": [
    {
      "id": "personality_1",
      "name": "Supportive Coach",
      "isDefault": true
    },
    {
      "id": "personality_2",
      "name": "Analytical Coach",
      "isDefault": false
    },
    {
      "id": "personality_3",
      "name": "Challenging Coach",
      "isDefault": false
    }
  ],
  "total": 3
}
```

**Error Responses**:
- `400 Bad Request` - Personalities already initialized
- `401 Unauthorized` - Missing or invalid token

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/coach-personalities/initialize \
  -H "Authorization: Bearer <token>"
```

**Note**: This endpoint is typically called once when a user first accesses the voice coach feature.

---

## Default Personality Types

The system provides three default personality templates:

### 1. Supportive Coach

**Style**: Encouraging, empathetic, positive
**Best For**: Building confidence, overcoming challenges
**Tone**: Warm, friendly, understanding

**Example Prompt**:
```
You are a supportive and empathetic life coach. Your goal is to encourage users, 
celebrate their progress, and help them overcome obstacles with compassion and 
understanding. Use positive reinforcement and focus on their strengths.
```

### 2. Analytical Coach

**Style**: Logical, data-driven, strategic
**Best For**: Planning, problem-solving, optimization
**Tone**: Professional, clear, objective

**Example Prompt**:
```
You are an analytical and strategic life coach. Your goal is to help users think 
critically about their goals, break down complex problems, and develop actionable 
plans. Use data and logic to guide decision-making.
```

### 3. Challenging Coach

**Style**: Direct, accountability-focused, growth-oriented
**Best For**: Pushing boundaries, maintaining discipline
**Tone**: Firm, honest, motivating

**Example Prompt**:
```
You are a challenging and accountability-focused life coach. Your goal is to push 
users out of their comfort zones, hold them accountable, and help them achieve 
ambitious goals. Be direct and honest while remaining supportive.
```

## System Prompt Best Practices

### Effective Prompts

1. **Define Role Clearly**: "You are a [type] life coach"
2. **State Goals**: "Your goal is to [objective]"
3. **Specify Tone**: "Use [tone] language"
4. **Set Boundaries**: "Focus on [topics], avoid [topics]"
5. **Include Context**: "Users are working on personal goals"

### Example Structure

```
You are a [personality type] life coach specializing in [focus area].

Your goals:
- [Primary goal]
- [Secondary goal]
- [Tertiary goal]

Your approach:
- [Communication style]
- [Interaction pattern]
- [Response format]

Guidelines:
- [Do this]
- [Don't do this]
- [Special considerations]
```

### Prompt Length

- **Minimum**: 50 characters
- **Recommended**: 200-500 characters
- **Maximum**: 2000 characters

## Voice Settings Guide

### Stability (0-1)

- **0.0-0.3**: Very expressive, variable (good for storytelling)
- **0.4-0.6**: Balanced (good for general coaching)
- **0.7-1.0**: Very consistent (good for professional tone)

**Recommended**: 0.7 for most coaching scenarios

### Similarity Boost (0-1)

- **0.0-0.3**: More creative interpretation
- **0.4-0.6**: Balanced similarity
- **0.7-1.0**: Very close to original voice

**Recommended**: 0.8 for consistent voice quality

### Style (0-1)

- **0.0-0.3**: Subtle expression
- **0.4-0.6**: Moderate expression
- **0.7-1.0**: Highly expressive

**Recommended**: 0.5 for natural conversation

## Using Personalities with Voice Coach

### Starting a Session

```bash
# Create session with specific personality
curl -X POST https://api.example.com/api/v1/voice-coach/session \
  -H "Authorization: Bearer <token>" \
  -d '{
    "personalityId": "personality_abc123"
  }'
```

### Getting Signed URL

```bash
# Get signed URL for specific personality
curl -X GET "https://api.example.com/api/v1/voice-coach/signed-url?personalityId=personality_abc123" \
  -H "Authorization: Bearer <token>"
```

## Best Practices

### Creating Personalities

1. **Start with Defaults**: Use default personalities as templates
2. **Test Thoroughly**: Try conversations before finalizing
3. **Iterate**: Refine prompts based on actual usage
4. **Be Specific**: Clear prompts produce better results
5. **Consider Context**: Think about when personality will be used

### Managing Personalities

1. **Limit Count**: Keep 3-5 personalities for clarity
2. **Name Clearly**: Use descriptive, memorable names
3. **Update Regularly**: Refine based on experience
4. **Set Appropriate Default**: Choose most-used personality
5. **Document Purpose**: Add clear descriptions

### Agent Management

1. **Generate vs Link**: Generate for new personalities, link for existing agents
2. **Test Agents**: Verify agent behavior matches personality
3. **Monitor Usage**: Track which personalities are most effective
4. **Update Carefully**: Changes to linked agents affect all users

## Limitations

- **Maximum Personalities**: 10 per user
- **Name Length**: 1-100 characters
- **Description Length**: Maximum 500 characters
- **System Prompt Length**: 50-2000 characters
- **Agent Linking**: One agent per personality

## Related Documentation

- [Voice Coach API](./voice-coach-api.md)
- [Voice Coach Feature](../features/voice-coach.md)
- [ElevenLabs Integration](../integrations/elevenlabs.md)

---

[← Back to API Reference](../API_REFERENCE.md)
