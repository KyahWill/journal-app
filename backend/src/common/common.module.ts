import { Module, Global } from '@nestjs/common'
import { RateLimitService } from './services/rate-limit.service'
import { EncryptionService } from './services/encryption.service'
import { KeyCacheService } from './services/key-cache.service'
import { EncryptionMigrationService } from './services/encryption-migration.service'
import { KeyRotationService } from './services/key-rotation.service'
import { FirebaseModule } from '@/firebase/firebase.module'

@Global()
@Module({
  imports: [FirebaseModule],
  providers: [RateLimitService, EncryptionService, KeyCacheService, EncryptionMigrationService, KeyRotationService],
  exports: [RateLimitService, EncryptionService, KeyCacheService, EncryptionMigrationService, KeyRotationService],
})
export class CommonModule {}

