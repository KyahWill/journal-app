import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MigrationService } from './rag/migration.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('CLI');

/**
 * CLI entry point for running migration commands
 * 
 * Usage:
 *   npm run cli migrate-embeddings --userId=<user-id>
 *   npm run cli migrate-embeddings --all-users
 *   npm run cli migrate-embeddings --userId=<user-id> --dry-run
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const migrationService = app.get(MigrationService);

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
 * Print general usage
 */
function printUsage(): void {
  logger.log('\nUsage: npm run cli <command> [options]');
  logger.log('\nAvailable commands:');
  logger.log('  migrate-embeddings    Migrate existing content to generate embeddings');
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

bootstrap();
