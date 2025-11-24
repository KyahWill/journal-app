import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { FirebaseService } from '@/firebase/firebase.service';
import { Timestamp } from 'firebase-admin/firestore';
import {
  EmbeddingData,
  SearchQuery,
  SearchResult,
  EmbeddingDocument,
  ContentType,
} from './interfaces/vector-store.interface';
import { ragConfig } from './config/rag.config';
import { MetricsService } from './metrics.service';

/**
 * Service responsible for storing and retrieving vector embeddings in Firestore
 */
@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);
  private readonly EMBEDDINGS_COLLECTION = 'embeddings';
  private readonly config = ragConfig();
  
  // In-memory cache for embeddings
  private embeddingCache: Map<string, CachedEmbedding> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(
    private firebaseService: FirebaseService,
    @Inject(forwardRef(() => MetricsService))
    private metricsService: MetricsService,
  ) {
    this.logger.log('VectorStoreService initialized');
    this.logger.log(`Cache TTL: ${this.config.cacheTTL} seconds`);
    
    // Start cache cleanup interval
    this.startCacheCleanup();
  }

  /**
   * Store a single embedding in Firestore
   * @param data - Embedding data to store
   * @returns Promise<string> - ID of the stored embedding
   */
  async storeEmbedding(data: EmbeddingData): Promise<string> {
    try {
      const timestamp = Timestamp.now();
      
      const embeddingDoc = {
        user_id: data.userId,
        content_type: data.contentType,
        document_id: data.documentId,
        embedding: data.embedding,
        text_snippet: data.textSnippet,
        metadata: data.metadata || {},
        created_at: timestamp,
        updated_at: timestamp,
      };

      const result = await this.firebaseService.addDocument(
        this.EMBEDDINGS_COLLECTION,
        embeddingDoc,
      );

      this.logger.log({
        action: 'embedding_stored',
        embeddingId: result.id,
        userId: data.userId,
        contentType: data.contentType,
        documentId: data.documentId,
        dimensions: data.embedding.length,
      });

      // Invalidate cache for this user
      this.invalidateUserCache(data.userId);

      return result.id;
    } catch (error) {
      this.logger.error('Failed to store embedding', {
        error: error.message,
        userId: data.userId,
        contentType: data.contentType,
        documentId: data.documentId,
      });
      throw error;
    }
  }

  /**
   * Store multiple embeddings in batch
   * @param dataArray - Array of embedding data to store
   * @returns Promise<string[]> - Array of stored embedding IDs
   */
  async storeEmbeddings(dataArray: EmbeddingData[]): Promise<string[]> {
    if (!dataArray || dataArray.length === 0) {
      this.logger.warn('storeEmbeddings called with empty array');
      return [];
    }

    const startTime = Date.now();
    const embeddingIds: string[] = [];

    try {
      const batch = this.firebaseService.batch();
      const timestamp = Timestamp.now();
      const firestore = this.firebaseService.getFirestore();

      for (const data of dataArray) {
        const docRef = firestore.collection(this.EMBEDDINGS_COLLECTION).doc();
        
        const embeddingDoc = {
          user_id: data.userId,
          content_type: data.contentType,
          document_id: data.documentId,
          embedding: data.embedding,
          text_snippet: data.textSnippet,
          metadata: data.metadata || {},
          created_at: timestamp,
          updated_at: timestamp,
        };

        batch.set(docRef, embeddingDoc);
        embeddingIds.push(docRef.id);
      }

      await batch.commit();

      const duration = Date.now() - startTime;
      this.logger.log({
        action: 'batch_embeddings_stored',
        count: dataArray.length,
        duration,
        avgDuration: duration / dataArray.length,
      });

      // Invalidate cache for affected users
      const uniqueUserIds = [...new Set(dataArray.map(d => d.userId))];
      uniqueUserIds.forEach(userId => this.invalidateUserCache(userId));

      return embeddingIds;
    } catch (error) {
      this.logger.error('Failed to store embeddings in batch', {
        error: error.message,
        count: dataArray.length,
      });
      throw error;
    }
  }

  /**
   * Search for similar embeddings using cosine similarity
   * @param query - Search query parameters
   * @returns Promise<SearchResult[]> - Array of search results sorted by similarity
   */
  async searchSimilar(query: SearchQuery): Promise<SearchResult[]> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(query.userId);
      let userEmbeddings = this.getFromCache(cacheKey);
      const cacheHit = userEmbeddings !== null;

      if (!userEmbeddings) {
        // Fetch embeddings from Firestore
        userEmbeddings = await this.fetchUserEmbeddings(
          query.userId,
          query.contentTypes,
        );
        
        // Cache the results
        this.addToCache(cacheKey, userEmbeddings);
      }

      // Calculate similarities
      const results: SearchResult[] = [];
      
      for (const doc of userEmbeddings) {
        const similarity = this.calculateCosineSimilarity(
          query.queryEmbedding,
          doc.embedding,
        );

        // Apply similarity threshold
        const threshold = query.similarityThreshold ?? this.config.similarityThreshold;
        if (similarity >= threshold) {
          results.push({
            documentId: doc.document_id,
            contentType: doc.content_type,
            textSnippet: doc.text_snippet,
            similarityScore: similarity,
            metadata: doc.metadata,
            createdAt: doc.created_at.toDate(),
          });
        }
      }

      // Sort by similarity (descending) and limit results
      results.sort((a, b) => b.similarityScore - a.similarityScore);
      
      const limit = query.limit ?? this.config.maxRetrievedDocs;
      const limitedResults = results.slice(0, limit);

      const duration = Date.now() - startTime;
      const avgSimilarity = limitedResults.length > 0
        ? limitedResults.reduce((sum, r) => sum + r.similarityScore, 0) / limitedResults.length
        : 0;

      // Record search metrics
      this.metricsService.recordSearch(duration, limitedResults.length, avgSimilarity, cacheHit);

      this.logger.log({
        action: 'semantic_search',
        userId: query.userId,
        totalEmbeddings: userEmbeddings.length,
        resultsFound: limitedResults.length,
        avgSimilarity: avgSimilarity.toFixed(3),
        duration,
        cacheHit,
      });

      return limitedResults;
    } catch (error) {
      this.logger.error('Failed to search similar embeddings', {
        error: error.message,
        userId: query.userId,
      });
      throw error;
    }
  }

  /**
   * Delete a single embedding by ID
   * @param embeddingId - ID of the embedding to delete
   * @returns Promise<void>
   */
  async deleteEmbedding(embeddingId: string): Promise<void> {
    try {
      // Get the embedding first to invalidate cache
      const embedding = await this.firebaseService.getDocument(
        this.EMBEDDINGS_COLLECTION,
        embeddingId,
      );

      if (embedding) {
        await this.firebaseService.deleteDocument(
          this.EMBEDDINGS_COLLECTION,
          embeddingId,
        );

        this.logger.log({
          action: 'embedding_deleted',
          embeddingId,
          userId: embedding.user_id,
        });

        // Invalidate cache
        this.invalidateUserCache(embedding.user_id);
      } else {
        this.logger.warn(`Embedding ${embeddingId} not found for deletion`);
      }
    } catch (error) {
      this.logger.error('Failed to delete embedding', {
        error: error.message,
        embeddingId,
      });
      throw error;
    }
  }

  /**
   * Delete all embeddings for a specific document
   * @param userId - User ID for data isolation
   * @param documentId - Document ID to delete embeddings for
   * @returns Promise<void>
   */
  async deleteByDocument(userId: string, documentId: string): Promise<void> {
    try {
      const embeddings = await this.firebaseService.getCollection(
        this.EMBEDDINGS_COLLECTION,
        [
          { field: 'user_id', operator: '==', value: userId },
          { field: 'document_id', operator: '==', value: documentId },
        ],
      );

      if (embeddings.length === 0) {
        this.logger.warn(`No embeddings found for document ${documentId}`);
        return;
      }

      const batch = this.firebaseService.batch();
      const firestore = this.firebaseService.getFirestore();

      for (const embedding of embeddings) {
        const docRef = firestore.collection(this.EMBEDDINGS_COLLECTION).doc(embedding.id);
        batch.delete(docRef);
      }

      await batch.commit();

      this.logger.log({
        action: 'embeddings_deleted_by_document',
        userId,
        documentId,
        count: embeddings.length,
      });

      // Invalidate cache
      this.invalidateUserCache(userId);
    } catch (error) {
      this.logger.error('Failed to delete embeddings by document', {
        error: error.message,
        userId,
        documentId,
      });
      throw error;
    }
  }

  /**
   * Update an existing embedding
   * @param embeddingId - ID of the embedding to update
   * @param newEmbedding - New embedding vector
   * @param newTextSnippet - New text snippet
   * @returns Promise<void>
   */
  async updateEmbedding(
    embeddingId: string,
    newEmbedding: number[],
    newTextSnippet: string,
  ): Promise<void> {
    try {
      // Get the existing embedding to get user_id for cache invalidation
      const existing = await this.firebaseService.getDocument(
        this.EMBEDDINGS_COLLECTION,
        embeddingId,
      );

      if (!existing) {
        throw new Error(`Embedding ${embeddingId} not found`);
      }

      await this.firebaseService.updateDocument(
        this.EMBEDDINGS_COLLECTION,
        embeddingId,
        {
          embedding: newEmbedding,
          text_snippet: newTextSnippet,
        },
      );

      this.logger.log({
        action: 'embedding_updated',
        embeddingId,
        userId: existing.user_id,
        dimensions: newEmbedding.length,
      });

      // Invalidate cache
      this.invalidateUserCache(existing.user_id);
    } catch (error) {
      this.logger.error('Failed to update embedding', {
        error: error.message,
        embeddingId,
      });
      throw error;
    }
  }

  /**
   * Fetch all embeddings for a user from Firestore
   * @param userId - User ID
   * @param contentTypes - Optional filter by content types
   * @returns Promise<EmbeddingDocument[]>
   */
  private async fetchUserEmbeddings(
    userId: string,
    contentTypes?: ContentType[],
  ): Promise<EmbeddingDocument[]> {
    const filters: Array<{ field: string; operator: FirebaseFirestore.WhereFilterOp; value: any }> = [
      { field: 'user_id', operator: '==', value: userId },
    ];

    // Note: Firestore doesn't support 'in' operator with arrays in the same way
    // If contentTypes filter is needed, we'll fetch all and filter in memory
    const embeddings = await this.firebaseService.getCollection(
      this.EMBEDDINGS_COLLECTION,
      filters,
    );

    // Filter by content types if specified
    let filteredEmbeddings = embeddings;
    if (contentTypes && contentTypes.length > 0) {
      filteredEmbeddings = embeddings.filter(e => 
        contentTypes.includes(e.content_type as ContentType)
      );
    }

    return filteredEmbeddings as EmbeddingDocument[];
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param vecA - First vector
   * @param vecB - Second vector
   * @returns number - Similarity score between 0 and 1
   */
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Get cache key for a user
   * @param userId - User ID
   * @returns string - Cache key
   */
  private getCacheKey(userId: string): string {
    return `user_embeddings_${userId}`;
  }

  /**
   * Get embeddings from cache
   * @param key - Cache key
   * @returns EmbeddingDocument[] | null
   */
  private getFromCache(key: string): EmbeddingDocument[] | null {
    const cached = this.embeddingCache.get(key);
    
    if (!cached) {
      this.cacheMisses++;
      return null;
    }

    // Check if cache entry is expired
    const now = Date.now();
    if (now - cached.timestamp > this.config.cacheTTL * 1000) {
      this.embeddingCache.delete(key);
      this.cacheMisses++;
      return null;
    }

    this.cacheHits++;
    return cached.embeddings;
  }

  /**
   * Add embeddings to cache
   * @param key - Cache key
   * @param embeddings - Embeddings to cache
   */
  private addToCache(key: string, embeddings: EmbeddingDocument[]): void {
    this.embeddingCache.set(key, {
      embeddings,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate cache for a specific user
   * @param userId - User ID
   */
  private invalidateUserCache(userId: string): void {
    const key = this.getCacheKey(userId);
    this.embeddingCache.delete(key);
    this.logger.debug(`Cache invalidated for user ${userId}`);
  }

  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const ttlMs = this.config.cacheTTL * 1000;
    let removedCount = 0;

    for (const [key, cached] of this.embeddingCache.entries()) {
      if (now - cached.timestamp > ttlMs) {
        this.embeddingCache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} expired cache entries`);
    }

    // Log cache statistics
    this.logCacheStats();
  }

  /**
   * Log cache statistics
   */
  private logCacheStats(): void {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 
      ? ((this.cacheHits / totalRequests) * 100).toFixed(2)
      : '0.00';

    this.logger.log({
      action: 'cache_stats',
      cacheSize: this.embeddingCache.size,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate: `${hitRate}%`,
    });
  }
}

/**
 * Interface for cached embeddings
 */
interface CachedEmbedding {
  embeddings: EmbeddingDocument[];
  timestamp: number;
}
