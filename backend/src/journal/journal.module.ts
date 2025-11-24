import { Module } from '@nestjs/common'
import { JournalController } from './journal.controller'
import { JournalService } from './journal.service'
import { FirebaseModule } from '@/firebase/firebase.module'
import { RagModule } from '@/rag/rag.module'

@Module({
  imports: [FirebaseModule, RagModule],
  controllers: [JournalController],
  providers: [JournalService],
  exports: [JournalService],
})
export class JournalModule {}

