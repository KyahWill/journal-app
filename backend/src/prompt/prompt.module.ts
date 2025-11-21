import { Module } from '@nestjs/common'
import { PromptController } from './prompt.controller'
import { PromptService } from './prompt.service'
import { FirebaseModule } from '@/firebase/firebase.module'
import { GeminiModule } from '@/gemini/gemini.module'

@Module({
  imports: [FirebaseModule, GeminiModule],
  controllers: [PromptController],
  providers: [PromptService],
  exports: [PromptService],
})
export class PromptModule {}

