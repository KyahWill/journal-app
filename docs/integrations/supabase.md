# Supabase Integration

**PostgreSQL database with vector search capabilities**

---

**Last Updated**: November 2025  
**Status**: ✅ Production Ready (RAG Feature)

---

## Table of Contents

- [Overview](#overview)
- [Services Used](#services-used)
- [Setup](#setup)
- [Vector Search](#vector-search)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

Supabase provides PostgreSQL database with pgvector extension for the Journal application's RAG (Retrieval-Augmented Generation) feature. It enables semantic search across journal entries, goals, and other content using vector embeddings.

**Key Features**:
- PostgreSQL database with pgvector extension
- Vector similarity search
- Efficient indexing with HNSW algorithm
- Real-time subscriptions (not currently used)
- Row Level Security (RLS)
- RESTful API

**Use Case**: RAG system for semantic search and context retrieval

---

## Services Used

### PostgreSQL Database

**Purpose**: Store vector embeddings and metadata for semantic search

**Features**:
- Full PostgreSQL compatibility
- ACID transactions
- Complex queries and joins
- JSON support
- Full-text search

### pgvector Extension

**Purpose**: Vector similarity search for RAG

**Features**:
- Store vector embeddings (up to 2000 dimensions)
- Cosine similarity search
- Euclidean distance search
- Inner product search
- HNSW indexing for fast queries

### Supabase Client

**Purpose**: JavaScript client for database operations

**Features**:
- Type-safe queries
- Real-time subscriptions
- Authentication integration
- Automatic connection pooling

---

## Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New project"
3. Enter project details:
   - Name: "journal-rag"
   - Database password: (generate strong password)
   - Region: Choose closest to your users
4. Click "Create new project"
5. Wait for project provisioning (2-3 minutes)

### 2. Enable pgvector Extension

1. In Supabase Dashboard, go to **Database** → **Extensions**
2. Search for "vector"
3. Enable **vector** extension
4. Confirm enablement

### 3. Create Database Schema

Run this SQL in **SQL Editor**:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE IF NOT EXISTS rag_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_text TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rag_embeddings_user_id 
  ON rag_embeddings(user_id);

CREATE INDEX IF NOT EXISTS idx_rag_embeddings_content_type 
  ON rag_embeddings(content_type);

CREATE INDEX IF NOT EXISTS idx_rag_embeddings_content_id 
  ON rag_embeddings(content_id);

-- Create HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_rag_embeddings_vector 
  ON rag_embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Create composite index for user + content type queries
CREATE INDEX IF NOT EXISTS idx_rag_embeddings_user_content 
  ON rag_embeddings(user_id, content_type);

-- Enable Row Level Security
ALTER TABLE rag_embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own embeddings"
  ON rag_embeddings FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own embeddings"
  ON rag_embeddings FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own embeddings"
  ON rag_embeddings FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own embeddings"
  ON rag_embeddings FOR DELETE
  USING (auth.uid()::text = user_id);
```

### 4. Get Configuration

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

### 5. Configure Environment Variables

**Backend API** (`.env`):
```env
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# RAG Configuration
RAG_ENABLED=true
RAG_EMBEDDING_MODEL=text-embedding-004
RAG_EMBEDDING_DIMENSIONS=768
RAG_SIMILARITY_THRESHOLD=0.7
RAG_MAX_RETRIEVED_DOCS=5
```

**Note**: Use `service_role` key for backend (bypasses RLS). Never expose this key to clients!

---

## Vector Search

### How It Works

1. **Content Ingestion**:
   - User creates journal entry, goal, or milestone
   - Backend generates embedding using Gemini API
   - Embedding stored in Supabase with metadata

2. **Semantic Search**:
   - User sends chat message
   - Backend generates query embedding
   - Supabase finds similar embeddings using cosine similarity
   - Relevant content returned to enhance AI response

3. **Context Enhancement**:
   - Retrieved content added to AI prompt
   - AI generates response with relevant context
   - User gets personalized, context-aware coaching

### Vector Dimensions

The application uses **768-dimensional vectors** from Google's `text-embedding-004` model:

- **Dimensions**: 768
- **Model**: text-embedding-004
- **Provider**: Google Gemini API
- **Quality**: High-quality semantic embeddings
- **Performance**: Optimized for similarity search

### Similarity Search

**Cosine Similarity**:
- Measures angle between vectors
- Range: -1 (opposite) to 1 (identical)
- Threshold: 0.7 (configurable)
- Best for semantic similarity

**Query Example**:
```sql
SELECT 
  content_text,
  content_type,
  metadata,
  1 - (embedding <=> query_embedding) AS similarity
FROM rag_embeddings
WHERE user_id = $1
  AND 1 - (embedding <=> query_embedding) > 0.7
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

### HNSW Index

**Hierarchical Navigable Small World (HNSW)**:
- Fast approximate nearest neighbor search
- Trade-off between speed and accuracy
- Parameters:
  - `m = 16`: Number of connections per layer
  - `ef_construction = 64`: Size of dynamic candidate list

**Performance**:
- Sub-millisecond queries on millions of vectors
- 95%+ recall accuracy
- Scales to billions of vectors

---

## Configuration

### Database Schema

**rag_embeddings Table**:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | TEXT | Owner user ID (from Firebase) |
| `content_type` | TEXT | Type: journal_entry, goal, milestone, progress_update |
| `content_id` | TEXT | Reference to source document |
| `content_text` | TEXT | Original text content |
| `embedding` | vector(768) | 768-dimensional embedding |
| `metadata` | JSONB | Additional metadata (category, date, etc.) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Indexes

1. **User ID Index**: Fast user-specific queries
2. **Content Type Index**: Filter by content type
3. **Content ID Index**: Lookup by source document
4. **Vector Index (HNSW)**: Fast similarity search
5. **Composite Index**: User + content type queries

### Row Level Security (RLS)

**Policies**:
- Users can only access their own embeddings
- Enforced at database level
- Bypassed by service_role key (backend only)

**Benefits**:
- Additional security layer
- Prevents data leaks
- Complements application-level authorization

---

## Usage Examples

### Initialize Supabase Client

**Backend Service** (`backend/src/rag/vector-store.service.ts`):
```typescript
import { createClient } from '@supabase/supabase-js'

@Injectable()
export class VectorStoreService {
  private supabase: SupabaseClient
  
  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')
    
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
}
```

### Store Embedding

```typescript
async storeEmbedding(
  userId: string,
  contentType: string,
  contentId: string,
  contentText: string,
  embedding: number[],
  metadata: any = {}
): Promise<void> {
  const { error } = await this.supabase
    .from('rag_embeddings')
    .insert({
      user_id: userId,
      content_type: contentType,
      content_id: contentId,
      content_text: contentText,
      embedding: embedding,
      metadata: metadata,
    })
  
  if (error) {
    throw new Error(`Failed to store embedding: ${error.message}`)
  }
}
```

### Search Similar Content

```typescript
async searchSimilar(
  userId: string,
  queryEmbedding: number[],
  limit: number = 5,
  threshold: number = 0.7
): Promise<any[]> {
  const { data, error } = await this.supabase.rpc('match_embeddings', {
    query_embedding: queryEmbedding,
    query_user_id: userId,
    match_threshold: threshold,
    match_count: limit,
  })
  
  if (error) {
    throw new Error(`Search failed: ${error.message}`)
  }
  
  return data || []
}
```

### Create Search Function

Run this SQL to create the search function:

```sql
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(768),
  query_user_id text,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content_text text,
  content_type text,
  content_id text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rag_embeddings.id,
    rag_embeddings.content_text,
    rag_embeddings.content_type,
    rag_embeddings.content_id,
    rag_embeddings.metadata,
    1 - (rag_embeddings.embedding <=> query_embedding) AS similarity
  FROM rag_embeddings
  WHERE rag_embeddings.user_id = query_user_id
    AND 1 - (rag_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY rag_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Delete Embeddings

```typescript
async deleteEmbedding(userId: string, contentId: string): Promise<void> {
  const { error } = await this.supabase
    .from('rag_embeddings')
    .delete()
    .eq('user_id', userId)
    .eq('content_id', contentId)
  
  if (error) {
    throw new Error(`Failed to delete embedding: ${error.message}`)
  }
}
```

### Update Embedding

```typescript
async updateEmbedding(
  userId: string,
  contentId: string,
  contentText: string,
  embedding: number[]
): Promise<void> {
  const { error } = await this.supabase
    .from('rag_embeddings')
    .update({
      content_text: contentText,
      embedding: embedding,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('content_id', contentId)
  
  if (error) {
    throw new Error(`Failed to update embedding: ${error.message}`)
  }
}
```

---

## Best Practices

### Performance

1. **Use HNSW index** for fast similarity search
2. **Batch insert operations** when possible
3. **Set appropriate similarity threshold** (0.6-0.8)
4. **Limit result count** (3-10 documents)
5. **Cache embeddings** to avoid regeneration
6. **Monitor query performance** in Supabase Dashboard

### Security

1. **Never expose service_role key** to clients
2. **Use RLS policies** for additional security
3. **Validate user_id** matches authenticated user
4. **Sanitize content** before storing
5. **Rotate keys** regularly
6. **Monitor access logs**

### Cost Optimization

1. **Delete old embeddings** periodically
2. **Use appropriate vector dimensions** (768 is good balance)
3. **Implement caching** to reduce queries
4. **Monitor database size** in Supabase Dashboard
5. **Set up billing alerts**
6. **Optimize index parameters** for your use case

### Data Quality

1. **Clean text** before generating embeddings
2. **Include relevant metadata** for filtering
3. **Update embeddings** when content changes
4. **Delete embeddings** when content is deleted
5. **Validate embedding dimensions** match model
6. **Handle errors gracefully**

---

## Troubleshooting

### Connection Errors

**Error**: `Failed to connect to Supabase`

**Solutions**:
1. Verify `SUPABASE_URL` is correct
2. Check `SUPABASE_SERVICE_ROLE_KEY` is valid
3. Ensure project is not paused (free tier)
4. Check network connectivity
5. Verify Supabase project is active

### Vector Dimension Mismatch

**Error**: `Vector dimension mismatch`

**Solutions**:
1. Verify embedding model outputs 768 dimensions
2. Check `RAG_EMBEDDING_DIMENSIONS=768` in config
3. Ensure table schema uses `vector(768)`
4. Regenerate embeddings if dimension changed
5. Drop and recreate table if needed

### Slow Queries

**Issue**: Vector search is slow

**Solutions**:
1. Verify HNSW index is created
2. Check index parameters (m, ef_construction)
3. Reduce result limit
4. Increase similarity threshold
5. Monitor database performance in Dashboard
6. Consider upgrading Supabase plan

### RLS Policy Errors

**Error**: `Row level security policy violation`

**Solutions**:
1. Verify using `service_role` key in backend
2. Check RLS policies are correct
3. Ensure `user_id` matches authenticated user
4. Test policies in SQL Editor
5. Temporarily disable RLS for debugging (not in production!)

### High Costs

**Issue**: Unexpected Supabase costs

**Solutions**:
1. Monitor database size in Dashboard
2. Delete old/unused embeddings
3. Implement data retention policy
4. Optimize query patterns
5. Set up billing alerts
6. Consider upgrading to Pro plan for better pricing

---

## Related Documentation

- [RAG System Feature](../features/rag-system.md)
- [Backend Architecture](../architecture/backend-architecture.md)
- [Environment Variables](../setup/environment-variables.md)
- [Gemini Integration](gemini.md) (for embeddings)

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Vector Search Guide](https://supabase.com/docs/guides/ai/vector-search)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)
- [Supabase Pricing](https://supabase.com/pricing)

---

**Last Updated**: November 2025  
**Status**: ✅ Production Ready (RAG Feature)
