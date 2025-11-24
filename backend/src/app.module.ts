import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { FirebaseModule } from './firebase/firebase.module'
import { GeminiModule } from './gemini/gemini.module'
import { AuthModule } from './auth/auth.module'
import { JournalModule } from './journal/journal.module'
import { ChatModule } from './chat/chat.module'
import { PromptModule } from './prompt/prompt.module'
import { ThemeModule } from './theme/theme.module'
import { ElevenLabsModule } from './elevenlabs/elevenlabs.module'
import { GoalModule } from './goal/goal.module'
import { CategoryModule } from './category/category.module'
import { CommonModule } from './common/common.module'
import { RagModule } from './rag/rag.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CommonModule,
    FirebaseModule,
    GeminiModule,
    AuthModule,
    JournalModule,
    ChatModule,
    PromptModule,
    ThemeModule,
    ElevenLabsModule,
    GoalModule,
    CategoryModule,
    RagModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

