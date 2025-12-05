import { Injectable, Logger } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import * as bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

export interface ApiKey {
  id: string
  user_id: string
  key_hash: string
  key_prefix: string // First 8 characters for identification
  name: string
  created_at: Date
  last_used_at: Date | null
  is_active: boolean
}

export interface ApiKeyCreateResult {
  id: string
  key: string // Only returned once at creation time
  key_prefix: string
  name: string
  created_at: Date
}

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name)
  private readonly collectionName = 'api_keys'
  private readonly saltRounds = 10

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Generate a new API key for a user
   */
  async createApiKey(userId: string, name: string): Promise<ApiKeyCreateResult> {
    // Generate a secure random key
    const rawKey = `jrnl_${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '').substring(0, 16)}`
    const keyPrefix = rawKey.substring(0, 12)
    const keyHash = await bcrypt.hash(rawKey, this.saltRounds)

    const now = new Date()
    const data = {
      user_id: userId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name: name,
      created_at: now,
      last_used_at: null,
      is_active: true,
    }

    const result = await this.firebaseService.addDocument(this.collectionName, data)

    this.logger.log(`API key created for user: ${userId}, name: ${name}`)

    return {
      id: result.id,
      key: rawKey, // Only returned once!
      key_prefix: keyPrefix,
      name: name,
      created_at: now,
    }
  }

  /**
   * Validate an API key and return the associated user data
   */
  async validateApiKey(key: string): Promise<{ user_id: string; key_id: string } | null> {
    if (!key || !key.startsWith('jrnl_')) {
      return null
    }

    const keyPrefix = key.substring(0, 12)

    // Find keys with matching prefix
    const keys = await this.firebaseService.getCollection(
      this.collectionName,
      [
        { field: 'key_prefix', operator: '==', value: keyPrefix },
        { field: 'is_active', operator: '==', value: true },
      ],
    )

    // Check each key's hash
    for (const keyDoc of keys) {
      const isMatch = await bcrypt.compare(key, keyDoc.key_hash)
      if (isMatch) {
        // Update last_used_at
        await this.firebaseService.updateDocument(this.collectionName, keyDoc.id, {
          last_used_at: new Date(),
        })

        return {
          user_id: keyDoc.user_id,
          key_id: keyDoc.id,
        }
      }
    }

    return null
  }

  /**
   * Get all API keys for a user (without the actual key values)
   */
  async getUserApiKeys(userId: string): Promise<Omit<ApiKey, 'key_hash'>[]> {
    const keys = await this.firebaseService.getCollection(
      this.collectionName,
      [{ field: 'user_id', operator: '==', value: userId }],
      'created_at',
      'desc',
    )

    return keys.map((key) => ({
      id: key.id,
      user_id: key.user_id,
      key_prefix: key.key_prefix,
      name: key.name,
      created_at: key.created_at?.toDate() || new Date(),
      last_used_at: key.last_used_at?.toDate() || null,
      is_active: key.is_active,
    }))
  }

  /**
   * Revoke (deactivate) an API key
   */
  async revokeApiKey(userId: string, keyId: string): Promise<boolean> {
    // Verify ownership
    const key = await this.firebaseService.getDocument(this.collectionName, keyId)
    if (!key || key.user_id !== userId) {
      return false
    }

    await this.firebaseService.updateDocument(this.collectionName, keyId, {
      is_active: false,
    })

    this.logger.log(`API key revoked: ${keyId} for user: ${userId}`)
    return true
  }

  /**
   * Delete an API key permanently
   */
  async deleteApiKey(userId: string, keyId: string): Promise<boolean> {
    // Verify ownership
    const key = await this.firebaseService.getDocument(this.collectionName, keyId)
    if (!key || key.user_id !== userId) {
      return false
    }

    await this.firebaseService.deleteDocument(this.collectionName, keyId)

    this.logger.log(`API key deleted: ${keyId} for user: ${userId}`)
    return true
  }

  /**
   * Rename an API key
   */
  async renameApiKey(userId: string, keyId: string, newName: string): Promise<boolean> {
    // Verify ownership
    const key = await this.firebaseService.getDocument(this.collectionName, keyId)
    if (!key || key.user_id !== userId) {
      return false
    }

    await this.firebaseService.updateDocument(this.collectionName, keyId, {
      name: newName,
    })

    this.logger.log(`API key renamed: ${keyId} to "${newName}" for user: ${userId}`)
    return true
  }
}

