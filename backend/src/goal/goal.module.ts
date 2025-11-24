import { Module } from '@nestjs/common'
import { GoalController } from './goal.controller'
import { GoalService } from './goal.service'
import { FirebaseModule } from '@/firebase/firebase.module'
import { RagModule } from '@/rag/rag.module'

@Module({
  imports: [FirebaseModule, RagModule],
  controllers: [GoalController],
  providers: [GoalService],
  exports: [GoalService],
})
export class GoalModule {}
