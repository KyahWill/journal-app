import { Module } from '@nestjs/common'
import { ThemeController } from './theme.controller'
import { ThemeService } from './theme.service'
import { FirebaseModule } from '@/firebase/firebase.module'
import { GeminiModule } from '@/gemini/gemini.module'

@Module({
  imports: [FirebaseModule, GeminiModule],
  controllers: [ThemeController],
  providers: [ThemeService],
  exports: [ThemeService],
})
export class ThemeModule {}

