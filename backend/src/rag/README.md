# RAG Module

This module implements Retrieval-Augmented Generation (RAG) capabilities for the backend server, enabling semantic search and context retrieval for AI coaching features.

## Directory Structure

```
rag/
├── config/
│   └── rag.config.ts          # Configuration loader for RAG settings
├── interfaces/
│   ├── embedding.interface.ts  # Embedding generation types
│   ├── vector-store.interface.ts # Vector storage types
│   ├── rag.interface.ts        # High-level RAG types
│   └── index.ts                # Interface exports
├── embedding.service.ts        # Embedding generation service
├── vector-store.service.ts     # Vector storage and search service
├── rag.service.ts              # Main RAG orchestration service
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

### VectorStoreService
Manages storage and retrieval of embeddings in Firestore, including semantic search.

### RagService
High-level orchestration service that coordinates embedding generation, storage, and context retrieval.

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
