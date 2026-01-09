import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { EncryptionService } from '@/common/services/encryption.service'
import { KeyCacheService } from '@/common/services/key-cache.service'
import { UserKeyFactors, RequestWithEncryption } from '@/common/types/encryption.types'

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)
  
  // Cache for user key factors (userId -> UserKeyFactors)
  private readonly userFactorsCache = new Map<string, UserKeyFactors>()
  private readonly FACTORS_CACHE_TTL = 30 * 60 * 1000 // 30 minutes
  private readonly factorsCacheTimestamps = new Map<string, number>()

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly encryptionService: EncryptionService,
    private readonly keyCacheService: KeyCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithEncryption>()
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided')
    }

    const token = authHeader.substring(7)

    try {
      // Try to verify as session cookie first (from Next.js frontend)
      let decodedToken
      try {
        decodedToken = await this.firebaseService.verifySessionCookie(token, true)
      } catch (sessionError) {
        // If session cookie verification fails, try as ID token (for backward compatibility)
        decodedToken = await this.firebaseService.verifyIdToken(token)
      }
      
      request.user = decodedToken
      
      // Derive and cache encryption key if encryption is enabled
      if (this.encryptionService.isEnabled()) {
        await this.attachEncryptionKey(request, decodedToken.uid)
      }
      
      return true
    } catch (error) {
      throw new UnauthorizedException('Invalid token')
    }
  }

  /**
   * Get user key factors and derive/cache encryption key
   */
  private async attachEncryptionKey(
    request: RequestWithEncryption,
    userId: string
  ): Promise<void> {
    try {
      // Get user key factors (with caching)
      const factors = await this.getUserKeyFactors(userId)
      
      if (factors) {
        request.userKeyFactors = factors
        
        // Get or derive the encryption key (uses key cache)
        const encryptionKey = this.keyCacheService.getOrDeriveKey(factors)
        request.encryptionKey = encryptionKey
      }
    } catch (error) {
      // Log but don't fail authentication if encryption key derivation fails
      this.logger.warn(`Failed to derive encryption key for user ${userId}: ${error.message}`)
    }
  }

  /**
   * Get user key factors from cache or Firebase Auth
   */
  private async getUserKeyFactors(userId: string): Promise<UserKeyFactors | null> {
    // Check local factors cache first
    const cached = this.userFactorsCache.get(userId)
    const cachedTime = this.factorsCacheTimestamps.get(userId) || 0
    
    if (cached && Date.now() - cachedTime < this.FACTORS_CACHE_TTL) {
      return cached
    }
    
    try {
      // Get user from Firebase Auth to get creation time and provider
      const firebaseUser = await this.firebaseService.getUserById(userId)
      
      // Extract auth provider from provider data
      let authProvider = 'password'
      if (firebaseUser.providerData && firebaseUser.providerData.length > 0) {
        authProvider = firebaseUser.providerData[0].providerId || 'password'
      }
      
      const factors: UserKeyFactors = {
        userId: firebaseUser.uid,
        createdAt: new Date(firebaseUser.metadata.creationTime),
        authProvider,
      }
      
      // Cache the factors
      this.userFactorsCache.set(userId, factors)
      this.factorsCacheTimestamps.set(userId, Date.now())
      
      return factors
    } catch (error) {
      this.logger.error(`Failed to get user key factors for ${userId}: ${error.message}`)
      return null
    }
  }
}

