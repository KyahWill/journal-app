import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '@/firebase/firebase.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { MigrationResult } from './interfaces/rag.interface';
import { EmbeddingData } from './interfaces/vector-store.interface';
import { ragConfig } from './config/rag.config';

/**
 * Statistics for migration progress tracking
 */
interface MigrationStats {
  journals: { total: number; processed: number; failed: number };
  goals: { total: number; processed: number; failed: number };
  milestones: { total: number; processed: number; failed: number };
  progressUpdates: { total: number; processed: number; failed: number };
}

/**
 * Progress callback for real-time monitoring
 */
export interface MigrationProgressCallback {
  (progress: {
    userId: string;
    phase: 'journals' | 'goals' | 'milestones' | 'progress_updates';
    processed: number;
    total: number;
    percentage: number;
    estimatedTimeRemaining: number;
  }): void;
}

/**
 * Service responsible for migrating existing content to generate embeddings
 */
@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);
  private readonly config = ragConfig();
  private readonly BATCH_SIZE = 10; // Process 10 items at a time
  private readonly DELAY_BETWEEN_BATCHES = 2000; // 2 seconds delay between batches

  constructor(
    private firebaseService: FirebaseService,
    private embeddingService: EmbeddingService,
    private vectorStoreService: VectorStoreService,
  ) {}

  /**
   * Migrate all content for a specific user
   * @param userId - User ID to migrate content for
   * @param progressCallback - Optional callback for progress updates
   * @returns Promise<MigrationResult>
   */
  async migrateUserContent(
    userId: string,
    progressCallback?: MigrationProgressCallback,
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      userId,
      totalProcessed: 0,
      successCount: 0,
      failedCount: 0,
      duration: 0,
      errors: [],
    };

    const stats: MigrationStats = {
      journals: { total: 0, processed: 0, failed: 0 },
      goals: { total: 0, processed: 0, failed: 0 },
      milestones: { total: 0, processed: 0, failed: 0 },
      progressUpdates: { total: 0, processed: 0, failed: 0 },
    };

    this.logger.log(`Starting content migration for user ${userId}`);

    try {
      // Estimate total items for progress tracking
      const totalItems = await this.estimateTotalItems(userId);
      let processedItems = 0;

      // Migrate journal entries
      await this.migrateJournalEntries(userId, result, stats, (processed, total) => {
        processedItems = processed;
        this.reportProgress(
          userId,
          'journals',
          processed,
          total,
          processedItems,
          totalItems,
          startTime,
          progressCallback,
        );
      });

      // Migrate goals
      await this.migrateGoals(userId, result, stats, (processed, total) => {
        processedItems = stats.journals.total + processed;
        this.reportProgress(
          userId,
          'goals',
          processed,
          total,
          processedItems,
          totalItems,
          startTime,
          progressCallback,
        );
      });

      // Migrate milestones
      await this.migrateMilestones(userId, result, stats, (processed, total) => {
        processedItems = stats.journals.total + stats.goals.total + processed;
        this.reportProgress(
          userId,
          'milestones',
          processed,
          total,
          processedItems,
          totalItems,
          startTime,
          progressCallback,
        );
      });

      // Migrate progress updates
      await this.migrateProgressUpdates(userId, result, stats, (processed, total) => {
        processedItems = stats.journals.total + stats.goals.total + stats.milestones.total + processed;
        this.reportProgress(
          userId,
          'progress_updates',
          processed,
          total,
          processedItems,
          totalItems,
          startTime,
          progressCallback,
        );
      });

      result.duration = Date.now() - startTime;

      this.logger.log({
        action: 'migration_complete',
        userId,
        totalProcessed: result.totalProcessed,
        successCount: result.successCount,
        failedCount: result.failedCount,
        duration: result.duration,
        stats,
      });

      return result;
    } catch (error) {
      result.duration = Date.now() - startTime;
      this.logger.error('Migration failed', {
        error: error.message,
        stack: error.stack,
        userId,
        stats,
      });
      throw error;
    }
  }

  /**
   * Report migration progress
   */
  private reportProgress(
    userId: string,
    phase: 'journals' | 'goals' | 'milestones' | 'progress_updates',
    phaseProcessed: number,
    phaseTotal: number,
    totalProcessed: number,
    totalItems: number,
    startTime: number,
    progressCallback?: MigrationProgressCallback,
  ): void {
    const percentage = totalItems > 0 ? (totalProcessed / totalItems) * 100 : 0;
    const elapsed = Date.now() - startTime;
    const rate = totalProcessed / (elapsed / 1000); // items per second
    const remaining = totalItems - totalProcessed;
    const estimatedTimeRemaining = rate > 0 ? (remaining / rate) * 1000 : 0;

    this.logger.log({
      action: 'migration_progress',
      userId,
      phase,
      phaseProcessed,
      phaseTotal,
      totalProcessed,
      totalItems,
      percentage: percentage.toFixed(2) + '%',
      estimatedTimeRemaining: this.formatDuration(estimatedTimeRemaining),
    });

    if (progressCallback) {
      progressCallback({
        userId,
        phase,
        processed: totalProcessed,
        total: totalItems,
        percentage,
        estimatedTimeRemaining,
      });
    }
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Migrate journal entries for a user
   * @param userId - User ID
   * @param result - Migration result to update
   * @param stats - Migration statistics to update
   * @param onProgress - Progress callback
   */
  private async migrateJournalEntries(
    userId: string,
    result: MigrationResult,
    stats: MigrationStats,
    onProgress?: (processed: number, total: number) => void,
  ): Promise<void> {
    this.logger.log(`Migrating journal entries for user ${userId}`);

    try {
      // Fetch all journal entries for the user
      const journals = await this.firebaseService.getCollection(
        'journal-entries',
        [{ field: 'user_id', operator: '==', value: userId }],
      );

      stats.journals.total = journals.length;
      this.logger.log(`Found ${journals.length} journal entries to migrate`);

      // Process in batches
      for (let i = 0; i < journals.length; i += this.BATCH_SIZE) {
        const batch = journals.slice(i, Math.min(i + this.BATCH_SIZE, journals.length));
        
        await this.processBatch(batch, userId, 'journal', result, stats.journals);

        // Report progress
        if (onProgress) {
          onProgress(stats.journals.processed, stats.journals.total);
        }

        // Add delay between batches to respect rate limits
        if (i + this.BATCH_SIZE < journals.length) {
          await this.sleep(this.DELAY_BETWEEN_BATCHES);
        }
      }

      this.logger.log({
        action: 'journals_migrated',
        userId,
        total: stats.journals.total,
        processed: stats.journals.processed,
        failed: stats.journals.failed,
      });
    } catch (error) {
      this.logger.error('Failed to migrate journal entries', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Migrate goals for a user
   * @param userId - User ID
   * @param result - Migration result to update
   * @param stats - Migration statistics to update
   * @param onProgress - Progress callback
   */
  private async migrateGoals(
    userId: string,
    result: MigrationResult,
    stats: MigrationStats,
    onProgress?: (processed: number, total: number) => void,
  ): Promise<void> {
    this.logger.log(`Migrating goals for user ${userId}`);

    try {
      // Fetch all goals for the user
      const goals = await this.firebaseService.getCollection(
        'goals',
        [{ field: 'user_id', operator: '==', value: userId }],
      );

      stats.goals.total = goals.length;
      this.logger.log(`Found ${goals.length} goals to migrate`);

      // Process in batches
      for (let i = 0; i < goals.length; i += this.BATCH_SIZE) {
        const batch = goals.slice(i, Math.min(i + this.BATCH_SIZE, goals.length));
        
        await this.processBatch(batch, userId, 'goal', result, stats.goals);

        // Report progress
        if (onProgress) {
          onProgress(stats.goals.processed, stats.goals.total);
        }

        // Add delay between batches
        if (i + this.BATCH_SIZE < goals.length) {
          await this.sleep(this.DELAY_BETWEEN_BATCHES);
        }
      }

      this.logger.log({
        action: 'goals_migrated',
        userId,
        total: stats.goals.total,
        processed: stats.goals.processed,
        failed: stats.goals.failed,
      });
    } catch (error) {
      this.logger.error('Failed to migrate goals', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Migrate milestones for a user
   * @param userId - User ID
   * @param result - Migration result to update
   * @param stats - Migration statistics to update
   * @param onProgress - Progress callback
   */
  private async migrateMilestones(
    userId: string,
    result: MigrationResult,
    stats: MigrationStats,
    onProgress?: (processed: number, total: number) => void,
  ): Promise<void> {
    this.logger.log(`Migrating milestones for user ${userId}`);

    try {
      // Fetch all goals first to get milestones
      const goals = await this.firebaseService.getCollection(
        'goals',
        [{ field: 'user_id', operator: '==', value: userId }],
      );

      const firestore = this.firebaseService.getFirestore();
      const allMilestones: any[] = [];

      // Fetch milestones for each goal
      for (const goal of goals) {
        const milestonesRef = firestore.collection(`goals/${goal.id}/milestones`);
        const milestonesSnapshot = await milestonesRef.get();
        
        milestonesSnapshot.docs.forEach((doc) => {
          allMilestones.push({
            id: doc.id,
            goal_id: goal.id,
            ...doc.data(),
          });
        });
      }

      stats.milestones.total = allMilestones.length;
      this.logger.log(`Found ${allMilestones.length} milestones to migrate`);

      // Process in batches
      for (let i = 0; i < allMilestones.length; i += this.BATCH_SIZE) {
        const batch = allMilestones.slice(i, Math.min(i + this.BATCH_SIZE, allMilestones.length));
        
        await this.processBatch(batch, userId, 'milestone', result, stats.milestones);

        // Report progress
        if (onProgress) {
          onProgress(stats.milestones.processed, stats.milestones.total);
        }

        // Add delay between batches
        if (i + this.BATCH_SIZE < allMilestones.length) {
          await this.sleep(this.DELAY_BETWEEN_BATCHES);
        }
      }

      this.logger.log({
        action: 'milestones_migrated',
        userId,
        total: stats.milestones.total,
        processed: stats.milestones.processed,
        failed: stats.milestones.failed,
      });
    } catch (error) {
      this.logger.error('Failed to migrate milestones', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Migrate progress updates for a user
   * @param userId - User ID
   * @param result - Migration result to update
   * @param stats - Migration statistics to update
   * @param onProgress - Progress callback
   */
  private async migrateProgressUpdates(
    userId: string,
    result: MigrationResult,
    stats: MigrationStats,
    onProgress?: (processed: number, total: number) => void,
  ): Promise<void> {
    this.logger.log(`Migrating progress updates for user ${userId}`);

    try {
      // Fetch all goals first to get progress updates
      const goals = await this.firebaseService.getCollection(
        'goals',
        [{ field: 'user_id', operator: '==', value: userId }],
      );

      const firestore = this.firebaseService.getFirestore();
      const allProgressUpdates: any[] = [];

      // Fetch progress updates for each goal
      for (const goal of goals) {
        const progressRef = firestore.collection(`goals/${goal.id}/progress_updates`);
        const progressSnapshot = await progressRef.get();
        
        progressSnapshot.docs.forEach((doc) => {
          allProgressUpdates.push({
            id: doc.id,
            goal_id: goal.id,
            ...doc.data(),
          });
        });
      }

      stats.progressUpdates.total = allProgressUpdates.length;
      this.logger.log(`Found ${allProgressUpdates.length} progress updates to migrate`);

      // Process in batches
      for (let i = 0; i < allProgressUpdates.length; i += this.BATCH_SIZE) {
        const batch = allProgressUpdates.slice(i, Math.min(i + this.BATCH_SIZE, allProgressUpdates.length));
        
        await this.processBatch(batch, userId, 'progress_update', result, stats.progressUpdates);

        // Report progress
        if (onProgress) {
          onProgress(stats.progressUpdates.processed, stats.progressUpdates.total);
        }

        // Add delay between batches
        if (i + this.BATCH_SIZE < allProgressUpdates.length) {
          await this.sleep(this.DELAY_BETWEEN_BATCHES);
        }
      }

      this.logger.log({
        action: 'progress_updates_migrated',
        userId,
        total: stats.progressUpdates.total,
        processed: stats.progressUpdates.processed,
        failed: stats.progressUpdates.failed,
      });
    } catch (error) {
      this.logger.error('Failed to migrate progress updates', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Process a batch of documents
   * @param batch - Batch of documents to process
   * @param userId - User ID
   * @param contentType - Type of content
   * @param result - Migration result to update
   * @param typeStats - Statistics for this content type
   */
  private async processBatch(
    batch: any[],
    userId: string,
    contentType: 'journal' | 'goal' | 'milestone' | 'progress_update',
    result: MigrationResult,
    typeStats: { total: number; processed: number; failed: number },
  ): Promise<void> {
    const promises = batch.map(async (item) => {
      try {
        // Extract text and metadata based on content type
        const { text, metadata } = this.extractContentData(item, contentType);

        if (!text || text.trim().length === 0) {
          this.logger.warn(`Skipping ${contentType} ${item.id} - empty text`);
          typeStats.processed++;
          result.totalProcessed++;
          return;
        }

        // Generate embedding
        const embedding = await this.embeddingService.generateEmbedding(text);

        // Store embedding
        const embeddingData: EmbeddingData = {
          userId,
          contentType,
          documentId: item.id,
          embedding,
          textSnippet: text.substring(0, 500),
          metadata,
        };

        await this.vectorStoreService.storeEmbedding(embeddingData);

        typeStats.processed++;
        result.totalProcessed++;
        result.successCount++;

        this.logger.debug({
          action: 'item_migrated',
          contentType,
          documentId: item.id,
          userId,
        });
      } catch (error) {
        typeStats.failed++;
        result.totalProcessed++;
        result.failedCount++;
        result.errors.push({
          documentId: item.id,
          contentType,
          error: error.message,
        });

        this.logger.error({
          action: 'item_migration_failed',
          contentType,
          documentId: item.id,
          error: error.message,
          userId,
        });
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Extract text and metadata from a document based on content type
   * @param item - Document item
   * @param contentType - Type of content
   * @returns Object with text and metadata
   */
  private extractContentData(
    item: any,
    contentType: 'journal' | 'goal' | 'milestone' | 'progress_update',
  ): { text: string; metadata: Record<string, any> } {
    switch (contentType) {
      case 'journal':
        return {
          text: `${item.title || ''}\n\n${item.content || ''}`,
          metadata: {
            mood: item.mood,
            tags: item.tags || [],
          },
        };

      case 'goal':
        return {
          text: `${item.title || ''}\n\n${item.description || ''}`,
          metadata: {
            category: item.category,
            status: item.status,
            target_date: item.target_date?.toDate?.()?.toISOString() || null,
          },
        };

      case 'milestone':
        return {
          text: item.title || '',
          metadata: {
            goal_id: item.goal_id,
            due_date: item.due_date?.toDate?.()?.toISOString() || null,
            completed: item.completed || false,
            order: item.order || 0,
          },
        };

      case 'progress_update':
        return {
          text: item.content || '',
          metadata: {
            goal_id: item.goal_id,
            created_at: item.created_at?.toDate?.()?.toISOString() || null,
          },
        };

      default:
        return { text: '', metadata: {} };
    }
  }

  /**
   * Sleep utility for delays between batches
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get all users from the database
   * @returns Promise<string[]> - Array of user IDs
   */
  async getAllUserIds(): Promise<string[]> {
    try {
      this.logger.log('Fetching all user IDs');

      // Get unique user IDs from journal entries
      const journals = await this.firebaseService.getCollection('journal-entries', []);
      const journalUserIds = new Set(journals.map((j: any) => j.user_id));

      // Get unique user IDs from goals
      const goals = await this.firebaseService.getCollection('goals', []);
      const goalUserIds = new Set(goals.map((g: any) => g.user_id));

      // Combine and deduplicate
      const allUserIds = Array.from(new Set([...journalUserIds, ...goalUserIds]));

      this.logger.log(`Found ${allUserIds.length} unique users`);
      return allUserIds;
    } catch (error) {
      this.logger.error('Failed to fetch user IDs', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Estimate total items to migrate for a user
   * @param userId - User ID
   * @returns Promise<number> - Estimated total items
   */
  async estimateTotalItems(userId: string): Promise<number> {
    try {
      let total = 0;

      // Count journals
      const journals = await this.firebaseService.getCollection(
        'journal-entries',
        [{ field: 'user_id', operator: '==', value: userId }],
      );
      total += journals.length;

      // Count goals
      const goals = await this.firebaseService.getCollection(
        'goals',
        [{ field: 'user_id', operator: '==', value: userId }],
      );
      total += goals.length;

      // Count milestones and progress updates
      const firestore = this.firebaseService.getFirestore();
      for (const goal of goals) {
        const milestonesRef = firestore.collection(`goals/${goal.id}/milestones`);
        const milestonesSnapshot = await milestonesRef.get();
        total += milestonesSnapshot.size;

        const progressRef = firestore.collection(`goals/${goal.id}/progress_updates`);
        const progressSnapshot = await progressRef.get();
        total += progressSnapshot.size;
      }

      this.logger.log(`Estimated ${total} items to migrate for user ${userId}`);
      return total;
    } catch (error) {
      this.logger.error('Failed to estimate total items', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }
}
