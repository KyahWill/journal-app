import { Injectable, NotFoundException, Logger, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { GeminiService } from '@/gemini/gemini.service'
import { JournalService } from '@/journal/journal.service'
import { SendMessageDto } from '@/common/dto/chat.dto'
import { ChatSession, ChatMessage } from '@/common/types/journal.types'
import { v4 as uuidv4 } from 'uuid'
import { PromptService } from '@/prompt/prompt.service'
import { RateLimitService } from '@/common/services/rate-limit.service'
import { GoalService } from '@/goal/goal.service'

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)
  private readonly collectionName = 'chat_sessions'

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly geminiService: GeminiService,
    private readonly journalService: JournalService,
    private readonly promptService: PromptService,
    private readonly rateLimitService: RateLimitService,
    @Inject(forwardRef(() => GoalService))
    private readonly goalService: GoalService,
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

      const { message, sessionId, promptId } = sendMessageDto

      // Get or create session
      let session: ChatSession
      if (sessionId) {
        session = await this.getSession(sessionId, userId)
      } else {
        session = await this.createSession(userId, promptId)
      }

      // Get user's journal entries for context
      const journalEntries = await this.journalService.getRecent(userId, 20)

      // Build goal context for AI
      const goalContext = await this.buildGoalContext(userId)

      // Get custom prompt if specified
      let customPromptText: string | undefined
      const effectivePromptId = promptId || session.prompt_id
      
      if (effectivePromptId) {
        try {
          const prompt = await this.promptService.getPrompt(effectivePromptId, userId)
          customPromptText = prompt.prompt_text
        } catch (error) {
          this.logger.warn(`Could not load prompt ${effectivePromptId}, using default`)
        }
      }

      // Create user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      }

      // Get AI response with custom prompt and goal context
      const aiResponse = await this.geminiService.sendMessage(
        message,
        journalEntries,
        session.messages,
        customPromptText,
        goalContext,
      )

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
        if (effectivePromptId) {
          updateData.prompt_id = effectivePromptId
        }
        await this.firebaseService.updateDocument(this.collectionName, session.id, updateData)
      } else {
        await this.updateSession(session.id, userId, session.messages, effectivePromptId)
      }

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

      const { message, sessionId, promptId } = sendMessageDto

      // Get or create session
      let session: ChatSession
      if (sessionId) {
        session = await this.getSession(sessionId, userId)
      } else {
        session = await this.createSession(userId, promptId)
      }

      // Get user's journal entries for context
      const journalEntries = await this.journalService.getRecent(userId, 20)

      // Build goal context for AI
      const goalContext = await this.buildGoalContext(userId)

      // Get custom prompt if specified
      let customPromptText: string | undefined
      const effectivePromptId = promptId || session.prompt_id
      
      if (effectivePromptId) {
        try {
          const prompt = await this.promptService.getPrompt(effectivePromptId, userId)
          customPromptText = prompt.prompt_text
        } catch (error) {
          this.logger.warn(`Could not load prompt ${effectivePromptId}, using default`)
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

      // Stream AI response
      let fullResponse = ''
      for await (const chunk of this.geminiService.sendMessageStream(
        message,
        journalEntries,
        session.messages,
        customPromptText,
        goalContext,
      )) {
        fullResponse += chunk
        yield {
          type: 'chunk',
          content: chunk,
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
        if (effectivePromptId) {
          updateData.prompt_id = effectivePromptId
        }
        await this.firebaseService.updateDocument(this.collectionName, session.id, updateData)
      } else {
        await this.updateSession(session.id, userId, session.messages, effectivePromptId)
      }

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

  async createSession(userId: string, promptId?: string): Promise<ChatSession> {
    try {
      const session: any = {
        user_id: userId,
        messages: [],
      }
      
      // Only add optional fields if they have values
      if (promptId) {
        session.prompt_id = promptId
      }

      const result = await this.firebaseService.addDocument(this.collectionName, session)

      this.logger.log(`Chat session created: ${result.id} for user: ${userId}`)

      return {
        id: result.id,
        user_id: userId,
        messages: [],
        prompt_id: promptId,
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
        prompt_id: session.prompt_id,
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
        prompt_id: session.prompt_id,
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
    promptId?: string,
  ): Promise<ChatSession> {
    try {
      // Verify session belongs to user
      await this.getSession(sessionId, userId)

      const updateData: any = { messages }
      if (promptId !== undefined) {
        updateData.prompt_id = promptId
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

      const journalEntries = await this.journalService.getRecent(userId, 30)

      if (journalEntries.length === 0) {
        return {
          insights: 'No journal entries available to generate insights. Start writing to get personalized insights!',
        }
      }

      const insights = await this.geminiService.generateInsights(journalEntries)

      this.logger.log(`Insights generated for user: ${userId}`)

      return { insights }
    } catch (error) {
      this.logger.error('Error generating insights', error)
      throw error
    }
  }

  async *generateInsightsStream(userId: string): AsyncGenerator<string, void, unknown> {
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

      const journalEntries = await this.journalService.getRecent(userId, 30)

      if (journalEntries.length === 0) {
        yield 'No journal entries available to generate insights. Start writing to get personalized insights!'
        return
      }

      for await (const chunk of this.geminiService.generateInsightsStream(journalEntries)) {
        yield chunk
      }

    } catch (error) {
      this.logger.error('Error generating insights stream', error)
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

      const journalEntries = await this.journalService.getRecent(userId, 30)

      if (journalEntries.length === 0) {
        return {
          suggestions: [],
          message: 'No journal entries available to generate goal suggestions. Start writing to get personalized goal suggestions!',
        }
      }

      const suggestions = await this.geminiService.generateGoalSuggestions(journalEntries)

      this.logger.log(`Goal suggestions generated for user: ${userId}`)

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

  async *getGoalInsightsStream(userId: string, goalId: string): AsyncGenerator<string, void, unknown> {
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

      for await (const chunk of this.geminiService.generateGoalInsightsStream(
        goalData,
        formattedMilestones,
        formattedProgress
      )) {
        yield chunk
      }
    } catch (error) {
      this.logger.error('Error generating goal insights stream', error)
      throw error
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
}

