import { Module } from '@nestjs/common'
import { GoogleCalendarService } from './google-calendar.service'
import { GoogleCalendarController } from './google-calendar.controller'
import { FirebaseModule } from '@/firebase/firebase.module'

@Module({
  imports: [FirebaseModule],
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarService],
  exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}

