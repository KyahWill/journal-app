/**
 * RAG system configuration interface
 */
export interface RagConfig {
  enabled: boolean;
  embeddingModel: string;
  embeddingDimensions: number;
  similarityThreshold: number;
  maxRetrievedDocs: number;
  cacheTTL: number;
  batchSize: number;
}

/**
 * Load RAG configuration from environment variables
 */
export const ragConfig = (): RagConfig => ({
  enabled: process.env.RAG_ENABLED === 'true',
  embeddingModel: process.env.RAG_EMBEDDING_MODEL || 'text-embedding-004',
  embeddingDimensions: parseInt(process.env.RAG_EMBEDDING_DIMENSIONS || '768', 10),
  similarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.7'),
  maxRetrievedDocs: parseInt(process.env.RAG_MAX_RETRIEVED_DOCS || '5', 10),
  cacheTTL: parseInt(process.env.RAG_CACHE_TTL_SECONDS || '3600', 10),
  batchSize: parseInt(process.env.RAG_BATCH_SIZE || '50', 10),
});
