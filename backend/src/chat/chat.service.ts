import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { GeminiService } from '@/gemini/gemini.service'
import { JournalService } from '@/journal/journal.service'
import { SendMessageDto } from '@/common/dto/chat.dto'
import { ChatSession, ChatMessage } from '@/common/types/journal.types'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)
  private readonly collectionName = 'chat_sessions'

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly geminiService: GeminiService,
    private readonly journalService: JournalService,
  ) {}

  async sendMessage(userId: string, sendMessageDto: SendMessageDto) {
    try {
      const { message, sessionId } = sendMessageDto

      // Get or create session
      let session: ChatSession
      if (sessionId) {
        session = await this.getSession(sessionId, userId)
      } else {
        session = await this.createSession(userId)
      }

      // Get user's journal entries for context
      const journalEntries = await this.journalService.getRecent(userId, 20)

      // Create user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      }

      // Get AI response
      const aiResponse = await this.geminiService.sendMessage(
        message,
        journalEntries,
        session.messages,
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
      await this.updateSession(session.id, userId, session.messages)

      this.logger.log(`Message sent in session: ${session.id} for user: ${userId}`)

      return {
        sessionId: session.id,
        userMessage,
        assistantMessage,
      }
    } catch (error) {
      this.logger.error('Error sending message', error)
      throw error
    }
  }

  async createSession(userId: string): Promise<ChatSession> {
    try {
      const session: Omit<ChatSession, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        messages: [],
      }

      const result = await this.firebaseService.addDocument(this.collectionName, session)

      this.logger.log(`Chat session created: ${result.id} for user: ${userId}`)

      return {
        id: result.id,
        user_id: userId,
        messages: [],
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
        messages: session.messages || [],
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
        messages: session.messages || [],
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
  ): Promise<ChatSession> {
    try {
      // Verify session belongs to user
      await this.getSession(sessionId, userId)

      await this.firebaseService.updateDocument(this.collectionName, sessionId, {
        messages,
      })

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

  async suggestPrompts(userId: string) {
    try {
      const journalEntries = await this.journalService.getRecent(userId, 10)

      const prompts = await this.geminiService.suggestPrompts(journalEntries)

      this.logger.log(`Prompts suggested for user: ${userId}`)

      return { prompts }
    } catch (error) {
      this.logger.error('Error suggesting prompts', error)
      throw error
    }
  }
}

