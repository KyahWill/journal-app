# RAG API

**Last Updated**: November 2025

## Overview

The RAG (Retrieval-Augmented Generation) API provides health monitoring and metrics for the semantic search and context retrieval system. The RAG system powers intelligent search across journal entries and provides context for AI chat responses. All endpoints require authentication.

**Base Path**: `/api/v1/rag`

## What is RAG?

RAG (Retrieval-Augmented Generation) enhances AI responses by:

1. **Embedding Generation**: Converting text to vector embeddings
2. **Vector Storage**: Storing embeddings in Firebase with vector search
3. **Semantic Search**: Finding relevant content by meaning, not just keywords
4. **Context Retrieval**: Providing relevant context to AI for better responses

## Endpoints

### Health Check

Get comprehensive health status of the RAG system including all components.

**Endpoint**: `GET /rag/health`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-11-24T10:00:00Z",
  "checks": {
    "ragEnabled": true,
    "embeddingService": {
      "status": "healthy",
      "message": "Embedding service is operational"
    },
    "vectorStore": {
      "status": "healthy",
      "message": "Vector store is operational"
    },
    "endToEnd": {
      "status": "healthy",
      "message": "End-to-end workflow is operational",
      "duration": 245
    }
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| status | string | Overall health: healthy, degraded, unhealthy |
| timestamp | string | Health check timestamp |
| checks.ragEnabled | boolean | Whether RAG is enabled in configuration |
| checks.embeddingService.status | string | Embedding service health status |
| checks.embeddingService.message | string | Status description |
| checks.vectorStore.status | string | Vector store health status |
| checks.vectorStore.message | string | Status description |
| checks.endToEnd.status | string | End-to-end workflow status |
| checks.endToEnd.duration | number | Test duration in milliseconds |

**Status Values**:
- `healthy` - All components operational
- `degraded` - RAG disabled or some components have issues
- `unhealthy` - Critical components unavailable

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/rag/health \
  -H "Authorization: Bearer <token>"
```

**Health Check Process**:

1. **Embedding Service Check**
   - Generates test embedding
   - Validates embedding dimensions
   - Confirms service availability

2. **Vector Store Check**
   - Performs test search query
   - Validates database connectivity
   - Confirms index availability

3. **End-to-End Check**
   - Generates embedding
   - Stores in vector database
   - Searches for stored embedding
   - Verifies retrieval
   - Cleans up test data
   - Measures total duration

---

### Get Metrics

Get detailed metrics about RAG system performance and usage.

**Endpoint**: `GET /rag/metrics`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "timestamp": "2025-11-24T10:00:00Z",
  "ragEnabled": true,
  "embedding": {
    "totalRequests": 1250,
    "successfulRequests": 1245,
    "failedRequests": 5,
    "averageLatency": 180,
    "cacheHits": 450,
    "cacheMisses": 800,
    "successRate": "99.60%"
  },
  "search": {
    "totalSearches": 890,
    "averageLatency": 95,
    "averageResultsReturned": 5.2,
    "cacheHitRate": "36.00%"
  },
  "quota": {
    "dailyLimit": 10000,
    "dailyUsed": 1250,
    "remainingToday": 8750,
    "percentUsed": 12.5
  }
}
```

**Metrics Breakdown**:

**Embedding Metrics**:
| Metric | Description |
|--------|-------------|
| totalRequests | Total embedding generation requests |
| successfulRequests | Successfully generated embeddings |
| failedRequests | Failed embedding requests |
| averageLatency | Average time to generate embedding (ms) |
| cacheHits | Embeddings served from cache |
| cacheMisses | Embeddings generated fresh |
| successRate | Percentage of successful requests |

**Search Metrics**:
| Metric | Description |
|--------|-------------|
| totalSearches | Total vector searches performed |
| averageLatency | Average search time (ms) |
| averageResultsReturned | Average number of results per search |
| cacheHitRate | Percentage of searches served from cache |

**Quota Metrics**:
| Metric | Description |
|--------|-------------|
| dailyLimit | Daily API quota limit |
| dailyUsed | Quota used today |
| remainingToday | Remaining quota for today |
| percentUsed | Percentage of daily quota used |

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/rag/metrics \
  -H "Authorization: Bearer <token>"
```

---

## RAG System Components

### 1. Embedding Service

Converts text to vector embeddings using Google's Gemini API.

**Model**: `text-embedding-004`
**Dimensions**: 768
**Task Type**: `RETRIEVAL_DOCUMENT` for storage, `RETRIEVAL_QUERY` for search

**Features**:
- Semantic understanding of text
- Consistent vector representation
- Optimized for retrieval tasks
- Caching for performance

### 2. Vector Store

Stores and searches embeddings using Firebase with vector search capabilities.

**Database**: Firestore with vector search
**Index Type**: Optimized vector indexing
**Distance Metric**: Cosine similarity

**Collections**:
- `journal_embeddings` - Journal entry embeddings
- `goal_embeddings` - Goal and milestone embeddings

### 3. Search Service

Performs semantic search to find relevant content.

**Features**:
- Similarity threshold filtering
- Result ranking by relevance
- Multi-collection search
- Context-aware retrieval

## RAG Configuration

### Enabling/Disabling RAG

RAG can be enabled or disabled via environment variables:

```bash
RAG_ENABLED=true
GEMINI_API_KEY=your_api_key
```

When disabled:
- Health check returns `degraded` status
- Search falls back to basic text search
- No embeddings are generated
- Existing embeddings remain in database

### Performance Tuning

**Embedding Cache**:
- TTL: 1 hour
- Max size: 1000 entries
- Reduces API calls and latency

**Search Parameters**:
- Default limit: 10 results
- Similarity threshold: 0.7 (0-1 scale)
- Max results: 50

## Rate Limiting

RAG endpoints have specific rate limits:

- **Health check**: 100 requests per minute per user
- **Metrics**: 100 requests per minute per user

**Embedding Generation** (internal):
- 20 requests per minute per user
- Shared with Chat API quota

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 503 Service Unavailable | RAG disabled or service down | Check configuration, enable RAG |
| 500 Internal Server Error | Database or API error | Check health endpoint, retry |
| 429 Too Many Requests | Rate limit exceeded | Wait before retrying |

### Health Check Errors

When health check fails, response includes error details:

```json
{
  "status": "unhealthy",
  "checks": {
    "embeddingService": {
      "status": "unhealthy",
      "message": "Embedding service check failed: API key invalid"
    },
    "vectorStore": {
      "status": "healthy",
      "message": "Vector store is operational"
    }
  }
}
```

## Monitoring Best Practices

### Regular Health Checks

1. Monitor health endpoint every 5 minutes
2. Alert on `unhealthy` status
3. Track `degraded` status for trends
4. Monitor end-to-end duration for performance

### Metrics Monitoring

1. Track success rate (should be >99%)
2. Monitor average latency (should be <200ms for embeddings)
3. Watch quota usage (alert at 80%)
4. Track cache hit rates (optimize if <30%)

### Performance Optimization

1. **High Cache Miss Rate**: Increase cache size or TTL
2. **High Latency**: Check network, database indexes
3. **Low Success Rate**: Check API keys, quotas
4. **High Quota Usage**: Implement request batching

## Integration with Other APIs

### Chat API

RAG provides context for chat responses:

1. User sends message to Chat API
2. Chat generates embedding for message
3. RAG searches for relevant journal entries and goals
4. Context included in AI prompt
5. AI generates contextual response

### Journal API

RAG enables semantic search:

1. User searches journal entries
2. Search query converted to embedding
3. RAG finds semantically similar entries
4. Results ranked by relevance
5. Returns matching entries

## Troubleshooting

### RAG Not Working

**Symptoms**: Search returns no results, chat lacks context

**Checks**:
1. Verify `RAG_ENABLED=true` in environment
2. Check `GEMINI_API_KEY` is valid
3. Verify Firebase connection
4. Check health endpoint status
5. Review metrics for errors

### Slow Performance

**Symptoms**: High latency, timeouts

**Checks**:
1. Check embedding service latency in metrics
2. Verify database indexes exist
3. Monitor cache hit rate
4. Check network connectivity
5. Review quota usage

### High Error Rate

**Symptoms**: Many failed requests

**Checks**:
1. Verify API key validity
2. Check quota limits
3. Review error logs
4. Test health endpoint
5. Verify database connectivity

## Related Documentation

- [RAG System Feature](../features/rag-system.md)
- [Chat API](./chat-api.md)
- [Journal API](./journal-api.md)
- [Backend Architecture](../architecture/backend-architecture.md)
- [Data Models](../architecture/data-models.md)

## Additional Resources

### RAG Configuration

See backend documentation:
- `backend/src/rag/CONFIGURATION.md` - Configuration guide
- `backend/src/rag/RATE_LIMITING.md` - Rate limiting details
- `backend/src/rag/INDEXES_QUICK_REFERENCE.md` - Database indexes

### Deployment

- `backend/scripts/deploy-rag-indexes.sh` - Deploy database indexes
- `backend/scripts/verify-rag-indexes.sh` - Verify index setup

---

[← Back to API Reference](../API_REFERENCE.md)
