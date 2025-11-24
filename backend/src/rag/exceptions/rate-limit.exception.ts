import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception thrown when RAG rate limit is exceeded
 */
export class RagRateLimitException extends HttpException {
  constructor(
    public readonly feature: 'embedding' | 'search',
    public readonly remaining: number,
    public readonly limit: number,
    public readonly resetsAt: Date,
  ) {
    const featureName = feature === 'embedding' ? 'content embedding generation' : 'semantic search queries';
    const message = `Rate limit exceeded for ${featureName}. You have reached your daily limit of ${limit}. Limit resets at ${resetsAt.toISOString()}.`;
    
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message,
        error: 'Too Many Requests',
        feature,
        remaining,
        limit,
        resetsAt: resetsAt.toISOString(),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
