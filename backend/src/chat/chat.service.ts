import { Injectable, NotFoundException, Logger, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { GeminiService } from '@/gemini/gemini.service'
import { JournalService } from '@/journal/journal.service'
import { WeeklyInsightsService } from './weekly-insights.service'
import { SendMessageDto } from '@/common/dto/chat.dto'
import { ChatSession, ChatMessage, WeeklyInsight } from '@/common/types/journal.types'
import { v4 as uuidv4 } from 'uuid'
import { CoachPersonalityService } from '@/coach-personality/coach-personality.service'
import { RateLimitService } from '@/common/services/rate-limit.service'
import { GoalService } from '@/goal/goal.service'
import { RagService } from '@/rag/rag.service'
import { RagRateLimitException } from '@/rag/exceptions/rate-limit.exception'

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)
  private readonly collectionName = 'chat_sessions'

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly geminiService: GeminiService,
    private readonly journalService: JournalService,
    private readonly coachPersonalityService: CoachPersonalityService,
    private readonly rateLimitService: RateLimitService,
    @Inject(forwardRef(() => GoalService))
    private readonly goalService: GoalService,
    private readonly ragService: RagService,
    private readonly weeklyInsightsService: WeeklyInsightsService,
  ) {}

  async sendMessage(userId: string, sendMessageDto: SendMessageDto) {
    try {
      // Check rate limit first
      const usageInfo = await this.rateLimitService.checkAndIncrement(userId, 'chat')
      if (!usageInfo.allowed) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: usageInfo.warning || 'Daily chat limit reached',
            error: 'Too Many Requests',
            usageInfo,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      const { message, sessionId, personalityId } = sendMessageDto

      // Get or create session
      let session: ChatSession
      if (sessionId) {
        session = await this.getSession(sessionId, userId)
      } else {
        session = await this.createSession(userId, personalityId)
      }

      // Get user's journal entries for context
      const journalEntries = await this.journalService.getRecent(userId, 20)

      // Build goal context for AI
      const goalContext = await this.buildGoalContext(userId)

      // Retrieve RAG context using semantic search
      const { ragContext, warning: ragWarning } = await this.retrieveRagContext(userId, message)

      // Get custom prompt from coach personality if specified
      let customPromptText: string | undefined
      const sessionPersonalityId = personalityId || session.personality_id
      
      if (sessionPersonalityId) {
        try {
          const personality = await this.coachPersonalityService.findOne(userId, sessionPersonalityId)
          customPromptText = personality.systemPrompt
        } catch (error) {
          this.logger.warn(`Could not load personality ${sessionPersonalityId}, using default`)
          // Try to get default personality
          try {
            const defaultPersonality = await this.coachPersonalityService.findDefault(userId)
            if (defaultPersonality) {
              customPromptText = defaultPersonality.systemPrompt
            }
          } catch (defaultError) {
            this.logger.warn('Could not load default personality, using built-in default')
          }
        }
      } else {
        // No personality specified, try to use the user's default
        try {
          const defaultPersonality = await this.coachPersonalityService.findDefault(userId)
          if (defaultPersonality) {
            customPromptText = defaultPersonality.systemPrompt
          }
        } catch (error) {
          this.logger.debug('No default personality found, using built-in default')
        }
      }

      // Create user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      }

      // Get AI response with custom prompt, goal context, and RAG context
      let aiResponse = await this.geminiService.sendMessage(
        message,
        journalEntries,
        session.messages,
        customPromptText,
        goalContext,
        ragContext,
      )

      // Append rate limit warning if present
      if (ragWarning) {
        aiResponse = `${aiResponse}\n\n---\n${ragWarning}`
      }

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      }

      // Update session with new messages
      session.messages.push(userMessage, assistantMessage)
      
      // Auto-generate title from first user message if not set
      if (!session.title && session.messages.length === 2) {
        session.title = this.generateTitle(message)
        const updateData: any = {
          messages: session.messages,
          title: session.title,
        }
        if (sessionPersonalityId) {
          updateData.personality_id = sessionPersonalityId
        }
        await this.firebaseService.updateDocument(this.collectionName, session.id, updateData)
      } else {
        await this.updateSession(session.id, userId, session.messages, sessionPersonalityId)
      }

      // Embed the message pair for RAG (async, non-blocking)
      this.embedChatMessagePair(
        userId,
        session.id,
        session.title,
        userMessage,
        assistantMessage,
        sessionPersonalityId,
      )

      this.logger.log(`Message sent in session: ${session.id} for user: ${userId}`)

      return {
        sessionId: session.id,
        userMessage,
        assistantMessage,
        usageInfo,
      }
    } catch (error) {
      this.logger.error('Error sending message', error)
      throw error
    }
  }

  async *sendMessageStream(userId: string, sendMessageDto: SendMessageDto): AsyncGenerator<any, void, unknown> {
    try {
      // Check rate limit first
      const usageInfo = await this.rateLimitService.checkAndIncrement(userId, 'chat')
      if (!usageInfo.allowed) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: usageInfo.warning || 'Daily chat limit reached',
            error: 'Too Many Requests',
            usageInfo,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      const { message, sessionId, personalityId } = sendMessageDto

      // Get or create session
      let session: ChatSession
      if (sessionId) {
        session = await this.getSession(sessionId, userId)
      } else {
        session = await this.createSession(userId, personalityId)
      }

      // Get user's journal entries for context
      const journalEntries = await this.journalService.getRecent(userId, 20)

      // Build goal context for AI
      const goalContext = await this.buildGoalContext(userId)

      // Retrieve RAG context using semantic search
      const { ragContext, warning: ragWarning } = await this.retrieveRagContext(userId, message)

      // Get custom prompt from coach personality if specified
      let customPromptText: string | undefined
      const sessionPersonalityId = personalityId || session.personality_id
      
      if (sessionPersonalityId) {
        try {
          const personality = await this.coachPersonalityService.findOne(userId, sessionPersonalityId)
          customPromptText = personality.systemPrompt
        } catch (error) {
          this.logger.warn(`Could not load personality ${sessionPersonalityId}, using default`)
          // Try to get default personality
          try {
            const defaultPersonality = await this.coachPersonalityService.findDefault(userId)
            if (defaultPersonality) {
              customPromptText = defaultPersonality.systemPrompt
            }
          } catch (defaultError) {
            this.logger.warn('Could not load default personality, using built-in default')
          }
        }
      } else {
        // No personality specified, try to use the user's default
        try {
          const defaultPersonality = await this.coachPersonalityService.findDefault(userId)
          if (defaultPersonality) {
            customPromptText = defaultPersonality.systemPrompt
          }
        } catch (error) {
          this.logger.debug('No default personality found, using built-in default')
        }
      }

      // Create user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      }

      // Send session info first
      yield {
        type: 'session',
        sessionId: session.id,
        userMessage,
        usageInfo,
      }

      // Stream AI response with RAG context
      let fullResponse = ''
      for await (const chunk of this.geminiService.sendMessageStream(
        message,
        journalEntries,
        session.messages,
        customPromptText,
        goalContext,
        ragContext,
      )) {
        fullResponse += chunk
        yield {
          type: 'chunk',
          content: chunk,
        }
      }

      // Send rate limit warning if present
      if (ragWarning) {
        const warningChunk = `\n\n---\n${ragWarning}`
        fullResponse += warningChunk
        yield {
          type: 'chunk',
          content: warningChunk,
        }
      }

      // Create assistant message with full response
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      }

      // Update session with new messages
      session.messages.push(userMessage, assistantMessage)
      
      // Auto-generate title from first user message if not set
      if (!session.title && session.messages.length === 2) {
        session.title = this.generateTitle(message)
        const updateData: any = {
          messages: session.messages,
          title: session.title,
        }
        if (sessionPersonalityId) {
          updateData.personality_id = sessionPersonalityId
        }
        await this.firebaseService.updateDocument(this.collectionName, session.id, updateData)
      } else {
        await this.updateSession(session.id, userId, session.messages, sessionPersonalityId)
      }

      // Embed the message pair for RAG (async, non-blocking)
      this.embedChatMessagePair(
        userId,
        session.id,
        session.title,
        userMessage,
        assistantMessage,
        sessionPersonalityId,
      )

      // Send completion
      yield {
        type: 'done',
        assistantMessage,
      }

      this.logger.log(`Message sent in session: ${session.id} for user: ${userId}`)
    } catch (error) {
      this.logger.error('Error sending message stream', error)
      throw error
    }
  }

  async createSession(userId: string, personalityId?: string): Promise<ChatSession> {
    try {
      const session: any = {
        user_id: userId,
        messages: [],
      }
      
      // Only add optional fields if they have values
      if (personalityId) {
        session.personality_id = personalityId
      }

      const result = await this.firebaseService.addDocument(this.collectionName, session)

      this.logger.log(`Chat session created: ${result.id} for user: ${userId}`)

      return {
        id: result.id,
        user_id: userId,
        messages: [],
        personality_id: personalityId,
        created_at: result.created_at.toDate(),
        updated_at: result.updated_at.toDate(),
      }
    } catch (error) {
      this.logger.error('Error creating chat session', error)
      throw error
    }
  }

  async getSession(sessionId: string, userId: string): Promise<ChatSession> {
    try {
      const session = await this.firebaseService.getDocument(this.collectionName, sessionId)

      if (!session) {
        throw new NotFoundException('Chat session not found')
      }

      if (session.user_id !== userId) {
        throw new NotFoundException('You do not have access to this chat session')
      }

      return {
        id: session.id,
        user_id: session.user_id,
        title: session.title,
        messages: session.messages || [],
        // Support legacy data that may have prompt_id instead of personality_id
        personality_id: session.personality_id || session.prompt_id,
        created_at: session.created_at?.toDate() || new Date(),
        updated_at: session.updated_at?.toDate() || new Date(),
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error('Error fetching chat session', error)
      throw error
    }
  }

  async getAllSessions(userId: string): Promise<ChatSession[]> {
    try {
      const sessions = await this.firebaseService.getCollection(
        this.collectionName,
        [{ field: 'user_id', operator: '==', value: userId }],
        'updated_at',
        'desc',
      )

      return sessions.map((session: any) => ({
        id: session.id,
        user_id: session.user_id,
        title: session.title,
        messages: session.messages || [],
        // Support legacy data that may have prompt_id instead of personality_id
        personality_id: session.personality_id || session.prompt_id,
        created_at: session.created_at?.toDate() || new Date(),
        updated_at: session.updated_at?.toDate() || new Date(),
      }))
    } catch (error) {
      this.logger.error('Error fetching chat sessions', error)
      throw error
    }
  }

  async updateSession(
    sessionId: string,
    userId: string,
    messages: ChatMessage[],
    personalityId?: string,
  ): Promise<ChatSession> {
    try {
      // Verify session belongs to user
      await this.getSession(sessionId, userId)

      const updateData: any = { messages }
      if (personalityId !== undefined) {
        updateData.personality_id = personalityId
      }

      await this.firebaseService.updateDocument(this.collectionName, sessionId, updateData)

      return this.getSession(sessionId, userId)
    } catch (error) {
      this.logger.error('Error updating chat session', error)
      throw error
    }
  }

  async deleteSession(sessionId: string, userId: string) {
    try {
      // Verify session belongs to user
      await this.getSession(sessionId, userId)

      await this.firebaseService.deleteDocument(this.collectionName, sessionId)

      this.logger.log(`Chat session deleted: ${sessionId} for user: ${userId}`)

      return { success: true, message: 'Chat session deleted successfully' }
    } catch (error) {
      this.logger.error('Error deleting chat session', error)
      throw error
    }
  }

  /**
   * Get recent chat sessions formatted for AI context
   * Returns the most recent sessions sorted by updated_at
   */
  async getChatContextForAI(userId: string, maxSessions: number = 10): Promise<ChatSession[]> {
    try {
      const sessions = await this.firebaseService.getCollection(
        this.collectionName,
        [{ field: 'user_id', operator: '==', value: userId }],
        'updated_at',
        'desc',
      )

      // Return the most recent sessions with messages
      const sessionsWithMessages = sessions
        .filter((session: any) => session.messages && session.messages.length > 0)
        .slice(0, maxSessions)
        .map((session: any) => ({
          id: session.id,
          user_id: session.user_id,
          title: session.title,
          messages: session.messages || [],
          personality_id: session.personality_id || session.prompt_id,
          created_at: session.created_at?.toDate() || new Date(),
          updated_at: session.updated_at?.toDate() || new Date(),
        }))

      this.logger.log(`Retrieved ${sessionsWithMessages.length} chat sessions for AI context for user: ${userId}`)
      
      return sessionsWithMessages
    } catch (error) {
      this.logger.error('Error fetching chat sessions for AI context', error)
      // Return empty array to allow insights to continue with just journal entries
      return []
    }
  }

  async generateInsights(userId: string) {
    try {
      // Check rate limit
      const usageInfo = await this.rateLimitService.checkAndIncrement(userId, 'insights')
      if (!usageInfo.allowed) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: usageInfo.warning || 'Daily insights limit reached',
            error: 'Too Many Requests',
            usageInfo,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      // Fetch journal entries and chat sessions in parallel
      const [journalEntries, chatSessions] = await Promise.all([
        this.journalService.getRecent(userId, 30),
        this.getChatContextForAI(userId, 10),
      ])

      if (journalEntries.length === 0 && chatSessions.length === 0) {
        return {
          insights: 'No journal entries or coaching conversations available to generate insights. Start writing or chatting to get personalized insights!',
        }
      }

      const insights = await this.geminiService.generateInsights(journalEntries, chatSessions)

      this.logger.log(`Insights generated for user: ${userId}`, {
        journalEntryCount: journalEntries.length,
        chatSessionCount: chatSessions.length,
      })

      return { insights }
    } catch (error) {
      this.logger.error('Error generating insights', error)
      throw error
    }
  }

  async *generateInsightsStream(userId: string): AsyncGenerator<any, void, unknown> {
    this.logger.log(`[Insights Stream] Starting streaming insight generation for user: ${userId}`)
    
    try {
      // Check rate limit
      this.logger.debug(`[Insights Stream] Checking rate limit for user: ${userId}`)
      const usageInfo = await this.rateLimitService.checkAndIncrement(userId, 'insights')
      
      if (!usageInfo.allowed) {
        this.logger.warn(`[Insights Stream] Rate limit exceeded for user: ${userId}`)
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: usageInfo.warning || 'Daily insights limit reached',
            error: 'Too Many Requests',
            usageInfo,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      this.logger.debug(`[Insights Stream] Rate limit check passed. Remaining: ${usageInfo.remaining}/${usageInfo.limit}`)

      // Send initial event with usage info
      yield {
        type: 'start',
        usageInfo,
      }

      // Fetch journal entries and chat sessions in parallel
      this.logger.debug(`[Insights Stream] Fetching recent journal entries and chat sessions for user: ${userId}`)
      const [journalEntries, chatSessions] = await Promise.all([
        this.journalService.getRecent(userId, 30),
        this.getChatContextForAI(userId, 10),
      ])
      this.logger.log(`[Insights Stream] Retrieved ${journalEntries.length} journal entries and ${chatSessions.length} chat sessions for user: ${userId}`)

      if (journalEntries.length === 0 && chatSessions.length === 0) {
        this.logger.warn(`[Insights Stream] No journal entries or chat sessions found for user: ${userId}`)
        yield {
          type: 'chunk',
          content: 'No journal entries or coaching conversations available to generate insights. Start writing or chatting to get personalized insights!',
        }
        yield {
          type: 'done',
        }
        return
      }

      this.logger.debug(`[Insights Stream] Starting streaming response from Gemini for user: ${userId}`)
      let chunkCount = 0
      
      for await (const chunk of this.geminiService.generateInsightsStream(journalEntries, chatSessions)) {
        chunkCount++
        yield {
          type: 'chunk',
          content: chunk,
        }
      }

      this.logger.log(`[Insights Stream] Successfully completed streaming insights for user: ${userId}`, {
        chunkCount,
        entryCount: journalEntries.length,
        chatSessionCount: chatSessions.length,
      })

      // Send completion event
      yield {
        type: 'done',
      }

    } catch (error) {
      this.logger.error(`[Insights Stream] Error generating insights stream for user: ${userId}`, error.stack || error)
      throw error
    }
  }

  async suggestPrompts(userId: string) {
    try {
      // Check rate limit
      const usageInfo = await this.rateLimitService.checkAndIncrement(userId, 'prompt_suggestions')
      if (!usageInfo.allowed) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: usageInfo.warning || 'Daily prompt suggestions limit reached',
            error: 'Too Many Requests',
            usageInfo,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      const journalEntries = await this.journalService.getRecent(userId, 10)

      const prompts = await this.geminiService.suggestPrompts(journalEntries)

      this.logger.log(`Prompts suggested for user: ${userId}`)

      return { prompts }
    } catch (error) {
      this.logger.error('Error suggesting prompts', error)
      throw error
    }
  }

  async updateSessionTitle(sessionId: string, userId: string, title: string) {
    try {
      // Verify session belongs to user
      await this.getSession(sessionId, userId)

      await this.firebaseService.updateDocument(this.collectionName, sessionId, {
        title,
      })

      this.logger.log(`Chat session title updated: ${sessionId} for user: ${userId}`)

      return { success: true, message: 'Session title updated successfully' }
    } catch (error) {
      this.logger.error('Error updating session title', error)
      throw error
    }
  }

  private generateTitle(message: string): string {
    // Truncate to ~50 characters and add ellipsis if needed
    const maxLength = 50
    if (message.length <= maxLength) {
      return message
    }
    return message.substring(0, maxLength).trim() + '...'
  }

  async suggestGoals(userId: string) {
    try {
      // Check rate limit
      const usageInfo = await this.rateLimitService.checkAndIncrement(userId, 'goal_suggestions')
      if (!usageInfo.allowed) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: usageInfo.warning || 'Daily goal suggestions limit reached',
            error: 'Too Many Requests',
            usageInfo,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      // Fetch journal entries and chat sessions in parallel
      const [journalEntries, chatSessions] = await Promise.all([
        this.journalService.getRecent(userId, 30),
        this.getChatContextForAI(userId, 10),
      ])

      if (journalEntries.length === 0 && chatSessions.length === 0) {
        return {
          suggestions: [],
          message: 'No journal entries or coaching conversations available to generate goal suggestions. Start writing or chatting to get personalized goal suggestions!',
        }
      }

      const suggestions = await this.geminiService.generateGoalSuggestions(journalEntries, chatSessions)

      this.logger.log(`Goal suggestions generated for user: ${userId}`, {
        journalEntryCount: journalEntries.length,
        chatSessionCount: chatSessions.length,
      })

      return { suggestions, usageInfo }
    } catch (error) {
      this.logger.error('Error suggesting goals', error)
      throw error
    }
  }

  async getGoalInsights(userId: string, goalId: string) {
    try {
      // Check rate limit
      const usageInfo = await this.rateLimitService.checkAndIncrement(userId, 'goal_insights')
      if (!usageInfo.allowed) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: usageInfo.warning || 'Daily goal insights limit reached',
            error: 'Too Many Requests',
            usageInfo,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      // Get goal details
      const goal = await this.goalService.getGoalById(userId, goalId)
      const milestones = await this.goalService.getMilestones(userId, goalId)
      const progressUpdates = await this.goalService.getProgressUpdates(userId, goalId)

      // Format goal data for AI
      const now = new Date()
      const daysRemaining = Math.ceil(
        (goal.target_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      const goalData = {
        title: goal.title,
        description: goal.description,
        category: goal.category,
        status: goal.status,
        targetDate: goal.target_date.toISOString().split('T')[0],
        daysRemaining,
        progress: goal.progress_percentage,
      }

      const formattedMilestones = milestones.map((m) => ({
        title: m.title,
        completed: m.completed,
        dueDate: m.due_date ? m.due_date.toISOString().split('T')[0] : null,
      }))

      const formattedProgress = progressUpdates.slice(0, 5).map((p) => ({
        content: p.content,
        date: p.created_at.toISOString().split('T')[0],
      }))

      const insights = await this.geminiService.generateGoalInsights(
        goalData,
        formattedMilestones,
        formattedProgress
      )

      this.logger.log(`Goal insights generated for goal ${goalId} for user: ${userId}`)

      return { insights, usageInfo }
    } catch (error) {
      this.logger.error('Error generating goal insights', error)
      throw error
    }
  }

  async *getGoalInsightsStream(userId: string, goalId: string): AsyncGenerator<any, void, unknown> {
    this.logger.log(`[Goal Insights Stream] Starting streaming goal insight generation for user: ${userId}, goal: ${goalId}`)
    
    try {
      // Check rate limit
      this.logger.debug(`[Goal Insights Stream] Checking rate limit for user: ${userId}`)
      const usageInfo = await this.rateLimitService.checkAndIncrement(userId, 'goal_insights')
      
      if (!usageInfo.allowed) {
        this.logger.warn(`[Goal Insights Stream] Rate limit exceeded for user: ${userId}`)
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: usageInfo.warning || 'Daily goal insights limit reached',
            error: 'Too Many Requests',
            usageInfo,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      this.logger.debug(`[Goal Insights Stream] Rate limit check passed. Remaining: ${usageInfo.remaining}/${usageInfo.limit}`)

      // Send initial event with usage info and goal ID
      yield {
        type: 'start',
        goalId,
        usageInfo,
      }

      // Get goal details
      this.logger.debug(`[Goal Insights Stream] Fetching goal data for goal: ${goalId}`)
      const goal = await this.goalService.getGoalById(userId, goalId)
      const milestones = await this.goalService.getMilestones(userId, goalId)
      const progressUpdates = await this.goalService.getProgressUpdates(userId, goalId)
      
      this.logger.log(`[Goal Insights Stream] Retrieved goal data for goal: ${goalId}`, {
        goalTitle: goal.title,
        milestoneCount: milestones.length,
        progressUpdateCount: progressUpdates.length,
      })

      // Format goal data for AI
      const now = new Date()
      const daysRemaining = Math.ceil(
        (goal.target_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      const goalData = {
        title: goal.title,
        description: goal.description,
        category: goal.category,
        status: goal.status,
        targetDate: goal.target_date.toISOString().split('T')[0],
        daysRemaining,
        progress: goal.progress_percentage,
      }

      const formattedMilestones = milestones.map((m) => ({
        title: m.title,
        completed: m.completed,
        dueDate: m.due_date ? m.due_date.toISOString().split('T')[0] : null,
      }))

      const formattedProgress = progressUpdates.slice(0, 5).map((p) => ({
        content: p.content,
        date: p.created_at.toISOString().split('T')[0],
      }))

      this.logger.debug(`[Goal Insights Stream] Starting streaming response from Gemini for goal: ${goalId}`)
      let chunkCount = 0
      
      for await (const chunk of this.geminiService.generateGoalInsightsStream(
        goalData,
        formattedMilestones,
        formattedProgress
      )) {
        chunkCount++
        yield {
          type: 'chunk',
          content: chunk,
        }
      }

      this.logger.log(`[Goal Insights Stream] Successfully completed streaming goal insights for goal: ${goalId}`, {
        chunkCount,
        goalProgress: goal.progress_percentage,
      })

      // Send completion event
      yield {
        type: 'done',
      }
    } catch (error) {
      this.logger.error(`[Goal Insights Stream] Error generating goal insights stream for goal: ${goalId}, user: ${userId}`, error.stack || error)
      throw error
    }
  }

  /**
   * Get the current week info (Saturday to Friday)
   */
  getCurrentWeekInfo() {
    const weekStart = this.weeklyInsightsService.getCurrentWeekStart()
    const weekEnd = this.weeklyInsightsService.getCurrentWeekEnd()
    return { weekStart, weekEnd }
  }

  /**
   * Get journal entries for a specific week (Saturday to Friday)
   */
  async getEntriesForWeek(userId: string, weekStart: Date, weekEnd: Date) {
    const allEntries = await this.journalService.findAllUnpaginated(userId)
    
    return allEntries.filter((entry) => {
      const entryDate = new Date(entry.created_at)
      return entryDate >= weekStart && entryDate <= weekEnd
    })
  }

  /**
   * Get current week insights - returns existing or generates new
   */
  async getCurrentWeekInsights(userId: string): Promise<{ insight: WeeklyInsight | null; weekStart: Date; weekEnd: Date }> {
    const { weekStart, weekEnd } = this.getCurrentWeekInfo()
    const existingInsight = await this.weeklyInsightsService.getInsightsForWeek(userId, weekStart)
    
    return {
      insight: existingInsight,
      weekStart,
      weekEnd,
    }
  }

  /**
   * Get all saved weekly insights for a user
   */
  async getAllWeeklyInsights(userId: string, limit: number = 52): Promise<WeeklyInsight[]> {
    return this.weeklyInsightsService.getAllInsights(userId, limit)
  }

  /**
   * Get a specific weekly insight by ID
   */
  async getWeeklyInsightById(userId: string, insightId: string): Promise<WeeklyInsight> {
    return this.weeklyInsightsService.getInsightById(userId, insightId)
  }

  /**
   * Generate and save weekly insights (non-streaming)
   */
  async generateWeeklyInsights(userId: string, forceRegenerate: boolean = false) {
    try {
      // Check rate limit
      const usageInfo = await this.rateLimitService.checkAndIncrement(userId, 'insights')
      if (!usageInfo.allowed) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: usageInfo.warning || 'Daily insights limit reached',
            error: 'Too Many Requests',
            usageInfo,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      // Get current week info (Saturday to Friday)
      const weekStart = this.weeklyInsightsService.getCurrentWeekStart()
      const weekEnd = this.weeklyInsightsService.getCurrentWeekEnd()

      // Check if insights already exist for this week
      if (!forceRegenerate) {
        const existingInsight = await this.weeklyInsightsService.getInsightsForWeek(userId, weekStart)
        if (existingInsight) {
          this.logger.log(`Returning existing weekly insights for user: ${userId}`)
          return {
            insight: existingInsight,
            isExisting: true,
            weekStart,
            weekEnd,
          }
        }
      }

      // Get journal entries for this week
      const journalEntries = await this.getEntriesForWeek(userId, weekStart, weekEnd)

      if (journalEntries.length === 0) {
        return {
          insight: null,
          message: 'No journal entries for this week (Saturday to Friday). Start writing to get your weekly reflection!',
          entryCount: 0,
          weekStart,
          weekEnd,
        }
      }

      // Generate insights
      const content = await this.geminiService.generateWeeklyInsights(journalEntries)

      // Save to database
      const savedInsight = await this.weeklyInsightsService.saveInsights(
        userId,
        weekStart,
        weekEnd,
        content,
        journalEntries.length,
      )

      this.logger.log(`Weekly insights generated and saved for user: ${userId}`)

      return {
        insight: savedInsight,
        isExisting: false,
        weekStart,
        weekEnd,
      }
    } catch (error) {
      this.logger.error('Error generating weekly insights', error)
      throw error
    }
  }

  /**
   * Generate and save weekly insights with streaming
   */
  async *generateWeeklyInsightsStream(userId: string, forceRegenerate: boolean = false): AsyncGenerator<any, void, unknown> {
    this.logger.log(`[Weekly Insights Stream] Starting streaming weekly insight generation for user: ${userId}`)
    
    try {
      // Check rate limit
      this.logger.debug(`[Weekly Insights Stream] Checking rate limit for user: ${userId}`)
      const usageInfo = await this.rateLimitService.checkAndIncrement(userId, 'insights')
      
      if (!usageInfo.allowed) {
        this.logger.warn(`[Weekly Insights Stream] Rate limit exceeded for user: ${userId}`)
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: usageInfo.warning || 'Daily insights limit reached',
            error: 'Too Many Requests',
            usageInfo,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      this.logger.debug(`[Weekly Insights Stream] Rate limit check passed. Remaining: ${usageInfo.remaining}/${usageInfo.limit}`)

      // Get current week info (Saturday to Friday)
      const weekStart = this.weeklyInsightsService.getCurrentWeekStart()
      const weekEnd = this.weeklyInsightsService.getCurrentWeekEnd()

      // Check if insights already exist for this week
      if (!forceRegenerate) {
        const existingInsight = await this.weeklyInsightsService.getInsightsForWeek(userId, weekStart)
        if (existingInsight) {
          this.logger.log(`[Weekly Insights Stream] Returning existing insights for user: ${userId}`)
          
          yield {
            type: 'start',
            usageInfo,
            entryCount: existingInsight.entry_count,
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            insightId: existingInsight.id,
            isExisting: true,
          }
          
          yield {
            type: 'chunk',
            content: existingInsight.content,
          }
          
          yield {
            type: 'done',
            insight: existingInsight,
          }
          return
        }
      }

      // Get journal entries for this week
      this.logger.debug(`[Weekly Insights Stream] Fetching journal entries for week for user: ${userId}`)
      const journalEntries = await this.getEntriesForWeek(userId, weekStart, weekEnd)
      this.logger.log(`[Weekly Insights Stream] Retrieved ${journalEntries.length} journal entries for user: ${userId}`)

      // Send initial event with metadata
      yield {
        type: 'start',
        usageInfo,
        entryCount: journalEntries.length,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        isExisting: false,
      }

      if (journalEntries.length === 0) {
        this.logger.warn(`[Weekly Insights Stream] No journal entries found for user: ${userId}`)
        yield {
          type: 'chunk',
          content: 'No journal entries for this week (Saturday to Friday). Start writing to get your weekly reflection!',
        }
        yield {
          type: 'done',
        }
        return
      }

      this.logger.debug(`[Weekly Insights Stream] Starting streaming response from Gemini for user: ${userId}`)
      let fullContent = ''
      let chunkCount = 0
      
      for await (const chunk of this.geminiService.generateWeeklyInsightsStream(journalEntries)) {
        chunkCount++
        fullContent += chunk
        yield {
          type: 'chunk',
          content: chunk,
        }
      }

      // Save to database after streaming completes
      const savedInsight = await this.weeklyInsightsService.saveInsights(
        userId,
        weekStart,
        weekEnd,
        fullContent,
        journalEntries.length,
      )

      this.logger.log(`[Weekly Insights Stream] Successfully completed and saved weekly insights for user: ${userId}`, {
        chunkCount,
        entryCount: journalEntries.length,
        insightId: savedInsight.id,
      })

      // Send completion event with saved insight
      yield {
        type: 'done',
        insight: savedInsight,
      }

    } catch (error) {
      this.logger.error(`[Weekly Insights Stream] Error generating weekly insights stream for user: ${userId}`, error.stack || error)
      throw error
    }
  }

  /**
   * Delete a weekly insight
   */
  async deleteWeeklyInsight(userId: string, insightId: string) {
    return this.weeklyInsightsService.deleteInsight(userId, insightId)
  }

  /**
   * Retrieve RAG context with rate limit handling
   * @param userId - User ID
   * @param message - User message to search for
   * @returns Object with ragContext and optional warning message
   */
  private async retrieveRagContext(
    userId: string,
    message: string,
  ): Promise<{ ragContext?: string; warning?: string }> {
    try {
      const retrievedContext = await this.ragService.retrieveContext(message, {
        userId,
        limit: 5,
        similarityThreshold: 0.7,
        includeRecent: true,
        recentDays: 30,
      })

      if (retrievedContext.documents.length > 0) {
        const ragContext = this.ragService.formatContextForAI(retrievedContext)
        this.logger.debug(
          `Retrieved ${retrievedContext.documents.length} relevant documents for RAG context`,
        )
        return { ragContext }
      }

      return {}
    } catch (error) {
      // Check if it's a rate limit error
      if (error instanceof RagRateLimitException) {
        this.logger.warn('RAG search rate limit exceeded', {
          userId,
          remaining: error.remaining,
          limit: error.limit,
          resetsAt: error.resetsAt,
        })
        const resetTime = new Date(error.resetsAt).toLocaleTimeString()
        return {
          warning: `Note: Semantic search is temporarily unavailable due to rate limits. Your response may be less personalized. Limit resets at ${resetTime}.`,
        }
      }

      this.logger.error('Failed to retrieve RAG context, continuing without it', error)
      // Continue without RAG context - graceful fallback
      return {}
    }
  }

  private async buildGoalContext(userId: string): Promise<any> {
    try {
      const [activeGoals, overdueGoals, inactiveGoals, recentCompletions] = await Promise.all([
        this.goalService.getGoalsForAIContext(userId),
        this.goalService.getOverdueGoals(userId),
        this.goalService.getInactiveGoals(userId),
        this.goalService.getRecentCompletions(userId, 30),
      ])

      // Format overdue goals
      const formattedOverdueGoals = overdueGoals.map((goal) => {
        const now = new Date()
        const daysRemaining = Math.ceil(
          (goal.target_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return {
          title: goal.title,
          category: goal.category,
          daysRemaining,
        }
      })

      return {
        activeGoals,
        overdueGoals: formattedOverdueGoals,
        inactiveGoals,
        recentCompletions,
      }
    } catch (error) {
      this.logger.error('Error building goal context for AI', error)
      // Return empty context on error to not block chat functionality
      return {
        activeGoals: [],
        overdueGoals: [],
        inactiveGoals: [],
        recentCompletions: [],
      }
    }
  }

  /**
   * Embed a chat message pair (user + assistant) for RAG retrieval
   * This runs asynchronously and does not block the chat response
   * @param userId - User ID
   * @param sessionId - Chat session ID
   * @param sessionTitle - Optional session title
   * @param userMessage - The user's message
   * @param assistantMessage - The AI's response
   * @param personalityId - Optional personality ID used for the response
   */
  private readonly MAX_EMBEDDING_TEXT_LENGTH = 10000

  private embedChatMessagePair(
    userId: string,
    sessionId: string,
    sessionTitle: string | undefined,
    userMessage: ChatMessage,
    assistantMessage: ChatMessage,
    personalityId?: string,
  ): void {
    // Generate a unique document ID for this message pair
    const messageIndex = Math.floor((new Date().getTime()) / 1000)
    const documentId = `${sessionId}_msg_${messageIndex}`

    // Format the conversation as text for embedding
    let text = `User: ${userMessage.content}\n\nCoach: ${assistantMessage.content}`

    // Truncate if text exceeds maximum length
    if (text.length > this.MAX_EMBEDDING_TEXT_LENGTH) {
      text = this.truncateTextForEmbedding(text)
    }

    // Build metadata, filtering out undefined values to avoid Firestore errors
    const metadata: Record<string, any> = {
      session_id: sessionId,
      user_message_id: userMessage.id,
      assistant_message_id: assistantMessage.id,
      timestamp: userMessage.timestamp?.toISOString() || new Date().toISOString(),
    }
    if (sessionTitle) metadata.session_title = sessionTitle
    if (personalityId) metadata.personality_id = personalityId

    // Queue the embedding (async, non-blocking)
    this.ragService.embedContent(
      {
        userId,
        contentType: 'chat_message',
        documentId,
        text,
        metadata,
      },
      true, // async = true, queue for background processing
    ).catch((error) => {
      // Log but don't throw - embedding failures should not affect chat
      this.logger.error('Failed to embed chat message pair', {
        error: error.message,
        userId,
        sessionId,
        documentId,
      })
    })
  }

  /**
   * Truncate text to maximum allowed length for embeddings
   * Tries to truncate at a sentence boundary for better semantic coherence
   */
  private truncateTextForEmbedding(text: string): string {
    let truncated = text.substring(0, this.MAX_EMBEDDING_TEXT_LENGTH)
    
    // Find the last sentence-ending punctuation
    const lastPeriod = truncated.lastIndexOf('.')
    const lastQuestion = truncated.lastIndexOf('?')
    const lastExclamation = truncated.lastIndexOf('!')
    const lastNewline = truncated.lastIndexOf('\n')
    
    const lastBreak = Math.max(lastPeriod, lastQuestion, lastExclamation, lastNewline)
    
    // Only use the break point if it's in the last 20% of the text
    if (lastBreak > this.MAX_EMBEDDING_TEXT_LENGTH * 0.8) {
      truncated = truncated.substring(0, lastBreak + 1)
    }

    this.logger.debug(`Truncated chat message from ${text.length} to ${truncated.length} characters for embedding`)
    return truncated + '\n\n[Content truncated...]'
  }
}

