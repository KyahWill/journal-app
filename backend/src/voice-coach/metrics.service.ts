import { Injectable, Logger } from '@nestjs/common';

/**
 * Metrics types for voice coaching
 */
export enum MetricType {
  CONVERSATION_STARTED = 'conversation_started',
  CONVERSATION_ENDED = 'conversation_ended',
  CONTEXT_BUILD_STARTED = 'context_build_started',
  CONTEXT_BUILD_COMPLETED = 'context_build_completed',
  ELEVENLABS_API_CALL = 'elevenlabs_api_call',
  ERROR_OCCURRED = 'error_occurred',
  SESSION_CREATED = 'session_created',
  SIGNED_URL_GENERATED = 'signed_url_generated',
}

export enum ErrorType {
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  ELEVENLABS_API_ERROR = 'elevenlabs_api_error',
  CONTEXT_BUILD_ERROR = 'context_build_error',
  SESSION_ERROR = 'session_error',
  VALIDATION_ERROR = 'validation_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Metric data structure
 */
export interface MetricData {
  type: MetricType;
  userId?: string;
  conversationId?: string;
  sessionId?: string;
  duration?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Error metric data structure
 */
export interface ErrorMetricData {
  errorType: ErrorType;
  errorMessage: string;
  userId?: string;
  conversationId?: string;
  sessionId?: string;
  timestamp: Date;
  stack?: string;
  metadata?: Record<string, any>;
}

/**
 * Aggregated metrics for reporting
 */
export interface AggregatedMetrics {
  totalConversations: number;
  averageConversationDuration: number;
  averageContextBuildTime: number;
  averageElevenLabsResponseTime: number;
  errorRateByType: Record<ErrorType, number>;
  totalErrors: number;
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Service for tracking and logging voice coaching metrics
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  
  // In-memory storage for metrics (in production, use a proper metrics backend)
  private metrics: MetricData[] = [];
  private errorMetrics: ErrorMetricData[] = [];
  
  // Retention period for in-memory metrics (24 hours)
  private readonly retentionPeriod = 24 * 60 * 60 * 1000;

  constructor() {
    // Clean up old metrics periodically
    setInterval(() => this.cleanupOldMetrics(), 60 * 60 * 1000); // Every hour
  }

  /**
   * Log a conversation start event
   */
  logConversationStart(userId: string, conversationId: string, metadata?: Record<string, any>): void {
    const metric: MetricData = {
      type: MetricType.CONVERSATION_STARTED,
      userId,
      conversationId,
      timestamp: new Date(),
      metadata,
    };

    this.recordMetric(metric);
    
    this.logger.log({
      action: 'conversation_started',
      userId,
      conversationId,
      ...metadata,
    });
  }

  /**
   * Log a conversation end event
   */
  logConversationEnd(
    userId: string,
    conversationId: string,
    duration: number,
    metadata?: Record<string, any>,
  ): void {
    const metric: MetricData = {
      type: MetricType.CONVERSATION_ENDED,
      userId,
      conversationId,
      duration,
      timestamp: new Date(),
      metadata,
    };

    this.recordMetric(metric);
    
    this.logger.log({
      action: 'conversation_ended',
      userId,
      conversationId,
      duration,
      ...metadata,
    });
  }

  /**
   * Log context building start
   */
  logContextBuildStart(userId: string, sessionId?: string, metadata?: Record<string, any>): string {
    const buildId = `build_${Date.now()}_${userId}`;
    
    const metric: MetricData = {
      type: MetricType.CONTEXT_BUILD_STARTED,
      userId,
      sessionId,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        buildId,
      },
    };

    this.recordMetric(metric);
    
    return buildId;
  }

  /**
   * Log context building completion
   */
  logContextBuildComplete(
    userId: string,
    buildId: string,
    duration: number,
    metadata?: Record<string, any>,
  ): void {
    const metric: MetricData = {
      type: MetricType.CONTEXT_BUILD_COMPLETED,
      userId,
      duration,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        buildId,
      },
    };

    this.recordMetric(metric);
    
    this.logger.log({
      action: 'context_build_completed',
      userId,
      buildId,
      duration,
      ...metadata,
    });
  }

  /**
   * Log ElevenLabs API call
   */
  logElevenLabsApiCall(
    operation: string,
    duration: number,
    userId?: string,
    metadata?: Record<string, any>,
  ): void {
    const metric: MetricData = {
      type: MetricType.ELEVENLABS_API_CALL,
      userId,
      duration,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        operation,
      },
    };

    this.recordMetric(metric);
    
    this.logger.log({
      action: 'elevenlabs_api_call',
      operation,
      duration,
      userId,
      ...metadata,
    });
  }

  /**
   * Log session creation
   */
  logSessionCreated(userId: string, sessionId: string, metadata?: Record<string, any>): void {
    const metric: MetricData = {
      type: MetricType.SESSION_CREATED,
      userId,
      sessionId,
      timestamp: new Date(),
      metadata,
    };

    this.recordMetric(metric);
    
    this.logger.log({
      action: 'session_created',
      userId,
      sessionId,
      ...metadata,
    });
  }

  /**
   * Log signed URL generation
   */
  logSignedUrlGenerated(userId: string, duration: number, metadata?: Record<string, any>): void {
    const metric: MetricData = {
      type: MetricType.SIGNED_URL_GENERATED,
      userId,
      duration,
      timestamp: new Date(),
      metadata,
    };

    this.recordMetric(metric);
    
    this.logger.log({
      action: 'signed_url_generated',
      userId,
      duration,
      ...metadata,
    });
  }

  /**
   * Log an error
   */
  logError(
    errorType: ErrorType,
    errorMessage: string,
    userId?: string,
    conversationId?: string,
    sessionId?: string,
    error?: Error,
    metadata?: Record<string, any>,
  ): void {
    const errorMetric: ErrorMetricData = {
      errorType,
      errorMessage,
      userId,
      conversationId,
      sessionId,
      timestamp: new Date(),
      stack: error?.stack,
      metadata,
    };

    this.recordErrorMetric(errorMetric);
    
    this.logger.error({
      action: 'error_occurred',
      errorType,
      errorMessage,
      userId,
      conversationId,
      sessionId,
      stack: error?.stack,
      ...metadata,
    });
  }

  /**
   * Get aggregated metrics for a time period
   */
  getAggregatedMetrics(startDate?: Date, endDate?: Date): AggregatedMetrics {
    const start = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    const end = endDate || new Date();

    // Filter metrics by time period
    const periodMetrics = this.metrics.filter(
      m => m.timestamp >= start && m.timestamp <= end,
    );

    const periodErrors = this.errorMetrics.filter(
      e => e.timestamp >= start && e.timestamp <= end,
    );

    // Calculate conversation metrics
    const conversationEnded = periodMetrics.filter(
      m => m.type === MetricType.CONVERSATION_ENDED,
    );
    const totalConversations = conversationEnded.length;
    const averageConversationDuration = totalConversations > 0
      ? conversationEnded.reduce((sum, m) => sum + (m.duration || 0), 0) / totalConversations
      : 0;

    // Calculate context build metrics
    const contextBuilds = periodMetrics.filter(
      m => m.type === MetricType.CONTEXT_BUILD_COMPLETED,
    );
    const averageContextBuildTime = contextBuilds.length > 0
      ? contextBuilds.reduce((sum, m) => sum + (m.duration || 0), 0) / contextBuilds.length
      : 0;

    // Calculate ElevenLabs API metrics
    const apiCalls = periodMetrics.filter(
      m => m.type === MetricType.ELEVENLABS_API_CALL,
    );
    const averageElevenLabsResponseTime = apiCalls.length > 0
      ? apiCalls.reduce((sum, m) => sum + (m.duration || 0), 0) / apiCalls.length
      : 0;

    // Calculate error rates by type
    const errorRateByType: Record<ErrorType, number> = {} as Record<ErrorType, number>;
    Object.values(ErrorType).forEach(type => {
      errorRateByType[type] = periodErrors.filter(e => e.errorType === type).length;
    });

    return {
      totalConversations,
      averageConversationDuration,
      averageContextBuildTime,
      averageElevenLabsResponseTime,
      errorRateByType,
      totalErrors: periodErrors.length,
      period: {
        start,
        end,
      },
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): ErrorMetricData[] {
    return this.errorMetrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Record a metric
   */
  private recordMetric(metric: MetricData): void {
    this.metrics.push(metric);
  }

  /**
   * Record an error metric
   */
  private recordErrorMetric(errorMetric: ErrorMetricData): void {
    this.errorMetrics.push(errorMetric);
  }

  /**
   * Clean up old metrics beyond retention period
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - this.retentionPeriod;
    
    const beforeCount = this.metrics.length + this.errorMetrics.length;
    
    this.metrics = this.metrics.filter(
      m => m.timestamp.getTime() > cutoffTime,
    );
    
    this.errorMetrics = this.errorMetrics.filter(
      e => e.timestamp.getTime() > cutoffTime,
    );
    
    const afterCount = this.metrics.length + this.errorMetrics.length;
    const removed = beforeCount - afterCount;
    
    if (removed > 0) {
      this.logger.log(`Cleaned up ${removed} old metrics`);
    }
  }
}
