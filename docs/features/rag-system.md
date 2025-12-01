# RAG System Feature

**Retrieval-Augmented Generation for semantic search and context-aware AI**

---

**Last Updated**: November 2025  
**Status**: ✅ Complete

---

## Overview

The RAG (Retrieval-Augmented Generation) system provides semantic search capabilities for journal entries using vector embeddings. This enables the AI coaches to retrieve the most relevant journal entries based on conversation context, improving response quality while reducing token usage.

## Key Features

### Semantic Search

#### Vector-Based Similarity
- Embedding generation with Google Gemini
- Cosine similarity search
- Relevance scoring
- Configurable result limits
- Metadata filtering

#### Query Processing
- Natural language queries
- Automatic embedding generation
- Efficient vector search
- Result ranking by relevance

### Document Management

#### Automatic Embedding
- Embed journal entries on creation
- Update embeddings on entry modification
- Delete embeddings on entry deletion
- Batch embedding generation

#### Document Chunking
- Split large entries into chunks
- Maintain context across chunks
- Optimal chunk size (500-1000 tokens)
- Overlap between chunks

#### Metadata Extraction
- Entry ID and user ID
- Creation and update timestamps
- Entry title
- Entry length
- Custom metadata fields

### Vector Store

#### Firebase Vector Search
- Firestore with vector search capabilities
- Efficient similarity search
- Indexed vector columns
- Scalable storage
- ACID compliance

#### Vector Dimensions
- 768-dimensional embeddings (Gemini)
- Optimized for semantic similarity
- Balanced accuracy and performance

### Context Integration

#### Chat Integration
- Retrieve relevant entries for chat context
- Top 5 most relevant entries
- Reduces token usage
- Improves response relevance

#### Voice Coach Integration
- Retrieve relevant entries for voice sessions
- Dynamic context building
- Real-time retrieval
- Conversation-aware search

### Performance

#### Rate Limiting
- 10 requests per minute per user
- Prevents API abuse
- Protects backend resources
- User-friendly error messages

#### Caching
- Cache frequent queries
- Cache embeddings
- Reduce API calls
- Faster response times

#### Batch Operations
- Batch embedding generation
- Batch document insertion
- Efficient resource usage
- Reduced API costs

## Architecture

### Database Schema

#### Journal Embeddings Table

```sql
CREATE TABLE journal_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(768) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_journal_embeddings_user_id 
  ON journal_embeddings(user_id);

CREATE INDEX idx_journal_embeddings_entry_id 
  ON journal_embeddings(entry_id);

-- Vector similarity index
CREATE INDEX idx_journal_embeddings_embedding 
  ON journal_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### Components

#### RAG Service
- Embedding generation
- Document management
- Search operations
- Batch processing

#### Vector Store Service
- Firebase integration
- Vector operations
- Similarity search
- Index management

#### Context Builder Service
- Context assembly
- RAG integration
- Token management
- Context optimization

#### Migration Service
- Migrate existing entries
- Batch embedding generation
- Progress tracking
- Error handling

### API Endpoints

**POST /rag/embed**
- Generate embedding for text
- Body: { text, userId, entryId }
- Returns: { embeddingId, dimensions }

**POST /rag/search**
- Semantic search for entries
- Body: { query, userId, limit }
- Returns: Array of relevant entries with scores

**POST /rag/migrate**
- Migrate existing entries to RAG
- Body: { userId }
- Returns: { processed, failed, skipped }

**DELETE /rag/entry/:entryId**
- Delete embeddings for entry
- Returns: Success message

## Usage Examples

### Embedding a Journal Entry

```typescript
import { apiClient } from '@/lib/api/client'

// Automatically called when creating entry
const entry = await apiClient.createJournalEntry({
  title: 'Great day today',
  content: 'Had an amazing breakthrough...'
})

// Embedding is generated automatically
```

### Searching for Relevant Entries

```typescript
// Search for entries related to a query
const results = await apiClient.searchRAG({
  query: 'Tell me about my progress on goals',
  limit: 5
})

// Results include entry content and relevance scores
results.forEach(result => {
  console.log(`Score: ${result.score}`)
  console.log(`Entry: ${result.content}`)
})
```

### Migrating Existing Entries

```typescript
// Migrate all existing entries for a user
const result = await apiClient.migrateToRAG(userId)

console.log(`Processed: ${result.processed}`)
console.log(`Failed: ${result.failed}`)
console.log(`Skipped: ${result.skipped}`)
```

### Using RAG in Chat Context

```typescript
// Context builder automatically uses RAG
const context = await contextBuilder.buildContext(userId, {
  query: userMessage,
  includeRAG: true,
  ragLimit: 5
})

// Context includes relevant journal entries
console.log(context.relevantEntries)
```

## Features in Detail

### Embedding Generation

Embeddings are generated using Google Gemini:

**Process**:
1. Extract text from journal entry
2. Send to Gemini embedding API
3. Receive 768-dimensional vector
4. Store in Firebase with metadata
5. Index for fast similarity search

**Optimization**:
- Batch multiple entries
- Cache embeddings
- Retry on failure
- Rate limit protection

### Similarity Search

Search uses cosine similarity:

**Algorithm**:
```
similarity = (A · B) / (||A|| × ||B||)
```

Where:
- A = query embedding
- B = document embedding
- · = dot product
- ||x|| = vector magnitude

**Ranking**:
- Results sorted by similarity score
- Score range: 0 (unrelated) to 1 (identical)
- Typical threshold: 0.7 for relevance

### Document Chunking

Large entries are split into chunks:

**Chunking Strategy**:
- Max chunk size: 1000 tokens
- Overlap: 100 tokens
- Preserve sentence boundaries
- Maintain context

**Benefits**:
- Better embedding quality
- More precise retrieval
- Handles long entries
- Improves search accuracy

### Metadata Management

Each embedding includes metadata:

```typescript
interface EmbeddingMetadata {
  entry_id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  length: number
  chunk_index?: number
  total_chunks?: number
}
```

**Uses**:
- Filter search results
- Track entry versions
- Manage chunks
- Audit trail

### Rate Limiting

Rate limiting protects the system:

**Limits**:
- 10 embedding requests per minute
- 10 search requests per minute
- Per-user limits
- Sliding window

**Behavior**:
- Returns 429 status code
- Includes retry-after header
- User-friendly error message
- Automatic retry with backoff

## Performance Optimizations

### Indexing
- IVFFlat index for fast search
- Optimized for cosine similarity
- Configurable list count
- Balanced speed and accuracy

### Caching
- Cache frequent queries
- Cache embeddings
- TTL-based expiration
- Memory-efficient

### Batch Processing
- Batch embedding generation
- Batch document insertion
- Reduced API calls
- Lower costs

### Query Optimization
- Limit result count
- Filter by user ID
- Use indexed columns
- Efficient SQL queries

## Testing

### Manual Testing Checklist

- [ ] Create journal entry (embedding auto-generated)
- [ ] Search for relevant entries
- [ ] Update journal entry (embedding updated)
- [ ] Delete journal entry (embedding deleted)
- [ ] Migrate existing entries
- [ ] Test with large entry (chunking)
- [ ] Test with many entries (1000+)
- [ ] Test search relevance
- [ ] Test rate limiting
- [ ] Test error handling
- [ ] Test with no entries
- [ ] Test with duplicate entries

### API Testing

```bash
# Generate embedding
curl -X POST http://localhost:3001/api/v1/rag/embed \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Today was a great day",
    "userId": "user123",
    "entryId": "entry456"
  }'

# Search for entries
curl -X POST http://localhost:3001/api/v1/rag/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tell me about my progress",
    "userId": "user123",
    "limit": 5
  }'

# Migrate entries
curl -X POST http://localhost:3001/api/v1/rag/migrate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123"
  }'
```

## Troubleshooting

### Embeddings not generated

**Symptoms**: Search returns no results

**Possible Causes**:
1. Embedding generation failed
2. Firebase connection issue
3. Gemini API error

**Solutions**:
1. Check backend logs
2. Verify Firebase connection
3. Check Gemini API key
4. Run migration script

### Search returns irrelevant results

**Symptoms**: Results don't match query

**Possible Causes**:
1. Poor embedding quality
2. Insufficient training data
3. Query too vague

**Solutions**:
1. Regenerate embeddings
2. Add more journal entries
3. Use more specific queries
4. Adjust similarity threshold

### Rate limit errors

**Symptoms**: 429 Too Many Requests

**Possible Causes**:
1. Too many requests in short time
2. Batch operation too large
3. Multiple users sharing IP

**Solutions**:
1. Implement exponential backoff
2. Reduce batch size
3. Spread requests over time
4. Contact support for limit increase

## Configuration

### Environment Variables

```bash
# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=your-private-key

# RAG Settings
RAG_EMBEDDING_DIMENSIONS=768
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=100
RAG_SEARCH_LIMIT=5
RAG_SIMILARITY_THRESHOLD=0.7
RAG_RATE_LIMIT=10
```

### Deployment

**Firebase Setup**:
```bash
# Create Firestore indexes
# Deploy security rules
firebase deploy --only firestore:indexes,firestore:rules

# Deploy indexes
bash backend/scripts/deploy-rag-indexes.sh
```

**Migration**:
```bash
# Migrate existing entries
npm run migrate:rag

# Verify migration
bash backend/scripts/verify-rag-indexes.sh
```

## Future Enhancements

### Planned Features

- [ ] Multi-modal embeddings (text + images)
- [ ] Hybrid search (vector + keyword)
- [ ] Semantic clustering
- [ ] Automatic summarization
- [ ] Topic modeling
- [ ] Trend detection
- [ ] Anomaly detection
- [ ] Personalized ranking

### Potential Improvements

- [ ] Fine-tuned embeddings
- [ ] Custom embedding models
- [ ] Incremental indexing
- [ ] Distributed search
- [ ] Real-time indexing
- [ ] Advanced filtering
- [ ] Faceted search
- [ ] Search analytics

## Related Documentation

- [API Reference](../API_REFERENCE.md#rag)
- [Firebase Vector Search](../integrations/firebase-vector-search.md)
- [Gemini Integration](../integrations/gemini.md)
- [Chat Feature](./chat.md)
- [Voice Coach Feature](./voice-coach.md)

