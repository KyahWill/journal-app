import { Module } from '@nestjs/common'
import { McpController } from './mcp.controller'
import { McpService } from './mcp.service'
import { ApiKeyService } from './api-key.service'
import { ApiKeyController } from './api-key.controller'
import { FirebaseModule } from '@/firebase/firebase.module'
import { GoalModule } from '@/goal/goal.module'
import { JournalModule } from '@/journal/journal.module'
import { CategoryModule } from '@/category/category.module'

@Module({
  imports: [FirebaseModule, GoalModule, JournalModule, CategoryModule],
  controllers: [McpController, ApiKeyController],
  providers: [McpService, ApiKeyService],
  exports: [McpService, ApiKeyService],
})
export class McpModule {}

