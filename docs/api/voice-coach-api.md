# Voice Coach API

**Last Updated**: November 2025

## Overview

The Voice Coach API provides voice-based AI coaching through integration with ElevenLabs Conversational AI. It supports real-time voice conversations, session management, conversation history, and health monitoring. All endpoints require authentication.

**Base Path**: `/api/v1/voice-coach`

## Endpoints

### Create Voice Session

Create a new voice coaching session with context and personality configuration.

**Endpoint**: `POST /voice-coach/session`

**Authentication**: Required

**Request Body**:
```json
{
  "personalityId": "personality_abc123",
  "context": {
    "recentGoals": ["goal_1", "goal_2"],
    "recentJournalEntries": ["journal_1"],
    "userPreferences": {
      "focusArea": "health"
    }
  }
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| personalityId | string | No | Coach personality ID (uses default if omitted) |
| context | object | No | Additional context for the conversation |

**Response** (200 OK):
```json
{
  "sessionId": "session_abc123",
  "agentId": "agent_xyz789",
  "context": {
    "recentGoals": ["goal_1", "goal_2"],
    "recentJournalEntries": ["journal_1"],
    "userPreferences": {
      "focusArea": "health"
    }
  }
}
```

**Error Responses**:
- `400 Bad Request` - Invalid personality ID or context
- `401 Unauthorized` - Missing or invalid token
- `503 Service Unavailable` - ElevenLabs service unavailable

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/voice-coach/session \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "personalityId": "personality_abc123",
    "context": {
      "focusArea": "health"
    }
  }'
```

---

### Get Signed URL

Get a signed URL for connecting to ElevenLabs Conversational AI.

**Endpoint**: `GET /voice-coach/signed-url`

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| personalityId | string | No | Coach personality ID |
| context | string | No | JSON string of context data |

**Response** (200 OK):
```json
{
  "signedUrl": "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=abc123&signed_url=xyz789",
  "expiresAt": "2025-11-24T10:10:00Z"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `503 Service Unavailable` - ElevenLabs service unavailable

**Example**:
```bash
curl -X GET "https://api.example.com/api/v1/voice-coach/signed-url?personalityId=personality_abc123" \
  -H "Authorization: Bearer <token>"
```

**Usage**:
The signed URL is used to establish a WebSocket connection with ElevenLabs:

```javascript
const response = await fetch('/api/v1/voice-coach/signed-url');
const { signedUrl } = await response.json();

const ws = new WebSocket(signedUrl);

ws.onopen = () => {
  console.log('Connected to voice coach');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle audio and transcript data
};
```

---

### Save Conversation

Save a completed voice conversation transcript and metadata.

**Endpoint**: `POST /voice-coach/conversation`

**Authentication**: Required

**Request Body**:
```json
{
  "conversationId": "conv_abc123",
  "transcript": [
    {
      "role": "user",
      "content": "How am I doing with my goals?",
      "timestamp": "2025-11-24T10:00:00Z",
      "audioUrl": "https://storage.example.com/audio/user_1.mp3"
    },
    {
      "role": "agent",
      "content": "You're making great progress! Let me tell you about your recent achievements...",
      "timestamp": "2025-11-24T10:00:05Z",
      "audioUrl": "https://storage.example.com/audio/agent_1.mp3"
    }
  ],
  "duration": 180,
  "startedAt": "2025-11-24T10:00:00Z",
  "endedAt": "2025-11-24T10:03:00Z"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| conversationId | string | Yes | Unique conversation identifier |
| transcript | array | Yes | Array of conversation messages |
| duration | number | Yes | Conversation duration in seconds (max 7200) |
| startedAt | string | Yes | Start timestamp (ISO 8601) |
| endedAt | string | Yes | End timestamp (ISO 8601) |

**Transcript Message Format**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| role | string | Yes | "user" or "agent" |
| content | string | Yes | Message text content |
| timestamp | string | Yes | Message timestamp (ISO 8601) |
| audioUrl | string | No | URL to audio recording |

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Conversation saved successfully",
  "conversationId": "conv_abc123"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid conversation data
- `401 Unauthorized` - Missing or invalid token

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/voice-coach/conversation \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv_abc123",
    "transcript": [...],
    "duration": 180,
    "startedAt": "2025-11-24T10:00:00Z",
    "endedAt": "2025-11-24T10:03:00Z"
  }'
```

---

### Get Conversation History

Get conversation history with optional filtering and search.

**Endpoint**: `GET /voice-coach/history`

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of results (1-100, default: 20) |
| search | string | No | Search query for transcript content |
| startDate | string | No | Filter by start date (ISO 8601) |
| endDate | string | No | Filter by end date (ISO 8601) |
| sortBy | string | No | Sort order: newest, oldest, longest, shortest |

**Response** (200 OK):
```json
{
  "conversations": [
    {
      "id": "conv_abc123",
      "duration": 180,
      "startedAt": "2025-11-24T10:00:00Z",
      "endedAt": "2025-11-24T10:03:00Z",
      "messageCount": 12,
      "preview": "How am I doing with my goals?",
      "created_at": "2025-11-24T10:03:00Z"
    },
    {
      "id": "conv_def456",
      "duration": 240,
      "startedAt": "2025-11-23T15:00:00Z",
      "endedAt": "2025-11-23T15:04:00Z",
      "messageCount": 16,
      "preview": "I need help staying motivated",
      "created_at": "2025-11-23T15:04:00Z"
    }
  ],
  "total": 2
}
```

**Example**:
```bash
# Get recent conversations
curl -X GET https://api.example.com/api/v1/voice-coach/history \
  -H "Authorization: Bearer <token>"

# Search conversations
curl -X GET "https://api.example.com/api/v1/voice-coach/history?search=motivation&limit=10" \
  -H "Authorization: Bearer <token>"

# Filter by date range
curl -X GET "https://api.example.com/api/v1/voice-coach/history?startDate=2025-11-01&endDate=2025-11-30" \
  -H "Authorization: Bearer <token>"

# Sort by duration
curl -X GET "https://api.example.com/api/v1/voice-coach/history?sortBy=longest" \
  -H "Authorization: Bearer <token>"
```

---

### Get Conversation by ID

Get detailed information about a specific conversation including full transcript.

**Endpoint**: `GET /voice-coach/conversation/:id`

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Conversation ID |

**Response** (200 OK):
```json
{
  "id": "conv_abc123",
  "user_id": "user_xyz789",
  "duration": 180,
  "startedAt": "2025-11-24T10:00:00Z",
  "endedAt": "2025-11-24T10:03:00Z",
  "transcript": [
    {
      "role": "user",
      "content": "How am I doing with my goals?",
      "timestamp": "2025-11-24T10:00:00Z",
      "audioUrl": "https://storage.example.com/audio/user_1.mp3"
    },
    {
      "role": "agent",
      "content": "You're making great progress!",
      "timestamp": "2025-11-24T10:00:05Z",
      "audioUrl": "https://storage.example.com/audio/agent_1.mp3"
    }
  ],
  "messageCount": 2,
  "created_at": "2025-11-24T10:03:00Z"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Conversation not found

**Example**:
```bash
curl -X GET "https://api.example.com/api/v1/voice-coach/conversation/conv_abc123" \
  -H "Authorization: Bearer <token>"
```

---

### Delete Conversation

Delete a conversation and its transcript.

**Endpoint**: `DELETE /voice-coach/conversation/:id`

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Conversation ID |

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Conversation not found

**Example**:
```bash
curl -X DELETE "https://api.example.com/api/v1/voice-coach/conversation/conv_abc123" \
  -H "Authorization: Bearer <token>"
```

---

### Health Check

Get comprehensive health status and metrics for the voice coach service.

**Endpoint**: `GET /voice-coach/health`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "status": "healthy",
  "services": {
    "elevenLabs": {
      "configured": true,
      "apiKeyPresent": true,
      "agentConfigured": true,
      "connectivity": "healthy"
    },
    "firebase": {
      "configured": true,
      "connectivity": "healthy"
    }
  },
  "metrics": {
    "totalConversations": 45,
    "averageConversationDuration": 195,
    "averageContextBuildTime": 250,
    "averageElevenLabsResponseTime": 1200,
    "totalErrors": 2,
    "errorRateByType": {
      "rate_limit": 1,
      "timeout": 1
    }
  },
  "timestamp": "2025-11-24T10:00:00Z"
}
```

**Status Values**:
- `healthy` - All services operational
- `degraded` - Some services experiencing issues
- `unhealthy` - Critical services unavailable

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/voice-coach/health \
  -H "Authorization: Bearer <token>"
```

---

### Get Metrics

Get detailed metrics for monitoring and analytics.

**Endpoint**: `GET /voice-coach/metrics`

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start date for metrics (ISO 8601) |
| endDate | string | No | End date for metrics (ISO 8601) |

**Response** (200 OK):
```json
{
  "metrics": {
    "totalConversations": 45,
    "averageConversationDuration": 195,
    "averageContextBuildTime": 250,
    "averageElevenLabsResponseTime": 1200,
    "totalErrors": 2,
    "errorRateByType": {
      "rate_limit": 1,
      "timeout": 1
    }
  },
  "recentErrors": [
    {
      "type": "rate_limit",
      "message": "ElevenLabs rate limit exceeded",
      "timestamp": "2025-11-24T09:30:00Z"
    }
  ],
  "period": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-11-24T10:00:00Z"
  }
}
```

**Example**:
```bash
# Get all-time metrics
curl -X GET https://api.example.com/api/v1/voice-coach/metrics \
  -H "Authorization: Bearer <token>"

# Get metrics for specific period
curl -X GET "https://api.example.com/api/v1/voice-coach/metrics?startDate=2025-11-01&endDate=2025-11-30" \
  -H "Authorization: Bearer <token>"
```

---

## Voice Conversation Flow

### Standard Flow

1. **Initialize Session**
   - Client calls `POST /voice-coach/session`
   - Receives session ID and agent ID

2. **Get Signed URL**
   - Client calls `GET /voice-coach/signed-url`
   - Receives WebSocket URL with authentication

3. **Connect to ElevenLabs**
   - Client establishes WebSocket connection
   - Begins voice conversation

4. **Conversation**
   - User speaks, audio sent to ElevenLabs
   - Agent responds with voice and text
   - Client receives audio and transcript

5. **Save Conversation**
   - After conversation ends
   - Client calls `POST /voice-coach/conversation`
   - Transcript and metadata saved

### Context Building

The system automatically builds context for conversations:

1. **Recent Goals**: Last 5 active goals
2. **Recent Journal Entries**: Last 10 entries
3. **Progress Updates**: Recent goal progress
4. **User Preferences**: Stored preferences and focus areas

Context is included in the agent's system prompt for personalized responses.

## Coach Personalities

Voice coach behavior can be customized using personalities:

- **Default Personality**: Supportive, encouraging coach
- **Custom Personalities**: User-defined coaching styles
- **Agent Linking**: Each personality linked to ElevenLabs agent

See [Coach Personalities API](./coach-personalities-api.md) for personality management.

## Rate Limiting

Voice coach endpoints have specific rate limits:

- **Session creation**: 10 per hour per user
- **Signed URL**: 20 per hour per user
- **Conversation save**: 20 per hour per user
- **History/metrics**: 100 per minute per user

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Invalid conversation data | Validate data format |
| 401 Unauthorized | Invalid token | Refresh authentication |
| 429 Too Many Requests | Rate limit exceeded | Wait before retrying |
| 503 Service Unavailable | ElevenLabs unavailable | Check health endpoint, retry later |

### ElevenLabs Errors

- **Agent Not Configured**: No agent linked to personality
- **Rate Limit**: ElevenLabs API limit reached
- **Connection Timeout**: Network or service issue

## Best Practices

### Session Management

1. Create session before getting signed URL
2. Include relevant context for better responses
3. Reuse sessions for related conversations
4. Clean up old sessions periodically

### Conversation Quality

1. Ensure good audio quality
2. Speak clearly and at moderate pace
3. Allow agent to finish responses
4. Save transcripts for future reference

### Performance

1. Monitor health endpoint regularly
2. Implement retry logic for transient errors
3. Cache signed URLs (valid for 10 minutes)
4. Batch conversation saves when possible

### Privacy

1. Conversations are private to each user
2. Audio URLs expire after 30 days
3. Transcripts stored securely in Firestore
4. Delete conversations to remove data

## WebSocket Integration

### Connecting to ElevenLabs

```javascript
// Get signed URL
const { signedUrl } = await fetch('/api/v1/voice-coach/signed-url')
  .then(r => r.json());

// Connect WebSocket
const ws = new WebSocket(signedUrl);

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'audio') {
    // Play audio
    playAudio(data.audio);
  } else if (data.type === 'transcript') {
    // Display transcript
    displayTranscript(data.text);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

### Sending Audio

```javascript
// Capture audio from microphone
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      // Send audio chunk to WebSocket
      ws.send(event.data);
    };
    
    mediaRecorder.start(100); // Send chunks every 100ms
  });
```

## Related Documentation

- [Voice Coach Feature](../features/voice-coach.md)
- [Coach Personalities API](./coach-personalities-api.md)
- [ElevenLabs Integration](../integrations/elevenlabs.md)
- [Backend Architecture](../architecture/backend-architecture.md)

---

[← Back to API Reference](../API_REFERENCE.md)
