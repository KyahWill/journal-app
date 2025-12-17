import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { FirebaseModule } from './firebase/firebase.module'
import { GeminiModule } from './gemini/gemini.module'
import { AuthModule } from './auth/auth.module'
import { JournalModule } from './journal/journal.module'
import { ChatModule } from './chat/chat.module'
import { ElevenLabsModule } from './elevenlabs/elevenlabs.module'
import { GoalModule } from './goal/goal.module'
import { CategoryModule } from './category/category.module'
import { CommonModule } from './common/common.module'
import { RagModule } from './rag/rag.module'
import { VoiceCoachModule } from './voice-coach/voice-coach.module'
import { CoachPersonalityModule } from './coach-personality/coach-personality.module'
import { GoogleCalendarModule } from './google-calendar/google-calendar.module'
import { RoutineModule } from './routine/routine.module'
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
    ElevenLabsModule,
    GoalModule,
    CategoryModule,
    RagModule,
    VoiceCoachModule,
    CoachPersonalityModule,
    GoogleCalendarModule,
    RoutineModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
