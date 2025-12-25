import { Injectable, Logger, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { MigrationService } from './migration.service';
import { RateLimitService } from '@/common/services/rate-limit.service';
import { RagRateLimitException } from './exceptions/rate-limit.exception';
import {
  ContentToEmbed,
  RetrievalOptions,
  RetrievedContext,
  RetrievedDocument,
  MigrationResult,
} from './interfaces/rag.interface';
import { EmbeddingData, SearchResult } from './interfaces/vector-store.interface';
import { ragConfig } from './config/rag.config';

/**
 * Job queue item for async embedding processing
 */
interface EmbeddingJob {
  id: string;
  content: ContentToEmbed;
  retryCount: number;
  createdAt: Date;
}

/**
 * Service that orchestrates the RAG workflow and provides high-level API
 */
@Injectable()
export class RagService implements OnModuleDestroy {
  private readonly logger = new Logger(RagService.name);
  private readonly config = ragConfig();
  private readonly MAX_CONTEXT_LENGTH = 8000; // Characters for context window management
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 5000; // 5 seconds
  
  // Job queue for async processing
  private jobQueue: EmbeddingJob[] = [];
  private isProcessingQueue = false;
  private queueProcessingInterval: NodeJS.Timeout | null = null;
  
  // Failed jobs for error recovery
  private failedJobs: Map<string, EmbeddingJob> = new Map();

  constructor(
    private embeddingService: EmbeddingService,
    private vectorStoreService: VectorStoreService,
    @Inject(forwardRef(() => MigrationService))
    private migrationService: MigrationService,
    private rateLimitService: RateLimitService,
  ) {
    this.logger.log('RagService initialized');
    this.logger.log(`RAG enabled: ${this.config.enabled}`);
    
    // Start queue processing
    this.startQueueProcessing();
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy() {
    if (this.queueProcessingInterval) {
      clearInterval(this.queueProcessingInterval);
      this.queueProcessingInterval = null;
    }
    
    this.logger.log('RagService destroyed');
    this.logQueueStats();
  }

  /**
   * Embed content and store it in the vector store
   * @param content - Content to embed
   * @param async - If true, queue for async processing instead of immediate execution
   * @param skipRateLimit - If true, skip rate limit check (for migrations and system operations)
   * @returns Promise<void>
   */
  async embedContent(
    content: ContentToEmbed,
    async: boolean = false,
    skipRateLimit: boolean = false,
  ): Promise<void> {
    if (!this.config.enabled) {
      this.logger.debug('RAG is disabled, skipping embedding');
      return;
    }

    // If async mode, queue the job and return immediately
    if (async) {
      this.queueEmbedding(content);
      return;
    }

    const startTime = Date.now();

    try {
      // Check rate limit (unless skipped for system operations)
      if (!skipRateLimit) {
        const rateLimitCheck = await this.rateLimitService.checkAndIncrement(
          content.userId,
          'rag_embedding',
        );

        if (!rateLimitCheck.allowed) {
          this.logger.warn('Rate limit exceeded for embedding generation', {
            userId: content.userId,
            remaining: rateLimitCheck.remaining,
            limit: rateLimitCheck.limit,
            resetsAt: rateLimitCheck.resetsAt,
          });

          throw new RagRateLimitException(
            'embedding',
            rateLimitCheck.remaining,
            rateLimitCheck.limit,
            rateLimitCheck.resetsAt,
          );
        }

        // Log warning if approaching limit
        if (rateLimitCheck.warning) {
          this.logger.warn('Approaching rate limit for embedding generation', {
            userId: content.userId,
            warning: rateLimitCheck.warning,
            remaining: rateLimitCheck.remaining,
          });
        }
      }

      // Validate input
      if (!content.text || content.text.trim().length === 0) {
        this.logger.warn('Empty text provided for embedding, skipping', {
          userId: content.userId,
          documentId: content.documentId,
          contentType: content.contentType,
        });
        return;
      }

      // Generate embedding
      this.logger.debug(`Generating embedding for ${content.contentType} ${content.documentId}`);
      const embedding = await this.embeddingService.generateEmbedding(content.text);

      // Create text snippet (first 500 characters)
      const textSnippet = content.text.substring(0, 500);

      // Store embedding
      const embeddingData: EmbeddingData = {
        userId: content.userId,
        contentType: content.contentType,
        documentId: content.documentId,
        embedding,
        textSnippet,
        metadata: content.metadata,
      };

      await this.vectorStoreService.storeEmbedding(embeddingData);

      const duration = Date.now() - startTime;
      this.logger.log({
        action: 'content_embedded',
        userId: content.userId,
        contentType: content.contentType,
        documentId: content.documentId,
        textLength: content.text.length,
        duration,
        async: false,
        rateLimitSkipped: skipRateLimit,
      });
    } catch (error) {
      // Re-throw rate limit exceptions
      if (error instanceof RagRateLimitException) {
        throw error;
      }

      this.logger.error('Failed to embed content', {
        error: error.message,
        stack: error.stack,
        userId: content.userId,
        contentType: content.contentType,
        documentId: content.documentId,
      });
      
      // Don't throw - embedding failures should not block primary operations
      // The error is logged for monitoring
    }
  }

  /**
   * Retrieve relevant context using semantic search
   * @param query - Query text to search for
   * @param options - Retrieval options
   * @param skipRateLimit - If true, skip rate limit check (for system operations)
   * @returns Promise<RetrievedContext>
   */
  async retrieveContext(
    query: string,
    options: RetrievalOptions,
    skipRateLimit: boolean = false,
  ): Promise<RetrievedContext> {
    if (!this.config.enabled) {
      this.logger.debug('RAG is disabled, returning empty context');
      return {
        documents: [],
        totalFound: 0,
        query,
      };
    }

    const startTime = Date.now();

    try {
      // Check rate limit (unless skipped for system operations)
      if (!skipRateLimit) {
        const rateLimitCheck = await this.rateLimitService.checkAndIncrement(
          options.userId,
          'rag_search',
        );

        if (!rateLimitCheck.allowed) {
          this.logger.warn('Rate limit exceeded for semantic search', {
            userId: options.userId,
            remaining: rateLimitCheck.remaining,
            limit: rateLimitCheck.limit,
            resetsAt: rateLimitCheck.resetsAt,
          });

          throw new RagRateLimitException(
            'search',
            rateLimitCheck.remaining,
            rateLimitCheck.limit,
            rateLimitCheck.resetsAt,
          );
        }

        // Log warning if approaching limit
        if (rateLimitCheck.warning) {
          this.logger.warn('Approaching rate limit for semantic search', {
            userId: options.userId,
            warning: rateLimitCheck.warning,
            remaining: rateLimitCheck.remaining,
          });
        }
      }

      // Validate input
      if (!query || query.trim().length === 0) {
        this.logger.warn('Empty query provided for context retrieval');
        return {
          documents: [],
          totalFound: 0,
          query,
        };
      }

      // Generate query embedding
      this.logger.debug(`Generating query embedding for user ${options.userId}`);
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Search for similar documents
      const searchResults = await this.vectorStoreService.searchSimilar({
        userId: options.userId,
        queryEmbedding,
        contentTypes: options.contentTypes,
        limit: options.limit ?? this.config.maxRetrievedDocs,
        similarityThreshold: options.similarityThreshold ?? this.config.similarityThreshold,
      });

      // Apply recency filter if requested
      let filteredResults = searchResults;
      if (options.includeRecent && options.recentDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - options.recentDays);
        
        filteredResults = searchResults.filter(
          result => result.createdAt >= cutoffDate,
        );
      }

      // Sort by recency when similarity scores are equal (within 0.01 threshold)
      filteredResults.sort((a, b) => {
        const similarityDiff = Math.abs(a.similarityScore - b.similarityScore);
        if (similarityDiff < 0.01) {
          // Similarity scores are essentially equal, sort by recency
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        // Otherwise maintain similarity-based sorting
        return b.similarityScore - a.similarityScore;
      });

      // Convert to RetrievedDocument format
      const documents: RetrievedDocument[] = filteredResults.map(result => ({
        id: result.documentId,
        type: result.contentType,
        content: result.textSnippet,
        similarity: result.similarityScore,
        createdAt: result.createdAt,
        metadata: result.metadata,
      }));

      const duration = Date.now() - startTime;
      this.logger.log({
        action: 'context_retrieved',
        userId: options.userId,
        queryLength: query.length,
        documentsFound: documents.length,
        duration,
        rateLimitSkipped: skipRateLimit,
      });

      return {
        documents,
        totalFound: documents.length,
        query,
      };
    } catch (error) {
      // Re-throw rate limit exceptions
      if (error instanceof RagRateLimitException) {
        throw error;
      }

      this.logger.error('Failed to retrieve context', {
        error: error.message,
        stack: error.stack,
        userId: options.userId,
        queryLength: query.length,
      });

      // Return empty context on failure (graceful degradation)
      return {
        documents: [],
        totalFound: 0,
        query,
      };
    }
  }

  /**
   * Update an existing embedding when content changes
   * @param userId - User ID for data isolation
   * @param documentId - Document ID to update
   * @param newText - New text content
   * @returns Promise<void>
   */
  async updateEmbedding(
    userId: string,
    documentId: string,
    newText: string,
  ): Promise<void> {
    if (!this.config.enabled) {
      this.logger.debug('RAG is disabled, skipping embedding update');
      return;
    }

    const startTime = Date.now();

    try {
      // Validate input
      if (!newText || newText.trim().length === 0) {
        this.logger.warn('Empty text provided for embedding update, deleting embeddings', {
          userId,
          documentId,
        });
        await this.deleteEmbeddings(userId, documentId);
        return;
      }

      // Generate new embedding
      this.logger.debug(`Updating embedding for document ${documentId}`);
      const newEmbedding = await this.embeddingService.generateEmbedding(newText);

      // Create new text snippet
      const newTextSnippet = newText.substring(0, 500);

      // Find existing embeddings for this document
      const existingEmbeddings = await this.vectorStoreService.searchSimilar({
        userId,
        queryEmbedding: newEmbedding, // Use new embedding as query to find existing
        limit: 100, // Get all potential matches
        similarityThreshold: 0, // Get all results
      });

      // Filter to exact document matches
      const documentEmbeddings = existingEmbeddings.filter(
        e => e.documentId === documentId,
      );

      if (documentEmbeddings.length === 0) {
        this.logger.warn(`No existing embeddings found for document ${documentId}, creating new one`);
        // If no existing embedding, create a new one
        // We need to infer the content type - this is a limitation
        // In practice, the calling service should provide this information
        return;
      }

      // Update the first embedding (there should typically be only one per document)
      // Note: We need to get the embedding ID, which requires fetching from Firestore
      // For now, we'll delete and recreate
      await this.deleteEmbeddings(userId, documentId);

      const duration = Date.now() - startTime;
      this.logger.log({
        action: 'embedding_updated',
        userId,
        documentId,
        textLength: newText.length,
        duration,
      });
    } catch (error) {
      this.logger.error('Failed to update embedding', {
        error: error.message,
        stack: error.stack,
        userId,
        documentId,
      });
      
      // Don't throw - embedding failures should not block primary operations
    }
  }

  /**
   * Delete all embeddings for a document
   * @param userId - User ID for data isolation
   * @param documentId - Document ID to delete embeddings for
   * @returns Promise<void>
   */
  async deleteEmbeddings(userId: string, documentId: string): Promise<void> {
    if (!this.config.enabled) {
      this.logger.debug('RAG is disabled, skipping embedding deletion');
      return;
    }

    const startTime = Date.now();

    try {
      this.logger.debug(`Deleting embeddings for document ${documentId}`);
      await this.vectorStoreService.deleteByDocument(userId, documentId);

      const duration = Date.now() - startTime;
      this.logger.log({
        action: 'embeddings_deleted',
        userId,
        documentId,
        duration,
      });
    } catch (error) {
      this.logger.error('Failed to delete embeddings', {
        error: error.message,
        stack: error.stack,
        userId,
        documentId,
      });
      
      // Don't throw - deletion failures should not block primary operations
    }
  }

  /**
   * Format retrieved context for AI consumption
   * Helper method to format retrieved documents for AI prompt
   * Includes document type, content, and relevance score
   * Organizes by content type (journals, goals, etc.)
   * Adds context markers for AI to understand source
   * 
   * @param context - Retrieved context
   * @returns string - Formatted context text
   */
  formatContextForAI(context: RetrievedContext): string {
    if (!context.documents || context.documents.length === 0) {
      return '';
    }

    const sections: string[] = [];
    
    // Add header to help AI understand this is RAG context
    sections.push('=== RELEVANT CONTEXT FROM USER\'S HISTORY ===');
    sections.push('The following information was retrieved based on semantic similarity to the current conversation:');
    sections.push('');
    
    // Group documents by type
    const groupedDocs = this.groupDocumentsByType(context.documents);

    // Format each group with clear markers
    for (const [type, docs] of Object.entries(groupedDocs)) {
      const typeLabel = this.getTypeLabel(type);
      sections.push(`--- ${typeLabel} ---`);
      
      const docTexts = docs.map((doc, index) => {
        const date = doc.createdAt.toLocaleDateString();
        const relevance = (doc.similarity * 100).toFixed(0);
        
        // Include metadata if available
        let metadataStr = '';
        if (doc.metadata) {
          const metaParts: string[] = [];
          if (doc.metadata.mood) metaParts.push(`Mood: ${doc.metadata.mood}`);
          if (doc.metadata.tags && Array.isArray(doc.metadata.tags)) {
            metaParts.push(`Tags: ${doc.metadata.tags.join(', ')}`);
          }
          if (doc.metadata.category) metaParts.push(`Category: ${doc.metadata.category}`);
          if (doc.metadata.status) metaParts.push(`Status: ${doc.metadata.status}`);
          
          if (metaParts.length > 0) {
            metadataStr = `\n  ${metaParts.join(' | ')}`;
          }
        }
        
        return `${index + 1}. [Date: ${date}] [Relevance: ${relevance}%]${metadataStr}\n  Content: ${doc.content}`;
      });

      sections.push(docTexts.join('\n\n'));
      sections.push('');
    }

    sections.push('=== END OF RETRIEVED CONTEXT ===');
    sections.push('');
    sections.push('Use the above context to provide more personalized and relevant responses. Reference specific entries when appropriate.');
    
    const formattedContext = sections.join('\n');

    // Apply context window management
    return this.truncateToContextWindow(formattedContext);
  }

  /**
   * Migrate existing content for a user (backfill embeddings)
   * @param userId - User ID to migrate content for
   * @returns Promise<MigrationResult>
   */
  async migrateExistingContent(userId: string): Promise<MigrationResult> {
    if (!this.config.enabled) {
      this.logger.warn('RAG is disabled, skipping migration');
      return {
        userId,
        totalProcessed: 0,
        successCount: 0,
        failedCount: 0,
        duration: 0,
        errors: [],
      };
    }

    this.logger.log(`Delegating content migration to MigrationService for user ${userId}`);
    return this.migrationService.migrateUserContent(userId);
  }

  /**
   * Queue content for async embedding (non-blocking)
   * @param content - Content to embed
   * @returns string - Job ID
   */
  queueEmbedding(content: ContentToEmbed): string {
    const jobId = `${content.userId}_${content.contentType}_${content.documentId}_${Date.now()}`;
    
    const job: EmbeddingJob = {
      id: jobId,
      content,
      retryCount: 0,
      createdAt: new Date(),
    };

    this.jobQueue.push(job);
    
    this.logger.debug({
      action: 'embedding_queued',
      jobId,
      queueSize: this.jobQueue.length,
      userId: content.userId,
      contentType: content.contentType,
    });

    return jobId;
  }

  /**
   * Process a batch of content items asynchronously
   * @param contents - Array of content to embed
   * @returns Promise<void>
   */
  async processBatch(contents: ContentToEmbed[]): Promise<void> {
    if (!this.config.enabled) {
      this.logger.debug('RAG is disabled, skipping batch processing');
      return;
    }

    const startTime = Date.now();
    this.logger.log(`Starting batch processing of ${contents.length} items`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
    };

    // Process in smaller batches to avoid overwhelming the API
    const batchSize = this.config.batchSize;
    
    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, Math.min(i + batchSize, contents.length));
      
      // Process batch items in parallel
      const promises = batch.map(async (content) => {
        try {
          await this.embedContent(content);
          results.success++;
        } catch (error) {
          this.logger.error('Failed to process batch item', {
            error: error.message,
            userId: content.userId,
            contentType: content.contentType,
            documentId: content.documentId,
          });
          results.failed++;
          
          // Queue for retry
          this.queueEmbedding(content);
        }
      });

      await Promise.allSettled(promises);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < contents.length) {
        await this.sleep(1000);
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log({
      action: 'batch_processing_complete',
      totalItems: contents.length,
      success: results.success,
      failed: results.failed,
      skipped: results.skipped,
      duration,
    });
  }

  /**
   * Retry failed embeddings
   * @returns Promise<void>
   */
  async retryFailedEmbeddings(): Promise<void> {
    if (this.failedJobs.size === 0) {
      return;
    }

    this.logger.log(`Retrying ${this.failedJobs.size} failed embeddings`);

    const jobsToRetry = Array.from(this.failedJobs.values());
    this.failedJobs.clear();

    for (const job of jobsToRetry) {
      if (job.retryCount < this.MAX_RETRY_ATTEMPTS) {
        job.retryCount++;
        this.jobQueue.push(job);
        
        this.logger.debug({
          action: 'job_requeued',
          jobId: job.id,
          retryCount: job.retryCount,
        });
      } else {
        this.logger.error({
          action: 'job_permanently_failed',
          jobId: job.id,
          retryCount: job.retryCount,
          userId: job.content.userId,
          contentType: job.content.contentType,
          documentId: job.content.documentId,
        });
      }
    }
  }

  /**
   * Get queue statistics
   * @returns Object with queue stats
   */
  getQueueStats() {
    return {
      queueSize: this.jobQueue.length,
      failedJobs: this.failedJobs.size,
      isProcessing: this.isProcessingQueue,
    };
  }

  /**
   * Start background queue processing
   */
  private startQueueProcessing(): void {
    // Process queue every 10 seconds
    this.queueProcessingInterval = setInterval(async () => {
      await this.processQueue();
    }, 10000);

    this.logger.log('Queue processing started');
  }

  /**
   * Process items in the job queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.jobQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process up to 10 jobs at a time
      const jobsToProcess = this.jobQueue.splice(0, 10);
      
      this.logger.debug({
        action: 'processing_queue',
        jobCount: jobsToProcess.length,
        remainingInQueue: this.jobQueue.length,
      });

      for (const job of jobsToProcess) {
        try {
          await this.embedContent(job.content);
          
          this.logger.debug({
            action: 'job_completed',
            jobId: job.id,
            retryCount: job.retryCount,
          });
        } catch (error) {
          this.logger.error({
            action: 'job_failed',
            jobId: job.id,
            error: error.message,
            retryCount: job.retryCount,
          });

          // Add to failed jobs for retry
          if (job.retryCount < this.MAX_RETRY_ATTEMPTS) {
            this.failedJobs.set(job.id, job);
          }
        }
      }

      // Retry failed jobs after a delay
      if (this.failedJobs.size > 0) {
        setTimeout(() => {
          this.retryFailedEmbeddings().catch(err => {
            this.logger.error('Error retrying failed embeddings', err);
          });
        }, this.RETRY_DELAY_MS);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Log queue statistics
   */
  private logQueueStats(): void {
    const stats = this.getQueueStats();
    this.logger.log({
      action: 'queue_stats',
      ...stats,
    });
  }

  /**
   * Sleep utility for delays
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Group documents by content type
   * @param documents - Documents to group
   * @returns Record<string, RetrievedDocument[]>
   */
  private groupDocumentsByType(
    documents: RetrievedDocument[],
  ): Record<string, RetrievedDocument[]> {
    const grouped: Record<string, RetrievedDocument[]> = {};

    for (const doc of documents) {
      if (!grouped[doc.type]) {
        grouped[doc.type] = [];
      }
      grouped[doc.type].push(doc);
    }

    return grouped;
  }

  /**
   * Get human-readable label for content type
   * @param type - Content type
   * @returns string - Human-readable label
   */
  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      journal: 'Journal Entries',
      goal: 'Goals',
      milestone: 'Milestones',
      progress_update: 'Progress Updates',
      chat_message: 'Past Conversations',
    };

    return labels[type] || type;
  }

  /**
   * Truncate context to fit within context window
   * @param context - Context text
   * @returns string - Truncated context
   */
  private truncateToContextWindow(context: string): string {
    if (context.length <= this.MAX_CONTEXT_LENGTH) {
      return context;
    }

    const truncated = context.substring(0, this.MAX_CONTEXT_LENGTH);
    const lastNewline = truncated.lastIndexOf('\n');
    
    // Truncate at last newline to avoid cutting mid-sentence
    if (lastNewline > this.MAX_CONTEXT_LENGTH * 0.8) {
      return truncated.substring(0, lastNewline) + '\n\n[Context truncated...]';
    }

    return truncated + '\n\n[Context truncated...]';
  }
}
