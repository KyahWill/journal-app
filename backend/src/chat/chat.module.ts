import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { FirebaseModule } from '@/firebase/firebase.module'
import { GeminiModule } from '@/gemini/gemini.module'
import { JournalModule } from '@/journal/journal.module'
import { PromptModule } from '@/prompt/prompt.module'

@Module({
  imports: [FirebaseModule, GeminiModule, JournalModule, PromptModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

