import { Module } from '@nestjs/common';
import { FirebaseModule } from '@/firebase/firebase.module';
import { GeminiModule } from '@/gemini/gemini.module';
import { RagService } from './rag.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { MigrationService } from './migration.service';
import { MetricsService } from './metrics.service';
import { RagController } from './rag.controller';
import { RateLimitService } from '@/common/services/rate-limit.service';

@Module({
  imports: [FirebaseModule, GeminiModule],
  controllers: [RagController],
  providers: [
    RagService,
    EmbeddingService,
    VectorStoreService,
    MigrationService,
    MetricsService,
    RateLimitService,
  ],
  exports: [RagService, MigrationService, MetricsService],
})
export class RagModule {}
