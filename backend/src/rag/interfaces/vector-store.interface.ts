import { Timestamp } from 'firebase-admin/firestore';

/**
 * Content types that can be embedded
 */
export type ContentType = 'journal' | 'goal' | 'milestone' | 'progress_update' | 'chat_message';

/**
 * Data structure for storing an embedding
 */
export interface EmbeddingData {
  userId: string;
  contentType: ContentType;
  documentId: string;
  embedding: number[];
  textSnippet: string;
  metadata?: Record<string, any>;
}

/**
 * Query parameters for semantic search
 */
export interface SearchQuery {
  userId: string;
  queryEmbedding: number[];
  contentTypes?: ContentType[];
  limit?: number;
  similarityThreshold?: number;
}

/**
 * A single search result from semantic search
 */
export interface SearchResult {
  documentId: string;
  contentType: ContentType;
  textSnippet: string;
  similarityScore: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

/**
 * Complete embedding document as stored in Firestore
 */
export interface EmbeddingDocument {
  id: string;
  user_id: string;
  content_type: ContentType;
  document_id: string;
  embedding: number[];
  text_snippet: string;
  metadata: Record<string, any>;
  created_at: Timestamp;
  updated_at: Timestamp;
}
