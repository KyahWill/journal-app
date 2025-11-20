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

      // Initialize Firebase Admin
      if (!admin.apps.length) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: projectId || serviceAccount.project_id,
        })
      } else {
        this.app = admin.app()
      }

      this.auth = admin.auth(this.app)
      this.firestore = admin.firestore(this.app)

      this.logger.log('Firebase Admin SDK initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error)
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
}

