import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EncryptionService, UserKeyFactors } from './encryption.service'

interface KeyCacheEntry {
  userId: string
  encryptionKey: Buffer
  encryptionVersion: number
  lastUsed: Date
  expiresAt: Date
}

@Injectable()
export class KeyCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(KeyCacheService.name)
  
  // In-memory cache: userId -> KeyCacheEntry
  private readonly cache = new Map<string, KeyCacheEntry>()
  
  // LRU tracking: most recently used at the end
  private readonly lruOrder: string[] = []
  
  // Configuration
  private readonly maxCacheSize: number
  private readonly ttlSeconds: number
  
  // Cleanup interval
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
  ) {
    this.maxCacheSize = parseInt(
      this.configService.get<string>('KEY_CACHE_MAX_SIZE') || '1000',
      10
    )
    this.ttlSeconds = parseInt(
      this.configService.get<string>('KEY_CACHE_TTL_SECONDS') || '432000', // 5 days
      10
    )
    
    // Start cleanup interval (every 5 minutes)
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries()
    }, 5 * 60 * 1000)

    this.logger.log(`Key cache initialized: maxSize=${this.maxCacheSize}, ttl=${this.ttlSeconds}s`)
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
    this.lruOrder.length = 0
    this.logger.log('Key cache destroyed')
  }

  /**
   * Get or derive a user's encryption key
   * Uses cache if available, otherwise derives and caches
   * 
   * @param factors User key factors for derivation
   * @param encryptionVersion Current encryption version
   * @returns The user's encryption key
   */
  getOrDeriveKey(factors: UserKeyFactors, encryptionVersion: number = 1): Buffer {
    const { userId } = factors
    const cached = this.cache.get(userId)
    
    // Check if we have a valid cached entry
    if (cached) {
      const now = new Date()
      
      // Check if expired
      if (cached.expiresAt <= now) {
        this.removeFromCache(userId)
      } 
      // Check if encryption version matches
      else if (cached.encryptionVersion !== encryptionVersion) {
        this.removeFromCache(userId)
      }
      // Valid cache hit
      else {
        this.updateLRU(userId)
        cached.lastUsed = now
        return cached.encryptionKey
      }
    }
    
    // Cache miss - derive key
    const key = this.encryptionService.deriveUserKey(factors)
    this.addToCache(userId, key, encryptionVersion)
    
    return key
  }

  /**
   * Invalidate a user's cached key
   * Call this on logout or when key needs to be re-derived
   * 
   * @param userId User ID to invalidate
   */
  invalidate(userId: string): void {
    this.removeFromCache(userId)
    this.logger.debug(`Invalidated key cache for user ${userId}`)
  }

  /**
   * Invalidate all cached keys for a specific encryption version
   * Useful during key rotation
   * 
   * @param version Encryption version to invalidate
   */
  invalidateByVersion(version: number): void {
    const usersToInvalidate: string[] = []
    
    for (const [userId, entry] of this.cache.entries()) {
      if (entry.encryptionVersion === version) {
        usersToInvalidate.push(userId)
      }
    }
    
    for (const userId of usersToInvalidate) {
      this.removeFromCache(userId)
    }
    
    this.logger.log(`Invalidated ${usersToInvalidate.length} keys for version ${version}`)
  }

  /**
   * Clear all cached keys
   */
  clearAll(): void {
    this.cache.clear()
    this.lruOrder.length = 0
    this.logger.log('All cached keys cleared')
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; ttlSeconds: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      ttlSeconds: this.ttlSeconds,
    }
  }

  private addToCache(
    userId: string,
    key: Buffer,
    encryptionVersion: number
  ): void {
    // Evict if at capacity
    while (this.cache.size >= this.maxCacheSize && this.lruOrder.length > 0) {
      const lruUserId = this.lruOrder.shift()
      if (lruUserId) {
        this.cache.delete(lruUserId)
        this.logger.debug(`Evicted LRU key for user ${lruUserId}`)
      }
    }
    
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000)
    
    this.cache.set(userId, {
      userId,
      encryptionKey: key,
      encryptionVersion,
      lastUsed: now,
      expiresAt,
    })
    
    this.lruOrder.push(userId)
  }

  private removeFromCache(userId: string): void {
    this.cache.delete(userId)
    const index = this.lruOrder.indexOf(userId)
    if (index > -1) {
      this.lruOrder.splice(index, 1)
    }
  }

  private updateLRU(userId: string): void {
    const index = this.lruOrder.indexOf(userId)
    if (index > -1) {
      this.lruOrder.splice(index, 1)
    }
    this.lruOrder.push(userId)
  }

  private cleanupExpiredEntries(): void {
    const now = new Date()
    const expiredUsers: string[] = []
    
    for (const [userId, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        expiredUsers.push(userId)
      }
    }
    
    for (const userId of expiredUsers) {
      this.removeFromCache(userId)
    }
    
    if (expiredUsers.length > 0) {
      this.logger.debug(`Cleaned up ${expiredUsers.length} expired key cache entries`)
    }
  }
}

