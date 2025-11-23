import * as admin from 'firebase-admin'

/**
 * Migration: Setup Custom Categories Collection
 * 
 * This migration creates the custom_categories collection structure
 * and sets up necessary indexes for efficient querying.
 * 
 * Collection: custom_categories
 * Fields:
 * - user_id: string (indexed)
 * - name: string
 * - color: string (optional, hex color)
 * - icon: string (optional)
 * - created_at: timestamp
 * - updated_at: timestamp
 * 
 * Indexes:
 * - user_id (ascending) + name (ascending) - for unique category names per user
 * - user_id (ascending) + created_at (descending) - for listing user categories
 */

async function setupCustomCategories() {
  try {
    console.log('Starting custom categories collection setup...')

    const firestore = admin.firestore()

    // Create a sample document to initialize the collection
    // This will be deleted after indexes are created
    const sampleDoc = {
      user_id: 'sample_user',
      name: 'Sample Category',
      color: '#3B82F6',
      icon: '🎯',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await firestore.collection('custom_categories').add(sampleDoc)
    console.log('Sample document created:', docRef.id)

    // Delete the sample document
    await docRef.delete()
    console.log('Sample document deleted')

    console.log('\n✅ Custom categories collection setup complete!')
    console.log('\nNext steps:')
    console.log('1. Create composite indexes in Firebase Console:')
    console.log('   - Collection: custom_categories')
    console.log('   - Fields: user_id (Ascending), name (Ascending)')
    console.log('   - Query scope: Collection')
    console.log('')
    console.log('   - Collection: custom_categories')
    console.log('   - Fields: user_id (Ascending), created_at (Descending)')
    console.log('   - Query scope: Collection')
    console.log('')
    console.log('2. Or use the Firebase CLI to deploy indexes:')
    console.log('   firebase deploy --only firestore:indexes')
    console.log('')
    console.log('Note: The goals collection already supports string category values,')
    console.log('so no migration is needed for existing goals.')

  } catch (error) {
    console.error('Error setting up custom categories collection:', error)
    throw error
  }
}

// Run if executed directly
if (require.main === module) {
  // Initialize Firebase Admin if not already initialized
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    })
  }

  setupCustomCategories()
    .then(() => {
      console.log('Migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export { setupCustomCategories }
