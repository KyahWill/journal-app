import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

export interface UserKeyFactors {
  userId: string
  createdAt: Date
  authProvider: string
}

export interface EncryptionResult {
  ciphertext: string
  isEncrypted: boolean
}

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name)
  
  // Encryption constants
  private readonly ALGORITHM = 'aes-256-gcm'
  private readonly KEY_LENGTH = 32 // 256 bits
  private readonly IV_LENGTH = 12 // 96 bits (recommended for GCM)
  private readonly AUTH_TAG_LENGTH = 16 // 128 bits
  private readonly INFO = 'journal-app-encryption-key-v1'
  
  // Encrypted data format prefix to identify encrypted content
  private readonly ENCRYPTED_PREFIX = 'enc:v1:'
  
  private serverMasterSecret: Buffer | null = null
  private encryptionEnabled = false

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeEncryption()
  }

  private initializeEncryption(): void {
    const masterSecretHex = this.configService.get<string>('SERVER_MASTER_SECRET')
    this.encryptionEnabled = this.configService.get<string>('ENCRYPTION_ENABLED') === 'true'

    if (!this.encryptionEnabled) {
      this.logger.warn('Encryption is DISABLED. Set ENCRYPTION_ENABLED=true to enable.')
      return
    }

    if (!masterSecretHex) {
      this.logger.error('SERVER_MASTER_SECRET is not configured! Encryption will be disabled.')
      this.encryptionEnabled = false
      return
    }

    // Validate hex format (64 characters = 32 bytes = 256 bits)
    if (!/^[0-9a-fA-F]{64}$/.test(masterSecretHex)) {
      this.logger.error('SERVER_MASTER_SECRET must be a 64-character hex string (256 bits)!')
      this.encryptionEnabled = false
      return
    }

    this.serverMasterSecret = Buffer.from(masterSecretHex, 'hex')
    this.logger.log('Encryption service initialized successfully')
  }

  /**
   * Check if encryption is enabled and properly configured
   */
  isEnabled(): boolean {
    return this.encryptionEnabled && this.serverMasterSecret !== null
  }

  /**
   * Derive a unique encryption key for a user using HKDF
   * 
   * @param factors User-specific factors for key derivation
   * @returns 256-bit encryption key unique to this user
   */
  deriveUserKey(factors: UserKeyFactors): Buffer {
    if (!this.serverMasterSecret) {
      throw new Error('Encryption not initialized: SERVER_MASTER_SECRET not configured')
    }

    // Create deterministic salt from user factors
    // Format: userId|createdAt_timestamp|authProvider
    const createdAtTimestamp = factors.createdAt instanceof Date 
      ? factors.createdAt.getTime().toString()
      : new Date(factors.createdAt).getTime().toString()
    
    const salt = `${factors.userId}|${createdAtTimestamp}|${factors.authProvider}`

    // Use HKDF to derive key
    // HKDF: Extract-then-Expand using SHA-256
    const derivedKey = crypto.hkdfSync(
      'sha256',
      this.serverMasterSecret,
      Buffer.from(salt, 'utf8'),
      Buffer.from(this.INFO, 'utf8'),
      this.KEY_LENGTH
    )

    return Buffer.from(derivedKey)
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   * 
   * @param plaintext The string to encrypt
   * @param key The 256-bit encryption key
   * @returns Encrypted string in format: enc:v1:iv:authTag:ciphertext (all base64)
   */
  encrypt(plaintext: string, key: Buffer): string {
    if (!plaintext) {
      return plaintext
    }

    // Generate random IV for each encryption
    const iv = crypto.randomBytes(this.IV_LENGTH)

    // Create cipher
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, {
      authTagLength: this.AUTH_TAG_LENGTH,
    })

    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ])

    // Get authentication tag
    const authTag = cipher.getAuthTag()

    // Format: enc:v1:iv:authTag:ciphertext (base64 encoded)
    const ivBase64 = iv.toString('base64')
    const authTagBase64 = authTag.toString('base64')
    const ciphertextBase64 = encrypted.toString('base64')

    return `${this.ENCRYPTED_PREFIX}${ivBase64}:${authTagBase64}:${ciphertextBase64}`
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   * 
   * @param ciphertext The encrypted string
   * @param key The 256-bit encryption key
   * @returns Decrypted plaintext string
   */
  decrypt(ciphertext: string, key: Buffer): string {
    if (!ciphertext) {
      return ciphertext
    }

    // Check if this is encrypted data
    if (!this.isEncrypted(ciphertext)) {
      // Return as-is if not encrypted (for backwards compatibility)
      return ciphertext
    }

    // Remove prefix and parse components
    const dataWithoutPrefix = ciphertext.substring(this.ENCRYPTED_PREFIX.length)
    const parts = dataWithoutPrefix.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = Buffer.from(parts[0], 'base64')
    const authTag = Buffer.from(parts[1], 'base64')
    const encryptedData = Buffer.from(parts[2], 'base64')

    // Create decipher
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, {
      authTagLength: this.AUTH_TAG_LENGTH,
    })
    decipher.setAuthTag(authTag)

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ])

    return decrypted.toString('utf8')
  }

  /**
   * Check if a string is encrypted (has our encryption prefix)
   */
  isEncrypted(value: string): boolean {
    return typeof value === 'string' && value.startsWith(this.ENCRYPTED_PREFIX)
  }

  /**
   * Encrypt specific fields in an object
   * 
   * @param obj Object containing fields to encrypt
   * @param fields Array of field names to encrypt
   * @param key Encryption key
   * @returns New object with specified fields encrypted
   */
  encryptFields<T extends Record<string, any>>(
    obj: T,
    fields: string[],
    key: Buffer
  ): T {
    if (!this.isEnabled()) {
      return obj
    }

    const result = { ...obj } as { [key: string]: any }

    for (const field of fields) {
      if (result[field] !== undefined && result[field] !== null) {
        if (typeof result[field] === 'string') {
          // Skip if already encrypted
          if (!this.isEncrypted(result[field])) {
            result[field] = this.encrypt(result[field], key)
          }
        } else if (Array.isArray(result[field])) {
          // Handle array of strings
          result[field] = result[field].map((item: any) => {
            if (typeof item === 'string' && !this.isEncrypted(item)) {
              return this.encrypt(item, key)
            }
            return item
          })
        }
      }
    }

    return result as T
  }

  /**
   * Decrypt specific fields in an object
   * 
   * @param obj Object containing encrypted fields
   * @param fields Array of field names to decrypt
   * @param key Decryption key
   * @returns New object with specified fields decrypted
   */
  decryptFields<T extends Record<string, any>>(
    obj: T,
    fields: string[],
    key: Buffer
  ): T {
    if (!this.isEnabled()) {
      return obj
    }

    const result = { ...obj } as { [key: string]: any }

    for (const field of fields) {
      if (result[field] !== undefined && result[field] !== null) {
        if (typeof result[field] === 'string') {
          if (this.isEncrypted(result[field])) {
            try {
              result[field] = this.decrypt(result[field], key)
            } catch (error) {
              this.logger.error(`Failed to decrypt field ${field}:`, error.message)
              // Keep encrypted value on failure
            }
          }
        } else if (Array.isArray(result[field])) {
          // Handle array of strings
          result[field] = result[field].map((item: any) => {
            if (typeof item === 'string' && this.isEncrypted(item)) {
              try {
                return this.decrypt(item, key)
              } catch (error) {
                this.logger.error(`Failed to decrypt array item in ${field}:`, error.message)
                return item
              }
            }
            return item
          })
        }
      }
    }

    return result as T
  }

  /**
   * Encrypt nested message objects (for chat messages)
   * 
   * @param messages Array of message objects
   * @param contentField The field containing message content
   * @param key Encryption key
   * @returns Messages with content encrypted
   */
  encryptMessages<T extends Record<string, any>>(
    messages: T[],
    contentField: string,
    key: Buffer
  ): T[] {
    if (!this.isEnabled() || !messages) {
      return messages
    }

    return messages.map(message => {
      if (message[contentField] && typeof message[contentField] === 'string') {
        if (!this.isEncrypted(message[contentField])) {
          return {
            ...message,
            [contentField]: this.encrypt(message[contentField], key),
          }
        }
      }
      return message
    })
  }

  /**
   * Decrypt nested message objects (for chat messages)
   * 
   * @param messages Array of message objects
   * @param contentField The field containing message content
   * @param key Decryption key
   * @returns Messages with content decrypted
   */
  decryptMessages<T extends Record<string, any>>(
    messages: T[],
    contentField: string,
    key: Buffer
  ): T[] {
    if (!this.isEnabled() || !messages) {
      return messages
    }

    return messages.map(message => {
      if (message[contentField] && this.isEncrypted(message[contentField])) {
        try {
          return {
            ...message,
            [contentField]: this.decrypt(message[contentField], key),
          }
        } catch (error) {
          this.logger.error('Failed to decrypt message:', error.message)
          return message
        }
      }
      return message
    })
  }

  /**
   * Generate a test encryption to verify the service is working
   */
  async testEncryption(): Promise<{ success: boolean; message: string }> {
    if (!this.isEnabled()) {
      return { success: false, message: 'Encryption is not enabled' }
    }

    try {
      const testFactors: UserKeyFactors = {
        userId: 'test-user-id',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        authProvider: 'password',
      }

      const key = this.deriveUserKey(testFactors)
      const testPlaintext = 'Hello, encryption test! 🔐'
      
      const encrypted = this.encrypt(testPlaintext, key)
      const decrypted = this.decrypt(encrypted, key)

      if (decrypted !== testPlaintext) {
        return { success: false, message: 'Encryption roundtrip failed' }
      }

      // Verify key derivation is deterministic
      const key2 = this.deriveUserKey(testFactors)
      if (!key.equals(key2)) {
        return { success: false, message: 'Key derivation is not deterministic' }
      }

      return { success: true, message: 'Encryption service is working correctly' }
    } catch (error) {
      return { success: false, message: `Encryption test failed: ${error.message}` }
    }
  }
}

