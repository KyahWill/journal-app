import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { FirebaseModule } from './firebase/firebase.module'
import { GeminiModule } from './gemini/gemini.module'
import { AuthModule } from './auth/auth.module'
import { JournalModule } from './journal/journal.module'
import { ChatModule } from './chat/chat.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    FirebaseModule,
    GeminiModule,
    AuthModule,
    JournalModule,
    ChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

