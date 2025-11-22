import { Module } from '@nestjs/common'
import { ElevenLabsService } from './elevenlabs.service'
import { ElevenLabsController } from './elevenlabs.controller'
import { FirebaseModule } from '@/firebase/firebase.module'

@Module({
  imports: [FirebaseModule],
  controllers: [ElevenLabsController],
  providers: [ElevenLabsService],
  exports: [ElevenLabsService],
})
export class ElevenLabsModule {}

