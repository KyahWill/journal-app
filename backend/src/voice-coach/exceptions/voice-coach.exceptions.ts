import { HttpException, HttpStatus } from '@nestjs/common';

export class VoiceCoachException extends HttpException {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
  }
}

export class ElevenLabsApiException extends VoiceCoachException {
  constructor(message: string, originalError?: any) {
    super(`ElevenLabs API Error: ${message}`, HttpStatus.BAD_GATEWAY);
    this.cause = originalError;
  }
}

export class SessionExpiredException extends VoiceCoachException {
  constructor() {
    super('Voice coaching session has expired', HttpStatus.GONE);
  }
}

export class RateLimitExceededException extends VoiceCoachException {
  constructor(resetTime: Date) {
    super(
      `Voice coaching rate limit exceeded. Try again after ${resetTime.toISOString()}`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class MicrophonePermissionException extends VoiceCoachException {
  constructor() {
    super('Microphone permission denied', HttpStatus.FORBIDDEN);
  }
}

export class ActiveSessionException extends VoiceCoachException {
  constructor() {
    super(
      'You already have an active voice coaching session. Please end the current session before starting a new one.',
      HttpStatus.CONFLICT,
    );
  }
}

export class AgentNotConfiguredException extends VoiceCoachException {
  constructor() {
    super('Voice coaching agent is not configured', HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class ConversationNotFoundException extends VoiceCoachException {
  constructor(conversationId: string) {
    super(`Conversation ${conversationId} not found`, HttpStatus.NOT_FOUND);
  }
}
