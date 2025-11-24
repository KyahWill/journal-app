import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmbeddingResult, BatchEmbeddingResult } from './interfaces/embedding.interface';
import { ragConfig } from './config/rag.config';
import { MetricsService } from './metrics.service';

/**
 * Service responsible for generating vector embeddings using Gemini's embedding API
 */
@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private genAI: GoogleGenerativeAI;
  private readonly config = ragConfig();
  private readonly MAX_TEXT_LENGTH = 10000;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => MetricsService))
    private metricsService: MetricsService,
  ) {}

  async onModuleInit() {
    try {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');

      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in environment variables');
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('EmbeddingService initialized successfully');
      this.logger.log(`Using embedding model: ${this.config.embeddingModel}`);
    } catch (error) {
      this.logger.error('Failed to initialize EmbeddingService', error);
      throw error;
    }
  }

  /**
   * Generate embedding for a single text
   * @param text - Text to embed
   * @returns Promise<number[]> - Embedding vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Validate input
    this.validateInput(text);

    const startTime = Date.now();

    try {
      const result = await this.generateEmbeddingWithRetry(text);
      
      const duration = Date.now() - startTime;
      
      // Record success metrics
      this.metricsService.recordEmbeddingSuccess(duration);
      
      this.logger.log({
        action: 'embedding_generated',
        textLength: text.length,
        dimensions: result.embedding.length,
        model: result.model,
        duration,
      });

      return result.embedding;
    } catch (error) {
      // Record failure metrics
      this.metricsService.recordEmbeddingFailure();
      
      this.logger.error('Failed to generate embedding', {
        error: error.message,
        textLength: text.length,
        textPreview: text.substring(0, 100),
      });
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param texts - Array of texts to embed
   * @returns Promise<number[][]> - Array of embedding vectors
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      this.logger.warn('generateEmbeddings called with empty array');
      return [];
    }

    const startTime = Date.now();
    const embeddings: number[][] = [];
    const batchSize = this.config.batchSize;

    this.logger.log(`Generating embeddings for ${texts.length} texts in batches of ${batchSize}`);

    // Process in batches
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, Math.min(i + batchSize, texts.length));
      const batchResults = await this.processBatch(batch, i);
      embeddings.push(...batchResults);
    }

    const duration = Date.now() - startTime;
    this.logger.log({
      action: 'batch_embeddings_generated',
      totalTexts: texts.length,
      successCount: embeddings.length,
      duration,
      avgDuration: duration / texts.length,
    });

    return embeddings;
  }

  /**
   * Get the dimensions of embeddings produced by this service
   * @returns number - Embedding dimensions
   */
  getEmbeddingDimensions(): number {
    return this.config.embeddingDimensions;
  }

  /**
   * Validate input text
   * @param text - Text to validate
   * @throws Error if validation fails
   */
  private validateInput(text: string): void {
    if (text === null || text === undefined) {
      throw new Error('Text cannot be null or undefined');
    }

    if (typeof text !== 'string') {
      throw new Error('Text must be a string');
    }

    if (text.trim().length === 0) {
      throw new Error('Text cannot be empty or whitespace only');
    }

    if (text.length > this.MAX_TEXT_LENGTH) {
      throw new Error(`Text length (${text.length}) exceeds maximum allowed length (${this.MAX_TEXT_LENGTH})`);
    }
  }

  /**
   * Generate embedding with exponential backoff retry logic
   * @param text - Text to embed
   * @param attempt - Current attempt number
   * @returns Promise<EmbeddingResult>
   */
  private async generateEmbeddingWithRetry(
    text: string,
    attempt: number = 1,
  ): Promise<EmbeddingResult> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.config.embeddingModel,
      });

      const result = await model.embedContent(text);
      const embedding = result.embedding;

      return {
        embedding: embedding.values,
        dimensions: embedding.values.length,
        model: this.config.embeddingModel,
      };
    } catch (error) {
      if (attempt < this.MAX_RETRIES) {
        const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
        this.logger.warn(
          `Embedding generation failed (attempt ${attempt}/${this.MAX_RETRIES}), retrying in ${delay}ms`,
          { error: error.message },
        );
        
        await this.sleep(delay);
        return this.generateEmbeddingWithRetry(text, attempt + 1);
      }

      this.logger.error(`Embedding generation failed after ${this.MAX_RETRIES} attempts`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Process a batch of texts
   * @param batch - Array of texts to process
   * @param batchStartIndex - Starting index for logging
   * @returns Promise<number[][]> - Array of embeddings
   */
  private async processBatch(batch: string[], batchStartIndex: number): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (let i = 0; i < batch.length; i++) {
      const text = batch[i];
      const globalIndex = batchStartIndex + i;

      try {
        // Validate before processing
        this.validateInput(text);
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);
      } catch (error) {
        this.logger.error(`Failed to generate embedding for text at index ${globalIndex}`, {
          error: error.message,
          textPreview: text.substring(0, 100),
        });
        
        // For batch processing, we continue with other texts
        // The caller can check if the number of embeddings matches the input
        this.logger.warn(`Skipping text at index ${globalIndex} due to error`);
      }
    }

    return embeddings;
  }

  /**
   * Sleep utility for retry delays
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
