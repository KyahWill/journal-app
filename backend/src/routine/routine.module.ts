import { Module } from '@nestjs/common'
import { RoutineController } from './routine.controller'
import { RoutineService } from './routine.service'
import { FirebaseModule } from '@/firebase/firebase.module'

@Module({
  imports: [FirebaseModule],
  controllers: [RoutineController],
  providers: [RoutineService],
  exports: [RoutineService],
})
export class RoutineModule {}
