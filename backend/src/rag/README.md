# RAG Module

This module implements Retrieval-Augmented Generation (RAG) capabilities for the backend server, enabling semantic search and context retrieval for AI coaching features.

## Supported Content Types

The RAG system embeds and retrieves the following content types:

| Content Type | Description | Source |
|--------------|-------------|--------|
| `journal` | Journal entries | Journal entries collection |
| `goal` | User goals | Goals collection |
| `milestone` | Goal milestones | Goals subcollection |
| `progress_update` | Goal progress updates | Goals subcollection |
| `chat_message` | AI Coach conversations | Chat sessions collection |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Message                                 │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ChatService                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. Retrieve RAG context (semantic search)                    │   │
│  │ 2. Build prompt with journal, goals, and RAG context         │   │
│  │ 3. Send to Gemini for response                               │   │
│  │ 4. Embed conversation pair (async, non-blocking)             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
┌───────────────────────────────┐  ┌───────────────────────────────────┐
│        RagService             │  │        EmbeddingService           │
│  - Orchestrates RAG workflow  │  │  - Generates vector embeddings    │
│  - Formats context for AI     │  │  - Uses Gemini text-embedding-004 │
│  - Manages job queue          │  │  - Max 10,000 chars per text      │
└───────────────────┬───────────┘  └───────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      VectorStoreService                               │
│  - Stores embeddings in Firestore                                     │
│  - Performs cosine similarity search                                  │
│  - Caches results for performance                                     │
└───────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      Firestore (embeddings collection)                │
│  - user_id, content_type, document_id, embedding[], text_snippet      │
└───────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
rag/
├── config/
│   └── rag.config.ts          # Configuration loader for RAG settings
├── exceptions/
│   └── rate-limit.exception.ts # Rate limit exception class
├── interfaces/
│   ├── embedding.interface.ts  # Embedding generation types
│   ├── vector-store.interface.ts # Vector storage types
│   ├── rag.interface.ts        # High-level RAG types
│   └── index.ts                # Interface exports
├── embedding.service.ts        # Embedding generation service
├── vector-store.service.ts     # Vector storage and search service
├── rag.service.ts              # Main RAG orchestration service
├── migration.service.ts        # Migration/backfill service
├── metrics.service.ts          # Metrics tracking service
├── rag.controller.ts           # Health check endpoints
├── rag.module.ts               # NestJS module definition
└── README.md                   # This file
```

## Configuration

The RAG module is configured via environment variables in `.env`:

```bash
RAG_ENABLED=true                      # Enable/disable RAG features
RAG_EMBEDDING_MODEL=text-embedding-004 # Gemini embedding model
RAG_EMBEDDING_DIMENSIONS=768          # Vector dimensions
RAG_SIMILARITY_THRESHOLD=0.7          # Minimum similarity score
RAG_MAX_RETRIEVED_DOCS=5              # Max documents per query
RAG_CACHE_TTL_SECONDS=3600            # Cache time-to-live
RAG_BATCH_SIZE=50                     # Batch processing size
```

### Configuration Details

#### RAG_ENABLED (Feature Flag)
- **Type**: Boolean (`true` or `false`)
- **Default**: `true`
- **Description**: Master switch for RAG functionality. When disabled, the system falls back to traditional context retrieval methods.
- **Use Cases**:
  - Disable during development/testing
  - Temporarily disable for troubleshooting
  - Reduce API costs
  - Gradual rollout to users

#### RAG_EMBEDDING_MODEL
- **Type**: String
- **Default**: `text-embedding-004`
- **Options**: `text-embedding-004`, `embedding-001`
- **Description**: The Gemini embedding model to use for generating vector embeddings.
- **Note**: Different models may have different dimensions and performance characteristics.

#### RAG_EMBEDDING_DIMENSIONS
- **Type**: Integer
- **Default**: `768`
- **Description**: The dimensionality of the embedding vectors. Must match the chosen embedding model.
- **Note**: `text-embedding-004` uses 768 dimensions.

#### RAG_SIMILARITY_THRESHOLD
- **Type**: Float (0.0 to 1.0)
- **Default**: `0.7`
- **Description**: Minimum cosine similarity score for search results. Higher values return more relevant but fewer results.
- **Recommendations**:
  - `0.6-0.7`: Balanced relevance
  - `0.7-0.8`: High relevance
  - `0.8+`: Very strict matching

#### RAG_MAX_RETRIEVED_DOCS
- **Type**: Integer
- **Default**: `5`
- **Description**: Maximum number of documents to retrieve per semantic search query.
- **Considerations**:
  - Higher values provide more context but increase token usage
  - Lower values reduce costs but may miss relevant information
  - Recommended range: 3-10

#### RAG_CACHE_TTL_SECONDS
- **Type**: Integer
- **Default**: `3600` (1 hour)
- **Description**: Time-to-live for cached embeddings in seconds.
- **Recommendations**:
  - Development: 300-600 (5-10 minutes)
  - Production: 3600-7200 (1-2 hours)

#### RAG_BATCH_SIZE
- **Type**: Integer
- **Default**: `50`
- **Description**: Number of documents to process in a single batch during embedding generation.
- **Considerations**:
  - Larger batches are more efficient but use more memory
  - Smaller batches are safer for large datasets
  - Recommended range: 25-100

### Loading Configuration

Configuration is loaded via the `ragConfig()` function in `config/rag.config.ts`:

```typescript
import { ragConfig } from './config/rag.config';

const config = ragConfig();
console.log('RAG enabled:', config.enabled);
```

### Environment-Specific Configurations

**Development:**
```bash
RAG_ENABLED=true
RAG_SIMILARITY_THRESHOLD=0.6
RAG_MAX_RETRIEVED_DOCS=10
RAG_CACHE_TTL_SECONDS=600
```

**Production:**
```bash
RAG_ENABLED=true
RAG_SIMILARITY_THRESHOLD=0.7
RAG_MAX_RETRIEVED_DOCS=5
RAG_CACHE_TTL_SECONDS=3600
```

**Testing:**
```bash
RAG_ENABLED=false
```

## Services

### EmbeddingService
Generates vector embeddings using Google's Gemini embedding API.
- Uses `text-embedding-004` model (768 dimensions)
- Maximum text length: 10,000 characters
- Automatic retry with exponential backoff

### VectorStoreService
Manages storage and retrieval of embeddings in Firestore, including semantic search.
- Cosine similarity search
- User-scoped queries for data isolation
- In-memory caching with configurable TTL

### RagService
High-level orchestration service that coordinates embedding generation, storage, and context retrieval.
- Async job queue for non-blocking embedding
- Context formatting for AI prompts
- Automatic retry for failed embeddings

### MigrationService
Handles backfilling embeddings for existing content.
- Batch processing with rate limiting
- Progress tracking and reporting
- Support for all content types including chat messages

## Chat Message Embedding

When users chat with the AI Coach, each conversation exchange (user message + AI response) is automatically embedded for future retrieval. This allows the AI to reference past conversations.

### How It Works

1. User sends a message to AI Coach
2. AI generates response
3. Message pair is queued for async embedding
4. Text is formatted as: `User: {message}\n\nCoach: {response}`
5. If text exceeds 10,000 chars, it's truncated at a sentence boundary
6. Embedding is stored with session metadata

### Metadata Stored

```typescript
{
  session_id: string,        // Chat session ID
  session_title?: string,    // Session title (if set)
  personality_id?: string,   // Coach personality used
  user_message_id: string,   // User message ID
  assistant_message_id: string, // AI response ID
  timestamp: string          // ISO timestamp
}
```

### Text Truncation

Long conversations are automatically truncated to fit the 10,000 character limit:
- Truncates at sentence boundaries when possible
- Preserves the beginning of the conversation (user's question)
- Appends `[Content truncated...]` indicator

## Usage

The RAG module is imported in `app.module.ts` and can be used by other modules:

```typescript
import { RagModule } from '@/rag/rag.module';

@Module({
  imports: [RagModule],
  // ...
})
export class YourModule {}
```

## Firestore Indexes

The RAG module requires specific Firestore indexes for optimal performance. See [INDEXES.md](./INDEXES.md) for detailed documentation.

### Quick Start

Deploy RAG indexes:
```bash
npm run rag:deploy-indexes
```

Verify indexes are ready:
```bash
npm run rag:verify-indexes
```

### Required Indexes

1. **user_id + content_type + created_at** - For filtered semantic search
2. **user_id + created_at** - For retrieving all user embeddings

See [INDEXES.md](./INDEXES.md) for complete documentation.

## Implementation Status

- [x] Module infrastructure setup
- [x] Embedding service implementation
- [x] Vector store service implementation
- [x] RAG service implementation
- [x] Integration with Journal service
- [x] Integration with Goal service
- [x] Integration with Chat service
- [x] Migration service for existing content
- [x] Monitoring and metrics
- [x] Rate limiting
- [x] Firestore indexes

## Documentation

- [Requirements](../../../.kiro/specs/rag-implementation/requirements.md) - Detailed requirements
- [Design](../../../.kiro/specs/rag-implementation/design.md) - Architecture and design
- [Configuration](./CONFIGURATION.md) - Configuration guide
- [Migration](./MIGRATION_GUIDE.md) - Migration guide for existing content
- [Rate Limiting](./RATE_LIMITING.md) - Rate limiting documentation
- [Indexes](./INDEXES.md) - Firestore indexes documentation
