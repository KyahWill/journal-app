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
        model: 'gemini-2.5-flash',
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

  private formatGoalContext(goalData: any): string {
    if (!goalData) {
      return ''
    }

    const buffer: string[] = []
    
    // Active Goals
    if (goalData.activeGoals && goalData.activeGoals.length > 0) {
      buffer.push("\n=== USER'S ACTIVE GOALS ===\n")
      for (const goal of goalData.activeGoals) {
        buffer.push(`Goal: ${goal.title}`)
        buffer.push(`Category: ${goal.category}`)
        buffer.push(`Status: ${goal.status}`)
        buffer.push(`Target Date: ${goal.targetDate}`)
        buffer.push(`Days Remaining: ${goal.daysRemaining}`)
        buffer.push(`Progress: ${goal.progress}%`)
        
        if (goal.description) {
          buffer.push(`Description: ${goal.description}`)
        }
        
        if (goal.milestones && goal.milestones.length > 0) {
          buffer.push('Milestones:')
          for (const milestone of goal.milestones) {
            const status = milestone.completed ? '✓' : '○'
            const dueDate = milestone.dueDate ? ` (due: ${milestone.dueDate})` : ''
            buffer.push(`  ${status} ${milestone.title}${dueDate}`)
          }
        }
        
        if (goal.recentProgress && goal.recentProgress.length > 0) {
          buffer.push('Recent Progress Updates:')
          for (const progress of goal.recentProgress) {
            buffer.push(`  - ${progress.date}: ${progress.content}`)
          }
        }
        
        buffer.push('---\n')
      }
    }

    // Overdue Goals
    if (goalData.overdueGoals && goalData.overdueGoals.length > 0) {
      buffer.push("\n=== OVERDUE GOALS (Need Attention) ===\n")
      for (const goal of goalData.overdueGoals) {
        buffer.push(`Goal: ${goal.title}`)
        buffer.push(`Category: ${goal.category}`)
        buffer.push(`Days Overdue: ${Math.abs(goal.daysRemaining)}`)
        buffer.push('---\n')
      }
    }

    // Inactive Goals
    if (goalData.inactiveGoals && goalData.inactiveGoals.length > 0) {
      buffer.push("\n=== INACTIVE GOALS (No Recent Activity) ===\n")
      for (const goal of goalData.inactiveGoals) {
        buffer.push(`Goal: ${goal.title}`)
        buffer.push(`Category: ${goal.category}`)
        buffer.push(`Days Since Last Activity: ${goal.daysSinceLastActivity}`)
        buffer.push('---\n')
      }
    }

    // Recent Completions
    if (goalData.recentCompletions && goalData.recentCompletions.length > 0) {
      buffer.push("\n=== RECENTLY COMPLETED GOALS ===\n")
      for (const goal of goalData.recentCompletions) {
        buffer.push(`Goal: ${goal.title}`)
        buffer.push(`Category: ${goal.category}`)
        buffer.push(`Completed: ${goal.completedAt}`)
        buffer.push(`Time Taken: ${goal.daysTaken} days`)
        buffer.push('---\n')
      }
    }

    return buffer.join('\n')
  }

  private getSystemPrompt(journalContext: string, goalContext: string, ragContext?: string, customPrompt?: string): string {
    const basePrompt = customPrompt || `You are an experienced executive coach with expertise in leadership development, personal growth, and professional success. Your role is to have meaningful one-on-one coaching sessions with the user based on their journal entries and goals.

Guidelines for your coaching:
1. Be empathetic, supportive, and insightful
2. Ask thoughtful questions that encourage self-reflection
3. Identify patterns, themes, and areas for growth from their journal entries
4. Provide actionable advice and strategies
5. Celebrate their wins and progress
6. Help them work through challenges
7. Be conversational and authentic, not robotic
8. Draw specific references to their journal entries and goals when relevant
9. Keep responses concise but meaningful (2-4 paragraphs typically)

Goal-Specific Coaching Guidelines:
- Reference specific goals by name when discussing progress or challenges
- Acknowledge milestone completions and progress updates
- Provide accountability for overdue goals in a supportive, non-judgmental way
- Encourage action on inactive goals by asking about obstacles
- Celebrate recent goal completions and ask reflection questions
- Help break down large goals into manageable milestones
- Connect journal reflections to goal progress when relevant
- Suggest creating goals based on patterns in journal entries

Remember: You're here to support their personal and professional growth journey.`

    // Build the full system prompt with all context
    const promptParts = [basePrompt];
    
    if (journalContext) {
      promptParts.push('\n' + journalContext);
    }
    
    if (goalContext) {
      promptParts.push('\n' + goalContext);
    }
    
    // Add RAG context if available - this provides semantically relevant historical context
    if (ragContext) {
      promptParts.push('\n' + ragContext);
    }
    
    return promptParts.join('\n');
  }

  async sendMessage(
    userMessage: string,
    journalEntries: JournalEntry[],
    history: ChatMessage[] = [],
    customPrompt?: string,
    goalContext?: any,
    ragContext?: string,
  ): Promise<string> {
    try {
      const journalContext = this.formatJournalContext(journalEntries)
      const formattedGoalContext = goalContext ? this.formatGoalContext(goalContext) : ''
      const systemPrompt = this.getSystemPrompt(journalContext, formattedGoalContext, ragContext, customPrompt)

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

  async *sendMessageStream(
    userMessage: string,
    journalEntries: JournalEntry[],
    history: ChatMessage[] = [],
    customPrompt?: string,
    goalContext?: any,
    ragContext?: string,
  ): AsyncGenerator<string, void, unknown> {
    try {
      const journalContext = this.formatJournalContext(journalEntries)
      const formattedGoalContext = goalContext ? this.formatGoalContext(goalContext) : ''
      const systemPrompt = this.getSystemPrompt(journalContext, formattedGoalContext, ragContext, customPrompt)

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

      // Generate streaming response
      const result = await this.model.generateContentStream(fullPrompt)

      let buffer = ''
      const maxChunkSize = 5 // Send chunks of ~5 characters for smoother streaming
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        if (chunkText) {
          buffer += chunkText
          
          // Send smaller chunks for smoother streaming
          while (buffer.length >= maxChunkSize) {
            const toSend = buffer.slice(0, maxChunkSize)
            buffer = buffer.slice(maxChunkSize)
            yield toSend
          }
        }
      }
      
      // Send any remaining buffered content
      if (buffer.length > 0) {
        yield buffer
      }
    } catch (error) {
      this.logger.error('Error generating AI response stream', error)
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

  async *generateInsightsStream(journalEntries: JournalEntry[]): AsyncGenerator<string, void, unknown> {
    try {
      if (journalEntries.length === 0) {
        yield 'No journal entries available to generate insights.'
        return
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

      const result = await this.model.generateContentStream(prompt)

      let buffer = ''
      const maxChunkSize = 100
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        if (chunkText) {
          buffer += chunkText 
          
          while (buffer.length >= maxChunkSize) {
            const toSend = buffer.slice(0, maxChunkSize)
            buffer = buffer.slice(maxChunkSize)
            yield toSend
          }
        }
      }
      
      if (buffer.length > 0) {
        yield buffer
      }
    } catch (error) {
      this.logger.error('Error generating insights stream', error)
      throw error
    }
  }

  async suggestPrompts(journalEntries: JournalEntry[]): Promise<string[]> {
    try {
      const journalContext = this.formatJournalContext(journalEntries.slice(0, 5))
      const prompt = `Based on these journal entries, suggest 5 thoughtful questions that the user
      could ask the AI coach to help them reflect deeper on their experiences and personal growth.
      Put an emphasis on the users. 

      Generate questions that focus on "I" rather than "you".

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

  async analyzePrompt(promptText: string): Promise<{ suggestions: string }> {
    try {
      const analysisPrompt = `You are an expert in crafting effective AI system prompts. Analyze the following system prompt and modify it to be more effective..

System Prompt to Analyze:
"""
${promptText}
"""
Focus on clarity, specificity, tone, and effectiveness. 
Do not provide an analysis of the prompt, only the modified prompt.`

      const result = await this.model.generateContent(analysisPrompt)
      const response = result.response
      return { suggestions: response.text() }
    } catch (error) {
      this.logger.error('Error analyzing prompt', error)
      throw error
    }
  }

  async generateGoalSuggestions(journalEntries: JournalEntry[]): Promise<any[]> {
    try {
      if (journalEntries.length === 0) {
        return []
      }

      const journalContext = this.formatJournalContext(journalEntries)
      const prompt = `Based on the following journal entries, analyze patterns, themes, and aspirations to suggest 3-5 specific, actionable goals the user might want to pursue.

${journalContext}

For each goal suggestion, provide:
1. A clear, specific title (3-10 words)
2. A category (one of: career, health, personal, financial, relationships, learning, other)
3. A brief description explaining why this goal is relevant based on their journal entries (2-3 sentences)
4. 2-4 suggested milestones to achieve this goal
5. A reasoning section that references specific journal entries or patterns

Format your response as a JSON array with this structure:
[
  {
    "title": "Goal title here",
    "category": "category_name",
    "description": "Why this goal matters...",
    "milestones": [
      "First milestone",
      "Second milestone",
      "Third milestone"
    ],
    "reasoning": "Based on your journal entries..."
  }
]

Provide ONLY the JSON array, no additional text.`

      const result = await this.model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      // Try to parse the JSON response
      try {
        // Remove markdown code blocks if present
        let jsonText = text.trim()
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```\n?/g, '')
        }
        
        const suggestions = JSON.parse(jsonText)
        return Array.isArray(suggestions) ? suggestions : []
      } catch (parseError) {
        this.logger.error('Error parsing goal suggestions JSON', parseError)
        this.logger.debug('Raw response:', text)
        return []
      }
    } catch (error) {
      this.logger.error('Error generating goal suggestions', error)
      throw error
    }
  }

  async generateGoalInsights(goal: any, milestones: any[], progressUpdates: any[]): Promise<string> {
    try {
      const prompt = `You are an executive coach analyzing a user's goal progress. Provide insightful, actionable feedback.

GOAL DETAILS:
Title: ${goal.title}
Description: ${goal.description || 'No description provided'}
Category: ${goal.category}
Status: ${goal.status}
Target Date: ${goal.targetDate}
Days Remaining: ${goal.daysRemaining}
Progress: ${goal.progress}%

MILESTONES:
${milestones.length > 0 ? milestones.map((m: any) => `${m.completed ? '✓' : '○'} ${m.title}${m.dueDate ? ` (due: ${m.dueDate})` : ''}`).join('\n') : 'No milestones set'}

RECENT PROGRESS UPDATES:
${progressUpdates.length > 0 ? progressUpdates.map((p: any) => `${p.date}: ${p.content}`).join('\n') : 'No progress updates yet'}

Provide a thoughtful analysis covering:
1. Progress Assessment: How is the user doing? What patterns do you see?
2. Momentum Analysis: Is progress accelerating, steady, or stalling?
3. Potential Obstacles: What might be blocking progress?
4. Actionable Recommendations: 2-3 specific next steps
5. Encouragement: Acknowledge wins and provide motivation

Keep your response conversational, supportive, and actionable (3-4 paragraphs).`

      const result = await this.model.generateContent(prompt)
      const response = result.response
      return response.text()
    } catch (error) {
      this.logger.error('Error generating goal insights', error)
      throw error
    }
  }

  async *generateGoalInsightsStream(goal: any, milestones: any[], progressUpdates: any[]): AsyncGenerator<string, void, unknown> {
    try {
      const prompt = `You are an executive coach analyzing a user's goal progress. Provide insightful, actionable feedback.

GOAL DETAILS:
Title: ${goal.title}
Description: ${goal.description || 'No description provided'}
Category: ${goal.category}
Status: ${goal.status}
Target Date: ${goal.targetDate}
Days Remaining: ${goal.daysRemaining}
Progress: ${goal.progress}%

MILESTONES:
${milestones.length > 0 ? milestones.map((m: any) => `${m.completed ? '✓' : '○'} ${m.title}${m.dueDate ? ` (due: ${m.dueDate})` : ''}`).join('\n') : 'No milestones set'}

RECENT PROGRESS UPDATES:
${progressUpdates.length > 0 ? progressUpdates.map((p: any) => `${p.date}: ${p.content}`).join('\n') : 'No progress updates yet'}

Provide a thoughtful analysis covering:
1. Progress Assessment: How is the user doing? What patterns do you see?
2. Momentum Analysis: Is progress accelerating, steady, or stalling?
3. Potential Obstacles: What might be blocking progress?
4. Actionable Recommendations: 2-3 specific next steps
5. Encouragement: Acknowledge wins and provide motivation

Keep your response conversational, supportive, and actionable (3-4 paragraphs).`

      const result = await this.model.generateContentStream(prompt)

      let buffer = ''
      const maxChunkSize = 20
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        if (chunkText) {
          buffer += chunkText
          
          while (buffer.length >= maxChunkSize) {
            const toSend = buffer.slice(0, maxChunkSize)
            buffer = buffer.slice(maxChunkSize)
            yield toSend
          }
        }
      }
      
      if (buffer.length > 0) {
        yield buffer
      }
    } catch (error) {
      this.logger.error('Error generating goal insights stream', error)
      throw error
    }
  }
}

