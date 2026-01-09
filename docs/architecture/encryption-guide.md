# Encryption Guide

**Complete guide to data encryption at rest for user data**

---

**Last Updated**: January 2026  
**Status**: Current

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Key Derivation](#key-derivation)
4. [Encryption Algorithm](#encryption-algorithm)
5. [What Gets Encrypted](#what-gets-encrypted)
6. [Implementation Details](#implementation-details)
7. [Migration](#migration)
8. [Key Rotation](#key-rotation)
9. [Environment Setup](#environment-setup)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Journal application implements **server-side encryption at rest** using AES-256-GCM with deterministic key derivation. This ensures that sensitive user data is encrypted before being stored in Firestore and can only be decrypted by authenticated users.

### Key Principles

- **Deterministic Key Derivation**: User encryption keys are derived using HKDF-SHA256 from a server master secret combined with user-specific factors
- **No Stored Keys**: User encryption keys are never stored in the database
- **Uniform Approach**: Same encryption method for all authentication types (password, Google OAuth)
- **Transparent Encryption**: Application code automatically encrypts/decrypts data through interceptors

### What This Protects Against

- Database breaches: Encrypted data is unreadable without the master secret
- Insider threats: Database administrators cannot read user content
- Data exposure: Even if Firestore data is leaked, content remains encrypted

### Limitations

- **Server-side encryption only**: The server has access to decrypted data during processing
- **Master secret dependency**: Loss of the master secret means loss of all data
- **Performance overhead**: Encryption/decryption adds computational cost

---

## Architecture

### Encryption Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Request                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Authentication Guard                         │
│  1. Verify Firebase token                                   │
│  2. Retrieve user factors (uid, createdAt, authProvider)    │
│  3. Derive encryption key from factors + master secret      │
│  4. Attach key to request context                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Key Cache Service                           │
│  - Cache derived keys with TTL (5 days)                     │
│  - LRU eviction for memory management                       │
│  - Invalidation on logout/key rotation                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Service Layer                                │
│  - Encrypt sensitive fields before save                      │
│  - Decrypt fields after retrieval                           │
│  - Pass key to RAG for embedding generation                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Firestore (Encrypted Data)                      │
│  - Encrypted content prefixed with "enc:v1:"                │
│  - IV + AuthTag + Ciphertext stored together                │
└─────────────────────────────────────────────────────────────┘
```

### Key Derivation Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ SERVER_MASTER_  │    │   User Factors  │    │     HKDF        │
│    SECRET       │───▶│ - userId        │───▶│   SHA-256       │
│  (256 bits)     │    │ - createdAt     │    │                 │
│                 │    │ - authProvider  │    │                 │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  User-Specific  │
                                              │    DEK          │
                                              │   (256 bits)    │
                                              └─────────────────┘
```

---

## Key Derivation

### Algorithm: HKDF-SHA256

The user's Data Encryption Key (DEK) is derived using HKDF (HMAC-based Key Derivation Function):

```typescript
const derivedKey = crypto.hkdfSync(
  'sha256',                              // Hash algorithm
  serverMasterSecret,                    // Input keying material (IKM)
  salt,                                  // Salt (user factors)
  'journal-app-encryption-key-v1',       // Info string (context)
  32                                     // Output length (256 bits)
)
```

### User Factors

The salt is composed of stable user-specific factors:

```typescript
const salt = `${userId}|${createdAt.getTime()}|${authProvider}`
```

| Factor | Source | Example |
|--------|--------|---------|
| `userId` | Firebase Auth UID | `abc123xyz` |
| `createdAt` | User creation timestamp | `1704067200000` |
| `authProvider` | First provider ID | `password`, `google.com` |

### Why These Factors?

- **userId**: Unique per user, ensures different keys for each user
- **createdAt**: Immutable timestamp, prevents key regeneration attacks
- **authProvider**: Distinguishes authentication method, adds entropy

---

## Encryption Algorithm

### AES-256-GCM

- **Algorithm**: AES (Advanced Encryption Standard)
- **Key Size**: 256 bits (32 bytes)
- **Mode**: GCM (Galois/Counter Mode)
- **IV Size**: 96 bits (12 bytes)
- **Auth Tag Size**: 128 bits (16 bytes)

### Encrypted Data Format

```
enc:v1:<IV>:<AuthTag>:<Ciphertext>
```

| Component | Encoding | Purpose |
|-----------|----------|---------|
| `enc:v1:` | Literal | Version prefix for identification |
| `IV` | Base64 | Initialization vector (random per encryption) |
| `AuthTag` | Base64 | Authentication tag (integrity check) |
| `Ciphertext` | Base64 | Encrypted data |

### Example Encrypted Value

```
enc:v1:ABC123def456:XYZ789auth:encrypteddatahere==
```

---

## What Gets Encrypted

### Journal Entries

| Field | Encrypted |
|-------|-----------|
| `title` | ✅ Yes |
| `content` | ✅ Yes |
| `tags` | ❌ No (for filtering) |
| `mood` | ❌ No (for analytics) |
| `user_id` | ❌ No (for ownership) |
| `created_at` | ❌ No (for sorting) |

### Chat Sessions

| Field | Encrypted |
|-------|-----------|
| `title` | ✅ Yes |
| `messages[].content` | ✅ Yes |
| `messages[].role` | ❌ No |
| `messages[].timestamp` | ❌ No |
| `user_id` | ❌ No |

### Goals

| Field | Encrypted |
|-------|-----------|
| `title` | ✅ Yes |
| `description` | ✅ Yes |
| `milestones[].title` | ✅ Yes |
| `milestones[].description` | ✅ Yes |
| `status` | ❌ No (for filtering) |
| `category` | ❌ No (for filtering) |

### Routines

| Field | Encrypted |
|-------|-----------|
| `title` | ✅ Yes |
| `description` | ✅ Yes |
| `steps[].title` | ✅ Yes |
| `frequency` | ❌ No |
| `streak` | ❌ No |

### Custom Categories

| Field | Encrypted |
|-------|-----------|
| `name` | ✅ Yes |
| `color` | ❌ No |
| `icon` | ❌ No |

### RAG Embeddings

RAG embeddings are **not encrypted** because:
1. Vector search requires plaintext embeddings
2. Text snippets are needed for context retrieval
3. Embeddings themselves don't reveal sensitive data directly

However, the original content is encrypted before embedding generation, and the embedding process uses the decrypted content.

---

## Implementation Details

### Encryption Service

```typescript
// backend/src/common/services/encryption.service.ts

@Injectable()
export class EncryptionService {
  private readonly ALGORITHM = 'aes-256-gcm'
  private readonly KEY_LENGTH = 32
  private readonly IV_LENGTH = 12
  
  deriveUserKey(factors: UserKeyFactors): Buffer {
    const salt = `${factors.userId}|${factors.createdAt.getTime()}|${factors.authProvider}`
    
    return Buffer.from(crypto.hkdfSync(
      'sha256',
      this.serverMasterSecret,
      Buffer.from(salt, 'utf8'),
      Buffer.from('journal-app-encryption-key-v1', 'utf8'),
      this.KEY_LENGTH
    ))
  }
  
  encrypt(plaintext: string, key: Buffer): string {
    const iv = crypto.randomBytes(this.IV_LENGTH)
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, {
      authTagLength: 16,
    })
    
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ])
    
    const authTag = cipher.getAuthTag()
    
    return `enc:v1:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
  }
  
  decrypt(ciphertext: string, key: Buffer): string {
    if (!this.isEncrypted(ciphertext)) {
      return ciphertext // Return as-is for backwards compatibility
    }
    
    const parts = ciphertext.substring(7).split(':')
    const iv = Buffer.from(parts[0], 'base64')
    const authTag = Buffer.from(parts[1], 'base64')
    const encryptedData = Buffer.from(parts[2], 'base64')
    
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, {
      authTagLength: 16,
    })
    decipher.setAuthTag(authTag)
    
    return Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]).toString('utf8')
  }
  
  isEncrypted(value: string): boolean {
    return typeof value === 'string' && value.startsWith('enc:v1:')
  }
}
```

### Key Cache Service

```typescript
// backend/src/common/services/key-cache.service.ts

@Injectable()
export class KeyCacheService {
  private readonly cache = new Map<string, KeyCacheEntry>()
  private readonly maxCacheSize = 1000
  private readonly ttlSeconds = 432000 // 5 days
  
  getOrDeriveKey(factors: UserKeyFactors, version: number = 1): Buffer {
    const cached = this.cache.get(factors.userId)
    
    if (cached && cached.expiresAt > new Date() && cached.version === version) {
      this.updateLRU(factors.userId)
      return cached.encryptionKey
    }
    
    const key = this.encryptionService.deriveUserKey(factors)
    this.addToCache(factors.userId, key, version)
    return key
  }
  
  invalidate(userId: string): void {
    this.cache.delete(userId)
  }
}
```

### Auth Guard Integration

```typescript
// backend/src/common/guards/auth.guard.ts

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    
    // ... token verification ...
    
    // Get user factors for key derivation
    const userRecord = await this.firebaseService.getUserById(decodedToken.uid)
    
    const keyFactors: UserKeyFactors = {
      userId: decodedToken.uid,
      createdAt: new Date(userRecord.metadata.creationTime),
      authProvider: userRecord.providerData?.[0]?.providerId || 'password',
    }
    
    // Derive or get cached key
    const encryptionKey = this.keyCacheService.getOrDeriveKey(keyFactors)
    
    // Attach to request
    request.user = { ...decodedToken, keyFactors, encryptionKey }
    
    return true
  }
}
```

---

## Migration

### Encrypting Existing Data

Use the CLI to encrypt existing unencrypted data:

```bash
# Check what needs to be encrypted (dry run)
npm run cli migrate:encrypt-data --stats
npm run cli migrate:encrypt-data --userId=<user-id> --stats

# Perform dry run to verify
npm run cli migrate:encrypt-data --all --dry-run
npm run cli migrate:encrypt-data --userId=<user-id> --dry-run

# Execute encryption
npm run cli migrate:encrypt-data --all
npm run cli migrate:encrypt-data --userId=<user-id>
```

### Migration Process

1. **Read document** from Firestore
2. **Check if already encrypted** (look for `enc:v1:` prefix)
3. **Skip if encrypted**, encrypt if not
4. **Write encrypted data** back to Firestore
5. **Update user profile** with encryption version

### Important Notes

- Always create a **backup** before migration
- Run `--dry-run` first to verify scope
- Migration is **idempotent** (safe to run multiple times)
- Already encrypted data is automatically skipped

---

## Key Rotation

### When to Rotate

- Suspected compromise of master secret
- Regular security policy (annually)
- Employee offboarding
- Security audit requirement

### Rotation Process

1. **Generate new master secret**:
   ```bash
   openssl rand -hex 32
   ```

2. **Update environment** with NEW secret:
   ```bash
   export SERVER_MASTER_SECRET=<new-hex-secret>
   ```

3. **Run rotation command** with OLD secret:
   ```bash
   npm run cli rotate-keys --old-secret=<old-hex-secret> --all --dry-run
   npm run cli rotate-keys --old-secret=<old-hex-secret> --all
   ```

4. **Verify rotation** was successful

5. **Destroy old secret** securely

### Rotation Command

```bash
# Dry run first
npm run cli rotate-keys --old-secret=abc123...def --all --dry-run

# Rotate single user
npm run cli rotate-keys --old-secret=abc123...def --userId=<user-id>

# Rotate all users
npm run cli rotate-keys --old-secret=abc123...def --all
```

---

## Environment Setup

### Required Environment Variables

```bash
# Enable encryption (required)
ENCRYPTION_ENABLED=true

# 256-bit master secret as hex (required)
# Generate with: openssl rand -hex 32
SERVER_MASTER_SECRET=<64-character-hex-string>

# Optional: Key cache settings
KEY_CACHE_MAX_SIZE=1000        # Maximum cached keys
KEY_CACHE_TTL_SECONDS=432000   # 5 days TTL
```

### Generating a Master Secret

```bash
# Linux/macOS
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Secret Management Best Practices

1. **Never commit** the master secret to version control
2. **Use a secrets manager** (Google Secret Manager, AWS Secrets Manager)
3. **Rotate regularly** (at least annually)
4. **Backup securely** (encrypted backup of the secret)
5. **Limit access** to production secrets

---

## Troubleshooting

### Common Issues

#### "Encryption is not enabled"

**Cause**: `ENCRYPTION_ENABLED` is not set to `true`

**Solution**:
```bash
export ENCRYPTION_ENABLED=true
```

#### "SERVER_MASTER_SECRET is not configured"

**Cause**: Missing or invalid master secret

**Solution**:
1. Generate a secret: `openssl rand -hex 32`
2. Set the environment variable: `export SERVER_MASTER_SECRET=<secret>`
3. Verify it's exactly 64 hex characters

#### "Invalid encrypted data format"

**Cause**: Corrupted encrypted data or wrong key

**Solution**:
1. Verify the data starts with `enc:v1:`
2. Check that the master secret hasn't changed
3. Check user factors match (userId, createdAt, authProvider)

#### "Authentication tag mismatch"

**Cause**: Data was encrypted with a different key

**Solution**:
1. Verify master secret is correct
2. Check if key rotation was performed without updating the secret
3. Check user's `authProvider` hasn't changed

#### Performance Issues

**Cause**: Key derivation is expensive

**Solution**:
1. Ensure key caching is enabled
2. Increase `KEY_CACHE_MAX_SIZE` if needed
3. Increase `KEY_CACHE_TTL_SECONDS` for longer sessions

### Debugging

Enable debug logging:

```typescript
// In your .env or environment
LOG_LEVEL=debug
```

View encryption operations:
```
[EncryptionService] Deriving key for user abc123
[KeyCacheService] Cache hit for user abc123
[EncryptionService] Encrypted field 'title' for journal entry xyz789
```

---

## Related Documentation

- **[Security Architecture](security-architecture.md)** - Complete security overview
- **[Backend Architecture](backend-architecture.md)** - Backend details
- **[Data Models](data-models.md)** - Database schema

---

**Last Updated**: January 2026  
**Status**: Current

