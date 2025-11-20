import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { JournalEntry, ChatMessage } from '@/common/types/journal.types'

@Injectable()
export class GeminiService implements OnModuleInit {
  private genAI: GoogleGenerativeAI
  private model: GenerativeModel
  private readonly logger = new Logger(GeminiService.name)

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY')

      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in environment variables')
      }

      this.genAI = new GoogleGenerativeAI(apiKey)
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
      })

      this.logger.log('Google Gemini AI initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize Google Gemini AI', error)
      throw error
    }
  }

  private formatJournalContext(entries: JournalEntry[]): string {
    if (entries.length === 0) {
      return 'The user has not written any journal entries yet.'
    }

    const buffer: string[] = []
    buffer.push("Here are the user's recent journal entries:\n")

    for (const entry of entries) {
      const date = new Date(entry.created_at).toLocaleDateString()
      buffer.push(`Date: ${date}`)
      buffer.push(`Title: ${entry.title}`)
      buffer.push(`Content: ${entry.content}`)
      if (entry.mood) {
        buffer.push(`Mood: ${entry.mood}`)
      }
      if (entry.tags && entry.tags.length > 0) {
        buffer.push(`Tags: ${entry.tags.join(', ')}`)
      }
      buffer.push('---\n')
    }

    return buffer.join('\n')
  }

  private getSystemPrompt(journalContext: string): string {
    return `You are an experienced executive coach with expertise in leadership development, personal growth, and professional success. Your role is to have meaningful one-on-one coaching sessions with the user based on their journal entries.

${journalContext}

Guidelines for your coaching:
1. Be empathetic, supportive, and insightful
2. Ask thoughtful questions that encourage self-reflection
3. Identify patterns, themes, and areas for growth from their journal entries
4. Provide actionable advice and strategies
5. Celebrate their wins and progress
6. Help them work through challenges
7. Be conversational and authentic, not robotic
8. Draw specific references to their journal entries when relevant
9. Keep responses concise but meaningful (2-4 paragraphs typically)

Remember: You're here to support their personal and professional growth journey.`
  }

  async sendMessage(
    userMessage: string,
    journalEntries: JournalEntry[],
    history: ChatMessage[] = [],
  ): Promise<string> {
    try {
      const journalContext = this.formatJournalContext(journalEntries)
      const systemPrompt = this.getSystemPrompt(journalContext)

      // Build conversation history
      const conversationHistory: string[] = []

      // Add system prompt
      conversationHistory.push(`System: ${systemPrompt}\n`)

      // Add conversation history
      for (const msg of history) {
        if (msg.role === 'user') {
          conversationHistory.push(`User: ${msg.content}`)
        } else if (msg.role === 'assistant') {
          conversationHistory.push(`Assistant: ${msg.content}`)
        }
      }

      // Add current user message
      conversationHistory.push(`User: ${userMessage}`)

      // Create the full prompt
      const fullPrompt = conversationHistory.join('\n\n')

      // Generate response
      const result = await this.model.generateContent(fullPrompt)
      const response = result.response
      const text = response.text()

      return text
    } catch (error) {
      this.logger.error('Error generating AI response', error)
      throw error
    }
  }

  async generateInsights(journalEntries: JournalEntry[]): Promise<string> {
    try {
      if (journalEntries.length === 0) {
        return 'No journal entries available to generate insights.'
      }

      const journalContext = this.formatJournalContext(journalEntries)
      const prompt = `Based on the following journal entries, provide key insights, patterns, and themes you observe. Focus on:
1. Emotional patterns and trends
2. Recurring challenges or concerns
3. Areas of growth and progress
4. Potential blind spots
5. Actionable recommendations

${journalContext}

Please provide a thoughtful analysis in 3-5 paragraphs.`

      const result = await this.model.generateContent(prompt)
      const response = result.response
      return response.text()
    } catch (error) {
      this.logger.error('Error generating insights', error)
      throw error
    }
  }

  async suggestPrompts(journalEntries: JournalEntry[]): Promise<string[]> {
    try {
      const journalContext = this.formatJournalContext(journalEntries.slice(0, 5))
      const prompt = `Based on these journal entries, suggest 5 thoughtful coaching questions or prompts that would help the user reflect deeper on their experiences and personal growth.

${journalContext}

Provide exactly 5 questions, one per line, without numbering or bullets.`

      const result = await this.model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      // Split by newlines and filter out empty lines
      const questions = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      return questions.slice(0, 5)
    } catch (error) {
      this.logger.error('Error generating prompts', error)
      throw error
    }
  }
}

