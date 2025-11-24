/**
 * Result of generating a single embedding
 */
export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
}

/**
 * Result of generating multiple embeddings in batch
 */
export interface BatchEmbeddingResult {
  embeddings: number[][];
  dimensions: number;
  model: string;
  failed: number[]; // Indices of texts that failed to embed
}
