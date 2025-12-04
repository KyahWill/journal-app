# Chat API

**Last Updated**: December 2025

## Overview

The Chat API provides AI-powered coaching through text-based conversations. It supports both standard request-response and streaming modes, session management, and context-aware insights based on user goals and journal entries. All endpoints require authentication.

**Base Path**: `/api/v1/chat`

## Endpoints

### Send Message (Non-Streaming)

Send a message to the AI coach and receive a complete response.

**Endpoint**: `POST /chat/message`

**Authentication**: Required

**Request Body**:
```json
{
  "message": "What are my goals for this month?",
  "sessionId": "session_abc123",
  "personalityId": "personality_abc123"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | User's message (minimum 1 character) |
| sessionId | string | No | Existing session ID (creates new if omitted) |
| personalityId | string | No | Coach personality ID for customized responses |

**Response** (200 OK):
```json
{
  "sessionId": "session_abc123",
  "messageId": "msg_xyz789",
  "response": "Based on your goals, you have 3 active goals for this month: Run a 5K, Read 2 books, and Complete Project X. Would you like to discuss any of these in detail?",
  "timestamp": "2025-11-24T10:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid message or parameters
- `401 Unauthorized` - Missing or invalid token
- `429 Too Many Requests` - Rate limit exceeded

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/chat/message \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are my goals for this month?"
  }'
```

---

### Send Message (Streaming)

Send a message and receive the response as a stream of chunks using Server-Sent Events (SSE).

**Endpoint**: `POST /chat/message/stream`

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "message": "Tell me about my progress this week",
  "sessionId": "session_abc123"
}
```

**Response** (200 OK - Server-Sent Events):
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type":"start","sessionId":"session_abc123"}

data: {"type":"content","content":"Based on"}

data: {"type":"content","content":" your journal"}

data: {"type":"content","content":" entries this"}

data: {"type":"content","content":" week..."}

data: {"type":"end","messageId":"msg_xyz789"}
```

**Event Types**:
| Type | Description | Data Fields |
|------|-------------|-------------|
| start | Stream started | sessionId |
| content | Content chunk | content |
| end | Stream completed | messageId |
| error | Error occurred | message |

**Error Response**:
```
data: {"type":"error","message":"Rate limit exceeded"}
```

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/chat/message/stream \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about my progress"
  }'
```

**JavaScript Example**:
```javascript
const response = await fetch('https://api.example.com/api/v1/chat/message/stream', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Tell me about my progress'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      
      if (data.type === 'content') {
        console.log(data.content);
      } else if (data.type === 'end') {
        console.log('Stream complete');
      }
    }
  }
}
```

---

### Create Chat Session

Create a new chat session for organizing conversations.

**Endpoint**: `POST /chat/session`

**Authentication**: Required

**Response** (201 Created):
```json
{
  "id": "session_abc123",
  "user_id": "user_xyz789",
  "title": "New Conversation",
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T10:00:00Z",
  "message_count": 0
}
```

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/chat/session \
  -H "Authorization: Bearer <token>"
```

---

### List All Sessions

Get all chat sessions for the authenticated user.

**Endpoint**: `GET /chat/sessions`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "sessions": [
    {
      "id": "session_abc123",
      "title": "Goal Planning Discussion",
      "created_at": "2025-11-24T10:00:00Z",
      "updated_at": "2025-11-24T15:00:00Z",
      "message_count": 12,
      "last_message": "That sounds like a great plan!"
    },
    {
      "id": "session_def456",
      "title": "Weekly Reflection",
      "created_at": "2025-11-23T08:00:00Z",
      "updated_at": "2025-11-23T09:00:00Z",
      "message_count": 8,
      "last_message": "Keep up the good work!"
    }
  ],
  "total": 2
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/chat/sessions \
  -H "Authorization: Bearer <token>"
```

---

### Get Session by ID

Get detailed information about a specific chat session including message history.

**Endpoint**: `GET /chat/session/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Session ID |

**Response** (200 OK):
```json
{
  "id": "session_abc123",
  "user_id": "user_xyz789",
  "title": "Goal Planning Discussion",
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T15:00:00Z",
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "What are my goals?",
      "timestamp": "2025-11-24T10:00:00Z"
    },
    {
      "id": "msg_2",
      "role": "assistant",
      "content": "You have 5 active goals...",
      "timestamp": "2025-11-24T10:00:05Z"
    }
  ],
  "message_count": 2
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Session not found

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/chat/session/session_abc123 \
  -H "Authorization: Bearer <token>"
```

---

### Delete Session

Delete a chat session and all its messages.

**Endpoint**: `DELETE /chat/session/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Session ID |

**Response** (200 OK):
```json
{
  "message": "Session deleted successfully",
  "id": "session_abc123"
}
```

**Example**:
```bash
curl -X DELETE https://api.example.com/api/v1/chat/session/session_abc123 \
  -H "Authorization: Bearer <token>"
```

---

### Update Session Title

Update the title of a chat session.

**Endpoint**: `PATCH /chat/session/:id/title`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Session ID |

**Request Body**:
```json
{
  "title": "Goal Planning for December"
}
```

**Response** (200 OK):
```json
{
  "id": "session_abc123",
  "title": "Goal Planning for December",
  "updated_at": "2025-11-24T16:00:00Z"
}
```

**Example**:
```bash
curl -X PATCH https://api.example.com/api/v1/chat/session/session_abc123/title \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Goal Planning for December"
  }'
```

---

### Generate Insights (Non-Streaming)

Generate AI insights based on user's goals and journal entries.

**Endpoint**: `GET /chat/insights`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "insights": "Based on your recent activity, you're making great progress on your health goals. You've completed 3 out of 5 milestones for 'Run a 5K'. Your journal entries show consistent motivation. Consider setting a new challenge goal to maintain momentum.",
  "generated_at": "2025-11-24T10:00:00Z",
  "based_on": {
    "goals_analyzed": 5,
    "journal_entries_analyzed": 12,
    "time_period": "last_30_days"
  }
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/chat/insights \
  -H "Authorization: Bearer <token>"
```

---

### Generate Insights (Streaming)

Generate AI insights with streaming response using Server-Sent Events.

**Endpoint**: `GET /chat/insights/stream`

**Authentication**: Required

**Response** (200 OK - Server-Sent Events):
```
data: {"type":"start"}

data: {"type":"content","content":"Based on your"}

data: {"type":"content","content":" recent activity..."}

data: {"type":"end"}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/chat/insights/stream \
  -H "Authorization: Bearer <token>"
```

---

### Get Suggested Prompts

Get AI-suggested conversation prompts based on user context.

**Endpoint**: `GET /chat/prompts`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "prompts": [
    {
      "id": "prompt_1",
      "text": "How can I stay motivated to complete my goals?",
      "category": "motivation"
    },
    {
      "id": "prompt_2",
      "text": "What progress have I made this week?",
      "category": "reflection"
    },
    {
      "id": "prompt_3",
      "text": "Help me break down my goal into smaller steps",
      "category": "planning"
    }
  ],
  "total": 3
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/chat/prompts \
  -H "Authorization: Bearer <token>"
```

---

### Suggest Goals

Get AI-generated goal suggestions based on user's journal entries and patterns.

**Endpoint**: `POST /chat/suggest-goals`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "suggested_goals": [
    {
      "title": "Establish Morning Routine",
      "description": "Based on your journal entries, you've mentioned wanting to wake up earlier. Consider creating a consistent morning routine.",
      "category": "personal",
      "reasoning": "Mentioned in 5 recent journal entries"
    },
    {
      "title": "Learn Spanish",
      "description": "You've expressed interest in language learning. Setting a specific goal could help you make progress.",
      "category": "learning",
      "reasoning": "Interest noted in journal entries"
    }
  ],
  "total": 2,
  "based_on": {
    "journal_entries_analyzed": 20,
    "patterns_identified": 3
  }
}
```

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/chat/suggest-goals \
  -H "Authorization: Bearer <token>"
```

---

### Get Goal Insights (Non-Streaming)

Get AI insights for a specific goal.

**Endpoint**: `GET /chat/goal-insights/:goalId`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| goalId | string | Goal ID |

**Response** (200 OK):
```json
{
  "goal_id": "goal_abc123",
  "goal_title": "Run a 5K",
  "insights": "You're making excellent progress! You've completed 3 out of 5 milestones. Your recent journal entries show consistent training. Consider focusing on the 3K milestone next, as you're close to achieving it.",
  "recommendations": [
    "Schedule training runs 3 times per week",
    "Track your progress in journal entries",
    "Set a specific race date to increase motivation"
  ],
  "progress_summary": {
    "milestones_completed": 3,
    "milestones_total": 5,
    "days_until_target": 37,
    "recent_activity": "Last progress update 2 days ago"
  }
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/chat/goal-insights/goal_abc123 \
  -H "Authorization: Bearer <token>"
```

---

### Get Goal Insights (Streaming)

Get AI insights for a specific goal with streaming response.

**Endpoint**: `GET /chat/goal-insights/:goalId/stream`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| goalId | string | Goal ID |

**Response** (200 OK - Server-Sent Events):
```
data: {"type":"start","goalId":"goal_abc123"}

data: {"type":"content","content":"You're making"}

data: {"type":"content","content":" excellent progress..."}

data: {"type":"end"}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/chat/goal-insights/goal_abc123/stream \
  -H "Authorization: Bearer <token>"
```

---

## Weekly Insights

The Weekly Insights endpoints provide AI-powered analysis of journal entries on a Saturday-to-Friday cadence, with support for history, streaming, and persistence.

### Get Current Week Insight

Check if an insight exists for the current week (Saturday to Friday).

**Endpoint**: `GET /chat/weekly-insights/current`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "insight": {
    "id": "insight_abc123",
    "user_id": "user_xyz789",
    "week_start": "2025-11-30T00:00:00Z",
    "week_end": "2025-12-06T23:59:59Z",
    "content": "## Your Week in Review\n\nThis week showed...",
    "entry_count": 5,
    "created_at": "2025-12-04T10:00:00Z",
    "updated_at": "2025-12-04T10:00:00Z"
  },
  "weekStart": "2025-11-30T00:00:00Z",
  "weekEnd": "2025-12-06T23:59:59Z"
}
```

**Response (No insight exists)**:
```json
{
  "insight": null,
  "weekStart": "2025-11-30T00:00:00Z",
  "weekEnd": "2025-12-06T23:59:59Z"
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/chat/weekly-insights/current \
  -H "Authorization: Bearer <token>"
```

---

### Get Weekly Insights History

Get all past weekly insights for the authenticated user.

**Endpoint**: `GET /chat/weekly-insights/history`

**Authentication**: Required

**Response** (200 OK):
```json
[
  {
    "id": "insight_abc123",
    "user_id": "user_xyz789",
    "week_start": "2025-11-30T00:00:00Z",
    "week_end": "2025-12-06T23:59:59Z",
    "content": "## Your Week in Review\n\n...",
    "entry_count": 5,
    "created_at": "2025-12-04T10:00:00Z",
    "updated_at": "2025-12-04T10:00:00Z"
  },
  {
    "id": "insight_def456",
    "user_id": "user_xyz789",
    "week_start": "2025-11-23T00:00:00Z",
    "week_end": "2025-11-29T23:59:59Z",
    "content": "## Your Week in Review\n\n...",
    "entry_count": 3,
    "created_at": "2025-11-27T10:00:00Z",
    "updated_at": "2025-11-27T10:00:00Z"
  }
]
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/chat/weekly-insights/history \
  -H "Authorization: Bearer <token>"
```

---

### Get Weekly Insight by ID

Get a specific weekly insight by its ID.

**Endpoint**: `GET /chat/weekly-insights/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Weekly insight ID |

**Response** (200 OK):
```json
{
  "id": "insight_abc123",
  "user_id": "user_xyz789",
  "week_start": "2025-11-30T00:00:00Z",
  "week_end": "2025-12-06T23:59:59Z",
  "content": "## Your Week in Review\n\nThis week showed consistent journaling with 5 entries...",
  "entry_count": 5,
  "created_at": "2025-12-04T10:00:00Z",
  "updated_at": "2025-12-04T10:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Insight not found

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/chat/weekly-insights/insight_abc123 \
  -H "Authorization: Bearer <token>"
```

---

### Generate Weekly Insights (Non-Streaming)

Generate weekly insights for the current week. Returns existing insight if already generated.

**Endpoint**: `POST /chat/weekly-insights/generate`

**Authentication**: Required

**Request Body**:
```json
{
  "forceRegenerate": false
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| forceRegenerate | boolean | No | Force regeneration even if insight exists (default: false) |

**Response** (200 OK):
```json
{
  "insight": {
    "id": "insight_abc123",
    "user_id": "user_xyz789",
    "week_start": "2025-11-30T00:00:00Z",
    "week_end": "2025-12-06T23:59:59Z",
    "content": "## Your Week in Review\n\n...",
    "entry_count": 5,
    "created_at": "2025-12-04T10:00:00Z",
    "updated_at": "2025-12-04T10:00:00Z"
  },
  "isExisting": true,
  "entryCount": 5,
  "weekStart": "2025-11-30T00:00:00Z",
  "weekEnd": "2025-12-06T23:59:59Z"
}
```

**Response (No entries)**:
```json
{
  "insight": null,
  "message": "No journal entries found for the current week",
  "entryCount": 0,
  "weekStart": "2025-11-30T00:00:00Z",
  "weekEnd": "2025-12-06T23:59:59Z"
}
```

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/chat/weekly-insights/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"forceRegenerate": false}'
```

---

### Generate Weekly Insights (Streaming)

Stream the generation of weekly insights using Server-Sent Events.

**Endpoint**: `GET /chat/weekly-insights/stream`

**Authentication**: Required

**Response** (200 OK - Server-Sent Events):
```
Content-Type: text/event-stream

data: {"type":"start","weekStart":"2025-11-30T00:00:00Z","weekEnd":"2025-12-06T23:59:59Z","entryCount":5,"usageInfo":{"allowed":true,"remaining":9,"limit":10}}

data: {"type":"chunk","content":"## Your Week"}

data: {"type":"chunk","content":" in Review\n\n"}

data: {"type":"chunk","content":"This week showed..."}

data: {"type":"done","insight":{"id":"insight_abc123","week_start":"2025-11-30T00:00:00Z","week_end":"2025-12-06T23:59:59Z","content":"...","entry_count":5}}
```

**Event Types**:
| Type | Description | Data Fields |
|------|-------------|-------------|
| start | Stream started | weekStart, weekEnd, entryCount, usageInfo, isExisting |
| chunk | Content chunk | content |
| done | Stream completed | insight |
| error | Error occurred | message |

**JavaScript Example**:
```javascript
const response = await fetch('https://api.example.com/api/v1/chat/weekly-insights/stream', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let fullContent = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      
      if (data.type === 'chunk') {
        fullContent += data.content;
        console.log(data.content);
      } else if (data.type === 'done') {
        console.log('Insight saved:', data.insight.id);
      }
    }
  }
}
```

---

### Regenerate Weekly Insights (Streaming)

Force regeneration of weekly insights even if one already exists.

**Endpoint**: `POST /chat/weekly-insights/regenerate`

**Authentication**: Required

**Response** (200 OK - Server-Sent Events):
Same format as `GET /chat/weekly-insights/stream`

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/chat/weekly-insights/regenerate \
  -H "Authorization: Bearer <token>"
```

---

### Delete Weekly Insight

Delete a specific weekly insight.

**Endpoint**: `DELETE /chat/weekly-insights/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Weekly insight ID |

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Weekly insight deleted successfully"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Insight not found

**Example**:
```bash
curl -X DELETE https://api.example.com/api/v1/chat/weekly-insights/insight_abc123 \
  -H "Authorization: Bearer <token>"
```

---

## Context and RAG Integration

The Chat API uses the RAG (Retrieval-Augmented Generation) system to provide context-aware responses:

### Context Sources

1. **User Goals**: Active and completed goals with milestones
2. **Journal Entries**: Recent and relevant journal content
3. **Progress Updates**: Goal progress history
4. **Conversation History**: Previous messages in the session

### How RAG Works

1. User sends a message
2. System generates embedding for the message
3. Searches vector store for relevant context
4. Retrieves top matching goals and journal entries
5. Constructs prompt with context
6. Sends to Gemini AI for response
7. Returns contextual, personalized response

### Context Limits

- Maximum 10 relevant documents per query
- Context window: ~30,000 tokens
- Prioritizes recent and high-relevance content

## Streaming Best Practices

### Client Implementation

1. **Handle Connection Errors**: Implement reconnection logic
2. **Parse SSE Format**: Split by `\n\n`, parse `data:` prefix
3. **Buffer Content**: Accumulate content chunks for display
4. **Handle Event Types**: Process start, content, end, and error events
5. **Timeout Handling**: Set reasonable timeout (30-60 seconds)

### Performance

1. Use streaming for long responses (insights, goal analysis)
2. Use non-streaming for quick queries
3. Cancel streams when user navigates away
4. Implement client-side caching for repeated queries

## Rate Limiting

Chat endpoints have specific rate limits:

- **Message endpoints**: 20 requests per minute per user
- **Insights generation**: 10 requests per hour per user
- **Session management**: 100 requests per minute per user

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Empty message or invalid session | Validate input before sending |
| 401 Unauthorized | Invalid token | Refresh authentication token |
| 429 Too Many Requests | Rate limit exceeded | Implement exponential backoff |
| 500 Internal Server Error | AI service error | Retry with exponential backoff |

### Streaming Errors

Streaming endpoints send errors as SSE events:

```
data: {"type":"error","message":"AI service temporarily unavailable"}
```

Handle these by:
1. Displaying error message to user
2. Closing the stream
3. Offering retry option

## Best Practices

### Session Management

1. Create sessions for related conversations
2. Update session titles for easy identification
3. Delete old sessions to reduce clutter
4. Limit active sessions to improve performance

### Message Quality

1. Be specific in questions
2. Reference goals or journal entries when relevant
3. Use suggested prompts for inspiration
4. Keep messages focused on one topic

### Performance Optimization

1. Use streaming for better perceived performance
2. Cache session lists on client
3. Implement optimistic UI updates
4. Prefetch suggested prompts

## Related Documentation

- [Chat Feature](../features/chat.md)
- [Weekly Insights Feature](../features/weekly-insights.md)
- [RAG System](../features/rag-system.md)
- [Web Architecture - Streaming](../architecture/web-architecture.md)
- [Goals API](./goals-api.md)
- [Journal API](./journal-api.md)

---

[← Back to API Reference](../API_REFERENCE.md)
