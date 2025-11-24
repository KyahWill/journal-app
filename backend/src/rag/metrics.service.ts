import { Injectable, Logger } from '@nestjs/common';

/**
 * Metrics for embedding generation
 */
export interface EmbeddingMetrics {
  totalGenerated: number;
  totalFailed: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
  lastResetTime: Date;
}

/**
 * Metrics for search operations
 */
export interface SearchMetrics {
  totalSearches: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
  cacheHits: number;
  cacheMisses: number;
  totalResultsReturned: number;
  avgSimilarityScore: number;
  lastResetTime: Date;
}

/**
 * API quota tracking
 */
export interface QuotaMetrics {
  embeddingApiCalls: number;
  lastResetTime: Date;
  estimatedCost: number;
}

/**
 * Service for tracking RAG system metrics
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  // Embedding metrics
  private embeddingMetrics: EmbeddingMetrics = {
    totalGenerated: 0,
    totalFailed: 0,
    totalDuration: 0,
    minDuration: Infinity,
    maxDuration: 0,
    avgDuration: 0,
    lastResetTime: new Date(),
  };

  // Search metrics
  private searchMetrics: SearchMetrics = {
    totalSearches: 0,
    totalDuration: 0,
    minDuration: Infinity,
    maxDuration: 0,
    avgDuration: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalResultsReturned: 0,
    avgSimilarityScore: 0,
    lastResetTime: new Date(),
  };

  // Quota metrics
  private quotaMetrics: QuotaMetrics = {
    embeddingApiCalls: 0,
    lastResetTime: new Date(),
    estimatedCost: 0,
  };

  // Cost per embedding call (estimated, adjust based on actual pricing)
  private readonly COST_PER_EMBEDDING = 0.00001; // $0.00001 per embedding

  constructor() {
    this.logger.log('MetricsService initialized');
    
    // Log metrics every 5 minutes
    setInterval(() => {
      this.logAllMetrics();
    }, 5 * 60 * 1000);
  }

  /**
   * Record successful embedding generation
   * @param duration - Time taken in milliseconds
   */
  recordEmbeddingSuccess(duration: number): void {
    this.embeddingMetrics.totalGenerated++;
    this.embeddingMetrics.totalDuration += duration;
    this.embeddingMetrics.minDuration = Math.min(this.embeddingMetrics.minDuration, duration);
    this.embeddingMetrics.maxDuration = Math.max(this.embeddingMetrics.maxDuration, duration);
    this.embeddingMetrics.avgDuration = 
      this.embeddingMetrics.totalDuration / this.embeddingMetrics.totalGenerated;

    // Track API quota
    this.quotaMetrics.embeddingApiCalls++;
    this.quotaMetrics.estimatedCost += this.COST_PER_EMBEDDING;
  }

  /**
   * Record failed embedding generation
   */
  recordEmbeddingFailure(): void {
    this.embeddingMetrics.totalFailed++;
  }

  /**
   * Record search operation
   * @param duration - Time taken in milliseconds
   * @param resultsCount - Number of results returned
   * @param avgSimilarity - Average similarity score
   * @param cacheHit - Whether cache was hit
   */
  recordSearch(
    duration: number,
    resultsCount: number,
    avgSimilarity: number,
    cacheHit: boolean,
  ): void {
    this.searchMetrics.totalSearches++;
    this.searchMetrics.totalDuration += duration;
    this.searchMetrics.minDuration = Math.min(this.searchMetrics.minDuration, duration);
    this.searchMetrics.maxDuration = Math.max(this.searchMetrics.maxDuration, duration);
    this.searchMetrics.avgDuration = 
      this.searchMetrics.totalDuration / this.searchMetrics.totalSearches;
    
    this.searchMetrics.totalResultsReturned += resultsCount;
    
    // Update average similarity score (running average)
    const totalSimilarity = this.searchMetrics.avgSimilarityScore * (this.searchMetrics.totalSearches - 1);
    this.searchMetrics.avgSimilarityScore = 
      (totalSimilarity + avgSimilarity) / this.searchMetrics.totalSearches;

    if (cacheHit) {
      this.searchMetrics.cacheHits++;
    } else {
      this.searchMetrics.cacheMisses++;
    }
  }

  /**
   * Get embedding metrics
   * @returns EmbeddingMetrics
   */
  getEmbeddingMetrics(): EmbeddingMetrics {
    return { ...this.embeddingMetrics };
  }

  /**
   * Get search metrics
   * @returns SearchMetrics
   */
  getSearchMetrics(): SearchMetrics {
    return { ...this.searchMetrics };
  }

  /**
   * Get quota metrics
   * @returns QuotaMetrics
   */
  getQuotaMetrics(): QuotaMetrics {
    return { ...this.quotaMetrics };
  }

  /**
   * Get all metrics
   * @returns Object with all metrics
   */
  getAllMetrics() {
    return {
      embedding: this.getEmbeddingMetrics(),
      search: this.getSearchMetrics(),
      quota: this.getQuotaMetrics(),
    };
  }

  /**
   * Get embedding success rate
   * @returns number - Success rate as percentage
   */
  getEmbeddingSuccessRate(): number {
    const total = this.embeddingMetrics.totalGenerated + this.embeddingMetrics.totalFailed;
    if (total === 0) return 100;
    return (this.embeddingMetrics.totalGenerated / total) * 100;
  }

  /**
   * Get cache hit rate
   * @returns number - Cache hit rate as percentage
   */
  getCacheHitRate(): number {
    const total = this.searchMetrics.cacheHits + this.searchMetrics.cacheMisses;
    if (total === 0) return 0;
    return (this.searchMetrics.cacheHits / total) * 100;
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    const now = new Date();
    
    this.embeddingMetrics = {
      totalGenerated: 0,
      totalFailed: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      avgDuration: 0,
      lastResetTime: now,
    };

    this.searchMetrics = {
      totalSearches: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      avgDuration: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalResultsReturned: 0,
      avgSimilarityScore: 0,
      lastResetTime: now,
    };

    this.quotaMetrics = {
      embeddingApiCalls: 0,
      lastResetTime: now,
      estimatedCost: 0,
    };

    this.logger.log('All metrics reset');
  }

  /**
   * Log all metrics
   */
  logAllMetrics(): void {
    const successRate = this.getEmbeddingSuccessRate();
    const cacheHitRate = this.getCacheHitRate();

    this.logger.log({
      action: 'metrics_summary',
      embedding: {
        totalGenerated: this.embeddingMetrics.totalGenerated,
        totalFailed: this.embeddingMetrics.totalFailed,
        successRate: `${successRate.toFixed(2)}%`,
        avgDuration: `${this.embeddingMetrics.avgDuration.toFixed(2)}ms`,
        minDuration: `${this.embeddingMetrics.minDuration === Infinity ? 0 : this.embeddingMetrics.minDuration}ms`,
        maxDuration: `${this.embeddingMetrics.maxDuration}ms`,
      },
      search: {
        totalSearches: this.searchMetrics.totalSearches,
        avgDuration: `${this.searchMetrics.avgDuration.toFixed(2)}ms`,
        minDuration: `${this.searchMetrics.minDuration === Infinity ? 0 : this.searchMetrics.minDuration}ms`,
        maxDuration: `${this.searchMetrics.maxDuration}ms`,
        cacheHitRate: `${cacheHitRate.toFixed(2)}%`,
        avgResultsPerSearch: this.searchMetrics.totalSearches > 0 
          ? (this.searchMetrics.totalResultsReturned / this.searchMetrics.totalSearches).toFixed(2)
          : 0,
        avgSimilarityScore: this.searchMetrics.avgSimilarityScore.toFixed(3),
      },
      quota: {
        embeddingApiCalls: this.quotaMetrics.embeddingApiCalls,
        estimatedCost: `$${this.quotaMetrics.estimatedCost.toFixed(4)}`,
      },
    });
  }

  /**
   * Log embedding generation metrics
   */
  logEmbeddingMetrics(): void {
    const successRate = this.getEmbeddingSuccessRate();

    this.logger.log({
      action: 'embedding_metrics',
      totalGenerated: this.embeddingMetrics.totalGenerated,
      totalFailed: this.embeddingMetrics.totalFailed,
      successRate: `${successRate.toFixed(2)}%`,
      avgDuration: `${this.embeddingMetrics.avgDuration.toFixed(2)}ms`,
      minDuration: `${this.embeddingMetrics.minDuration === Infinity ? 0 : this.embeddingMetrics.minDuration}ms`,
      maxDuration: `${this.embeddingMetrics.maxDuration}ms`,
      apiCalls: this.quotaMetrics.embeddingApiCalls,
      estimatedCost: `$${this.quotaMetrics.estimatedCost.toFixed(4)}`,
    });
  }

  /**
   * Log search performance metrics
   */
  logSearchMetrics(): void {
    const cacheHitRate = this.getCacheHitRate();

    this.logger.log({
      action: 'search_metrics',
      totalSearches: this.searchMetrics.totalSearches,
      avgDuration: `${this.searchMetrics.avgDuration.toFixed(2)}ms`,
      minDuration: `${this.searchMetrics.minDuration === Infinity ? 0 : this.searchMetrics.minDuration}ms`,
      maxDuration: `${this.searchMetrics.maxDuration}ms`,
      cacheHits: this.searchMetrics.cacheHits,
      cacheMisses: this.searchMetrics.cacheMisses,
      cacheHitRate: `${cacheHitRate.toFixed(2)}%`,
      avgResultsPerSearch: this.searchMetrics.totalSearches > 0 
        ? (this.searchMetrics.totalResultsReturned / this.searchMetrics.totalSearches).toFixed(2)
        : 0,
      avgSimilarityScore: this.searchMetrics.avgSimilarityScore.toFixed(3),
    });
  }
}
