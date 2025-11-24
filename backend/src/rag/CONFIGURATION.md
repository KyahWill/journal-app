# RAG System Configuration Guide

This guide provides comprehensive documentation for configuring the Retrieval-Augmented Generation (RAG) system in the backend.

## Table of Contents

- [Overview](#overview)
- [Environment Variables](#environment-variables)
- [Configuration Interface](#configuration-interface)
- [Feature Flag](#feature-flag)
- [Configuration Examples](#configuration-examples)
- [Performance Tuning](#performance-tuning)
- [Troubleshooting](#troubleshooting)

## Overview

The RAG system enhances AI coaching by enabling semantic search over user content. Configuration is managed through environment variables defined in the `.env` file and loaded via the `ragConfig()` function.

## Environment Variables

All RAG configuration is controlled through environment variables with sensible defaults.

### RAG_ENABLED

**Feature flag to enable/disable RAG functionality**

- **Type**: Boolean (`true` or `false`)
- **Default**: `true`
- **Required**: No

When set to `false`, the RAG system is completely disabled and the application falls back to traditional context retrieval methods. This is useful for:

- Development and testing without RAG
- Troubleshooting issues
- Reducing API costs
- Gradual rollout to production

**Example:**
```bash
RAG_ENABLED=true
```

### RAG_EMBEDDING_MODEL

**Gemini embedding model to use for generating vector embeddings**

- **Type**: String
- **Default**: `text-embedding-004`
- **Options**: 
  - `text-embedding-004` (recommended, 768 dimensions)
  - `embedding-001` (legacy, 768 dimensions)
- **Required**: No

**Example:**
```bash
RAG_EMBEDDING_MODEL=text-embedding-004
```

### RAG_EMBEDDING_DIMENSIONS

**Dimensionality of the embedding vectors**

- **Type**: Integer
- **Default**: `768`
- **Required**: No

Must match the dimensions of the chosen embedding model. The `text-embedding-004` model uses 768 dimensions.

**Example:**
```bash
RAG_EMBEDDING_DIMENSIONS=768
```

### RAG_SIMILARITY_THRESHOLD

**Minimum cosine similarity score for search results**

- **Type**: Float (0.0 to 1.0)
- **Default**: `0.7`
- **Required**: No

Controls the relevance threshold for semantic search results. Higher values return more relevant but fewer results.

**Recommendations:**
- `0.5-0.6`: Broad matching (more results, lower relevance)
- `0.6-0.7`: Balanced (recommended for most use cases)
- `0.7-0.8`: High relevance (fewer but more accurate results)
- `0.8+`: Very strict matching (may miss relevant content)

**Example:**
```bash
RAG_SIMILARITY_THRESHOLD=0.7
```

### RAG_MAX_RETRIEVED_DOCS

**Maximum number of documents to retrieve per semantic search query**

- **Type**: Integer
- **Default**: `5`
- **Required**: No

Limits the number of documents included in AI prompts. Higher values provide more context but increase token usage and costs.

**Recommendations:**
- `3-5`: Optimal for most use cases
- `5-10`: More context for complex queries
- `10+`: May exceed token limits or increase latency

**Example:**
```bash
RAG_MAX_RETRIEVED_DOCS=5
```

### RAG_CACHE_TTL_SECONDS

**Time-to-live for cached embeddings in seconds**

- **Type**: Integer
- **Default**: `3600` (1 hour)
- **Required**: No

Controls how long embeddings are cached in memory before being refreshed from Firestore.

**Recommendations:**
- Development: `300-600` (5-10 minutes)
- Production: `3600-7200` (1-2 hours)
- High-traffic: `7200+` (2+ hours)

**Example:**
```bash
RAG_CACHE_TTL_SECONDS=3600
```

### RAG_BATCH_SIZE

**Number of documents to process in a single batch during embedding generation**

- **Type**: Integer
- **Default**: `50`
- **Required**: No

Controls batch size for embedding generation operations. Larger batches are more efficient but use more memory.

**Recommendations:**
- Small datasets: `25-50`
- Medium datasets: `50-100`
- Large datasets: `100+` (monitor memory usage)

**Example:**
```bash
RAG_BATCH_SIZE=50
```

## Configuration Interface

The configuration is loaded through the `RagConfig` interface:

```typescript
export interface RagConfig {
  enabled: boolean;
  embeddingModel: string;
  embeddingDimensions: number;
  similarityThreshold: number;
  maxRetrievedDocs: number;
  cacheTTL: number;
  batchSize: number;
}
```

### Loading Configuration

```typescript
import { ragConfig } from './config/rag.config';

const config = ragConfig();

if (config.enabled) {
  console.log('RAG is enabled');
  console.log('Using model:', config.embeddingModel);
  console.log('Similarity threshold:', config.similarityThreshold);
}
```

## Feature Flag

The `RAG_ENABLED` environment variable acts as a master feature flag for the entire RAG system.

### Enabling RAG

```bash
RAG_ENABLED=true
```

When enabled:
- Content is automatically embedded on creation/update
- Semantic search is used for AI coaching
- Embeddings are stored in Firestore
- Cache is active

### Disabling RAG

```bash
RAG_ENABLED=false
```

When disabled:
- No embeddings are generated
- Semantic search is skipped
- Traditional context retrieval is used
- No additional API costs

### Use Cases for Disabling RAG

1. **Development**: Test the application without RAG overhead
2. **Debugging**: Isolate issues by disabling RAG
3. **Cost Control**: Reduce Gemini API usage during development
4. **Gradual Rollout**: Enable RAG for specific users or environments
5. **Performance Testing**: Compare performance with and without RAG

## Configuration Examples

### Development Environment

Optimized for testing and debugging:

```bash
RAG_ENABLED=true
RAG_EMBEDDING_MODEL=text-embedding-004
RAG_EMBEDDING_DIMENSIONS=768
RAG_SIMILARITY_THRESHOLD=0.6          # Lower threshold for more results
RAG_MAX_RETRIEVED_DOCS=10             # More context for testing
RAG_CACHE_TTL_SECONDS=600             # Shorter cache for faster updates
RAG_BATCH_SIZE=25                     # Smaller batches for debugging
```

### Production Environment

Optimized for performance and cost:

```bash
RAG_ENABLED=true
RAG_EMBEDDING_MODEL=text-embedding-004
RAG_EMBEDDING_DIMENSIONS=768
RAG_SIMILARITY_THRESHOLD=0.7          # Balanced relevance
RAG_MAX_RETRIEVED_DOCS=5              # Optimal context size
RAG_CACHE_TTL_SECONDS=3600            # 1 hour cache
RAG_BATCH_SIZE=50                     # Efficient batch size
```

### High-Performance Production

Optimized for high-traffic scenarios:

```bash
RAG_ENABLED=true
RAG_EMBEDDING_MODEL=text-embedding-004
RAG_EMBEDDING_DIMENSIONS=768
RAG_SIMILARITY_THRESHOLD=0.75         # Higher relevance
RAG_MAX_RETRIEVED_DOCS=3              # Minimal context for speed
RAG_CACHE_TTL_SECONDS=7200            # 2 hour cache
RAG_BATCH_SIZE=100                    # Large batches for efficiency
```

### Testing Environment

RAG disabled for baseline testing:

```bash
RAG_ENABLED=false
# Other RAG settings are ignored when disabled
```

## Performance Tuning

### Optimizing Search Performance

1. **Adjust Similarity Threshold**: Higher thresholds reduce the number of results and improve relevance
2. **Limit Retrieved Documents**: Fewer documents reduce token usage and latency
3. **Increase Cache TTL**: Longer cache reduces Firestore queries
4. **Use Larger Batches**: Batch processing is more efficient for bulk operations

### Optimizing Embedding Generation

1. **Batch Size**: Larger batches reduce API calls but increase memory usage
2. **Async Processing**: Embeddings are generated asynchronously to avoid blocking
3. **Error Handling**: Failed embeddings are logged but don't block operations

### Monitoring Performance

Key metrics to monitor:

- Embedding generation time
- Search latency
- Cache hit rate
- API quota usage
- Similarity score distribution

## Troubleshooting

### RAG Not Working

**Check if RAG is enabled:**
```bash
# In .env file
RAG_ENABLED=true
```

**Verify configuration is loaded:**
```typescript
import { ragConfig } from './config/rag.config';
console.log('RAG Config:', ragConfig());
```

### No Search Results

**Lower the similarity threshold:**
```bash
RAG_SIMILARITY_THRESHOLD=0.6  # or lower
```

**Increase max retrieved documents:**
```bash
RAG_MAX_RETRIEVED_DOCS=10
```

### High API Costs

**Reduce batch size:**
```bash
RAG_BATCH_SIZE=25
```

**Increase cache TTL:**
```bash
RAG_CACHE_TTL_SECONDS=7200
```

**Disable RAG temporarily:**
```bash
RAG_ENABLED=false
```

### Slow Performance

**Increase cache TTL:**
```bash
RAG_CACHE_TTL_SECONDS=7200
```

**Reduce max retrieved documents:**
```bash
RAG_MAX_RETRIEVED_DOCS=3
```

**Increase similarity threshold:**
```bash
RAG_SIMILARITY_THRESHOLD=0.8
```

### Memory Issues

**Reduce batch size:**
```bash
RAG_BATCH_SIZE=25
```

**Reduce cache TTL:**
```bash
RAG_CACHE_TTL_SECONDS=1800
```

## Additional Resources

- [RAG Module README](./README.md) - Module overview and usage
- [Migration Guide](./MIGRATION_GUIDE.md) - Backfilling embeddings for existing content
- [Design Document](../../.kiro/specs/rag-implementation/design.md) - Architecture and design details
- [Requirements Document](../../.kiro/specs/rag-implementation/requirements.md) - Detailed requirements

## Support

For issues or questions about RAG configuration:

1. Check this documentation
2. Review the [troubleshooting section](#troubleshooting)
3. Check application logs for errors
4. Verify environment variables are set correctly
5. Test with RAG disabled to isolate issues
