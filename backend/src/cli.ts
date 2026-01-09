import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MigrationService } from './rag/migration.service';
import { MilestoneMigrationService } from './goal/milestone-migration.service';
import { WeeklyInsightsMigrationService } from './chat/weekly-insights-migration.service';
import { EncryptionMigrationService } from './common/services/encryption-migration.service';
import { EncryptionService } from './common/services/encryption.service';
import { KeyRotationService } from './common/services/key-rotation.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('CLI');

/**
 * CLI entry point for running migration commands
 * 
 * Usage:
 *   npm run cli migrate-embeddings --userId=<user-id>
 *   npm run cli migrate-embeddings --all-users
 *   npm run cli migrate-embeddings --userId=<user-id> --dry-run
 *   npm run cli migrate-milestones [--userId=<user-id>] [--dry-run] [--cleanup]
 *   npm run cli migrate-weekly-insights [--userId=<user-id>] [--dry-run] [--stats]
 *   npm run cli migrate:encrypt-data [--userId=<user-id>] [--all] [--dry-run]
 *   npm run cli rotate-keys --old-secret=<hex> [--userId=<user-id>] [--all] [--dry-run]
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const migrationService = app.get(MigrationService);
  const milestoneMigrationService = app.get(MilestoneMigrationService);
  const weeklyInsightsMigrationService = app.get(WeeklyInsightsMigrationService);
  const encryptionMigrationService = app.get(EncryptionMigrationService);
  const encryptionService = app.get(EncryptionService);
  const keyRotationService = app.get(KeyRotationService);

  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    logger.error('No command specified');
    printUsage();
    process.exit(1);
  }

  try {
    switch (command) {
      case 'migrate-embeddings':
        await handleMigrateEmbeddings(migrationService, args.slice(1));
        break;
      case 'migrate-milestones':
        await handleMigrateMilestones(milestoneMigrationService, args.slice(1));
        break;
      case 'migrate-weekly-insights':
        await handleMigrateWeeklyInsights(weeklyInsightsMigrationService, args.slice(1));
        break;
      case 'migrate:encrypt-data':
        await handleEncryptData(encryptionMigrationService, encryptionService, args.slice(1));
        break;
      case 'rotate-keys':
        await handleRotateKeys(keyRotationService, encryptionService, args.slice(1));
        break;
      default:
        logger.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('Command failed', error);
    await app.close();
    process.exit(1);
  }
}

/**
 * Handle migrate-embeddings command
 */
async function handleMigrateEmbeddings(
  migrationService: MigrationService,
  args: string[],
): Promise<void> {
  const options = parseOptions(args);

  // Validate options
  if (!options.userId && !options.allUsers) {
    logger.error('Error: You must specify either --userId or --all-users');
    printMigrateUsage();
    process.exit(1);
  }

  if (options.userId && options.allUsers) {
    logger.error('Error: Cannot specify both --userId and --all-users');
    printMigrateUsage();
    process.exit(1);
  }

  // Dry run mode
  if (options.dryRun) {
    logger.log('DRY RUN MODE - No embeddings will be created');
    await performDryRun(migrationService, options);
    return;
  }

  // Perform actual migration
  if (options.userId) {
    await migrateUser(migrationService, options.userId);
  } else if (options.allUsers) {
    await migrateAllUsers(migrationService);
  }

  logger.log('Migration command completed successfully');
}

/**
 * Perform a dry run to estimate migration scope
 */
async function performDryRun(
  migrationService: MigrationService,
  options: any,
): Promise<void> {
  logger.log('Performing dry run...');

  if (options.userId) {
    const totalItems = await migrationService.estimateTotalItems(options.userId);
    logger.log(`User ${options.userId}:`);
    logger.log(`  - Estimated items to migrate: ${totalItems}`);
    logger.log(`  - Estimated time: ${estimateTime(totalItems)}`);
  } else if (options.allUsers) {
    const userIds = await migrationService.getAllUserIds();
    logger.log(`Found ${userIds.length} users to migrate`);

    let totalItems = 0;
    for (const userId of userIds) {
      const items = await migrationService.estimateTotalItems(userId);
      totalItems += items;
      logger.log(`  - User ${userId}: ${items} items`);
    }

    logger.log(`\nTotal estimated items: ${totalItems}`);
    logger.log(`Estimated time: ${estimateTime(totalItems)}`);
  }

  logger.log('\nDry run complete. Use without --dry-run to perform actual migration.');
}

/**
 * Migrate embeddings for a single user
 */
async function migrateUser(
  migrationService: MigrationService,
  userId: string,
): Promise<void> {
  logger.log(`Migrating embeddings for user: ${userId}`);

  const startTime = Date.now();
  const result = await migrationService.migrateUserContent(userId);
  const duration = Date.now() - startTime;

  printMigrationResult(result);
  logger.log(`Total migration time: ${formatDuration(duration)}`);
}

/**
 * Migrate embeddings for all users
 */
async function migrateAllUsers(migrationService: MigrationService): Promise<void> {
  logger.log('Migrating embeddings for all users...');

  const userIds = await migrationService.getAllUserIds();
  logger.log(`Found ${userIds.length} users to migrate`);

  const allResults: any[] = [];
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalProcessed = 0;

  const overallStartTime = Date.now();

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    logger.log(`\n[${i + 1}/${userIds.length}] Migrating user: ${userId}`);

    try {
      const result = await migrationService.migrateUserContent(userId);
      allResults.push(result);
      totalSuccess += result.successCount;
      totalFailed += result.failedCount;
      totalProcessed += result.totalProcessed;

      printMigrationResult(result);
    } catch (error) {
      logger.error(`Failed to migrate user ${userId}`, error);
    }

    // Add delay between users to avoid overwhelming the system
    if (i < userIds.length - 1) {
      logger.log('Waiting 5 seconds before next user...');
      await sleep(5000);
    }
  }

  const overallDuration = Date.now() - overallStartTime;

  // Print summary
  logger.log('\n' + '='.repeat(60));
  logger.log('MIGRATION SUMMARY');
  logger.log('='.repeat(60));
  logger.log(`Total users migrated: ${userIds.length}`);
  logger.log(`Total items processed: ${totalProcessed}`);
  logger.log(`Total successful: ${totalSuccess}`);
  logger.log(`Total failed: ${totalFailed}`);
  logger.log(`Success rate: ${((totalSuccess / totalProcessed) * 100).toFixed(2)}%`);
  logger.log(`Total time: ${formatDuration(overallDuration)}`);
  logger.log('='.repeat(60));

  // Print failed items if any
  if (totalFailed > 0) {
    logger.log('\nFailed items:');
    allResults.forEach((result) => {
      if (result.errors.length > 0) {
        logger.log(`\nUser ${result.userId}:`);
        result.errors.forEach((error: any) => {
          logger.log(`  - ${error.contentType} ${error.documentId}: ${error.error}`);
        });
      }
    });
  }
}

/**
 * Print migration result for a single user
 */
function printMigrationResult(result: any): void {
  logger.log('\nMigration Result:');
  logger.log(`  User ID: ${result.userId}`);
  logger.log(`  Total processed: ${result.totalProcessed}`);
  logger.log(`  Successful: ${result.successCount}`);
  logger.log(`  Failed: ${result.failedCount}`);
  logger.log(`  Duration: ${formatDuration(result.duration)}`);

  if (result.errors.length > 0) {
    logger.log(`  Errors:`);
    result.errors.slice(0, 5).forEach((error: any) => {
      logger.log(`    - ${error.contentType} ${error.documentId}: ${error.error}`);
    });
    if (result.errors.length > 5) {
      logger.log(`    ... and ${result.errors.length - 5} more errors`);
    }
  }
}

/**
 * Parse command line options
 */
function parseOptions(args: string[]): any {
  const options: any = {};

  for (const arg of args) {
    if (arg.startsWith('--userId=')) {
      options.userId = arg.split('=')[1];
    } else if (arg.startsWith('--old-secret=')) {
      options.oldSecret = arg.split('=')[1];
    } else if (arg === '--all-users') {
      options.allUsers = true;
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--cleanup') {
      options.cleanup = true;
    } else if (arg === '--stats') {
      options.stats = true;
    } else if (arg === '--help') {
      options.help = true;
    }
  }

  return options;
}

/**
 * Estimate migration time based on number of items
 */
function estimateTime(items: number): string {
  // Assume ~2 seconds per item (including API calls and delays)
  const seconds = items * 2;
  return formatDuration(seconds * 1000);
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
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
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Handle migrate-milestones command
 */
async function handleMigrateMilestones(
  milestoneMigrationService: MilestoneMigrationService,
  args: string[],
): Promise<void> {
  const options = parseOptions(args);

  // Show help
  if (options.help) {
    printMilestonesUsage();
    return;
  }

  // Show stats
  if (options.stats) {
    logger.log('Fetching migration statistics...');
    const stats = await milestoneMigrationService.getMigrationStats();
    logger.log('\n' + '='.repeat(60));
    logger.log('MILESTONE MIGRATION STATISTICS');
    logger.log('='.repeat(60));
    logger.log(`Total goals: ${stats.totalGoals}`);
    logger.log(`Already migrated: ${stats.alreadyMigrated}`);
    logger.log(`Needs migration: ${stats.needsMigration}`);
    logger.log(`Total milestones: ${stats.totalMilestones}`);
    logger.log('='.repeat(60));
    return;
  }

  // Dry run mode
  if (options.dryRun) {
    logger.log('DRY RUN MODE - No changes will be made');
  }

  // Cleanup mode warning
  if (options.cleanup && !options.dryRun) {
    logger.warn('⚠️  CLEANUP MODE - Old milestone subcollections will be DELETED');
    logger.warn('⚠️  Make sure you have a backup before proceeding!');
    logger.log('Waiting 5 seconds...');
    await sleep(5000);
  }

  const startTime = Date.now();
  let result;

  if (options.userId) {
    logger.log(`Migrating milestones for user: ${options.userId}`);
    result = await milestoneMigrationService.migrateUserGoals(options.userId, {
      dryRun: options.dryRun,
      cleanup: options.cleanup,
    });
  } else {
    logger.log('Migrating milestones for all goals...');
    result = await milestoneMigrationService.migrateAllGoals({
      dryRun: options.dryRun,
      cleanup: options.cleanup,
    });
  }

  // Print results
  logger.log('\n' + '='.repeat(60));
  logger.log('MILESTONE MIGRATION RESULT');
  logger.log('='.repeat(60));
  logger.log(`Total goals: ${result.totalGoals}`);
  logger.log(`Migrated: ${result.migratedGoals}`);
  logger.log(`Skipped (already migrated): ${result.skippedGoals}`);
  logger.log(`Errors: ${result.errors.length}`);
  logger.log(`Duration: ${formatDuration(result.duration)}`);
  logger.log('='.repeat(60));

  if (result.errors.length > 0) {
    logger.log('\nErrors:');
    result.errors.forEach((error) => {
      logger.log(`  - Goal ${error.goalId}: ${error.error}`);
    });
  }

  if (options.dryRun) {
    logger.log('\n✓ Dry run complete. Run without --dry-run to perform actual migration.');
  } else {
    logger.log('\n✓ Migration completed successfully!');
    if (!options.cleanup) {
      logger.log('\nNote: Old milestone subcollections were preserved.');
      logger.log('Run with --cleanup flag to delete them after verifying the migration.');
    }
  }
}

/**
 * Handle migrate-weekly-insights command
 */
async function handleMigrateWeeklyInsights(
  migrationService: WeeklyInsightsMigrationService,
  args: string[],
): Promise<void> {
  const options = parseOptions(args);

  // Show help
  if (options.help) {
    printWeeklyInsightsUsage();
    return;
  }

  // Show stats
  if (options.stats) {
    if (options.userId) {
      logger.log(`\nFetching migration statistics for user: ${options.userId}...`);
      const stats = await migrationService.getMigrationStats(options.userId);
      logger.log('\n' + '='.repeat(60));
      logger.log('WEEKLY INSIGHTS MIGRATION STATISTICS');
      logger.log('='.repeat(60));
      logger.log(`Total journal entries: ${stats.totalEntries}`);
      logger.log(`Total weeks with entries: ${stats.totalWeeks}`);
      logger.log(`Existing insights: ${stats.existingInsights}`);
      logger.log(`Weeks needing migration: ${stats.weeksNeedingMigration}`);
      if (stats.currentWeekExcluded) {
        logger.log(`Current week excluded: Yes (will be generated on demand)`);
      }
      logger.log('='.repeat(60));
    } else {
      const userIds = await migrationService.getAllUserIds();
      logger.log(`\nFound ${userIds.length} users with journal entries`);
      logger.log('\nFetching statistics for all users...\n');
      
      let totalWeeksNeeding = 0;
      let totalExisting = 0;
      
      for (const userId of userIds) {
        const stats = await migrationService.getMigrationStats(userId);
        totalWeeksNeeding += stats.weeksNeedingMigration;
        totalExisting += stats.existingInsights;
        logger.log(`  User ${userId}: ${stats.weeksNeedingMigration} weeks to migrate, ${stats.existingInsights} existing`);
      }
      
      logger.log('\n' + '='.repeat(60));
      logger.log('TOTAL WEEKLY INSIGHTS MIGRATION STATISTICS');
      logger.log('='.repeat(60));
      logger.log(`Total users: ${userIds.length}`);
      logger.log(`Total existing insights: ${totalExisting}`);
      logger.log(`Total weeks needing migration: ${totalWeeksNeeding}`);
      logger.log(`Estimated time: ${estimateTime(totalWeeksNeeding * 3)}`); // ~3 seconds per insight
      logger.log('='.repeat(60));
    }
    return;
  }

  // Dry run mode
  if (options.dryRun) {
    logger.log('DRY RUN MODE - No insights will be generated or saved');
  }

  const startTime = Date.now();

  if (options.userId) {
    // Migrate single user
    logger.log(`\nMigrating weekly insights for user: ${options.userId}`);
    const result = await migrationService.migrateUserInsights(options.userId, {
      dryRun: options.dryRun,
    });

    printWeeklyInsightsResult(result);
  } else {
    // Migrate all users
    logger.log('\nMigrating weekly insights for all users...');
    
    if (!options.dryRun) {
      logger.warn('⚠️  This will generate AI insights for all past weeks.');
      logger.warn('⚠️  This may take a long time and use API credits.');
      logger.log('Waiting 5 seconds...');
      await sleep(5000);
    }

    const results = await migrationService.migrateAllUsers({
      dryRun: options.dryRun,
    });

    // Print summary
    logger.log('\n' + '='.repeat(60));
    logger.log('WEEKLY INSIGHTS MIGRATION SUMMARY');
    logger.log('='.repeat(60));
    logger.log(`Total users processed: ${results.totalUsers}`);
    logger.log(`Total insights generated: ${results.totalGenerated}`);
    logger.log(`Total failures: ${results.totalFailed}`);
    logger.log(`Total duration: ${formatDuration(results.duration)}`);
    logger.log('='.repeat(60));

    // Print individual results
    if (results.results.length > 0) {
      logger.log('\nPer-user results:');
      results.results.forEach((result) => {
        logger.log(`  ${result.userId}: ${result.generatedCount} generated, ${result.failedCount} failed`);
      });
    }

    // Print errors
    const allErrors = results.results.flatMap((r) => 
      r.errors.map((e) => ({ userId: r.userId, ...e }))
    );
    if (allErrors.length > 0) {
      logger.log('\nErrors:');
      allErrors.slice(0, 10).forEach((error) => {
        logger.log(`  - User ${error.userId}, Week ${error.weekStart.toLocaleDateString()}: ${error.error}`);
      });
      if (allErrors.length > 10) {
        logger.log(`  ... and ${allErrors.length - 10} more errors`);
      }
    }
  }

  if (options.dryRun) {
    logger.log('\n✓ Dry run complete. Run without --dry-run to perform actual migration.');
  } else {
    logger.log('\n✓ Migration completed!');
  }
}

/**
 * Print weekly insights migration result
 */
function printWeeklyInsightsResult(result: any): void {
  logger.log('\n' + '='.repeat(60));
  logger.log('WEEKLY INSIGHTS MIGRATION RESULT');
  logger.log('='.repeat(60));
  logger.log(`User ID: ${result.userId}`);
  logger.log(`Total weeks found: ${result.totalWeeks}`);
  logger.log(`Insights generated: ${result.generatedCount}`);
  logger.log(`Failed: ${result.failedCount}`);
  logger.log(`Duration: ${formatDuration(result.duration)}`);
  logger.log('='.repeat(60));

  if (result.errors.length > 0) {
    logger.log('\nErrors:');
    result.errors.forEach((error: any) => {
      logger.log(`  - Week ${error.weekStart.toLocaleDateString()}: ${error.error}`);
    });
  }
}

/**
 * Print weekly insights migration usage
 */
function printWeeklyInsightsUsage(): void {
  logger.log('\nUsage: npm run cli migrate-weekly-insights [options]');
  logger.log('\nDescription:');
  logger.log('  Generate weekly insights for past weeks that don\'t have insights yet.');
  logger.log('  Weeks run Saturday to Friday. Current week is excluded (generated on demand).');
  logger.log('\nOptions:');
  logger.log('  --userId=<userId>     Migrate insights for a specific user only');
  logger.log('  --dry-run             Perform a dry run without generating insights');
  logger.log('  --stats               Show migration statistics without migrating');
  logger.log('  --help                Show this help message');
  logger.log('\nExamples:');
  logger.log('  npm run cli migrate-weekly-insights --stats');
  logger.log('  npm run cli migrate-weekly-insights --userId=user123 --stats');
  logger.log('  npm run cli migrate-weekly-insights --dry-run');
  logger.log('  npm run cli migrate-weekly-insights --userId=user123 --dry-run');
  logger.log('  npm run cli migrate-weekly-insights');
  logger.log('  npm run cli migrate-weekly-insights --userId=user123');
  logger.log('\nNote: Always run with --dry-run or --stats first to verify the scope!');
}

/**
 * Handle migrate:encrypt-data command
 */
async function handleEncryptData(
  encryptionMigrationService: EncryptionMigrationService,
  encryptionService: EncryptionService,
  args: string[],
): Promise<void> {
  const options = parseOptions(args);

  // Show help
  if (options.help) {
    printEncryptDataUsage();
    return;
  }

  // Check if encryption is enabled
  if (!encryptionService.isEnabled()) {
    logger.error('Encryption is not enabled! Set ENCRYPTION_ENABLED=true and SERVER_MASTER_SECRET in your environment.');
    process.exit(1);
  }

  // Test encryption before proceeding
  const testResult = await encryptionService.testEncryption();
  if (!testResult.success) {
    logger.error(`Encryption test failed: ${testResult.message}`);
    process.exit(1);
  }
  logger.log('✓ Encryption service is working correctly');

  // Validate options
  if (!options.userId && !options.all) {
    logger.error('Error: You must specify either --userId=<userId> or --all');
    printEncryptDataUsage();
    process.exit(1);
  }

  // Show stats mode
  if (options.stats) {
    if (options.userId) {
      const stats = await encryptionMigrationService.getMigrationStats(options.userId);
      printEncryptionStats([stats]);
    } else {
      const userIds = await encryptionMigrationService.getAllUserIds();
      logger.log(`Found ${userIds.length} users in the database`);
      const allStats = await Promise.all(
        userIds.map((userId) => encryptionMigrationService.getMigrationStats(userId)),
      );
      printEncryptionStats(allStats);
    }
    return;
  }

  // Dry run warning
  if (options.dryRun) {
    logger.log('DRY RUN MODE - No data will be encrypted');
  } else {
    logger.warn('⚠️  This will ENCRYPT existing data in the database!');
    logger.warn('⚠️  Make sure you have a BACKUP before proceeding!');
    logger.warn('⚠️  Encrypted data cannot be decrypted without the SERVER_MASTER_SECRET.');
    logger.log('Waiting 5 seconds...');
    await sleep(5000);
  }

  const startTime = Date.now();

  if (options.userId) {
    // Encrypt single user
    logger.log(`\nEncrypting data for user: ${options.userId}`);
    const keyFactors = await encryptionMigrationService.getUserKeyFactors(options.userId);
    
    if (!keyFactors) {
      logger.error(`Could not get key factors for user ${options.userId}`);
      process.exit(1);
    }

    const result = await encryptionMigrationService.migrateUserData(
      options.userId,
      keyFactors,
      { dryRun: options.dryRun },
    );

    printEncryptionResult(result);

    // Update encryption version in user profile
    if (!options.dryRun && result.successCount > 0) {
      await encryptionMigrationService.updateUserEncryptionVersion(options.userId, 1);
    }
  } else if (options.all) {
    // Encrypt all users
    logger.log('\nEncrypting data for all users...');
    const userIds = await encryptionMigrationService.getAllUserIds();
    logger.log(`Found ${userIds.length} users to process`);

    let totalSuccess = 0;
    let totalFailed = 0;
    let totalProcessed = 0;

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      logger.log(`\n[${i + 1}/${userIds.length}] Processing user: ${userId}`);

      try {
        const keyFactors = await encryptionMigrationService.getUserKeyFactors(userId);
        
        if (!keyFactors) {
          logger.warn(`Could not get key factors for user ${userId}, skipping`);
          continue;
        }

        const result = await encryptionMigrationService.migrateUserData(
          userId,
          keyFactors,
          { dryRun: options.dryRun },
        );

        totalSuccess += result.successCount;
        totalFailed += result.failedCount;
        totalProcessed += result.totalProcessed;

        logger.log(`  Processed: ${result.totalProcessed}, Encrypted: ${result.successCount}, Failed: ${result.failedCount}`);

        // Update encryption version in user profile
        if (!options.dryRun && result.successCount > 0) {
          await encryptionMigrationService.updateUserEncryptionVersion(userId, 1);
        }
      } catch (error) {
        logger.error(`Failed to process user ${userId}`, error);
      }

      // Add delay between users
      if (i < userIds.length - 1) {
        await sleep(1000);
      }
    }

    const duration = Date.now() - startTime;

    // Print summary
    logger.log('\n' + '='.repeat(60));
    logger.log('ENCRYPTION MIGRATION SUMMARY');
    logger.log('='.repeat(60));
    logger.log(`Total users processed: ${userIds.length}`);
    logger.log(`Total documents processed: ${totalProcessed}`);
    logger.log(`Total encrypted: ${totalSuccess}`);
    logger.log(`Total failed: ${totalFailed}`);
    logger.log(`Duration: ${formatDuration(duration)}`);
    logger.log('='.repeat(60));
  }

  if (options.dryRun) {
    logger.log('\n✓ Dry run complete. Run without --dry-run to perform actual encryption.');
  } else {
    logger.log('\n✓ Encryption migration completed!');
  }
}

/**
 * Print encryption migration result
 */
function printEncryptionResult(result: any): void {
  logger.log('\n' + '='.repeat(60));
  logger.log('ENCRYPTION MIGRATION RESULT');
  logger.log('='.repeat(60));
  logger.log(`User ID: ${result.userId}`);
  logger.log(`Total processed: ${result.totalProcessed}`);
  logger.log(`Encrypted: ${result.successCount}`);
  logger.log(`Failed: ${result.failedCount}`);
  logger.log(`Duration: ${formatDuration(result.duration)}`);
  logger.log('\nBy collection:');
  result.collections.forEach((col: any) => {
    logger.log(`  ${col.collection}: ${col.processed} processed, ${col.encrypted} encrypted, ${col.skipped} skipped, ${col.errors} errors`);
  });
  logger.log('='.repeat(60));
}

/**
 * Print encryption stats
 */
function printEncryptionStats(stats: any[]): void {
  logger.log('\n' + '='.repeat(60));
  logger.log('ENCRYPTION MIGRATION STATISTICS');
  logger.log('='.repeat(60));

  let totalJournals = 0;
  let totalChats = 0;
  let totalGoals = 0;
  let totalCategories = 0;
  let totalRoutines = 0;
  let totalDocuments = 0;

  stats.forEach((s) => {
    logger.log(`\nUser ${s.userId}:`);
    logger.log(`  Journal entries: ${s.journalEntries}`);
    logger.log(`  Chat sessions: ${s.chatSessions}`);
    logger.log(`  Goals: ${s.goals}`);
    logger.log(`  Categories: ${s.categories}`);
    logger.log(`  Routines: ${s.routines}`);
    logger.log(`  Total: ${s.total}`);

    totalJournals += s.journalEntries;
    totalChats += s.chatSessions;
    totalGoals += s.goals;
    totalCategories += s.categories;
    totalRoutines += s.routines;
    totalDocuments += s.total;
  });

  logger.log('\n' + '-'.repeat(40));
  logger.log('TOTALS:');
  logger.log(`  Users: ${stats.length}`);
  logger.log(`  Journal entries: ${totalJournals}`);
  logger.log(`  Chat sessions: ${totalChats}`);
  logger.log(`  Goals: ${totalGoals}`);
  logger.log(`  Categories: ${totalCategories}`);
  logger.log(`  Routines: ${totalRoutines}`);
  logger.log(`  Total documents: ${totalDocuments}`);
  logger.log('='.repeat(60));
}

/**
 * Print encrypt-data usage
 */
function printEncryptDataUsage(): void {
  logger.log('\nUsage: npm run cli migrate:encrypt-data [options]');
  logger.log('\nDescription:');
  logger.log('  Encrypt existing unencrypted data in the database.');
  logger.log('  Data is encrypted using AES-256-GCM with a key derived from');
  logger.log('  SERVER_MASTER_SECRET + user factors (uid, createdAt, authProvider).');
  logger.log('\nOptions:');
  logger.log('  --userId=<userId>     Encrypt data for a specific user only');
  logger.log('  --all                 Encrypt data for all users');
  logger.log('  --dry-run             Perform a dry run without encrypting data');
  logger.log('  --stats               Show encryption statistics without encrypting');
  logger.log('  --help                Show this help message');
  logger.log('\nExamples:');
  logger.log('  npm run cli migrate:encrypt-data --stats');
  logger.log('  npm run cli migrate:encrypt-data --userId=user123 --stats');
  logger.log('  npm run cli migrate:encrypt-data --dry-run --all');
  logger.log('  npm run cli migrate:encrypt-data --userId=user123 --dry-run');
  logger.log('  npm run cli migrate:encrypt-data --userId=user123');
  logger.log('  npm run cli migrate:encrypt-data --all');
  logger.log('\n⚠️  IMPORTANT:');
  logger.log('  - Always run with --dry-run or --stats first!');
  logger.log('  - Create a backup before running without --dry-run!');
  logger.log('  - Set ENCRYPTION_ENABLED=true and SERVER_MASTER_SECRET in .env');
}

/**
 * Handle rotate-keys command
 */
async function handleRotateKeys(
  keyRotationService: KeyRotationService,
  encryptionService: EncryptionService,
  args: string[],
): Promise<void> {
  const options = parseOptions(args);

  // Show help
  if (options.help) {
    printRotateKeysUsage();
    return;
  }

  // Check if encryption is enabled
  if (!encryptionService.isEnabled()) {
    logger.error('Encryption is not enabled! Set ENCRYPTION_ENABLED=true and SERVER_MASTER_SECRET in your environment.');
    process.exit(1);
  }

  // Validate old-secret is provided
  if (!options.oldSecret) {
    logger.error('Error: --old-secret=<hex> is required for key rotation');
    printRotateKeysUsage();
    process.exit(1);
  }

  // Validate old-secret format (64 hex characters)
  if (!/^[0-9a-fA-F]{64}$/.test(options.oldSecret)) {
    logger.error('Error: --old-secret must be a 64-character hex string (256 bits)');
    process.exit(1);
  }

  // Validate options
  if (!options.userId && !options.all) {
    logger.error('Error: You must specify either --userId=<userId> or --all');
    printRotateKeysUsage();
    process.exit(1);
  }

  // Dry run warning
  if (options.dryRun) {
    logger.log('DRY RUN MODE - No data will be re-encrypted');
  } else {
    logger.warn('⚠️  KEY ROTATION will RE-ENCRYPT all user data!');
    logger.warn('⚠️  Make sure you have a BACKUP before proceeding!');
    logger.warn('⚠️  The old secret must match the one previously used to encrypt the data.');
    logger.log('Waiting 10 seconds...');
    await sleep(10000);
  }

  const startTime = Date.now();
  const newVersion = 2; // Increment version on rotation

  if (options.userId) {
    // Rotate single user
    logger.log(`\nRotating encryption key for user: ${options.userId}`);
    const result = await keyRotationService.rotateUserKey(
      options.userId,
      options.oldSecret,
      newVersion,
      options.dryRun,
    );

    printRotationResult(result);
  } else if (options.all) {
    // Rotate all users
    logger.log('\nRotating encryption keys for all users...');
    const userIds = await keyRotationService.getUsersWithEncryptedData();
    
    if (userIds.length === 0) {
      logger.log('No users with encrypted data found.');
      return;
    }

    logger.log(`Found ${userIds.length} users with encrypted data`);

    const results = await keyRotationService.batchRotateUsers(
      userIds,
      options.oldSecret,
      newVersion,
      options.dryRun,
    );

    // Print summary
    const duration = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalDocs = results.reduce((sum, r) => sum + r.documentsRotated, 0);

    logger.log('\n' + '='.repeat(60));
    logger.log('KEY ROTATION SUMMARY');
    logger.log('='.repeat(60));
    logger.log(`Total users: ${results.length}`);
    logger.log(`Successful: ${successful}`);
    logger.log(`Failed: ${failed}`);
    logger.log(`Total documents rotated: ${totalDocs}`);
    logger.log(`Duration: ${formatDuration(duration)}`);
    logger.log('='.repeat(60));

    // Print failures
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      logger.log('\nFailures:');
      failures.forEach(f => {
        logger.log(`  User ${f.userId}: ${f.errors.join(', ')}`);
      });
    }
  }

  if (options.dryRun) {
    logger.log('\n✓ Dry run complete. Run without --dry-run to perform actual key rotation.');
  } else {
    logger.log('\n✓ Key rotation completed!');
    logger.log('\n⚠️  IMPORTANT: Update your .env with the new SERVER_MASTER_SECRET');
  }
}

/**
 * Print rotation result
 */
function printRotationResult(result: any): void {
  logger.log('\n' + '='.repeat(60));
  logger.log('KEY ROTATION RESULT');
  logger.log('='.repeat(60));
  logger.log(`User ID: ${result.userId}`);
  logger.log(`Success: ${result.success}`);
  logger.log(`Documents rotated: ${result.documentsRotated}`);
  logger.log(`Duration: ${formatDuration(result.duration)}`);
  if (result.errors.length > 0) {
    logger.log(`Errors: ${result.errors.join(', ')}`);
  }
  logger.log('='.repeat(60));
}

/**
 * Print rotate-keys usage
 */
function printRotateKeysUsage(): void {
  logger.log('\nUsage: npm run cli rotate-keys --old-secret=<hex> [options]');
  logger.log('\nDescription:');
  logger.log('  Rotate encryption keys by re-encrypting all data with the new');
  logger.log('  SERVER_MASTER_SECRET. Use this when you need to change your secret.');
  logger.log('\nOptions:');
  logger.log('  --old-secret=<hex>    The previous SERVER_MASTER_SECRET (64-char hex, REQUIRED)');
  logger.log('  --userId=<userId>     Rotate key for a specific user only');
  logger.log('  --all                 Rotate keys for all users');
  logger.log('  --dry-run             Perform a dry run without re-encrypting data');
  logger.log('  --help                Show this help message');
  logger.log('\nExamples:');
  logger.log('  npm run cli rotate-keys --old-secret=abc123...def --all --dry-run');
  logger.log('  npm run cli rotate-keys --old-secret=abc123...def --userId=user123');
  logger.log('  npm run cli rotate-keys --old-secret=abc123...def --all');
  logger.log('\n⚠️  IMPORTANT:');
  logger.log('  1. Update your .env with the NEW SERVER_MASTER_SECRET first');
  logger.log('  2. Run this command with the OLD secret to re-encrypt data');
  logger.log('  3. Always run with --dry-run first!');
  logger.log('  4. Create a backup before running without --dry-run!');
}

/**
 * Print general usage
 */
function printUsage(): void {
  logger.log('\nUsage: npm run cli <command> [options]');
  logger.log('\nAvailable commands:');
  logger.log('  migrate-embeddings      Migrate existing content to generate embeddings');
  logger.log('  migrate-milestones      Migrate milestones from subcollection to array');
  logger.log('  migrate-weekly-insights Generate weekly insights for past weeks');
  logger.log('  migrate:encrypt-data    Encrypt existing user data');
  logger.log('  rotate-keys             Rotate encryption keys (re-encrypt with new secret)');
  logger.log('\nFor command-specific help, run: npm run cli <command> --help');
}

/**
 * Print migrate-embeddings usage
 */
function printMigrateUsage(): void {
  logger.log('\nUsage: npm run cli migrate-embeddings [options]');
  logger.log('\nOptions:');
  logger.log('  --userId=<userId>     Migrate embeddings for a specific user');
  logger.log('  --all-users           Migrate embeddings for all users');
  logger.log('  --dry-run             Perform a dry run without creating embeddings');
  logger.log('\nExamples:');
  logger.log('  npm run cli migrate-embeddings --userId=user123');
  logger.log('  npm run cli migrate-embeddings --all-users');
  logger.log('  npm run cli migrate-embeddings --userId=user123 --dry-run');
}

/**
 * Print migrate-milestones usage
 */
function printMilestonesUsage(): void {
  logger.log('\nUsage: npm run cli migrate-milestones [options]');
  logger.log('\nOptions:');
  logger.log('  --userId=<userId>     Migrate milestones for a specific user only');
  logger.log('  --dry-run             Perform a dry run without making changes');
  logger.log('  --cleanup             Delete old milestone subcollections after migration');
  logger.log('  --stats               Show migration statistics without migrating');
  logger.log('  --help                Show this help message');
  logger.log('\nExamples:');
  logger.log('  npm run cli migrate-milestones --stats');
  logger.log('  npm run cli migrate-milestones --dry-run');
  logger.log('  npm run cli migrate-milestones');
  logger.log('  npm run cli migrate-milestones --userId=user123');
  logger.log('  npm run cli migrate-milestones --cleanup');
  logger.log('\nNote: Always run with --dry-run first to verify the migration!');
}

bootstrap();
