import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { EncryptionService, UserKeyFactors } from './encryption.service'

describe('EncryptionService', () => {
  let service: EncryptionService
  let configService: ConfigService

  // Valid 64-character hex string for testing
  const testMasterSecret = 'a'.repeat(64)

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SERVER_MASTER_SECRET') {
                return testMasterSecret
              }
              if (key === 'ENCRYPTION_ENABLED') {
                return 'true'
              }
              return null
            }),
          },
        },
      ],
    }).compile()

    service = module.get<EncryptionService>(EncryptionService)
    configService = module.get<ConfigService>(ConfigService)
    
    // Trigger onModuleInit
    service.onModuleInit()
  })

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    it('should be enabled when properly configured', () => {
      expect(service.isEnabled()).toBe(true)
    })

    it('should be disabled when ENCRYPTION_ENABLED is false', async () => {
      const disabledModule: TestingModule = await Test.createTestingModule({
        providers: [
          EncryptionService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'SERVER_MASTER_SECRET') {
                  return testMasterSecret
                }
                if (key === 'ENCRYPTION_ENABLED') {
                  return 'false'
                }
                return null
              }),
            },
          },
        ],
      }).compile()

      const disabledService = disabledModule.get<EncryptionService>(EncryptionService)
      disabledService.onModuleInit()
      expect(disabledService.isEnabled()).toBe(false)
    })

    it('should be disabled when SERVER_MASTER_SECRET is missing', async () => {
      const noSecretModule: TestingModule = await Test.createTestingModule({
        providers: [
          EncryptionService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'ENCRYPTION_ENABLED') {
                  return 'true'
                }
                return null
              }),
            },
          },
        ],
      }).compile()

      const noSecretService = noSecretModule.get<EncryptionService>(EncryptionService)
      noSecretService.onModuleInit()
      expect(noSecretService.isEnabled()).toBe(false)
    })
  })

  describe('deriveUserKey', () => {
    const testFactors: UserKeyFactors = {
      userId: 'user-123',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      authProvider: 'password',
    }

    it('should derive a 32-byte key', () => {
      const key = service.deriveUserKey(testFactors)
      expect(key).toBeInstanceOf(Buffer)
      expect(key.length).toBe(32) // 256 bits
    })

    it('should derive deterministic keys (same factors = same key)', () => {
      const key1 = service.deriveUserKey(testFactors)
      const key2 = service.deriveUserKey(testFactors)
      expect(key1.equals(key2)).toBe(true)
    })

    it('should derive different keys for different users', () => {
      const key1 = service.deriveUserKey(testFactors)
      const key2 = service.deriveUserKey({
        ...testFactors,
        userId: 'user-456',
      })
      expect(key1.equals(key2)).toBe(false)
    })

    it('should derive different keys for different auth providers', () => {
      const key1 = service.deriveUserKey(testFactors)
      const key2 = service.deriveUserKey({
        ...testFactors,
        authProvider: 'google.com',
      })
      expect(key1.equals(key2)).toBe(false)
    })

    it('should derive different keys for different creation times', () => {
      const key1 = service.deriveUserKey(testFactors)
      const key2 = service.deriveUserKey({
        ...testFactors,
        createdAt: new Date('2024-06-01T00:00:00Z'),
      })
      expect(key1.equals(key2)).toBe(false)
    })
  })

  describe('encrypt/decrypt', () => {
    const testFactors: UserKeyFactors = {
      userId: 'user-123',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      authProvider: 'password',
    }

    let key: Buffer

    beforeEach(() => {
      key = service.deriveUserKey(testFactors)
    })

    it('should encrypt and decrypt plaintext correctly', () => {
      const plaintext = 'Hello, World!'
      const encrypted = service.encrypt(plaintext, key)
      const decrypted = service.decrypt(encrypted, key)
      expect(decrypted).toBe(plaintext)
    })

    it('should handle empty strings', () => {
      const plaintext = ''
      const result = service.encrypt(plaintext, key)
      expect(result).toBe('')
    })

    it('should handle Unicode characters', () => {
      const plaintext = 'Hello 🔐 World! 日本語 🎉'
      const encrypted = service.encrypt(plaintext, key)
      const decrypted = service.decrypt(encrypted, key)
      expect(decrypted).toBe(plaintext)
    })

    it('should handle long text', () => {
      const plaintext = 'A'.repeat(10000)
      const encrypted = service.encrypt(plaintext, key)
      const decrypted = service.decrypt(encrypted, key)
      expect(decrypted).toBe(plaintext)
    })

    it('should produce different ciphertext for the same plaintext (random IV)', () => {
      const plaintext = 'Hello, World!'
      const encrypted1 = service.encrypt(plaintext, key)
      const encrypted2 = service.encrypt(plaintext, key)
      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should produce ciphertext with correct prefix', () => {
      const plaintext = 'Hello, World!'
      const encrypted = service.encrypt(plaintext, key)
      expect(encrypted.startsWith('enc:v1:')).toBe(true)
    })

    it('should fail to decrypt with wrong key', () => {
      const plaintext = 'Hello, World!'
      const encrypted = service.encrypt(plaintext, key)
      const wrongKey = service.deriveUserKey({
        ...testFactors,
        userId: 'wrong-user',
      })
      expect(() => service.decrypt(encrypted, wrongKey)).toThrow()
    })

    it('should return unencrypted text as-is when decrypting', () => {
      const plaintext = 'Hello, World!'
      const decrypted = service.decrypt(plaintext, key)
      expect(decrypted).toBe(plaintext)
    })
  })

  describe('isEncrypted', () => {
    it('should return true for encrypted strings', () => {
      const key = service.deriveUserKey({
        userId: 'user-123',
        createdAt: new Date(),
        authProvider: 'password',
      })
      const encrypted = service.encrypt('Hello', key)
      expect(service.isEncrypted(encrypted)).toBe(true)
    })

    it('should return false for non-encrypted strings', () => {
      expect(service.isEncrypted('Hello, World!')).toBe(false)
    })

    it('should return false for null/undefined', () => {
      expect(service.isEncrypted(null as any)).toBe(false)
      expect(service.isEncrypted(undefined as any)).toBe(false)
    })
  })

  describe('encryptFields/decryptFields', () => {
    const testFactors: UserKeyFactors = {
      userId: 'user-123',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      authProvider: 'password',
    }

    let key: Buffer

    beforeEach(() => {
      key = service.deriveUserKey(testFactors)
    })

    it('should encrypt specified fields in an object', () => {
      const obj = {
        title: 'My Journal Entry',
        content: 'This is private content',
        tags: ['tag1', 'tag2'],
        mood: 'happy',
      }

      const encrypted = service.encryptFields(obj, ['title', 'content'], key)
      
      expect(service.isEncrypted(encrypted.title)).toBe(true)
      expect(service.isEncrypted(encrypted.content)).toBe(true)
      expect(encrypted.tags).toEqual(['tag1', 'tag2']) // unchanged
      expect(encrypted.mood).toBe('happy') // unchanged
    })

    it('should decrypt specified fields in an object', () => {
      const obj = {
        title: 'My Journal Entry',
        content: 'This is private content',
        mood: 'happy',
      }

      const encrypted = service.encryptFields(obj, ['title', 'content'], key)
      const decrypted = service.decryptFields(encrypted, ['title', 'content'], key)

      expect(decrypted.title).toBe(obj.title)
      expect(decrypted.content).toBe(obj.content)
      expect(decrypted.mood).toBe(obj.mood)
    })

    it('should handle array fields', () => {
      const obj = {
        tags: ['private-tag', 'secret'],
      }

      const encrypted = service.encryptFields(obj, ['tags'], key)
      
      expect(Array.isArray(encrypted.tags)).toBe(true)
      expect(service.isEncrypted(encrypted.tags[0])).toBe(true)
      expect(service.isEncrypted(encrypted.tags[1])).toBe(true)
    })

    it('should skip null/undefined fields', () => {
      const obj = {
        title: 'Test',
        content: null,
        description: undefined,
      }

      const encrypted = service.encryptFields(obj, ['title', 'content', 'description'], key)
      
      expect(service.isEncrypted(encrypted.title)).toBe(true)
      expect(encrypted.content).toBeNull()
      expect(encrypted.description).toBeUndefined()
    })
  })

  describe('encryptMessages/decryptMessages', () => {
    const testFactors: UserKeyFactors = {
      userId: 'user-123',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      authProvider: 'password',
    }

    let key: Buffer

    beforeEach(() => {
      key = service.deriveUserKey(testFactors)
    })

    it('should encrypt message content', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello!' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
      ]

      const encrypted = service.encryptMessages(messages, 'content', key)

      expect(service.isEncrypted(encrypted[0].content)).toBe(true)
      expect(service.isEncrypted(encrypted[1].content)).toBe(true)
      expect(encrypted[0].id).toBe('1')
      expect(encrypted[0].role).toBe('user')
    })

    it('should decrypt message content', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello!' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
      ]

      const encrypted = service.encryptMessages(messages, 'content', key)
      const decrypted = service.decryptMessages(encrypted, 'content', key)

      expect(decrypted[0].content).toBe('Hello!')
      expect(decrypted[1].content).toBe('Hi there!')
    })

    it('should handle empty messages array', () => {
      const encrypted = service.encryptMessages([], 'content', key)
      expect(encrypted).toEqual([])
    })
  })

  describe('testEncryption', () => {
    it('should return success when encryption is working', async () => {
      const result = await service.testEncryption()
      expect(result.success).toBe(true)
      expect(result.message).toContain('working correctly')
    })

    it('should return failure when encryption is disabled', async () => {
      const disabledModule: TestingModule = await Test.createTestingModule({
        providers: [
          EncryptionService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'ENCRYPTION_ENABLED') {
                  return 'false'
                }
                return null
              }),
            },
          },
        ],
      }).compile()

      const disabledService = disabledModule.get<EncryptionService>(EncryptionService)
      disabledService.onModuleInit()
      
      const result = await disabledService.testEncryption()
      expect(result.success).toBe(false)
    })
  })
})



