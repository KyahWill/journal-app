import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '@/firebase/firebase.service';
import * as admin from 'firebase-admin';

interface MigrationResult {
  totalGoals: number;
  migratedGoals: number;
  skippedGoals: number;
  errors: Array<{ goalId: string; error: string }>;
  duration: number;
}

interface Milestone {
  id: string;
  title: string;
  due_date: admin.firestore.Timestamp | null;
  completed: boolean;
  completed_at: admin.firestore.Timestamp | null;
  order: number;
  created_at: admin.firestore.Timestamp;
}

@Injectable()
export class MilestoneMigrationService {
  private readonly logger = new Logger(MilestoneMigrationService.name);
  private readonly goalsCollection = 'goals';

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Migrate all goals to include milestones array
   */
  async migrateAllGoals(options: {
    dryRun?: boolean;
    cleanup?: boolean;
  } = {}): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      totalGoals: 0,
      migratedGoals: 0,
      skippedGoals: 0,
      errors: [],
      duration: 0,
    };

    try {
      const firestore = this.firebaseService.getFirestore();
      const goalsSnapshot = await firestore.collection(this.goalsCollection).get();
      
      result.totalGoals = goalsSnapshot.size;
      this.logger.log(`Found ${result.totalGoals} goals to process`);

      for (const goalDoc of goalsSnapshot.docs) {
        try {
          const goalId = goalDoc.id;
          const goalData = goalDoc.data();

          // Skip if already migrated (has milestones array)
          if (goalData.milestones !== undefined) {
            this.logger.debug(`Goal ${goalId} already migrated, skipping`);
            result.skippedGoals++;
            continue;
          }

          // Get milestones subcollection
          const milestonesSnapshot = await firestore
            .collection(`${this.goalsCollection}/${goalId}/milestones`)
            .orderBy('order', 'asc')
            .get();

          const milestones: Milestone[] = milestonesSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              due_date: data.due_date || null,
              completed: data.completed || false,
              completed_at: data.completed_at || null,
              order: data.order || 0,
              created_at: data.created_at || admin.firestore.Timestamp.now(),
            };
          });

          this.logger.log(
            `Goal ${goalId}: Found ${milestones.length} milestones`,
          );

          if (!options.dryRun) {
            // Update goal document with milestones array
            await goalDoc.ref.update({
              milestones,
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Optionally delete subcollection
            if (options.cleanup && milestonesSnapshot.size > 0) {
              const batch = firestore.batch();
              milestonesSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
              });
              await batch.commit();
              this.logger.log(`Goal ${goalId}: Deleted milestones subcollection`);
            }
          }

          result.migratedGoals++;
        } catch (error) {
          this.logger.error(`Error processing goal ${goalDoc.id}:`, error);
          result.errors.push({
            goalId: goalDoc.id,
            error: error.message || 'Unknown error',
          });
        }
      }

      result.duration = Date.now() - startTime;
      return result;
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Migrate goals for a specific user
   */
  async migrateUserGoals(
    userId: string,
    options: { dryRun?: boolean; cleanup?: boolean } = {},
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      totalGoals: 0,
      migratedGoals: 0,
      skippedGoals: 0,
      errors: [],
      duration: 0,
    };

    try {
      const firestore = this.firebaseService.getFirestore();
      const goalsSnapshot = await firestore
        .collection(this.goalsCollection)
        .where('user_id', '==', userId)
        .get();

      result.totalGoals = goalsSnapshot.size;
      this.logger.log(`Found ${result.totalGoals} goals for user ${userId}`);

      for (const goalDoc of goalsSnapshot.docs) {
        try {
          const goalId = goalDoc.id;
          const goalData = goalDoc.data();

          // Skip if already migrated
          if (goalData.milestones !== undefined) {
            this.logger.debug(`Goal ${goalId} already migrated, skipping`);
            result.skippedGoals++;
            continue;
          }

          // Get milestones subcollection
          const milestonesSnapshot = await firestore
            .collection(`${this.goalsCollection}/${goalId}/milestones`)
            .orderBy('order', 'asc')
            .get();

          const milestones: Milestone[] = milestonesSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              due_date: data.due_date || null,
              completed: data.completed || false,
              completed_at: data.completed_at || null,
              order: data.order || 0,
              created_at: data.created_at || admin.firestore.Timestamp.now(),
            };
          });

          this.logger.log(
            `Goal ${goalId}: Found ${milestones.length} milestones`,
          );

          if (!options.dryRun) {
            // Update goal document
            await goalDoc.ref.update({
              milestones,
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Optionally delete subcollection
            if (options.cleanup && milestonesSnapshot.size > 0) {
              const batch = firestore.batch();
              milestonesSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
              });
              await batch.commit();
              this.logger.log(`Goal ${goalId}: Deleted milestones subcollection`);
            }
          }

          result.migratedGoals++;
        } catch (error) {
          this.logger.error(`Error processing goal ${goalDoc.id}:`, error);
          result.errors.push({
            goalId: goalDoc.id,
            error: error.message || 'Unknown error',
          });
        }
      }

      result.duration = Date.now() - startTime;
      return result;
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Get migration statistics without performing migration
   */
  async getMigrationStats(): Promise<{
    totalGoals: number;
    alreadyMigrated: number;
    needsMigration: number;
    totalMilestones: number;
  }> {
    const firestore = this.firebaseService.getFirestore();
    const goalsSnapshot = await firestore.collection(this.goalsCollection).get();

    let alreadyMigrated = 0;
    let needsMigration = 0;
    let totalMilestones = 0;

    for (const goalDoc of goalsSnapshot.docs) {
      const goalData = goalDoc.data();

      if (goalData.milestones !== undefined) {
        alreadyMigrated++;
        totalMilestones += (goalData.milestones || []).length;
      } else {
        needsMigration++;
        // Count milestones in subcollection
        const milestonesSnapshot = await firestore
          .collection(`${this.goalsCollection}/${goalDoc.id}/milestones`)
          .get();
        totalMilestones += milestonesSnapshot.size;
      }
    }

    return {
      totalGoals: goalsSnapshot.size,
      alreadyMigrated,
      needsMigration,
      totalMilestones,
    };
  }
}
