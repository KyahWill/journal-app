# RAG Rate Limiting Implementation

## Overview

Rate limiting has been implemented for RAG operations to prevent API quota exhaustion and ensure fair usage across users. The implementation integrates with the existing `RateLimitService` and provides graceful degradation when limits are exceeded.

## Rate Limits

The following daily rate limits have been configured:

- **Embedding Generation**: 100 embeddings per user per day
- **Semantic Search**: 200 searches per user per day

These limits reset daily at midnight.

## Implementation Details

### 1. RateLimitService Updates

Added two new rate limit features to `backend/src/common/services/rate-limit.service.ts`:

```typescript
rag_embedding: 100,  // Embedding generation per day
rag_search: 200,     // Semantic search queries per day
```

Warning thresholds:
- `rag_embedding`: Warn when 10 or fewer remaining
- `rag_search`: Warn when 20 or fewer remaining

### 2. RagRateLimitException

Created a custom exception class at `backend/src/rag/exceptions/rate-limit.exception.ts` that:
- Extends `HttpException` with status code 429 (Too Many Requests)
- Includes detailed information about the limit, remaining quota, and reset time
- Provides user-friendly error messages

### 3. RagService Integration

Updated `backend/src/rag/rag.service.ts` to check rate limits:

#### embedContent Method
- Checks rate limit before generating embeddings
- Throws `RagRateLimitException` if limit exceeded
- Supports `skipRateLimit` parameter for system operations (migrations)
- Logs warnings when approaching limits

#### retrieveContext Method
- Checks rate limit before performing semantic search
- Throws `RagRateLimitException` if limit exceeded
- Supports `skipRateLimit` parameter for system operations
- Logs warnings when approaching limits

### 4. Chat Service Integration

Updated `backend/src/chat/chat.service.ts` to handle rate limit exceptions gracefully:

#### retrieveRagContext Helper Method
- Wraps RAG context retrieval with error handling
- Catches `RagRateLimitException` and returns a user-friendly warning
- Falls back to empty context when rate limit is exceeded
- Ensures chat functionality continues even when RAG is unavailable

#### sendMessage and sendMessageStream Methods
- Use the `retrieveRagContext` helper method
- Append rate limit warnings to AI responses when applicable
- Provide users with information about when limits reset

## Behavior

### Normal Operation
1. User sends a chat message
2. Rate limit is checked for semantic search
3. If allowed, RAG context is retrieved and included in the response
4. Usage counter is incremented
5. Warning is logged if approaching limit

### Rate Limit Exceeded
1. User sends a chat message
2. Rate limit check fails (quota exhausted)
3. `RagRateLimitException` is thrown
4. Chat service catches the exception
5. User receives a response with a warning message:
   ```
   Note: Semantic search is temporarily unavailable due to rate limits. 
   Your response may be less personalized. Limit resets at [time].
   ```
6. Chat continues to function without RAG context

### System Operations
- Migrations and other system operations bypass rate limits
- Use `skipRateLimit: true` parameter when calling RAG methods
- Ensures backfilling and maintenance tasks are not blocked

## Error Messages

### Embedding Generation Limit Exceeded
```
Rate limit exceeded for content embedding generation. 
You have reached your daily limit of 100. 
Limit resets at [ISO timestamp].
```

### Semantic Search Limit Exceeded
```
Rate limit exceeded for semantic search queries. 
You have reached your daily limit of 200. 
Limit resets at [ISO timestamp].
```

## Monitoring

Rate limit events are logged with the following information:
- User ID
- Feature (embedding or search)
- Remaining quota
- Limit
- Reset time
- Warning messages when approaching limits

Example log entry:
```json
{
  "level": "warn",
  "message": "RAG search rate limit exceeded",
  "userId": "user123",
  "remaining": 0,
  "limit": 200,
  "resetsAt": "2024-01-02T00:00:00.000Z"
}
```

## Configuration

Rate limits can be adjusted in `backend/src/common/services/rate-limit.service.ts`:

```typescript
private readonly LIMITS = {
  // ... other limits
  rag_embedding: 100,  // Adjust as needed
  rag_search: 200,     // Adjust as needed
}

private readonly WARNING_THRESHOLDS = {
  // ... other thresholds
  rag_embedding: 10,   // Warn when this many remaining
  rag_search: 20,      // Warn when this many remaining
}
```

## Testing

To test rate limiting:

1. **Manual Testing**:
   - Send multiple chat messages to trigger semantic searches
   - Monitor logs for rate limit warnings
   - Exceed the limit and verify graceful degradation

2. **Database Verification**:
   - Check `user_usage/{userId}/daily/{date}` documents in Firestore
   - Verify `rag_search_count` and `rag_embedding_count` fields

3. **API Testing**:
   - Use the chat API endpoint repeatedly
   - Verify that responses continue even after rate limit is exceeded
   - Check for warning messages in responses

## Future Enhancements

1. **Configurable Limits**: Move limits to environment variables
2. **Per-Tier Limits**: Different limits for different user tiers
3. **Rate Limit Headers**: Include rate limit info in API response headers
4. **Metrics Dashboard**: Visualize rate limit usage across users
5. **Automatic Scaling**: Increase limits based on API quota availability
