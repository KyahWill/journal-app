import { Module, Global } from '@nestjs/common'
import { RateLimitService } from './services/rate-limit.service'
import { FirebaseModule } from '@/firebase/firebase.module'

@Global()
@Module({
  imports: [FirebaseModule],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class CommonModule {}

