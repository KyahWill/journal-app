/**
 * Migration script to delete all documents from the user_themes collection
 * 
 * This script is part of the theme system removal.
 * Run with: npx ts-node src/firebase/migrations/delete-user-themes.ts
 * 
 * Prerequisites:
 *   - FIREBASE_SERVICE_ACCOUNT_KEY environment variable must be set
 *   - Run from the backend directory
 */

import * as admin from 'firebase-admin'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') })

const COLLECTION_NAME = 'user_themes'

async function initializeFirebase(): Promise<admin.firestore.Firestore> {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)'

  if (!serviceAccountKey) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables.\n' +
      'Make sure your .env file contains the service account JSON.'
    )
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

async function deleteUserThemesCollection() {
  console.log('============================================================')
  console.log('DELETE USER_THEMES COLLECTION')
  console.log('============================================================')
  console.log(`Collection: ${COLLECTION_NAME}`)
  console.log('============================================================\n')

  const db = await initializeFirebase()
  
  console.log(`Fetching documents from ${COLLECTION_NAME}...`)
  
  const collectionRef = db.collection(COLLECTION_NAME)
  const snapshot = await collectionRef.get()
  
  if (snapshot.empty) {
    console.log(`\n✅ Collection ${COLLECTION_NAME} is already empty or does not exist.`)
    return
  }
  
  console.log(`Found ${snapshot.size} documents to delete.\n`)
  
  // Delete in batches of 500 (Firestore batch limit)
  const batchSize = 500
  let deletedCount = 0
  
  const docs = snapshot.docs
  
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch()
    const batchDocs = docs.slice(i, i + batchSize)
    
    for (const doc of batchDocs) {
      batch.delete(doc.ref)
    }
    
    await batch.commit()
    deletedCount += batchDocs.length
    console.log(`  Deleted ${deletedCount}/${docs.length} documents...`)
  }
  
  console.log('\n============================================================')
  console.log('MIGRATION COMPLETE')
  console.log('============================================================')
  console.log(`✅ Successfully deleted ${deletedCount} documents from ${COLLECTION_NAME}.`)
  console.log('============================================================')
}

// Run the migration
deleteUserThemesCollection()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  })


