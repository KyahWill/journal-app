import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'
import { JournalEntry, ChatMessage } from '@/lib/types'

export class AICoach {
  private model: ChatGoogleGenerativeAI

  constructor(apiKey: string) {
    this.model = new ChatGoogleGenerativeAI({
      apiKey,
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
    })
  }

  private formatJournalContext(entries: JournalEntry[]): string {
    if (entries.length === 0) {
      return 'The user has not written any journal entries yet.'
    }

    const buffer = []
    buffer.push("Here are the user's recent journal entries:\n")

    for (const entry of entries) {
      const date = new Date(entry.created_at).toLocaleDateString()
      buffer.push(`Date: ${date}`)
      buffer.push(`Title: ${entry.title}`)
      buffer.push(`Content: ${entry.content}`)
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
    history: ChatMessage[]
  ): Promise<string> {
    const journalContext = this.formatJournalContext(journalEntries)
    const systemPrompt = this.getSystemPrompt(journalContext)

    // Build messages array for LangChain
    const messages = []

    // Add system message
    messages.push(new SystemMessage(systemPrompt))

    // Add conversation history
    for (const msg of history) {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content))
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.content))
      }
    }

    // Add current user message
    messages.push(new HumanMessage(userMessage))

    // Get AI response
    const response = await this.model.invoke(messages)

    return response.content as string
  }
}

