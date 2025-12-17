/**
 * User ID Migration Script
 * 
 * Migrates all user data from one user ID to another.
 * This is useful when:
 * - A user's UID changed due to authentication provider linking issues
 * - Merging two accounts into one
 * - Recovering data after accidental account creation
 * 
 * Usage:
 *   npx ts-node src/firebase/migrations/migrate-user-id.ts <OLD_UID> <NEW_UID> [--dry-run]
 * 
 * Examples:
 *   # Dry run (no changes made):
 *   npx ts-node src/firebase/migrations/migrate-user-id.ts abc123 xyz789 --dry-run
 * 
 *   # Actual migration:
 *   npx ts-node src/firebase/migrations/migrate-user-id.ts abc123 xyz789
 */

import * as admin from 'firebase-admin'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') })

// Collections that have a user_id field
const COLLECTIONS_WITH_USER_ID = [
  'goals',
  'journal-entries',
  'chat_sessions',
  'user_prompts',
  'custom_categories',
  'goal_journal_links',
  'coach_personalities',
  'embeddings',
]

// Special collections with different structures
const PROFILE_COLLECTION = 'profiles'
const USAGE_COLLECTION = 'user_usage'

interface MigrationResult {
  collection: string
  documentsFound: number
  documentsUpdated: number
  errors: string[]
}

interface MigrationSummary {
  oldUid: string
  newUid: string
  dryRun: boolean
  startTime: Date
  endTime?: Date
  results: MigrationResult[]
  totalDocuments: number
  totalUpdated: number
  totalErrors: number
}

async function initializeFirebase(): Promise<admin.firestore.Firestore> {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)'

  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables')
  }

  const serviceAccount = JSON.parse(serviceAccountKey)

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    })
  }

  const firestore = admin.firestore()
  
  if (databaseId && databaseId !== '(default)') {
    firestore.settings({ databaseId })
  }

  return firestore
}

async function migrateCollection(
  db: admin.firestore.Firestore,
  collectionName: string,
  oldUid: string,
  newUid: string,
  dryRun: boolean
): Promise<MigrationResult> {
  const result: MigrationResult = {
    collection: collectionName,
    documentsFound: 0,
    documentsUpdated: 0,
    errors: [],
  }

  try {
    // Query documents with the old user_id
    const snapshot = await db
      .collection(collectionName)
      .where('user_id', '==', oldUid)
      .get()

    result.documentsFound = snapshot.size

    if (snapshot.empty) {
      console.log(`  [${collectionName}] No documents found`)
      return result
    }

    console.log(`  [${collectionName}] Found ${snapshot.size} documents`)

    if (dryRun) {
      console.log(`  [${collectionName}] DRY RUN - Would update ${snapshot.size} documents`)
      result.documentsUpdated = snapshot.size
      return result
    }

    // Batch update documents (Firestore limits batches to 500 operations)
    const batches: admin.firestore.WriteBatch[] = []
    let currentBatch = db.batch()
    let operationCount = 0

    for (const doc of snapshot.docs) {
      currentBatch.update(doc.ref, { user_id: newUid })
      operationCount++

      if (operationCount === 500) {
        batches.push(currentBatch)
        currentBatch = db.batch()
        operationCount = 0
      }
    }

    if (operationCount > 0) {
      batches.push(currentBatch)
    }

    // Execute all batches
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit()
      console.log(`  [${collectionName}] Committed batch ${i + 1}/${batches.length}`)
    }

    result.documentsUpdated = snapshot.size
    console.log(`  [${collectionName}] Successfully updated ${snapshot.size} documents`)
  } catch (error: any) {
    const errorMessage = `Error migrating ${collectionName}: ${error.message}`
    console.error(`  [${collectionName}] ${errorMessage}`)
    result.errors.push(errorMessage)
  }

  return result
}

async function migrateProfile(
  db: admin.firestore.Firestore,
  oldUid: string,
  newUid: string,
  dryRun: boolean
): Promise<MigrationResult> {
  const result: MigrationResult = {
    collection: PROFILE_COLLECTION,
    documentsFound: 0,
    documentsUpdated: 0,
    errors: [],
  }

  try {
    // Profile document ID = user ID
    const oldProfileRef = db.collection(PROFILE_COLLECTION).doc(oldUid)
    const oldProfileDoc = await oldProfileRef.get()

    if (!oldProfileDoc.exists) {
      console.log(`  [${PROFILE_COLLECTION}] No profile found for old UID`)
      return result
    }

    result.documentsFound = 1
    console.log(`  [${PROFILE_COLLECTION}] Found profile document`)

    if (dryRun) {
      console.log(`  [${PROFILE_COLLECTION}] DRY RUN - Would copy profile to new UID and delete old`)
      result.documentsUpdated = 1
      return result
    }

    // Check if new profile already exists
    const newProfileRef = db.collection(PROFILE_COLLECTION).doc(newUid)
    const newProfileDoc = await newProfileRef.get()

    const oldData = oldProfileDoc.data()!

    if (newProfileDoc.exists) {
      // Merge data, preferring old profile data (since that's the one with history)
      const newData = newProfileDoc.data()!
      const mergedData = {
        ...newData,
        ...oldData,
        id: newUid, // Ensure ID matches new UID
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }
      await newProfileRef.set(mergedData, { merge: true })
      console.log(`  [${PROFILE_COLLECTION}] Merged profile data into existing new profile`)
    } else {
      // Copy to new location with updated ID
      await newProfileRef.set({
        ...oldData,
        id: newUid,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })
      console.log(`  [${PROFILE_COLLECTION}] Copied profile to new UID`)
    }

    // Delete old profile
    await oldProfileRef.delete()
    console.log(`  [${PROFILE_COLLECTION}] Deleted old profile`)

    result.documentsUpdated = 1
  } catch (error: any) {
    const errorMessage = `Error migrating profile: ${error.message}`
    console.error(`  [${PROFILE_COLLECTION}] ${errorMessage}`)
    result.errors.push(errorMessage)
  }

  return result
}

async function migrateUsage(
  db: admin.firestore.Firestore,
  oldUid: string,
  newUid: string,
  dryRun: boolean
): Promise<MigrationResult> {
  const result: MigrationResult = {
    collection: USAGE_COLLECTION,
    documentsFound: 0,
    documentsUpdated: 0,
    errors: [],
  }

  try {
    // Usage is stored as: user_usage/{userId}/daily/{YYYY-MM-DD}
    const oldUsageRef = db.collection(USAGE_COLLECTION).doc(oldUid)
    const dailyCollection = await oldUsageRef.collection('daily').get()

    if (dailyCollection.empty) {
      console.log(`  [${USAGE_COLLECTION}] No usage data found for old UID`)
      return result
    }

    result.documentsFound = dailyCollection.size
    console.log(`  [${USAGE_COLLECTION}] Found ${dailyCollection.size} usage documents`)

    if (dryRun) {
      console.log(`  [${USAGE_COLLECTION}] DRY RUN - Would migrate ${dailyCollection.size} usage documents`)
      result.documentsUpdated = dailyCollection.size
      return result
    }

    // Copy each daily document to new user path
    const newUsageRef = db.collection(USAGE_COLLECTION).doc(newUid)
    
    for (const doc of dailyCollection.docs) {
      const data = doc.data()
      await newUsageRef.collection('daily').doc(doc.id).set(data, { merge: true })
    }

    console.log(`  [${USAGE_COLLECTION}] Copied ${dailyCollection.size} usage documents to new UID`)

    // Delete old usage documents
    const batch = db.batch()
    for (const doc of dailyCollection.docs) {
      batch.delete(doc.ref)
    }
    await batch.commit()
    await oldUsageRef.delete()

    console.log(`  [${USAGE_COLLECTION}] Deleted old usage documents`)

    result.documentsUpdated = dailyCollection.size
  } catch (error: any) {
    const errorMessage = `Error migrating usage: ${error.message}`
    console.error(`  [${USAGE_COLLECTION}] ${errorMessage}`)
    result.errors.push(errorMessage)
  }

  return result
}

async function migrateProgressUpdates(
  db: admin.firestore.Firestore,
  oldUid: string,
  newUid: string,
  dryRun: boolean
): Promise<MigrationResult> {
  const result: MigrationResult = {
    collection: 'goals/*/progress_updates',
    documentsFound: 0,
    documentsUpdated: 0,
    errors: [],
  }

  try {
    // Get all goals for the old user (already migrated, so query by new user_id)
    const goalsSnapshot = await db
      .collection('goals')
      .where('user_id', '==', newUid)
      .get()

    if (goalsSnapshot.empty) {
      console.log(`  [progress_updates] No goals found to check for progress updates`)
      return result
    }

    // Progress updates are subcollections of goals, they don't have user_id
    // but they're already associated with the goal, so no migration needed
    // Just count them for reporting
    for (const goalDoc of goalsSnapshot.docs) {
      const updatesSnapshot = await goalDoc.ref.collection('progress_updates').get()
      result.documentsFound += updatesSnapshot.size
    }

    console.log(`  [progress_updates] Found ${result.documentsFound} progress updates (no migration needed - part of goals)`)
    result.documentsUpdated = result.documentsFound

  } catch (error: any) {
    const errorMessage = `Error checking progress updates: ${error.message}`
    console.error(`  [progress_updates] ${errorMessage}`)
    result.errors.push(errorMessage)
  }

  return result
}

async function runMigration(oldUid: string, newUid: string, dryRun: boolean): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    oldUid,
    newUid,
    dryRun,
    startTime: new Date(),
    results: [],
    totalDocuments: 0,
    totalUpdated: 0,
    totalErrors: 0,
  }

  console.log('\n' + '='.repeat(60))
  console.log('USER ID MIGRATION')
  console.log('='.repeat(60))
  console.log(`Old UID: ${oldUid}`)
  console.log(`New UID: ${newUid}`)
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`)
  console.log('='.repeat(60) + '\n')

  // Initialize Firebase
  console.log('Initializing Firebase...')
  const db = await initializeFirebase()
  console.log('Firebase initialized successfully\n')

  // Migrate regular collections with user_id field
  console.log('Migrating collections with user_id field...')
  for (const collection of COLLECTIONS_WITH_USER_ID) {
    const result = await migrateCollection(db, collection, oldUid, newUid, dryRun)
    summary.results.push(result)
    summary.totalDocuments += result.documentsFound
    summary.totalUpdated += result.documentsUpdated
    summary.totalErrors += result.errors.length
  }

  // Migrate profile (special case - document ID = user ID)
  console.log('\nMigrating profile...')
  const profileResult = await migrateProfile(db, oldUid, newUid, dryRun)
  summary.results.push(profileResult)
  summary.totalDocuments += profileResult.documentsFound
  summary.totalUpdated += profileResult.documentsUpdated
  summary.totalErrors += profileResult.errors.length

  // Migrate usage data (special case - nested by user ID in path)
  console.log('\nMigrating usage data...')
  const usageResult = await migrateUsage(db, oldUid, newUid, dryRun)
  summary.results.push(usageResult)
  summary.totalDocuments += usageResult.documentsFound
  summary.totalUpdated += usageResult.documentsUpdated
  summary.totalErrors += usageResult.errors.length

  // Check progress updates (they're subcollections, already migrated with goals)
  console.log('\nChecking progress updates...')
  const progressResult = await migrateProgressUpdates(db, oldUid, newUid, dryRun)
  summary.results.push(progressResult)

  summary.endTime = new Date()

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('MIGRATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`Duration: ${(summary.endTime.getTime() - summary.startTime.getTime()) / 1000}s`)
  console.log(`Total documents found: ${summary.totalDocuments}`)
  console.log(`Total documents ${dryRun ? 'would be ' : ''}updated: ${summary.totalUpdated}`)
  console.log(`Total errors: ${summary.totalErrors}`)
  console.log('')
  console.log('Results by collection:')
  for (const result of summary.results) {
    const status = result.errors.length > 0 ? '❌' : '✅'
    console.log(`  ${status} ${result.collection}: ${result.documentsFound} found, ${result.documentsUpdated} ${dryRun ? 'would be ' : ''}updated`)
    for (const error of result.errors) {
      console.log(`     Error: ${error}`)
    }
  }
  console.log('='.repeat(60))

  if (dryRun) {
    console.log('\n⚠️  DRY RUN COMPLETE - No changes were made')
    console.log('   Run without --dry-run to perform the actual migration\n')
  } else {
    console.log('\n✅ MIGRATION COMPLETE\n')
  }

  return summary
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: npx ts-node src/firebase/migrations/migrate-user-id.ts <OLD_UID> <NEW_UID> [--dry-run]')
    console.log('')
    console.log('Arguments:')
    console.log('  OLD_UID   The user ID to migrate FROM (the one with the data)')
    console.log('  NEW_UID   The user ID to migrate TO (the one you want to use)')
    console.log('  --dry-run Optional. Preview changes without making them')
    console.log('')
    console.log('Examples:')
    console.log('  # Preview migration:')
    console.log('  npx ts-node src/firebase/migrations/migrate-user-id.ts abc123 xyz789 --dry-run')
    console.log('')
    console.log('  # Perform migration:')
    console.log('  npx ts-node src/firebase/migrations/migrate-user-id.ts abc123 xyz789')
    process.exit(1)
  }

  const oldUid = args[0]
  const newUid = args[1]
  const dryRun = args.includes('--dry-run')

  if (oldUid === newUid) {
    console.error('Error: OLD_UID and NEW_UID cannot be the same')
    process.exit(1)
  }

  try {
    await runMigration(oldUid, newUid, dryRun)
  } catch (error: any) {
    console.error('Migration failed:', error.message)
    process.exit(1)
  }
}

main()

