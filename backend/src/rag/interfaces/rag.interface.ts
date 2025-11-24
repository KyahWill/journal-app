import { ContentType } from './vector-store.interface';

/**
 * Content to be embedded and stored
 */
export interface ContentToEmbed {
  userId: string;
  contentType: ContentType;
  documentId: string;
  text: string;
  metadata?: Record<string, any>;
}

/**
 * Options for retrieving context
 */
export interface RetrievalOptions {
  userId: string;
  contentTypes?: ContentType[];
  limit?: number;
  similarityThreshold?: number;
  includeRecent?: boolean;
  recentDays?: number;
}

/**
 * A single retrieved document with context
 */
export interface RetrievedDocument {
  id: string;
  type: ContentType;
  content: string;
  similarity: number;
  createdAt: Date;
  metadata: Record<string, any>;
}

/**
 * Retrieved context containing relevant documents
 */
export interface RetrievedContext {
  documents: RetrievedDocument[];
  totalFound: number;
  query: string;
}

/**
 * Result of content migration
 */
export interface MigrationResult {
  userId: string;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  duration: number;
  errors: Array<{
    documentId: string;
    contentType: ContentType;
    error: string;
  }>;
}
