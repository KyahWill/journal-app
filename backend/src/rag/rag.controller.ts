import { Controller, Get, Logger } from '@nestjs/common';
import { RagService } from './rag.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { MetricsService } from './metrics.service';
import { ragConfig } from './config/rag.config';

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    ragEnabled: boolean;
    embeddingService: {
      status: 'healthy' | 'unhealthy';
      message?: string;
    };
    vectorStore: {
      status: 'healthy' | 'unhealthy';
      message?: string;
    };
    endToEnd: {
      status: 'healthy' | 'unhealthy';
      message?: string;
      duration?: number;
    };
  };
  metrics?: {
    embedding: any;
    search: any;
    quota: any;
  };
}

/**
 * Controller for RAG system health checks and metrics
 */
@Controller('rag')
export class RagController {
  private readonly logger = new Logger(RagController.name);
  private readonly config = ragConfig();

  constructor(
    private ragService: RagService,
    private embeddingService: EmbeddingService,
    private vectorStoreService: VectorStoreService,
    private metricsService: MetricsService,
  ) {}

  /**
   * Health check endpoint for RAG system
   * Tests Vector Store connectivity, Embedding Service availability, and end-to-end workflow
   * @returns HealthCheckResponse
   */
  @Get('health')
  async healthCheck(): Promise<HealthCheckResponse> {
    this.logger.log('RAG health check requested');

    const response: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        ragEnabled: this.config.enabled,
        embeddingService: {
          status: 'healthy',
        },
        vectorStore: {
          status: 'healthy',
        },
        endToEnd: {
          status: 'healthy',
        },
      },
    };

    // If RAG is disabled, return early
    if (!this.config.enabled) {
      response.status = 'degraded';
      response.checks.embeddingService.status = 'unhealthy';
      response.checks.embeddingService.message = 'RAG is disabled';
      response.checks.vectorStore.status = 'unhealthy';
      response.checks.vectorStore.message = 'RAG is disabled';
      response.checks.endToEnd.status = 'unhealthy';
      response.checks.endToEnd.message = 'RAG is disabled';
      return response;
    }

    // Check Embedding Service
    try {
      await this.checkEmbeddingService();
      response.checks.embeddingService.status = 'healthy';
      response.checks.embeddingService.message = 'Embedding service is operational';
    } catch (error) {
      this.logger.error('Embedding service health check failed', error);
      response.checks.embeddingService.status = 'unhealthy';
      response.checks.embeddingService.message = error.message;
      response.status = 'unhealthy';
    }

    // Check Vector Store
    try {
      await this.checkVectorStore();
      response.checks.vectorStore.status = 'healthy';
      response.checks.vectorStore.message = 'Vector store is operational';
    } catch (error) {
      this.logger.error('Vector store health check failed', error);
      response.checks.vectorStore.status = 'unhealthy';
      response.checks.vectorStore.message = error.message;
      response.status = 'unhealthy';
    }

    // Check end-to-end workflow
    try {
      const duration = await this.checkEndToEndWorkflow();
      response.checks.endToEnd.status = 'healthy';
      response.checks.endToEnd.message = 'End-to-end workflow is operational';
      response.checks.endToEnd.duration = duration;
    } catch (error) {
      this.logger.error('End-to-end workflow health check failed', error);
      response.checks.endToEnd.status = 'unhealthy';
      response.checks.endToEnd.message = error.message;
      response.status = 'unhealthy';
    }

    this.logger.log({
      action: 'health_check_complete',
      status: response.status,
      embeddingService: response.checks.embeddingService.status,
      vectorStore: response.checks.vectorStore.status,
      endToEnd: response.checks.endToEnd.status,
    });

    return response;
  }

  /**
   * Get RAG system metrics
   * @returns Metrics data
   */
  @Get('metrics')
  async getMetrics() {
    this.logger.log('RAG metrics requested');

    const metrics = this.metricsService.getAllMetrics();
    const successRate = this.metricsService.getEmbeddingSuccessRate();
    const cacheHitRate = this.metricsService.getCacheHitRate();

    return {
      timestamp: new Date().toISOString(),
      ragEnabled: this.config.enabled,
      embedding: {
        ...metrics.embedding,
        successRate: `${successRate.toFixed(2)}%`,
      },
      search: {
        ...metrics.search,
        cacheHitRate: `${cacheHitRate.toFixed(2)}%`,
      },
      quota: metrics.quota,
    };
  }

  /**
   * Check if Embedding Service is available
   * @throws Error if service is unavailable
   */
  private async checkEmbeddingService(): Promise<void> {
    const testText = 'Health check test';
    
    try {
      const embedding = await this.embeddingService.generateEmbedding(testText);
      
      if (!embedding || embedding.length === 0) {
        throw new Error('Embedding service returned empty result');
      }

      const expectedDimensions = this.embeddingService.getEmbeddingDimensions();
      if (embedding.length !== expectedDimensions) {
        throw new Error(
          `Embedding dimensions mismatch: expected ${expectedDimensions}, got ${embedding.length}`,
        );
      }
    } catch (error) {
      throw new Error(`Embedding service check failed: ${error.message}`);
    }
  }

  /**
   * Check if Vector Store is accessible
   * @throws Error if store is unavailable
   */
  private async checkVectorStore(): Promise<void> {
    try {
      // Try to perform a simple search operation
      // Use a test user ID that won't interfere with real data
      const testUserId = 'health_check_test_user';
      const testEmbedding = new Array(this.embeddingService.getEmbeddingDimensions()).fill(0);
      
      await this.vectorStoreService.searchSimilar({
        userId: testUserId,
        queryEmbedding: testEmbedding,
        limit: 1,
        similarityThreshold: 0.9,
      });
    } catch (error) {
      throw new Error(`Vector store check failed: ${error.message}`);
    }
  }

  /**
   * Check end-to-end RAG workflow
   * Tests embedding generation, storage, and retrieval
   * @returns Duration in milliseconds
   * @throws Error if workflow fails
   */
  private async checkEndToEndWorkflow(): Promise<number> {
    const startTime = Date.now();
    
    try {
      const testText = 'End-to-end health check test for RAG system';
      const testUserId = 'health_check_test_user';
      const testDocumentId = `health_check_${Date.now()}`;
      
      // Step 1: Generate embedding
      const embedding = await this.embeddingService.generateEmbedding(testText);
      
      if (!embedding || embedding.length === 0) {
        throw new Error('Failed to generate embedding');
      }

      // Step 2: Store embedding
      await this.vectorStoreService.storeEmbedding({
        userId: testUserId,
        contentType: 'journal',
        documentId: testDocumentId,
        embedding,
        textSnippet: testText,
        metadata: { healthCheck: true },
      });

      // Step 3: Search for the embedding
      const searchResults = await this.vectorStoreService.searchSimilar({
        userId: testUserId,
        queryEmbedding: embedding,
        limit: 5,
        similarityThreshold: 0.5,
      });

      // Step 4: Verify we can find our test document
      const found = searchResults.some(r => r.documentId === testDocumentId);
      
      if (!found) {
        throw new Error('Failed to retrieve stored embedding');
      }

      // Step 5: Clean up test data
      await this.vectorStoreService.deleteByDocument(testUserId, testDocumentId);

      const duration = Date.now() - startTime;
      return duration;
    } catch (error) {
      throw new Error(`End-to-end workflow check failed: ${error.message}`);
    }
  }
}
