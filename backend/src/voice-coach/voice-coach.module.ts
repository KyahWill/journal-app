import { Module } from '@nestjs/common';
import { VoiceCoachController } from '@/voice-coach/voice-coach.controller';
import { VoiceCoachService } from '@/voice-coach/voice-coach.service';
import { ContextBuilderService } from './context-builder.service';
import { MetricsService } from './metrics.service';
import { ElevenLabsModule } from '@/elevenlabs/elevenlabs.module';
import { FirebaseModule } from '@/firebase/firebase.module';
import { GoalModule } from '@/goal/goal.module';
import { RagModule } from '@/rag/rag.module';
import { JournalModule } from '@/journal/journal.module';
import { CoachPersonalityModule } from '@/coach-personality/coach-personality.module';

@Module({
  imports: [
    ElevenLabsModule,
    FirebaseModule,
    GoalModule,
    RagModule,
    JournalModule,
    CoachPersonalityModule,
  ],
  controllers: [VoiceCoachController],
  providers: [VoiceCoachService, ContextBuilderService, MetricsService],
  exports: [VoiceCoachService, ContextBuilderService, MetricsService],
})
export class VoiceCoachModule {}
