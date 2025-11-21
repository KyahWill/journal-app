import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as admin from 'firebase-admin'
import { App } from 'firebase-admin/app'
import { Auth } from 'firebase-admin/auth'
import { Firestore } from 'firebase-admin/firestore'

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: App
  private auth: Auth
  private firestore: Firestore
  private readonly logger = new Logger(FirebaseService.name)

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const serviceAccountKey = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_KEY')
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID')
      const databaseId = this.configService.get<string>('FIREBASE_DATABASE_ID') || '(default)'

      if (!serviceAccountKey) {
        throw new Error(
          'FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables.\n' +
          'Please set it in your .env file.\n' +
          'See backend/.env.example for the correct format.'
        )
      }

      // Validate JSON before parsing
      let serviceAccount: any
      try {
        serviceAccount = JSON.parse(serviceAccountKey)
      } catch (parseError) {
        throw new Error(
          'FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.\n' +
          'Make sure to:\n' +
          '1. Copy the entire JSON from Firebase Console\n' +
          '2. Stringify it to a single line (no line breaks)\n' +
          '3. Wrap it in single quotes in .env file\n' +
          `Parse error: ${parseError.message}`
        )
      }

      const finalProjectId = projectId || serviceAccount.project_id

      // Initialize Firebase Admin
      if (!admin.apps.length) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: finalProjectId,
        })
      } else {
        this.app = admin.app()
      }

      this.auth = admin.auth(this.app)
      
      // Initialize Firestore with specific database if provided
      if (databaseId && databaseId !== '(default)') {
        this.firestore = admin.firestore(this.app)
        this.firestore.settings({ databaseId })
        this.logger.log(`Using Firestore database: ${databaseId}`)
      } else {
        this.firestore = admin.firestore(this.app)
        this.logger.log('Using Firestore default database: (default)')
      }

      this.logger.log('='.repeat(60))
      this.logger.log('Firebase Configuration:')
      this.logger.log(`  Project ID: ${finalProjectId}`)
      this.logger.log(`  Database ID: ${databaseId}`)
      this.logger.log(`  Collection: journal-entries (will be created automatically)`)
      this.logger.log('='.repeat(60))
      this.logger.log('Firebase Admin SDK initialized successfully')
      
      // Test database connectivity
      await this.testDatabaseConnection()
      
      this.logger.log('Please verify:')
      this.logger.log(`  1. Firestore is enabled in Firebase Console`)
      this.logger.log(`  2. Database "${databaseId}" exists`)
      this.logger.log(`  3. Service account has Firestore permissions`)
      this.logger.log(`  Firebase Console: https://console.firebase.google.com/project/${finalProjectId}/firestore`)
      this.logger.log('='.repeat(60))
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error)
      throw error
    }
  }

  /**
   * Test database connection and check if collections exist
   */
  private async testDatabaseConnection(): Promise<void> {
    try {
      this.logger.log('Testing Firestore database connection...')
      
      // Try to list collections (this will fail if database doesn't exist)
      const collections = await this.firestore.listCollections()
      
      this.logger.log(`✅ Database connection successful!`)
      
      if (collections.length > 0) {
        this.logger.log(`✅ Found ${collections.length} collection(s):`)
        collections.forEach(col => {
          this.logger.log(`   - ${col.id}`)
        })
        
        // Check if journal-entries collection exists
        const hasJournalCollection = collections.some(col => col.id === 'journal-entries')
        if (hasJournalCollection) {
          // Count documents in the collection
          const snapshot = await this.firestore.collection('journal-entries').get()
          this.logger.log(`✅ journal-entries collection exists with ${snapshot.size} document(s)`)
        } else {
          this.logger.log(`ℹ️  journal-entries collection doesn't exist yet (will be created on first write)`)
        }
      } else {
        this.logger.log(`ℹ️  No collections exist yet (this is normal for a new database)`)
        this.logger.log(`ℹ️  Collections will be created automatically when you add data`)
      }
    } catch (error) {
      this.logger.error('❌ Database connection test failed!')
      this.logger.error('This usually means:')
      this.logger.error('  1. Firestore is not enabled in Firebase Console')
      this.logger.error('  2. The database does not exist')
      this.logger.error('  3. Service account lacks proper permissions')
      this.logger.error(`Error details: ${error.message}`)
      throw error
    }
  }

  // Auth methods
  getAuth(): Auth {
    return this.auth
  }

  async verifyIdToken(token: string) {
    return this.auth.verifyIdToken(token)
  }

  async createUser(email: string, password: string, displayName?: string) {
    return this.auth.createUser({
      email,
      password,
      displayName,
    })
  }

  async getUserByEmail(email: string) {
    return this.auth.getUserByEmail(email)
  }

  async getUserById(uid: string) {
    return this.auth.getUser(uid)
  }

  async deleteUser(uid: string) {
    return this.auth.deleteUser(uid)
  }

  async updateUser(uid: string, properties: admin.auth.UpdateRequest) {
    return this.auth.updateUser(uid, properties)
  }

  async createCustomToken(uid: string, additionalClaims?: object) {
    return this.auth.createCustomToken(uid, additionalClaims)
  }

  // Firestore methods
  getFirestore(): Firestore {
    return this.firestore
  }

  collection(collectionPath: string) {
    return this.firestore.collection(collectionPath)
  }

  doc(documentPath: string) {
    return this.firestore.doc(documentPath)
  }

  async getDocument(collectionPath: string, docId: string): Promise<any> {
    const docRef = this.firestore.collection(collectionPath).doc(docId)
    const doc = await docRef.get()
    if (!doc.exists) {
      return null
    }
    return { id: doc.id, ...doc.data() }
  }

  async getCollection(
    collectionPath: string,
    filters?: Array<{ field: string; operator: FirebaseFirestore.WhereFilterOp; value: any }>,
    orderByField?: string,
    orderDirection?: 'asc' | 'desc',
  ): Promise<any[]> {
    let query: FirebaseFirestore.Query = this.firestore.collection(collectionPath)

    if (filters) {
      for (const filter of filters) {
        query = query.where(filter.field, filter.operator, filter.value)
      }
    }

    if (orderByField) {
      query = query.orderBy(orderByField, orderDirection || 'asc')
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async addDocument(collectionPath: string, data: any): Promise<any> {
    const collectionRef = this.firestore.collection(collectionPath)
    const timestamp = admin.firestore.Timestamp.now()

    const docRef = await collectionRef.add({
      ...data,
      created_at: timestamp,
      updated_at: timestamp,
    })

    return { id: docRef.id, ...data, created_at: timestamp, updated_at: timestamp }
  }

  async updateDocument(collectionPath: string, docId: string, data: any): Promise<any> {
    const docRef = this.firestore.collection(collectionPath).doc(docId)
    const timestamp = admin.firestore.Timestamp.now()

    await docRef.update({
      ...data,
      updated_at: timestamp,
    })

    return { id: docId, ...data, updated_at: timestamp }
  }

  async deleteDocument(collectionPath: string, docId: string) {
    const docRef = this.firestore.collection(collectionPath).doc(docId)
    await docRef.delete()
    return { id: docId, deleted: true }
  }

  async documentExists(collectionPath: string, docId: string): Promise<boolean> {
    const docRef = this.firestore.collection(collectionPath).doc(docId)
    const doc = await docRef.get()
    return doc.exists
  }

  // Batch operations
  batch() {
    return this.firestore.batch()
  }

  // Transaction operations
  async runTransaction<T>(updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>) {
    return this.firestore.runTransaction(updateFunction)
  }

  // Diagnostic methods
  async checkDatabaseConnection(): Promise<{ connected: boolean; projectId: string; error?: string }> {
    try {
      const projectId = this.app.options.projectId || 'unknown'
      // Try to list collections (even if empty, this will succeed if database exists)
      await this.firestore.listCollections()
      
      this.logger.log('✅ Database connection successful')
      return { connected: true, projectId }
    } catch (error) {
      this.logger.error('❌ Database connection failed', error)
      return { 
        connected: false, 
        projectId: this.app.options.projectId || 'unknown',
        error: error.message 
      }
    }
  }

  async checkCollectionExists(collectionName: string): Promise<{ exists: boolean; documentCount?: number; error?: string }> {
    try {
      const collectionRef = this.firestore.collection(collectionName)
      const snapshot = await collectionRef.limit(1).get()
      
      // Get document count (limit to 1000 for performance)
      const countSnapshot = await collectionRef.count().get()
      const count = countSnapshot.data().count
      
      if (count > 0) {
        this.logger.log(`✅ Collection '${collectionName}' exists with ${count} documents`)
        return { exists: true, documentCount: count }
      } else {
        this.logger.log(`⚠️  Collection '${collectionName}' doesn't exist yet (will be created on first write)`)
        return { exists: false, documentCount: 0 }
      }
    } catch (error) {
      this.logger.error(`❌ Error checking collection '${collectionName}'`, error)
      return { 
        exists: false, 
        error: error.message 
      }
    }
  }

  async getDatabaseInfo(): Promise<any> {
    try {
      const projectId = this.app.options.projectId || 'unknown'
      const collections = await this.firestore.listCollections()
      const collectionNames = collections.map(col => col.id)

      const info = {
        projectId,
        databaseId: '(default)',
        collections: collectionNames,
        collectionCount: collectionNames.length,
      }

      this.logger.log('📊 Database Info:', JSON.stringify(info, null, 2))
      return info
    } catch (error) {
      this.logger.error('❌ Failed to get database info', error)
      throw error
    }
  }
}

