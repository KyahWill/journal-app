import { Injectable, Logger } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { EncryptionService, UserKeyFactors } from './encryption.service'

export interface EncryptionMigrationResult {
  userId: string
  totalProcessed: number
  successCount: number
  failedCount: number
  duration: number
  collections: {
    collection: string
    processed: number
    encrypted: number
    skipped: number
    errors: number
  }[]
  errors: {
    collection: string
    documentId: string
    error: string
  }[]
}

export interface MigrationStats {
  userId: string
  journalEntries: number
  chatSessions: number
  goals: number
  categories: number
  routines: number
  total: number
}

@Injectable()
export class EncryptionMigrationService {
  private readonly logger = new Logger(EncryptionMigrationService.name)

  // Collection configurations
  private readonly collections = {
    'journal-entries': {
      fields: ['title', 'content'],
      arrayFields: ['tags'],
    },
    'chat_sessions': {
      fields: ['title'],
      messageField: 'messages',
      messageContentField: 'content',
    },
    'goals': {
      fields: ['title', 'description'],
      milestonesField: 'milestones',
      milestoneFields: ['title', 'description'],
    },
    'custom_categories': {
      fields: ['name'],
    },
    'routines': {
      fields: ['title', 'description'],
      stepsField: 'steps',
      stepFields: ['title'],
    },
  }

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Get migration statistics for a user
   */
  async getMigrationStats(userId: string): Promise<MigrationStats> {
    const stats: MigrationStats = {
      userId,
      journalEntries: 0,
      chatSessions: 0,
      goals: 0,
      categories: 0,
      routines: 0,
      total: 0,
    }

    try {
      // Count documents in each collection
      const firestore = this.firebaseService.getFirestore()

      const journalSnapshot = await firestore
        .collection('journal-entries')
        .where('user_id', '==', userId)
        .count()
        .get()
      stats.journalEntries = journalSnapshot.data().count

      const chatSnapshot = await firestore
        .collection('chat_sessions')
        .where('user_id', '==', userId)
        .count()
        .get()
      stats.chatSessions = chatSnapshot.data().count

      const goalsSnapshot = await firestore
        .collection('goals')
        .where('user_id', '==', userId)
        .count()
        .get()
      stats.goals = goalsSnapshot.data().count

      const categoriesSnapshot = await firestore
        .collection('custom_categories')
        .where('user_id', '==', userId)
        .count()
        .get()
      stats.categories = categoriesSnapshot.data().count

      const routinesSnapshot = await firestore
        .collection('routines')
        .where('user_id', '==', userId)
        .count()
        .get()
      stats.routines = routinesSnapshot.data().count

      stats.total =
        stats.journalEntries +
        stats.chatSessions +
        stats.goals +
        stats.categories +
        stats.routines
    } catch (error) {
      this.logger.error(`Error getting migration stats for user ${userId}`, error)
    }

    return stats
  }

  /**
   * Get all user IDs from the database
   */
  async getAllUserIds(): Promise<string[]> {
    const userIds = new Set<string>()

    try {
      const firestore = this.firebaseService.getFirestore()

      // Collect user IDs from all collections
      for (const collectionName of Object.keys(this.collections)) {
        const snapshot = await firestore.collection(collectionName).select('user_id').get()
        snapshot.docs.forEach((doc) => {
          const userId = doc.data().user_id
          if (userId) {
            userIds.add(userId)
          }
        })
      }
    } catch (error) {
      this.logger.error('Error getting all user IDs', error)
    }

    return Array.from(userIds)
  }

  /**
   * Migrate a single user's data to encrypted format
   */
  async migrateUserData(
    userId: string,
    keyFactors: UserKeyFactors,
    options: { dryRun?: boolean } = {},
  ): Promise<EncryptionMigrationResult> {
    const startTime = Date.now()
    const result: EncryptionMigrationResult = {
      userId,
      totalProcessed: 0,
      successCount: 0,
      failedCount: 0,
      duration: 0,
      collections: [],
      errors: [],
    }

    if (!this.encryptionService.isEnabled()) {
      this.logger.error('Encryption is not enabled. Cannot migrate.')
      return result
    }

    // Derive encryption key for user
    const encryptionKey = this.encryptionService.deriveUserKey(keyFactors)

    // Migrate each collection
    for (const [collectionName, config] of Object.entries(this.collections)) {
      const collectionResult = await this.migrateCollection(
        userId,
        collectionName,
        config,
        encryptionKey,
        options.dryRun || false,
      )

      result.collections.push(collectionResult)
      result.totalProcessed += collectionResult.processed
      result.successCount += collectionResult.encrypted
      result.failedCount += collectionResult.errors

      // Collect errors
      if (collectionResult.errors > 0) {
        // The errors are logged but not individually tracked for now
      }
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * Migrate all documents in a collection for a user
   */
  private async migrateCollection(
    userId: string,
    collectionName: string,
    config: any,
    encryptionKey: Buffer,
    dryRun: boolean,
  ): Promise<{
    collection: string
    processed: number
    encrypted: number
    skipped: number
    errors: number
  }> {
    const result = {
      collection: collectionName,
      processed: 0,
      encrypted: 0,
      skipped: 0,
      errors: 0,
    }

    try {
      const firestore = this.firebaseService.getFirestore()
      const collectionRef = firestore.collection(collectionName)

      // Get all documents for this user
      const snapshot = await collectionRef.where('user_id', '==', userId).get()

      this.logger.log(
        `Migrating ${snapshot.size} documents in ${collectionName} for user ${userId}`,
      )

      for (const doc of snapshot.docs) {
        result.processed++

        try {
          const data = doc.data()
          const encryptedData: any = {}
          let needsUpdate = false

          // Check if already encrypted (check first field)
          if (config.fields && config.fields.length > 0) {
            const firstField = config.fields[0]
            if (data[firstField] && this.encryptionService.isEncrypted(data[firstField])) {
              result.skipped++
              continue
            }
          }

          // Encrypt simple string fields
          if (config.fields) {
            for (const field of config.fields) {
              if (data[field] && typeof data[field] === 'string') {
                encryptedData[field] = this.encryptionService.encrypt(data[field], encryptionKey)
                needsUpdate = true
              }
            }
          }

          // Encrypt array fields (arrays of strings)
          if (config.arrayFields) {
            for (const field of config.arrayFields) {
              if (Array.isArray(data[field])) {
                encryptedData[field] = data[field].map((item: any) => {
                  if (typeof item === 'string' && !this.encryptionService.isEncrypted(item)) {
                    return this.encryptionService.encrypt(item, encryptionKey)
                  }
                  return item
                })
                needsUpdate = true
              }
            }
          }

          // Encrypt messages (for chat sessions)
          if (config.messageField && data[config.messageField]) {
            encryptedData[config.messageField] = this.encryptMessages(
              data[config.messageField],
              config.messageContentField,
              encryptionKey,
            )
            needsUpdate = true
          }

          // Encrypt milestones (for goals)
          if (config.milestonesField && data[config.milestonesField]) {
            encryptedData[config.milestonesField] = this.encryptNestedArray(
              data[config.milestonesField],
              config.milestoneFields,
              encryptionKey,
            )
            needsUpdate = true
          }

          // Encrypt steps (for routines)
          if (config.stepsField && data[config.stepsField]) {
            encryptedData[config.stepsField] = this.encryptNestedArray(
              data[config.stepsField],
              config.stepFields,
              encryptionKey,
            )
            needsUpdate = true
          }

          // Update document if needed
          if (needsUpdate) {
            if (dryRun) {
              this.logger.debug(`[DRY RUN] Would encrypt document ${doc.id} in ${collectionName}`)
            } else {
              await collectionRef.doc(doc.id).update(encryptedData)
            }
            result.encrypted++
          } else {
            result.skipped++
          }
        } catch (docError) {
          this.logger.error(
            `Error encrypting document ${doc.id} in ${collectionName}: ${docError.message}`,
          )
          result.errors++
        }
      }
    } catch (error) {
      this.logger.error(`Error migrating collection ${collectionName}`, error)
      result.errors++
    }

    return result
  }

  /**
   * Encrypt messages array (for chat sessions)
   */
  private encryptMessages(messages: any[], contentField: string, key: Buffer): any[] {
    return messages.map((msg) => {
      if (msg[contentField] && typeof msg[contentField] === 'string') {
        if (!this.encryptionService.isEncrypted(msg[contentField])) {
          return {
            ...msg,
            [contentField]: this.encryptionService.encrypt(msg[contentField], key),
          }
        }
      }
      return msg
    })
  }

  /**
   * Encrypt nested array (for milestones, steps, etc.)
   */
  private encryptNestedArray(items: any[], fieldsToEncrypt: string[], key: Buffer): any[] {
    return items.map((item) => {
      const encrypted = { ...item }
      for (const field of fieldsToEncrypt) {
        if (item[field] && typeof item[field] === 'string') {
          if (!this.encryptionService.isEncrypted(item[field])) {
            encrypted[field] = this.encryptionService.encrypt(item[field], key)
          }
        }
      }
      return encrypted
    })
  }

  /**
   * Update user profile with encryption version
   */
  async updateUserEncryptionVersion(userId: string, version: number): Promise<void> {
    try {
      const firestore = this.firebaseService.getFirestore()
      const userProfileRef = firestore.collection('user_profiles').doc(userId)

      await userProfileRef.set(
        {
          encryption_version: version,
          encryption_migrated_at: new Date(),
        },
        { merge: true },
      )

      this.logger.log(`Updated encryption version to ${version} for user ${userId}`)
    } catch (error) {
      this.logger.error(`Error updating encryption version for user ${userId}`, error)
    }
  }

  /**
   * Get user key factors from Firebase Auth
   */
  async getUserKeyFactors(userId: string): Promise<UserKeyFactors | null> {
    try {
      const firebaseUser = await this.firebaseService.getUserById(userId)

      let authProvider = 'password'
      if (firebaseUser.providerData && firebaseUser.providerData.length > 0) {
        authProvider = firebaseUser.providerData[0].providerId || 'password'
      }

      return {
        userId: firebaseUser.uid,
        createdAt: new Date(firebaseUser.metadata.creationTime),
        authProvider,
      }
    } catch (error) {
      this.logger.error(`Error getting user key factors for ${userId}`, error)
      return null
    }
  }
}

