import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { KeyCacheService } from './key-cache.service'
import { EncryptionService, UserKeyFactors } from './encryption.service'

describe('KeyCacheService', () => {
  let service: KeyCacheService
  let encryptionService: EncryptionService

  // Valid 64-character hex string for testing
  const testMasterSecret = 'a'.repeat(64)
  
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SERVER_MASTER_SECRET') return testMasterSecret
      if (key === 'ENCRYPTION_ENABLED') return 'true'
      if (key === 'KEY_CACHE_MAX_SIZE') return '100'
      if (key === 'KEY_CACHE_TTL_SECONDS') return '3600' // 1 hour for tests
      return null
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyCacheService,
        EncryptionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<KeyCacheService>(KeyCacheService)
    encryptionService = module.get<EncryptionService>(EncryptionService)
    
    // Initialize encryption service
    encryptionService.onModuleInit()
  })

  afterEach(async () => {
    // Clear the cache and cleanup
    service.clearAll()
    service.onModuleDestroy()
  })

  const testFactors: UserKeyFactors = {
    userId: 'user-123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    authProvider: 'password',
  }

  describe('getOrDeriveKey', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    it('should derive and cache a key', () => {
      const key = service.getOrDeriveKey(testFactors)
      
      expect(key).toBeDefined()
      expect(key).toBeInstanceOf(Buffer)
      expect(key.length).toBe(32)
      
      const stats = service.getStats()
      expect(stats.size).toBe(1)
    })

    it('should return same key from cache on subsequent calls', () => {
      const key1 = service.getOrDeriveKey(testFactors)
      const key2 = service.getOrDeriveKey(testFactors)
      
      expect(key1.equals(key2)).toBe(true)
    })

    it('should derive different keys for different users', () => {
      const key1 = service.getOrDeriveKey(testFactors)
      const key2 = service.getOrDeriveKey({
        ...testFactors,
        userId: 'user-456',
      })
      
      expect(key1.equals(key2)).toBe(false)
    })

    it('should store separate keys for different users', () => {
      service.getOrDeriveKey(testFactors)
      service.getOrDeriveKey({ ...testFactors, userId: 'user-456' })
      service.getOrDeriveKey({ ...testFactors, userId: 'user-789' })
      
      const stats = service.getStats()
      expect(stats.size).toBe(3)
    })
  })

  describe('invalidate', () => {
    it('should remove a cached key', () => {
      service.getOrDeriveKey(testFactors)
      expect(service.getStats().size).toBe(1)
      
      service.invalidate(testFactors.userId)
      expect(service.getStats().size).toBe(0)
    })

    it('should not throw when invalidating non-existent key', () => {
      expect(() => service.invalidate('non-existent-user')).not.toThrow()
    })
  })

  describe('invalidateByVersion', () => {
    it('should invalidate all keys with specific version', () => {
      // Add keys with version 1
      service.getOrDeriveKey(testFactors, 1)
      service.getOrDeriveKey({ ...testFactors, userId: 'user-2' }, 1)
      service.getOrDeriveKey({ ...testFactors, userId: 'user-3' }, 2)
      
      expect(service.getStats().size).toBe(3)
      
      service.invalidateByVersion(1)
      
      expect(service.getStats().size).toBe(1)
    })
  })

  describe('clearAll', () => {
    it('should remove all cached keys', () => {
      service.getOrDeriveKey(testFactors)
      service.getOrDeriveKey({ ...testFactors, userId: 'user-2' })
      service.getOrDeriveKey({ ...testFactors, userId: 'user-3' })
      
      expect(service.getStats().size).toBe(3)
      
      service.clearAll()
      
      expect(service.getStats().size).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should return correct stats for empty cache', () => {
      const stats = service.getStats()
      expect(stats.size).toBe(0)
      expect(stats.maxSize).toBe(100)
      expect(stats.ttlSeconds).toBe(3600)
    })

    it('should return correct count of cached keys', () => {
      service.getOrDeriveKey(testFactors)
      expect(service.getStats().size).toBe(1)
      
      service.getOrDeriveKey({ ...testFactors, userId: 'user-2' })
      expect(service.getStats().size).toBe(2)
    })
  })

  describe('LRU eviction', () => {
    it('should evict LRU entries when cache is full', async () => {
      // Create module with very small cache
      const smallCacheModule: TestingModule = await Test.createTestingModule({
        providers: [
          KeyCacheService,
          EncryptionService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'SERVER_MASTER_SECRET') return testMasterSecret
                if (key === 'ENCRYPTION_ENABLED') return 'true'
                if (key === 'KEY_CACHE_MAX_SIZE') return '3'
                if (key === 'KEY_CACHE_TTL_SECONDS') return '3600'
                return null
              }),
            },
          },
        ],
      }).compile()

      const smallCacheService = smallCacheModule.get<KeyCacheService>(KeyCacheService)
      const smallEncryptionService = smallCacheModule.get<EncryptionService>(EncryptionService)
      smallEncryptionService.onModuleInit()

      // Fill the cache
      smallCacheService.getOrDeriveKey({ ...testFactors, userId: 'user-1' })
      smallCacheService.getOrDeriveKey({ ...testFactors, userId: 'user-2' })
      smallCacheService.getOrDeriveKey({ ...testFactors, userId: 'user-3' })
      
      expect(smallCacheService.getStats().size).toBe(3)
      
      // Add one more - should evict user-1 (LRU)
      smallCacheService.getOrDeriveKey({ ...testFactors, userId: 'user-4' })
      
      expect(smallCacheService.getStats().size).toBe(3)
      
      // Cleanup
      smallCacheService.clearAll()
      smallCacheService.onModuleDestroy()
    })
  })
})
