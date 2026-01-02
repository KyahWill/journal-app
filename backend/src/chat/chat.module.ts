import { Module, forwardRef } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { CoachPersonalityService } from './coach-personality.service'
import { WeeklyInsightsService } from './weekly-insights.service'
import { WeeklyInsightsMigrationService } from './weekly-insights-migration.service'
import { FirebaseModule } from '@/firebase/firebase.module'
import { GeminiModule } from '@/gemini/gemini.module'
import { JournalModule } from '@/journal/journal.module'
import { GoalModule } from '@/goal/goal.module'
import { RagModule } from '@/rag/rag.module'

@Module({
  imports: [
    FirebaseModule,
    GeminiModule,
    JournalModule,
    forwardRef(() => GoalModule),
    RagModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    CoachPersonalityService,
    WeeklyInsightsService,
    WeeklyInsightsMigrationService,
  ],
  exports: [
    ChatService,
    CoachPersonalityService,
    WeeklyInsightsService,
    WeeklyInsightsMigrationService,
  ],
})
export class ChatModule {}

