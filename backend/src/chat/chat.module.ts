import { Module, forwardRef } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { FirebaseModule } from '@/firebase/firebase.module'
import { GeminiModule } from '@/gemini/gemini.module'
import { JournalModule } from '@/journal/journal.module'
import { CoachPersonalityModule } from '@/coach-personality/coach-personality.module'
import { GoalModule } from '@/goal/goal.module'
import { RagModule } from '@/rag/rag.module'

@Module({
  imports: [
    FirebaseModule,
    GeminiModule,
    JournalModule,
    CoachPersonalityModule,
    forwardRef(() => GoalModule),
    RagModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

