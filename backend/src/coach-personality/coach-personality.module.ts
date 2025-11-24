import { Module } from '@nestjs/common';
import { CoachPersonalityController } from './coach-personality.controller';
import { CoachPersonalityService } from './coach-personality.service';
import { FirebaseModule } from '@/firebase/firebase.module';
import { ElevenLabsModule } from '@/elevenlabs/elevenlabs.module';

@Module({
  imports: [FirebaseModule, ElevenLabsModule],
  controllers: [CoachPersonalityController],
  providers: [CoachPersonalityService],
  exports: [CoachPersonalityService],
})
export class CoachPersonalityModule {}
