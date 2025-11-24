import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  VoiceCoachException,
  ElevenLabsApiException,
  SessionExpiredException,
  RateLimitExceededException,
  MicrophonePermissionException,
  ActiveSessionException,
  AgentNotConfiguredException,
  ConversationNotFoundException,
} from '../exceptions/voice-coach.exceptions';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
  errorCode?: string;
  retryAfter?: string;
}

@Catch(VoiceCoachException, HttpException)
export class VoiceCoachExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(VoiceCoachExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Build error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: this.getErrorMessage(exception),
      error: this.getErrorName(exception),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Add error code for specific exceptions
    if (exception instanceof RateLimitExceededException) {
      errorResponse.errorCode = 'RATE_LIMIT_EXCEEDED';
      // Extract retry time from message
      const match = exception.message.match(/after (.+)$/);
      if (match) {
        errorResponse.retryAfter = match[1];
      }
    } else if (exception instanceof SessionExpiredException) {
      errorResponse.errorCode = 'SESSION_EXPIRED';
    } else if (exception instanceof ElevenLabsApiException) {
      errorResponse.errorCode = 'ELEVENLABS_API_ERROR';
    } else if (exception instanceof MicrophonePermissionException) {
      errorResponse.errorCode = 'MICROPHONE_PERMISSION_DENIED';
    } else if (exception instanceof ActiveSessionException) {
      errorResponse.errorCode = 'ACTIVE_SESSION_EXISTS';
    } else if (exception instanceof AgentNotConfiguredException) {
      errorResponse.errorCode = 'AGENT_NOT_CONFIGURED';
    } else if (exception instanceof ConversationNotFoundException) {
      errorResponse.errorCode = 'CONVERSATION_NOT_FOUND';
    }

    // Log error with context
    this.logError(exception, request, errorResponse);

    // Send response
    response.status(status).json(errorResponse);
  }

  private getErrorMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }
    if (typeof response === 'object' && 'message' in response) {
      const message = (response as any).message;
      return Array.isArray(message) ? message.join(', ') : message;
    }
    return exception.message;
  }

  private getErrorName(exception: HttpException): string {
    if (exception instanceof VoiceCoachException) {
      return exception.constructor.name;
    }
    return exception.name || 'HttpException';
  }

  private logError(
    exception: HttpException,
    request: any,
    errorResponse: ErrorResponse,
  ) {
    const { method, url, body, params, query } = request;
    const userId = request.user?.uid || 'anonymous';

    const logContext = {
      userId,
      method,
      url,
      params,
      query,
      body: this.sanitizeBody(body),
      statusCode: errorResponse.statusCode,
      errorCode: errorResponse.errorCode,
      message: errorResponse.message,
      timestamp: errorResponse.timestamp,
    };

    // Log at appropriate level based on status code
    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `Voice Coach Error: ${errorResponse.message}`,
        exception.stack,
        logContext,
      );
    } else if (errorResponse.statusCode >= 400) {
      this.logger.warn(`Voice Coach Warning: ${errorResponse.message}`, logContext);
    } else {
      this.logger.log(`Voice Coach Info: ${errorResponse.message}`, logContext);
    }
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    // Remove sensitive fields from logging
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
