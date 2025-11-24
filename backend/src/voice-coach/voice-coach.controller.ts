import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
  Query,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { VoiceCoachService, ConversationData } from './voice-coach.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';
import {
  CreateSessionDto,
  GetSignedUrlDto,
  SaveConversationDto,
  GetConversationHistoryDto,
} from '@/common/dto/voice-coach.dto';
import { VoiceCoachExceptionFilter } from './filters/voice-coach-exception.filter';
import {
  ElevenLabsApiException,
  AgentNotConfiguredException,
  RateLimitExceededException,
} from './exceptions/voice-coach.exceptions';

interface SessionResponse {
  sessionId: string;
  agentId: string;
  context: any;
}

interface SignedUrlResponse {
  signedUrl: string;
  expiresAt: string;
}

interface ConversationHistoryResponse {
  conversations: any[];
  total: number;
}

@Controller('voice-coach')
@UseGuards(AuthGuard)
@UseFilters(VoiceCoachExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class VoiceCoachController {
  private readonly logger = new Logger(VoiceCoachController.name);

  constructor(private readonly voiceCoachService: VoiceCoachService) {}

  /**
   * POST /voice-coach/session
   * Create new conversation session
   */
  @Post('session')
  async createSession(
    @CurrentUser() user: any,
    @Body() dto: CreateSessionDto,
  ): Promise<SessionResponse> {
    this.logger.log(`Creating voice coaching session for user: ${user.uid}`);

    const session = await this.voiceCoachService.createSession(
      user.uid,
      dto.personalityId,
      dto.context || {},
    );

    this.logger.log(`Session created successfully: ${session.sessionId}`);

    return {
      sessionId: session.sessionId,
      agentId: session.agentId,
      context: session.context,
    };
  }

  /**
   * GET /voice-coach/signed-url
   * Get signed URL for ElevenLabs connection
   */
  @Get('signed-url')
  async getSignedUrl(
    @CurrentUser() user: any,
    @Query() query: GetSignedUrlDto,
  ): Promise<SignedUrlResponse> {
    this.logger.log(`Generating signed URL for user: ${user.uid}`);

    const signedUrl = await this.voiceCoachService.getSignedUrl(
      user.uid,
      query.personalityId,
      query.context,
    );

    // Signed URLs typically expire in 5-10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    this.logger.log(`Signed URL generated successfully for user: ${user.uid}`);

    return {
      signedUrl,
      expiresAt,
    };
  }

  /**
   * POST /voice-coach/conversation
   * Save conversation transcript
   */
  @Post('conversation')
  async saveConversation(
    @CurrentUser() user: any,
    @Body() dto: SaveConversationDto,
  ): Promise<{ success: boolean; message: string; conversationId: string }> {
    this.logger.log(
      `Saving conversation ${dto.conversationId} for user: ${user.uid}`,
    );

    const conversationData: ConversationData = {
      conversationId: dto.conversationId,
      transcript: dto.transcript.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        audioUrl: msg.audioUrl,
      })),
      duration: dto.duration,
      startedAt: new Date(dto.startedAt),
      endedAt: new Date(dto.endedAt),
    };

    await this.voiceCoachService.saveConversation(user.uid, conversationData);

    this.logger.log(
      `Conversation ${dto.conversationId} saved successfully for user: ${user.uid}`,
    );

    return {
      success: true,
      message: 'Conversation saved successfully',
      conversationId: dto.conversationId,
    };
  }

  /**
   * GET /voice-coach/history
   * Get conversation history with search and filtering
   */
  @Get('history')
  async getConversationHistory(
    @CurrentUser() user: any,
    @Query() query: GetConversationHistoryDto,
  ): Promise<ConversationHistoryResponse> {
    this.logger.log(`Fetching conversation history for user: ${user.uid}`);

    const options = {
      limit: query.limit || 20,
      search: query.search,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      sortBy: query.sortBy,
    };

    const conversations = await this.voiceCoachService.getConversationHistory(
      user.uid,
      options,
    );

    this.logger.log(
      `Retrieved ${conversations.length} conversations for user: ${user.uid}`,
    );

    return {
      conversations,
      total: conversations.length,
    };
  }

  /**
   * GET /voice-coach/conversation/:id
   * Get specific conversation by ID
   */
  @Get('conversation/:id')
  async getConversation(
    @CurrentUser() user: any,
    @Query('id') id: string,
  ): Promise<any> {
    this.logger.log(`Fetching conversation ${id} for user: ${user.uid}`);

    const conversation = await this.voiceCoachService.loadConversation(
      user.uid,
      id,
    );

    this.logger.log(`Retrieved conversation ${id} for user: ${user.uid}`);

    return conversation;
  }

  /**
   * DELETE /voice-coach/conversation/:id
   * Delete a conversation
   */
  @Delete('conversation/:id')
  async deleteConversation(
    @CurrentUser() user: any,
    @Query('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting conversation ${id} for user: ${user.uid}`);

    await this.voiceCoachService.deleteConversation(user.uid, id);

    this.logger.log(`Deleted conversation ${id} for user: ${user.uid}`);

    return {
      success: true,
      message: 'Conversation deleted successfully',
    };
  }

  /**
   * GET /voice-coach/health
   * Health check endpoint with comprehensive service status and metrics
   */
  @Get('health')
  async healthCheck(): Promise<{
    status: string;
    services: {
      elevenLabs: {
        configured: boolean;
        apiKeyPresent: boolean;
        agentConfigured: boolean;
        connectivity: string;
      };
      firebase: {
        configured: boolean;
        connectivity: string;
      };
    };
    metrics: {
      totalConversations: number;
      averageConversationDuration: number;
      averageContextBuildTime: number;
      averageElevenLabsResponseTime: number;
      totalErrors: number;
      errorRateByType: Record<string, number>;
    };
    timestamp: string;
  }> {
    this.logger.log('Performing comprehensive health check');

    const healthData = await this.voiceCoachService.performHealthCheck();

    this.logger.log(`Health check completed: ${healthData.status}`);

    return healthData;
  }

  /**
   * GET /voice-coach/metrics
   * Get detailed metrics for monitoring
   */
  @Get('metrics')
  async getMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    metrics: {
      totalConversations: number;
      averageConversationDuration: number;
      averageContextBuildTime: number;
      averageElevenLabsResponseTime: number;
      totalErrors: number;
      errorRateByType: Record<string, number>;
    };
    recentErrors: any[];
    period: {
      start: string;
      end: string;
    };
  }> {
    this.logger.log('Fetching voice coach metrics');

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const metrics = await this.voiceCoachService.getMetrics(start, end);

    return metrics;
  }
}
