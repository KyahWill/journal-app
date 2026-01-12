import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FirebaseService } from '@/firebase/firebase.service'
import { EncryptionService, UserKeyFactors } from './encryption.service'
import { KeyCacheService } from './key-cache.service'
import * as crypto from 'crypto'

export interface KeyRotationProgress {
  total: number
  completed: number
  failed: number
  inProgress: boolean
  startedAt?: Date
  completedAt?: Date
}

export interface KeyRotationResult {
  userId: string
  success: boolean
  documentsRotated: number
  errors: string[]
  duration: number
}

@Injectable()
export class KeyRotationService {
  private readonly logger = new Logger(KeyRotationService.name)
  
  // Collection configurations (same as migration service)
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

  // Track rotation progress
  private rotationProgress: KeyRotationProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: false,
  }

  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService,
    private readonly encryptionService: EncryptionService,
    private readonly keyCacheService: KeyCacheService,
  ) {}

  /**
   * Get the current rotation progress
   */
  getRotationProgress(): KeyRotationProgress {
    return { ...this.rotationProgress }
  }

  /**
   * Derive encryption key for old version
   * This requires the old SERVER_MASTER_SECRET to be available
   */
  private deriveOldKey(
    oldSecret: Buffer,
    factors: UserKeyFactors,
  ): Buffer {
    const createdAtTimestamp = factors.createdAt instanceof Date
      ? factors.createdAt.getTime().toString()
      : new Date(factors.createdAt).getTime().toString()
    
    const salt = `${factors.userId}|${createdAtTimestamp}|${factors.authProvider}`

    return Buffer.from(crypto.hkdfSync(
      'sha256',
      oldSecret,
      Buffer.from(salt, 'utf8'),
      Buffer.from('journal-app-encryption-key-v1', 'utf8'),
      32
    ))
  }

  /**
   * Rotate encryption key for a single user
   * Decrypts with old key and re-encrypts with new key
   */
  async rotateUserKey(
    userId: string,
    oldSecretHex: string,
    newVersion: number,
    dryRun: boolean = false,
  ): Promise<KeyRotationResult> {
    const startTime = Date.now()
    const result: KeyRotationResult = {
      userId,
      success: false,
      documentsRotated: 0,
      errors: [],
      duration: 0,
    }

    try {
      // Get user key factors
      const firebaseUser = await this.firebaseService.getUserById(userId)
      let authProvider = 'password'
      if (firebaseUser.providerData && firebaseUser.providerData.length > 0) {
        authProvider = firebaseUser.providerData[0].providerId || 'password'
      }

      const factors: UserKeyFactors = {
        userId: firebaseUser.uid,
        createdAt: new Date(firebaseUser.metadata.creationTime),
        authProvider,
      }

      // Derive old and new keys
      const oldSecret = Buffer.from(oldSecretHex, 'hex')
      const oldKey = this.deriveOldKey(oldSecret, factors)
      const newKey = this.encryptionService.deriveUserKey(factors)

      // Rotate each collection
      for (const [collectionName, config] of Object.entries(this.collections)) {
        try {
          const rotated = await this.rotateCollection(
            userId,
            collectionName,
            config,
            oldKey,
            newKey,
            dryRun,
          )
          result.documentsRotated += rotated
        } catch (error) {
          result.errors.push(`${collectionName}: ${error.message}`)
        }
      }

      // Update user's encryption version
      if (!dryRun && result.documentsRotated > 0) {
        await this.updateUserEncryptionVersion(userId, newVersion)
      }

      // Invalidate cached key for this user
      this.keyCacheService.invalidate(userId)

      result.success = result.errors.length === 0
    } catch (error) {
      result.errors.push(`General error: ${error.message}`)
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * Rotate all documents in a collection for a user
   */
  private async rotateCollection(
    userId: string,
    collectionName: string,
    config: any,
    oldKey: Buffer,
    newKey: Buffer,
    dryRun: boolean,
  ): Promise<number> {
    let rotatedCount = 0

    const firestore = this.firebaseService.getFirestore()
    const collectionRef = firestore.collection(collectionName)

    // Get all documents for this user
    const snapshot = await collectionRef.where('user_id', '==', userId).get()

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data()
        const rotatedData: any = {}
        let needsUpdate = false

        // Rotate simple string fields
        if (config.fields) {
          for (const field of config.fields) {
            if (data[field] && this.encryptionService.isEncrypted(data[field])) {
              // Decrypt with old key, encrypt with new key
              const decrypted = this.decryptWithKey(data[field], oldKey)
              rotatedData[field] = this.encryptWithKey(decrypted, newKey)
              needsUpdate = true
            }
          }
        }

        // Rotate array fields
        if (config.arrayFields) {
          for (const field of config.arrayFields) {
            if (Array.isArray(data[field])) {
              rotatedData[field] = data[field].map((item: any) => {
                if (typeof item === 'string' && this.encryptionService.isEncrypted(item)) {
                  const decrypted = this.decryptWithKey(item, oldKey)
                  return this.encryptWithKey(decrypted, newKey)
                }
                return item
              })
              needsUpdate = true
            }
          }
        }

        // Rotate messages
        if (config.messageField && data[config.messageField]) {
          rotatedData[config.messageField] = this.rotateMessages(
            data[config.messageField],
            config.messageContentField,
            oldKey,
            newKey,
          )
          needsUpdate = true
        }

        // Rotate milestones
        if (config.milestonesField && data[config.milestonesField]) {
          rotatedData[config.milestonesField] = this.rotateNestedArray(
            data[config.milestonesField],
            config.milestoneFields,
            oldKey,
            newKey,
          )
          needsUpdate = true
        }

        // Rotate steps
        if (config.stepsField && data[config.stepsField]) {
          rotatedData[config.stepsField] = this.rotateNestedArray(
            data[config.stepsField],
            config.stepFields,
            oldKey,
            newKey,
          )
          needsUpdate = true
        }

        // Update document if needed
        if (needsUpdate) {
          if (!dryRun) {
            await collectionRef.doc(doc.id).update(rotatedData)
          }
          rotatedCount++
        }
      } catch (docError) {
        this.logger.error(
          `Error rotating document ${doc.id} in ${collectionName}: ${docError.message}`,
        )
      }
    }

    return rotatedCount
  }

  /**
   * Decrypt with a specific key
   */
  private decryptWithKey(ciphertext: string, key: Buffer): string {
    const ENCRYPTED_PREFIX = 'enc:v1:'
    
    if (!ciphertext.startsWith(ENCRYPTED_PREFIX)) {
      return ciphertext
    }

    const dataWithoutPrefix = ciphertext.substring(ENCRYPTED_PREFIX.length)
    const parts = dataWithoutPrefix.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = Buffer.from(parts[0], 'base64')
    const authTag = Buffer.from(parts[1], 'base64')
    const encryptedData = Buffer.from(parts[2], 'base64')

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv, {
      authTagLength: 16,
    })
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ])

    return decrypted.toString('utf8')
  }

  /**
   * Encrypt with a specific key
   */
  private encryptWithKey(plaintext: string, key: Buffer): string {
    const ENCRYPTED_PREFIX = 'enc:v1:'
    const iv = crypto.randomBytes(12)

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, {
      authTagLength: 16,
    })

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ])

    const authTag = cipher.getAuthTag()

    const ivBase64 = iv.toString('base64')
    const authTagBase64 = authTag.toString('base64')
    const ciphertextBase64 = encrypted.toString('base64')

    return `${ENCRYPTED_PREFIX}${ivBase64}:${authTagBase64}:${ciphertextBase64}`
  }

  /**
   * Rotate messages array
   */
  private rotateMessages(
    messages: any[],
    contentField: string,
    oldKey: Buffer,
    newKey: Buffer,
  ): any[] {
    return messages.map((msg) => {
      if (msg[contentField] && this.encryptionService.isEncrypted(msg[contentField])) {
        const decrypted = this.decryptWithKey(msg[contentField], oldKey)
        return {
          ...msg,
          [contentField]: this.encryptWithKey(decrypted, newKey),
        }
      }
      return msg
    })
  }

  /**
   * Rotate nested array (milestones, steps, etc.)
   */
  private rotateNestedArray(
    items: any[],
    fieldsToRotate: string[],
    oldKey: Buffer,
    newKey: Buffer,
  ): any[] {
    return items.map((item) => {
      const rotated = { ...item }
      for (const field of fieldsToRotate) {
        if (item[field] && this.encryptionService.isEncrypted(item[field])) {
          const decrypted = this.decryptWithKey(item[field], oldKey)
          rotated[field] = this.encryptWithKey(decrypted, newKey)
        }
      }
      return rotated
    })
  }

  /**
   * Update user's encryption version in profile
   */
  private async updateUserEncryptionVersion(userId: string, version: number): Promise<void> {
    try {
      const firestore = this.firebaseService.getFirestore()
      const userProfileRef = firestore.collection('user_profiles').doc(userId)

      await userProfileRef.set(
        {
          encryption_version: version,
          encryption_rotated_at: new Date(),
        },
        { merge: true },
      )

      this.logger.log(`Updated encryption version to ${version} for user ${userId}`)
    } catch (error) {
      this.logger.error(`Error updating encryption version for user ${userId}`, error)
    }
  }

  /**
   * Batch rotate keys for multiple users
   */
  async batchRotateUsers(
    userIds: string[],
    oldSecretHex: string,
    newVersion: number,
    dryRun: boolean = false,
  ): Promise<KeyRotationResult[]> {
    this.rotationProgress = {
      total: userIds.length,
      completed: 0,
      failed: 0,
      inProgress: true,
      startedAt: new Date(),
    }

    const results: KeyRotationResult[] = []

    for (const userId of userIds) {
      const result = await this.rotateUserKey(userId, oldSecretHex, newVersion, dryRun)
      results.push(result)

      if (result.success) {
        this.rotationProgress.completed++
      } else {
        this.rotationProgress.failed++
      }

      this.logger.log(
        `Key rotation progress: ${this.rotationProgress.completed + this.rotationProgress.failed}/${this.rotationProgress.total}`,
      )
    }

    this.rotationProgress.inProgress = false
    this.rotationProgress.completedAt = new Date()

    return results
  }

  /**
   * Get all user IDs that have encrypted data
   */
  async getUsersWithEncryptedData(): Promise<string[]> {
    const userIds = new Set<string>()

    try {
      const firestore = this.firebaseService.getFirestore()

      // Get users from user_profiles with encryption_version
      const profilesSnapshot = await firestore
        .collection('user_profiles')
        .where('encryption_version', '>=', 1)
        .get()

      profilesSnapshot.docs.forEach((doc) => {
        userIds.add(doc.id)
      })
    } catch (error) {
      this.logger.error('Error getting users with encrypted data', error)
    }

    return Array.from(userIds)
  }
}



