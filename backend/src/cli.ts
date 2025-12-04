import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MigrationService } from './rag/migration.service';
import { MilestoneMigrationService } from './goal/milestone-migration.service';
import { WeeklyInsightsMigrationService } from './chat/weekly-insights-migration.service';
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
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const migrationService = app.get(MigrationService);
  const milestoneMigrationService = app.get(MilestoneMigrationService);
  const weeklyInsightsMigrationService = app.get(WeeklyInsightsMigrationService);

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
    } else if (arg === '--all-users') {
      options.allUsers = true;
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
 * Print general usage
 */
function printUsage(): void {
  logger.log('\nUsage: npm run cli <command> [options]');
  logger.log('\nAvailable commands:');
  logger.log('  migrate-embeddings      Migrate existing content to generate embeddings');
  logger.log('  migrate-milestones      Migrate milestones from subcollection to array');
  logger.log('  migrate-weekly-insights Generate weekly insights for past weeks');
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
