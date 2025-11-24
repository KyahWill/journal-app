# API Reference

**Last Updated**: November 2025

## Overview

The Journal API is a RESTful API built with NestJS that provides endpoints for managing goals, journal entries, AI chat coaching, voice coaching, and more. The API uses Firebase Authentication for user management and authorization.

## Base URL

```
Production: https://your-api-domain.com/api/v1
Development: http://localhost:3001/api/v1
```

The API uses a global prefix of `api/v1` for all endpoints.

## Authentication

### Authentication Method

The API uses Firebase Authentication with Bearer tokens. All protected endpoints require a valid Firebase ID token in the Authorization header.

**Header Format**:
```
Authorization: Bearer <firebase-id-token>
```

### Getting a Token

Tokens are obtained through Firebase Authentication on the client side. The token should be included in all API requests to protected endpoints.

**Token Expiration**: Firebase ID tokens expire after 1 hour. Clients should refresh tokens automatically.

### Public Endpoints

The following endpoints do not require authentication:
- `POST /auth/signup` - Create new user account
- `POST /auth/verify` - Verify Firebase token

All other endpoints require authentication.

## Versioning

The API is currently at version 1 (`v1`). The version is included in the base URL path.

**Current Version**: `v1`

Future versions will be released with a new version prefix (e.g., `v2`) while maintaining backward compatibility with previous versions for a deprecation period.

## Common Patterns

### Request Format

All POST and PUT requests should include a `Content-Type: application/json` header and send data as JSON in the request body.

```bash
curl -X POST https://api.example.com/api/v1/goal \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Goal", "category": "health", "target_date": "2025-12-31"}'
```

### Response Format

All responses are returned as JSON with appropriate HTTP status codes.

**Success Response**:
```json
{
  "id": "abc123",
  "title": "My Goal",
  "status": "in_progress",
  "created_at": "2025-11-24T10:00:00Z"
}
```

**Error Response**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Pagination

Endpoints that return lists support pagination using query parameters:

- `limit` - Number of items to return (default varies by endpoint)
- `startAfter` - Cursor for pagination (document ID to start after)

**Example**:
```
GET /api/v1/goal?limit=20&startAfter=doc123
```

### Filtering

Many list endpoints support filtering via query parameters:

- `category` - Filter by category
- `status` - Filter by status
- `search` - Search by text

**Example**:
```
GET /api/v1/goal?category=health&status=in_progress
```

## Error Handling

### HTTP Status Codes

The API uses standard HTTP status codes:

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request succeeded with no response body |
| 400 | Bad Request | Invalid request data or parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Authenticated but not authorized for this resource |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed: title must be at least 3 characters",
  "error": "Bad Request"
}
```

### Common Error Messages

- **401 Unauthorized**: "Invalid or expired token"
- **403 Forbidden**: "You do not have permission to access this resource"
- **404 Not Found**: "Resource not found"
- **429 Too Many Requests**: "Rate limit exceeded. Please try again later."

## Rate Limiting

### Limits

The API implements rate limiting to ensure fair usage:

- **General Endpoints**: 100 requests per minute per user
- **AI/RAG Endpoints**: 20 requests per minute per user
- **Voice Coach**: 10 sessions per hour per user

### Rate Limit Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

### Handling Rate Limits

When rate limited, the API returns a `429 Too Many Requests` status. Clients should:
1. Check the `X-RateLimit-Reset` header for when limits reset
2. Implement exponential backoff
3. Cache responses when appropriate

## Endpoint Reference by Module

### Authentication API

User authentication and account management.

**Base Path**: `/auth`

**Endpoints**:
- `POST /auth/signup` - Create new user account
- `POST /auth/verify` - Verify Firebase token
- `GET /auth/me` - Get current user profile
- `GET /auth/user/:uid` - Get user by ID
- `PUT /auth/user/:uid` - Update user profile
- `DELETE /auth/user/:uid` - Delete user account
- `POST /auth/token/:uid` - Create custom token

[View detailed documentation →](./api/authentication-api.md)

### Goals API

Goal setting, tracking, milestones, and progress updates.

**Base Path**: `/goal`

**Endpoints**:
- `POST /goal` - Create new goal
- `POST /goal/batch` - Create multiple goals
- `PUT /goal/batch` - Update multiple goals
- `GET /goal` - List all goals with filtering
- `GET /goal/counts` - Get goal counts by status
- `GET /goal/overdue` - Get overdue goals
- `GET /goal/:id` - Get goal by ID
- `PUT /goal/:id` - Update goal
- `PATCH /goal/:id/status` - Update goal status
- `DELETE /goal/:id` - Delete goal
- Milestone endpoints (add, update, toggle, delete)
- Progress update endpoints (add, list, delete)
- Journal linking endpoints (link, unlink, list)

[View detailed documentation →](./api/goals-api.md)

### Journal API

Journal entry creation, management, and search.

**Base Path**: `/journal`

**Endpoints**:
- `POST /journal` - Create journal entry
- `GET /journal` - List all journal entries
- `GET /journal/recent` - Get recent entries
- `GET /journal/search` - Search entries
- `GET /journal/grouped` - Get entries grouped by date
- `GET /journal/:id` - Get entry by ID
- `PUT /journal/:id` - Update entry
- `DELETE /journal/:id` - Delete entry
- `GET /journal/:id/goals` - Get linked goals

[View detailed documentation →](./api/journal-api.md)

### Chat API

AI-powered chat coaching with streaming support.

**Base Path**: `/chat`

**Endpoints**:
- `POST /chat/message` - Send message (non-streaming)
- `POST /chat/message/stream` - Send message (streaming)
- `POST /chat/session` - Create chat session
- `GET /chat/sessions` - List all sessions
- `GET /chat/session/:id` - Get session by ID
- `DELETE /chat/session/:id` - Delete session
- `PATCH /chat/session/:id/title` - Update session title
- `GET /chat/insights` - Generate insights
- `GET /chat/insights/stream` - Generate insights (streaming)
- `GET /chat/prompts` - Get suggested prompts
- `POST /chat/suggest-goals` - Get AI goal suggestions
- `GET /chat/goal-insights/:goalId` - Get goal-specific insights
- `GET /chat/goal-insights/:goalId/stream` - Get goal insights (streaming)

[View detailed documentation →](./api/chat-api.md)

### Voice Coach API

Voice-based AI coaching with ElevenLabs integration.

**Base Path**: `/voice-coach`

**Endpoints**:
- `POST /voice-coach/session` - Create voice session
- `GET /voice-coach/signed-url` - Get ElevenLabs signed URL
- `POST /voice-coach/conversation` - Save conversation transcript
- `GET /voice-coach/history` - Get conversation history
- `GET /voice-coach/conversation/:id` - Get conversation by ID
- `DELETE /voice-coach/conversation/:id` - Delete conversation
- `GET /voice-coach/health` - Health check with metrics
- `GET /voice-coach/metrics` - Get detailed metrics

[View detailed documentation →](./api/voice-coach-api.md)

### RAG API

Retrieval-Augmented Generation system health and metrics.

**Base Path**: `/rag`

**Endpoints**:
- `GET /rag/health` - RAG system health check
- `GET /rag/metrics` - Get RAG system metrics

[View detailed documentation →](./api/rag-api.md)

### Categories API

Custom category management for goals.

**Base Path**: `/category`

**Endpoints**:
- `POST /category` - Create custom category
- `GET /category` - List all categories
- `GET /category/:id` - Get category by ID
- `PUT /category/:id` - Update category
- `DELETE /category/:id` - Delete category

[View detailed documentation →](./api/categories-api.md)

### Coach Personalities API

Manage AI coach personality configurations.

**Base Path**: `/coach-personalities`

**Endpoints**:
- `POST /coach-personalities` - Create personality
- `GET /coach-personalities` - List all personalities
- `GET /coach-personalities/default` - Get default personality
- `GET /coach-personalities/:id` - Get personality by ID
- `PUT /coach-personalities/:id` - Update personality
- `DELETE /coach-personalities/:id` - Delete personality
- `POST /coach-personalities/:id/link-agent` - Link ElevenLabs agent
- `POST /coach-personalities/:id/generate-agent` - Auto-generate agent
- `POST /coach-personalities/initialize` - Initialize default personalities

[View detailed documentation →](./api/coach-personalities-api.md)

## Request/Response Examples

### Creating a Goal

**Request**:
```bash
curl -X POST https://api.example.com/api/v1/goal \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Run a 5K",
    "description": "Complete a 5K race by end of year",
    "category": "health",
    "target_date": "2025-12-31"
  }'
```

**Response** (201 Created):
```json
{
  "id": "goal_abc123",
  "user_id": "user_xyz789",
  "title": "Run a 5K",
  "description": "Complete a 5K race by end of year",
  "category": "health",
  "status": "not_started",
  "target_date": "2025-12-31T00:00:00Z",
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T10:00:00Z"
}
```

### Streaming Chat Message

**Request**:
```bash
curl -X POST https://api.example.com/api/v1/chat/message/stream \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are my goals for this month?",
    "sessionId": "session_123"
  }'
```

**Response** (Server-Sent Events):
```
data: {"type":"start","sessionId":"session_123"}

data: {"type":"content","content":"Based on your"}

data: {"type":"content","content":" goals, you have"}

data: {"type":"content","content":" 3 active goals"}

data: {"type":"end","messageId":"msg_456"}
```

### Getting Goal Counts

**Request**:
```bash
curl -X GET https://api.example.com/api/v1/goal/counts \
  -H "Authorization: Bearer <token>"
```

**Response** (200 OK):
```json
{
  "total": 15,
  "by_status": {
    "not_started": 3,
    "in_progress": 8,
    "completed": 4,
    "abandoned": 0
  },
  "by_category": {
    "health": 5,
    "career": 4,
    "personal": 6
  },
  "overdue": 2
}
```

## Streaming Endpoints

Several endpoints support Server-Sent Events (SSE) for real-time streaming:

### Chat Streaming

- `POST /chat/message/stream` - Stream chat responses
- `GET /chat/insights/stream` - Stream insights generation
- `GET /chat/goal-insights/:goalId/stream` - Stream goal insights

### SSE Format

Streaming responses use the Server-Sent Events format:

```
data: {"type":"start","sessionId":"123"}

data: {"type":"content","content":"Hello"}

data: {"type":"end","messageId":"456"}
```

### Event Types

- `start` - Stream started
- `content` - Content chunk
- `end` - Stream completed
- `error` - Error occurred

## CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) for web applications.

**Allowed Origins**: Configured via `CORS_ORIGINS` environment variable

**Allowed Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS

**Credentials**: Supported (cookies and authorization headers)

## Health Checks

### API Health

```bash
GET /health
```

Returns overall API health status.

### Service-Specific Health

- `GET /rag/health` - RAG system health
- `GET /voice-coach/health` - Voice coach service health

## Best Practices

### Authentication

1. Always include the Authorization header with a valid token
2. Refresh tokens before they expire (1 hour)
3. Handle 401 errors by prompting user to re-authenticate

### Error Handling

1. Check HTTP status codes before parsing response
2. Display user-friendly error messages
3. Implement retry logic for 5xx errors
4. Respect rate limits (429 errors)

### Performance

1. Use pagination for large lists
2. Cache responses when appropriate
3. Use streaming endpoints for long-running operations
4. Batch operations when available (e.g., batch goal creation)

### Security

1. Never expose Firebase tokens in logs or URLs
2. Use HTTPS in production
3. Validate and sanitize all user input
4. Follow principle of least privilege

## SDK and Client Libraries

Currently, the API is accessed directly via HTTP requests. Official client libraries may be provided in the future.

### Recommended HTTP Clients

- **JavaScript/TypeScript**: axios, fetch
- **Python**: requests, httpx
- **cURL**: For testing and debugging

## Support and Resources

- [Architecture Documentation](../ARCHITECTURE.md)
- [Setup Guide](../SETUP.md)
- [Feature Documentation](../FEATURES.md)
- [Troubleshooting Guide](../guides/troubleshooting.md)

## Changelog

### Version 1.0.0 (November 2025)

- Initial API release
- Authentication endpoints
- Goals management with milestones and progress
- Journal entries with search
- AI chat coaching with streaming
- Voice coach integration
- RAG system
- Custom categories
- Coach personalities

---

For detailed endpoint documentation, see the individual API documentation files in the [api/](./api/) directory.
