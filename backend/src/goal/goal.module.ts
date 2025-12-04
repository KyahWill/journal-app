import { Module } from '@nestjs/common'
import { GoalController } from './goal.controller'
import { GoalService } from './goal.service'
import { MilestoneMigrationService } from './milestone-migration.service'
import { FirebaseModule } from '@/firebase/firebase.module'
import { RagModule } from '@/rag/rag.module'
import { CategoryModule } from '@/category/category.module'
import { GoogleCalendarModule } from '@/google-calendar/google-calendar.module'

@Module({
  imports: [FirebaseModule, RagModule, CategoryModule, GoogleCalendarModule],
  controllers: [GoalController],
  providers: [GoalService, MilestoneMigrationService],
  exports: [GoalService, MilestoneMigrationService],
})
export class GoalModule {}
