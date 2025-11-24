import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElevenLabsClient } from 'elevenlabs';
import { FirebaseService } from '@/firebase/firebase.service';
import { RateLimitService } from '@/common/services/rate-limit.service';
import { ContextBuilderService } from './context-builder.service';
import { ElevenLabsService, ConversationConfig } from '@/elevenlabs/elevenlabs.service';
import { MetricsService, ErrorType } from './metrics.service';
import { CoachPersonalityService } from '@/coach-personality/coach-personality.service';
import {
  ElevenLabsApiException,
  RateLimitExceededException,
  ActiveSessionException,
  AgentNotConfiguredException,
  ConversationNotFoundException,
} from './exceptions/voice-coach.exceptions';

export interface SessionData {
  sessionId: string;
  agentId: string;
  context: any;
  createdAt: Date;
}

export interface ConversationData {
  conversationId: string;
  transcript: ConversationMessage[];
  duration: number;
  startedAt: Date;
  endedAt: Date;
}

export interface ConversationMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface StoredConversation extends ConversationData {
  id: string;
  userId: string;
  summary?: string;
}

@Injectable()
export class VoiceCoachService {
  private client: ElevenLabsClient;
  private readonly logger = new Logger(VoiceCoachService.name);
  private readonly agentId: string;
  private readonly maxSessionDuration: number = 1800; // 30 minutes in seconds

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService,
    private rateLimitService: RateLimitService,
    private contextBuilderService: ContextBuilderService,
    private elevenLabsService: ElevenLabsService,
    private metricsService: MetricsService,
    private coachPersonalityService: CoachPersonalityService,
  ) {
    const apiKey = this.configService.get<string>('ELEVEN_LABS_API_KEY');
    if (!apiKey) {
      this.logger.warn('ELEVEN_LABS_API_KEY not configured');
    } else {
      this.client = new ElevenLabsClient({ apiKey });
      this.logger.log('ElevenLabs client initialized for voice coaching');
    }

    this.agentId = this.configService.get<string>('ELEVENLABS_AGENT_ID') || '';
    if (!this.agentId) {
      this.logger.warn('ELEVENLABS_AGENT_ID not configured');
    }
  }

  /**
   * Create a new conversation session with user context
   */
  async createSession(userId: string, personalityId?: string, context?: any): Promise<SessionData> {
    const startTime = Date.now();
    
    try {
      // Check rate limit
      const usageInfo = await this.rateLimitService.checkAndIncrement(
        userId,
        'voice_coach_session',
      );
      if (!usageInfo.allowed) {
        const resetTime = new Date(Date.now() + 3600000); // 1 hour from now
        this.metricsService.logError(
          ErrorType.RATE_LIMIT_EXCEEDED,
          'Voice coach session rate limit exceeded',
          userId,
        );
        throw new RateLimitExceededException(resetTime);
      }

      // Check for active sessions
      const activeSessions = await this.getActiveSessions(userId);
      if (activeSessions.length > 0) {
        this.metricsService.logError(
          ErrorType.SESSION_ERROR,
          'User already has an active session',
          userId,
        );
        throw new ActiveSessionException();
      }

      // Get personality (use provided, default, or create one)
      let agentId = this.agentId;
      try {
        if (personalityId) {
          const personality = await this.coachPersonalityService.findOne(userId, personalityId);
          
          // Generate agent if not exists
          if (!personality.elevenLabsAgentId) {
            this.logger.log(`Personality ${personalityId} has no agent, generating one...`);
            const updatedPersonality = await this.coachPersonalityService.generateAgent(userId, personalityId);
            agentId = updatedPersonality.elevenLabsAgentId!;
          } else {
            agentId = personality.elevenLabsAgentId;
          }
        } else {
          let defaultPersonality = await this.coachPersonalityService.findDefault(userId);
          
          // Create default personality if none exists
          if (!defaultPersonality) {
            this.logger.log(`No default personality found for user ${userId}, creating one...`);
            defaultPersonality = await this.createDefaultPersonality(userId);
          }
          
          // TypeScript doesn't recognize the guarantee above, so we assert non-null
          const personality = defaultPersonality!;
          
          // Generate agent if not exists
          if (!personality.elevenLabsAgentId) {
            this.logger.log(`Default personality has no agent, generating one...`);
            const updated = await this.coachPersonalityService.generateAgent(userId, personality.id);
            agentId = updated.elevenLabsAgentId!;
          } else {
            agentId = personality.elevenLabsAgentId;
          }
        }
      } catch (personalityError) {
        // Log detailed error
        this.logger.error(`Error loading/creating personality:`, {
          message: personalityError.message,
          stack: personalityError.stack,
          userId,
          personalityId,
        });
        
        // Fall back to environment agent
        if (!this.agentId) {
          this.logger.error('No fallback agent available - ELEVENLABS_AGENT_ID not set in environment');
          throw new AgentNotConfiguredException();
        }
        
        this.logger.warn(`Falling back to environment agent: ${this.agentId}`);
        agentId = this.agentId;
      }
      
      // Final validation
      if (!agentId) {
        this.logger.error('No agent ID available after personality loading');
        throw new AgentNotConfiguredException();
      }

      // Build initial user context using ContextBuilderService
      this.logger.log(`Building initial context for user: ${userId}`);
      const userContext = context || await this.contextBuilderService.buildInitialContext(userId);

      const sessionId = `session_${Date.now()}_${userId}`;
      const sessionData: SessionData = {
        sessionId,
        agentId,
        context: userContext,
        createdAt: new Date(),
      };

      // Store session in Firebase
      const db = this.firebaseService.getFirestore();
      const expiresAt = new Date(Date.now() + this.maxSessionDuration * 1000);
      
      await db.collection('voice_sessions').doc(sessionId).set({
        user_id: userId,
        agent_id: agentId,
        personality_id: personalityId,
        status: 'active',
        started_at: sessionData.createdAt,
        last_activity: sessionData.createdAt,
        expires_at: expiresAt,
        context: userContext,
      });

      // Log metrics
      const duration = Date.now() - startTime;
      this.metricsService.logSessionCreated(userId, sessionId, {
        agentId,
        duration,
      });

      this.logger.log(`Created voice coaching session: ${sessionId} for user: ${userId}`);
      return sessionData;
    } catch (error) {
      this.logger.error('Error creating voice coaching session', error);
      
      // Log error metrics if not already logged
      if (!(error instanceof RateLimitExceededException) && !(error instanceof ActiveSessionException)) {
        this.metricsService.logError(
          ErrorType.SESSION_ERROR,
          error.message || 'Failed to create session',
          userId,
          undefined,
          undefined,
          error,
        );
      }
      
      throw error;
    }
  }

  /**
   * Get signed URL for ElevenLabs WebSocket connection
   */
  async getSignedUrl(userId: string, personalityId?: string, customContext?: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Get personality and agent configuration
      let agentId = this.agentId;
      let voiceConfig: any = {};
      let systemPrompt: string | undefined;
      let firstMessage: string | undefined;
      let language = 'en';

      // Try to get personality configuration
      try {
        if (personalityId) {
          const personality = await this.coachPersonalityService.findOne(userId, personalityId);
          
          // Generate agent if not exists
          if (!personality.elevenLabsAgentId) {
            this.logger.log(`Personality ${personalityId} has no agent, generating one...`);
            const updatedPersonality = await this.coachPersonalityService.generateAgent(userId, personalityId);
            agentId = updatedPersonality.elevenLabsAgentId!;
          } else {
            agentId = personality.elevenLabsAgentId;
          }
          
          systemPrompt = personality.systemPrompt;
          firstMessage = personality.firstMessage;
          language = personality.language || 'en';
          
          if (personality.voiceId) {
            voiceConfig = {
              voiceId: personality.voiceId,
              stability: personality.voiceStability,
              similarityBoost: personality.voiceSimilarityBoost,
            };
          }
        } else {
          let defaultPersonality = await this.coachPersonalityService.findDefault(userId);
          
          // Create default personality if none exists
          if (!defaultPersonality) {
            this.logger.log(`No default personality found for user ${userId}, creating one...`);
            defaultPersonality = await this.createDefaultPersonality(userId);
          }
          
          // TypeScript doesn't recognize the guarantee above, so we assert non-null
          const personality = defaultPersonality!;
          
          // Generate agent if not exists
          if (!personality.elevenLabsAgentId) {
            this.logger.log(`Default personality has no agent, generating one...`);
            const updated = await this.coachPersonalityService.generateAgent(userId, personality.id);
            agentId = updated.elevenLabsAgentId!;
            systemPrompt = updated.systemPrompt;
            firstMessage = updated.firstMessage;
            language = updated.language || 'en';
            
            if (updated.voiceId) {
              voiceConfig = {
                voiceId: updated.voiceId,
                stability: updated.voiceStability,
                similarityBoost: updated.voiceSimilarityBoost,
              };
            }
          } else {
            agentId = personality.elevenLabsAgentId;
            systemPrompt = personality.systemPrompt;
            firstMessage = personality.firstMessage;
            language = personality.language || 'en';
            
            if (personality.voiceId) {
              voiceConfig = {
                voiceId: personality.voiceId,
                stability: personality.voiceStability,
                similarityBoost: personality.voiceSimilarityBoost,
              };
            }
          }
        }
      } catch (personalityError) {
        // Log detailed error
        this.logger.error(`Error loading/creating personality:`, {
          message: personalityError.message,
          stack: personalityError.stack,
          userId,
          personalityId,
        });
        
        // Fall back to environment agent
        if (!this.agentId) {
          this.logger.error('No fallback agent available - ELEVENLABS_AGENT_ID not set in environment');
          throw new AgentNotConfiguredException();
        }
        
        this.logger.warn(`Falling back to environment agent: ${this.agentId}`);
        agentId = this.agentId;
      }

      // Final validation
      if (!agentId) {
        this.metricsService.logError(
          ErrorType.VALIDATION_ERROR,
          'Agent ID not configured',
          userId,
        );
        throw new AgentNotConfiguredException();
      }

      this.logger.log(`Generating signed URL for agent: ${agentId}, user: ${userId}`);

      // Build user context using ContextBuilderService
      const userContext = await this.contextBuilderService.buildInitialContext(userId);
      
      // Format context for ElevenLabs prompt
      const formattedContext = this.contextBuilderService.formatContextForPrompt(userContext);

      // Combine system prompt with user context
      const finalPrompt = systemPrompt 
        ? `${systemPrompt}\n\n${formattedContext}`
        : formattedContext;

      // Build conversation configuration
      const conversationConfig: ConversationConfig = {
        agentId,
        customPrompt: customContext || finalPrompt,
        language,
        firstMessage: firstMessage || this.buildFirstMessage(userContext),
        ...(Object.keys(voiceConfig).length > 0 && { voice: voiceConfig }),
      };

      // Get signed URL from ElevenLabsService
      const apiStartTime = Date.now();
      const signedUrl = await this.elevenLabsService.getSignedUrl(conversationConfig);
      const apiDuration = Date.now() - apiStartTime;

      // Log ElevenLabs API metrics
      this.metricsService.logElevenLabsApiCall('getSignedUrl', apiDuration, userId, {
        agentId,
      });

      // Log signed URL generation metrics
      const totalDuration = Date.now() - startTime;
      this.metricsService.logSignedUrlGenerated(userId, totalDuration, {
        agentId,
      });

      this.logger.log(`Successfully generated signed URL for user: ${userId}`);
      return signedUrl;
    } catch (error) {
      this.logger.error('Error generating signed URL', error);
      
      // Log error metrics
      if (error instanceof AgentNotConfiguredException) {
        // Already logged above
        throw error;
      }
      
      this.metricsService.logError(
        ErrorType.ELEVENLABS_API_ERROR,
        error.message || 'Failed to generate signed URL',
        userId,
        undefined,
        undefined,
        error,
      );
      
      throw new ElevenLabsApiException('Failed to generate signed URL', error);
    }
  }

  /**
   * Create default personalities for a new user
   * Creates multiple coach personalities with different styles
   */
  private async createDefaultPersonalities(userId: string): Promise<any> {
    this.logger.log(`Creating default coach personalities for user: ${userId}`);
    
    // Create supportive coach (default)
    const supportiveCoach = await this.coachPersonalityService.create(userId, {
      name: 'Supportive Coach',
      description: 'A warm and encouraging coach who provides emotional support and practical guidance',
      style: 'supportive' as any,
      systemPrompt: `You are a supportive and encouraging AI coach. Your role is to help users achieve their goals through:

- Providing emotional support and validation
- Offering practical guidance and actionable steps
- Celebrating progress and wins
- Helping users work through challenges
- Maintaining a positive but realistic outlook
- Asking thoughtful questions to help users think through problems

You have access to the user's goals, journal entries, and progress data. Use this context to provide personalized, relevant coaching. Reference specific goals and milestones when appropriate.

Be warm, friendly, and approachable. Balance empathy with action-oriented guidance. Help users stay accountable while being understanding of setbacks.`,
      voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - clear, professional
      voiceStability: 0.6,
      voiceSimilarityBoost: 0.75,
      firstMessage: "Hi! I'm your supportive coach. I'm here to help you achieve your goals. What would you like to work on today?",
      language: 'en',
      isDefault: true,
    });
    
    // Create motivational coach
    await this.coachPersonalityService.create(userId, {
      name: 'Motivational Coach',
      description: 'An energetic and inspiring coach who pushes you to reach your full potential',
      style: 'motivational' as any,
      systemPrompt: `You are a high-energy, motivational coach. Your mission is to inspire and energize users to achieve their goals through:

- Using enthusiastic and uplifting language
- Celebrating every win, big or small
- Turning setbacks into opportunities for growth
- Reminding users of their potential and capabilities
- Using motivational phrases and positive reinforcement
- Creating excitement about the journey ahead

You have access to the user's goals, journal entries, and progress. Use this to provide personalized motivation that resonates with their specific situation.

Be energetic, optimistic, and inspiring. Use exclamation points. Make users feel like they can conquer anything!`,
      voiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi - energetic, enthusiastic
      voiceStability: 0.7,
      voiceSimilarityBoost: 0.8,
      firstMessage: "Hey champion! I'm so excited to work with you today! What amazing goal are we crushing?",
      language: 'en',
      isDefault: false,
    });
    
    // Create analytical coach
    await this.coachPersonalityService.create(userId, {
      name: 'Analytical Coach',
      description: 'A data-driven coach focused on metrics, patterns, and systematic progress',
      style: 'analytical' as any,
      systemPrompt: `You are an analytical, data-driven coach. Your approach is systematic and metrics-focused:

- Analyze progress data and identify patterns
- Break down goals into measurable milestones
- Use specific numbers and percentages
- Identify trends and optimization opportunities
- Provide structured action plans
- Focus on efficiency and effectiveness

You have access to the user's goals with progress percentages, milestones, and completion data. Use this to provide data-driven insights and recommendations.

Be logical, organized, and detail-oriented. Use phrases like "Based on your data...", "Your metrics show...", "Let's analyze...". Help users make informed decisions based on their progress patterns.`,
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - professional, clear
      voiceStability: 0.7,
      voiceSimilarityBoost: 0.75,
      firstMessage: "Hello. Let's review your progress data and identify optimization opportunities for your goals.",
      language: 'en',
      isDefault: false,
    });
    
    this.logger.log(`Created 3 default coach personalities for user: ${userId}`);
    
    return supportiveCoach;
  }
  
  /**
   * Create a single default personality for a user (legacy method)
   */
  private async createDefaultPersonality(userId: string): Promise<any> {
    return this.createDefaultPersonalities(userId);
  }

  /**
   * Build a personalized first message based on user context
   */
  private buildFirstMessage(context: any): string {
    const userName = context.preferences?.name || 'there';
    const activeGoalsCount = context.stats?.activeGoals || 0;
    
    if (activeGoalsCount === 0) {
      return `Hi ${userName}! I'm your AI coach. I'm here to help you set and achieve your goals. What would you like to work on today?`;
    } else if (activeGoalsCount === 1) {
      return `Hi ${userName}! I see you have a goal you're working on. How's it going? I'm here to help you make progress.`;
    } else {
      return `Hi ${userName}! I see you're working on ${activeGoalsCount} goals. That's great! Which one would you like to focus on today?`;
    }
  }

  /**
   * Save conversation transcript to Firebase
   */
  async saveConversation(userId: string, conversation: ConversationData): Promise<void> {
    try {
      // Log conversation end metrics
      this.metricsService.logConversationEnd(
        userId,
        conversation.conversationId,
        conversation.duration,
        {
          messageCount: conversation.transcript.length,
          startedAt: conversation.startedAt,
          endedAt: conversation.endedAt,
        },
      );

      const db = this.firebaseService.getFirestore();
      
      // Get active goals for context snapshot
      const goalsSnapshot = await db
        .collection('goals')
        .where('user_id', '==', userId)
        .where('status', '==', 'active')
        .get();

      const activeGoalIds = goalsSnapshot.docs.map(doc => doc.id);

      const conversationDoc = {
        user_id: userId,
        conversation_id: conversation.conversationId,
        agent_id: this.agentId,
        transcript: conversation.transcript.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          audio_url: msg.audioUrl,
        })),
        duration: conversation.duration,
        started_at: conversation.startedAt,
        ended_at: conversation.endedAt,
        created_at: new Date(),
        context_snapshot: {
          goals_count: activeGoalIds.length,
          active_goals: activeGoalIds,
          journal_entries_referenced: [], // Will be populated by context builder
        },
      };

      await db.collection('voice_conversations').add(conversationDoc);

      // Update session status to completed
      const sessionsSnapshot = await db
        .collection('voice_sessions')
        .where('user_id', '==', userId)
        .where('status', '==', 'active')
        .get();

      const batch = db.batch();
      sessionsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'completed' });
      });
      await batch.commit();

      this.logger.log(`Saved conversation: ${conversation.conversationId} for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error saving conversation', error);
      
      this.metricsService.logError(
        ErrorType.UNKNOWN_ERROR,
        error.message || 'Failed to save conversation',
        userId,
        conversation.conversationId,
        undefined,
        error,
      );
      
      throw error;
    }
  }

  /**
   * Retrieve conversation history with search and filtering
   */
  async getConversationHistory(
    userId: string,
    options?: {
      limit?: number;
      search?: string;
      startDate?: Date;
      endDate?: Date;
      sortBy?: 'newest' | 'oldest' | 'longest' | 'shortest';
    },
  ): Promise<StoredConversation[]> {
    try {
      const db = this.firebaseService.getFirestore();
      const limit = options?.limit || 20;
      
      // Build base query
      let query = db
        .collection('voice_conversations')
        .where('user_id', '==', userId);

      // Add date range filters
      if (options?.startDate) {
        query = query.where('started_at', '>=', options.startDate);
      }
      if (options?.endDate) {
        query = query.where('started_at', '<=', options.endDate);
      }

      // Add sorting
      const sortBy = options?.sortBy || 'newest';
      if (sortBy === 'newest') {
        query = query.orderBy('created_at', 'desc');
      } else if (sortBy === 'oldest') {
        query = query.orderBy('created_at', 'asc');
      } else if (sortBy === 'longest' || sortBy === 'shortest') {
        // For duration sorting, we need to fetch all and sort in memory
        query = query.orderBy('created_at', 'desc');
      }

      query = query.limit(limit);

      const snapshot = await query.get();

      let conversations: StoredConversation[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.user_id,
          conversationId: data.conversation_id,
          transcript: data.transcript.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toDate(),
            audioUrl: msg.audio_url,
          })),
          duration: data.duration,
          startedAt: data.started_at.toDate(),
          endedAt: data.ended_at.toDate(),
          summary: data.summary,
        };
      });

      // Apply search filter (in-memory)
      if (options?.search) {
        const searchLower = options.search.toLowerCase();
        conversations = conversations.filter(conv => {
          // Search in summary
          if (conv.summary?.toLowerCase().includes(searchLower)) {
            return true;
          }
          // Search in transcript
          return conv.transcript.some(msg =>
            msg.content.toLowerCase().includes(searchLower),
          );
        });
      }

      // Apply duration sorting (in-memory)
      if (sortBy === 'longest') {
        conversations.sort((a, b) => b.duration - a.duration);
      } else if (sortBy === 'shortest') {
        conversations.sort((a, b) => a.duration - b.duration);
      }

      this.logger.log(`Retrieved ${conversations.length} conversations for user: ${userId}`);
      return conversations;
    } catch (error) {
      this.logger.error('Error retrieving conversation history', error);
      throw error;
    }
  }

  /**
   * Load specific conversation
   */
  async loadConversation(userId: string, conversationId: string): Promise<StoredConversation> {
    try {
      const db = this.firebaseService.getFirestore();
      
      const snapshot = await db
        .collection('voice_conversations')
        .where('user_id', '==', userId)
        .where('conversation_id', '==', conversationId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new ConversationNotFoundException(conversationId);
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        userId: data.user_id,
        conversationId: data.conversation_id,
        transcript: data.transcript.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toDate(),
          audioUrl: msg.audio_url,
        })),
        duration: data.duration,
        startedAt: data.started_at.toDate(),
        endedAt: data.ended_at.toDate(),
        summary: data.summary,
      };
    } catch (error) {
      this.logger.error('Error loading conversation', error);
      throw error;
    }
  }

  /**
   * Get active sessions for a user
   */
  private async getActiveSessions(userId: string): Promise<any[]> {
    const db = this.firebaseService.getFirestore();
    const now = new Date();
    
    const snapshot = await db
      .collection('voice_sessions')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .where('expires_at', '>', now)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    try {
      const db = this.firebaseService.getFirestore();
      
      const snapshot = await db
        .collection('voice_conversations')
        .where('user_id', '==', userId)
        .where('conversation_id', '==', conversationId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new ConversationNotFoundException(conversationId);
      }

      await snapshot.docs[0].ref.delete();

      this.logger.log(`Deleted conversation: ${conversationId} for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error deleting conversation', error);
      throw error;
    }
  }

  /**
   * Validate agent configuration
   */
  async validateAgent(agentId: string): Promise<boolean> {
    try {
      // Use ElevenLabsService to validate agent
      return await this.elevenLabsService.validateAgent(agentId);
    } catch (error) {
      this.logger.error('Error validating agent', error);
      return false;
    }
  }

  /**
   * Get metrics for monitoring
   */
  async getMetrics(startDate?: Date, endDate?: Date): Promise<{
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
    const aggregatedMetrics = this.metricsService.getAggregatedMetrics(startDate, endDate);
    const recentErrors = this.metricsService.getRecentErrors(10);

    return {
      metrics: {
        totalConversations: aggregatedMetrics.totalConversations,
        averageConversationDuration: Math.round(aggregatedMetrics.averageConversationDuration),
        averageContextBuildTime: Math.round(aggregatedMetrics.averageContextBuildTime),
        averageElevenLabsResponseTime: Math.round(aggregatedMetrics.averageElevenLabsResponseTime),
        totalErrors: aggregatedMetrics.totalErrors,
        errorRateByType: aggregatedMetrics.errorRateByType as Record<string, number>,
      },
      recentErrors: recentErrors.map(error => ({
        errorType: error.errorType,
        errorMessage: error.errorMessage,
        userId: error.userId,
        conversationId: error.conversationId,
        timestamp: error.timestamp.toISOString(),
      })),
      period: {
        start: aggregatedMetrics.period.start.toISOString(),
        end: aggregatedMetrics.period.end.toISOString(),
      },
    };
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<{
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
    const healthData = {
      status: 'healthy',
      services: {
        elevenLabs: {
          configured: false,
          apiKeyPresent: false,
          agentConfigured: false,
          connectivity: 'unknown',
        },
        firebase: {
          configured: false,
          connectivity: 'unknown',
        },
      },
      metrics: {
        totalConversations: 0,
        averageConversationDuration: 0,
        averageContextBuildTime: 0,
        averageElevenLabsResponseTime: 0,
        totalErrors: 0,
        errorRateByType: {},
      },
      timestamp: new Date().toISOString(),
    };

    // Check ElevenLabs configuration
    const elevenLabsApiKey = this.configService.get<string>('ELEVEN_LABS_API_KEY');
    healthData.services.elevenLabs.apiKeyPresent = !!elevenLabsApiKey;
    healthData.services.elevenLabs.agentConfigured = !!this.agentId;
    healthData.services.elevenLabs.configured = 
      healthData.services.elevenLabs.apiKeyPresent && 
      healthData.services.elevenLabs.agentConfigured;

    // Check ElevenLabs connectivity
    if (healthData.services.elevenLabs.configured) {
      try {
        const isValid = await this.elevenLabsService.validateAgent(this.agentId);
        healthData.services.elevenLabs.connectivity = isValid ? 'connected' : 'error';
        
        if (!isValid) {
          healthData.status = 'degraded';
        }
      } catch (error) {
        this.logger.error('ElevenLabs connectivity check failed', error);
        healthData.services.elevenLabs.connectivity = 'error';
        healthData.status = 'degraded';
      }
    } else {
      healthData.services.elevenLabs.connectivity = 'not_configured';
      healthData.status = 'degraded';
    }

    // Check Firebase connectivity
    try {
      const db = this.firebaseService.getFirestore();
      // Try a simple query to verify connectivity
      await db.collection('voice_sessions').limit(1).get();
      healthData.services.firebase.configured = true;
      healthData.services.firebase.connectivity = 'connected';
    } catch (error) {
      this.logger.error('Firebase connectivity check failed', error);
      healthData.services.firebase.configured = false;
      healthData.services.firebase.connectivity = 'error';
      healthData.status = 'unhealthy';
    }

    // Get aggregated metrics from MetricsService
    try {
      const aggregatedMetrics = this.metricsService.getAggregatedMetrics();
      healthData.metrics = {
        totalConversations: aggregatedMetrics.totalConversations,
        averageConversationDuration: Math.round(aggregatedMetrics.averageConversationDuration),
        averageContextBuildTime: Math.round(aggregatedMetrics.averageContextBuildTime),
        averageElevenLabsResponseTime: Math.round(aggregatedMetrics.averageElevenLabsResponseTime),
        totalErrors: aggregatedMetrics.totalErrors,
        errorRateByType: aggregatedMetrics.errorRateByType as Record<string, number>,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve metrics', error);
      // Metrics failure shouldn't affect overall health status
    }

    return healthData;
  }
}
