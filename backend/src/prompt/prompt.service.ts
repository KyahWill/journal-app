import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { CreatePromptDto, UpdatePromptDto } from '@/common/dto/prompt.dto'
import { UserPrompt } from '@/common/types/journal.types'

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name)
  private readonly collectionName = 'user_prompts'

  // Default prompt text - the hardcoded executive coach prompt
  private readonly DEFAULT_PROMPT_TEXT = `You are an experienced executive coach with expertise in leadership development, personal growth, and professional success. Your role is to have meaningful one-on-one coaching sessions with the user based on their journal entries.

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

  constructor(private readonly firebaseService: FirebaseService) {}

  async createPrompt(userId: string, createPromptDto: CreatePromptDto): Promise<UserPrompt> {
    try {
      const { name, prompt_text, is_default } = createPromptDto

      // If setting as default, unset all other defaults
      if (is_default) {
        await this.unsetAllDefaults(userId)
      }

      const promptData: Omit<UserPrompt, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        name,
        prompt_text,
        is_default: is_default || false,
      }

      const result = await this.firebaseService.addDocument(this.collectionName, promptData)

      this.logger.log(`Prompt created: ${result.id} for user: ${userId}`)

      return {
        id: result.id,
        user_id: userId,
        name,
        prompt_text,
        is_default: is_default || false,
        created_at: result.created_at.toDate(),
        updated_at: result.updated_at.toDate(),
      }
    } catch (error) {
      this.logger.error('Error creating prompt', error)
      throw error
    }
  }

  async getPrompt(promptId: string, userId: string): Promise<UserPrompt> {
    try {
      const prompt = await this.firebaseService.getDocument(this.collectionName, promptId)

      if (!prompt) {
        throw new NotFoundException('Prompt not found')
      }

      if (prompt.user_id !== userId) {
        throw new NotFoundException('You do not have access to this prompt')
      }

      return {
        id: prompt.id,
        user_id: prompt.user_id,
        name: prompt.name,
        prompt_text: prompt.prompt_text,
        is_default: prompt.is_default || false,
        created_at: prompt.created_at?.toDate() || new Date(),
        updated_at: prompt.updated_at?.toDate() || new Date(),
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error('Error fetching prompt', error)
      throw error
    }
  }

  async getAllPrompts(userId: string): Promise<UserPrompt[]> {
    try {
      const prompts = await this.firebaseService.getCollection(
        this.collectionName,
        [{ field: 'user_id', operator: '==', value: userId }],
        'created_at',
        'desc',
      )

      return prompts.map((prompt: any) => ({
        id: prompt.id,
        user_id: prompt.user_id,
        name: prompt.name,
        prompt_text: prompt.prompt_text,
        is_default: prompt.is_default || false,
        created_at: prompt.created_at?.toDate() || new Date(),
        updated_at: prompt.updated_at?.toDate() || new Date(),
      }))
    } catch (error) {
      this.logger.error('Error fetching prompts', error)
      throw error
    }
  }

  async getDefaultPrompt(userId: string): Promise<UserPrompt> {
    try {
      const prompts = await this.firebaseService.getCollection(
        this.collectionName,
        [
          { field: 'user_id', operator: '==', value: userId },
          { field: 'is_default', operator: '==', value: true },
        ],
      )

      if (prompts.length > 0) {
        const prompt = prompts[0]
        return {
          id: prompt.id,
          user_id: prompt.user_id,
          name: prompt.name,
          prompt_text: prompt.prompt_text,
          is_default: prompt.is_default,
          created_at: prompt.created_at?.toDate() || new Date(),
          updated_at: prompt.updated_at?.toDate() || new Date(),
        }
      }

      // If no default found, create one automatically
      return this.createDefaultPrompt(userId)
    } catch (error) {
      this.logger.error('Error fetching default prompt', error)
      throw error
    }
  }

  async updatePrompt(
    promptId: string,
    userId: string,
    updatePromptDto: UpdatePromptDto,
  ): Promise<UserPrompt> {
    try {
      // Verify prompt belongs to user
      await this.getPrompt(promptId, userId)

      // If setting as default, unset all other defaults
      if (updatePromptDto.is_default) {
        await this.unsetAllDefaults(userId)
      }

      await this.firebaseService.updateDocument(this.collectionName, promptId, updatePromptDto)

      return this.getPrompt(promptId, userId)
    } catch (error) {
      this.logger.error('Error updating prompt', error)
      throw error
    }
  }

  async deletePrompt(promptId: string, userId: string): Promise<void> {
    try {
      const prompt = await this.getPrompt(promptId, userId)

      // Don't allow deleting the default prompt if it's the only one
      if (prompt.is_default) {
        const allPrompts = await this.getAllPrompts(userId)
        if (allPrompts.length === 1) {
          throw new BadRequestException(
            'Cannot delete the default prompt. Create another prompt first or set another as default.',
          )
        }
      }

      await this.firebaseService.deleteDocument(this.collectionName, promptId)

      this.logger.log(`Prompt deleted: ${promptId} for user: ${userId}`)
    } catch (error) {
      this.logger.error('Error deleting prompt', error)
      throw error
    }
  }

  async setAsDefault(promptId: string, userId: string): Promise<UserPrompt> {
    try {
      // Verify prompt belongs to user
      await this.getPrompt(promptId, userId)

      // Unset all other defaults
      await this.unsetAllDefaults(userId)

      // Set this one as default
      await this.firebaseService.updateDocument(this.collectionName, promptId, {
        is_default: true,
      })

      this.logger.log(`Prompt set as default: ${promptId} for user: ${userId}`)

      return this.getPrompt(promptId, userId)
    } catch (error) {
      this.logger.error('Error setting default prompt', error)
      throw error
    }
  }

  private async unsetAllDefaults(userId: string): Promise<void> {
    try {
      const defaultPrompts = await this.firebaseService.getCollection(
        this.collectionName,
        [
          { field: 'user_id', operator: '==', value: userId },
          { field: 'is_default', operator: '==', value: true },
        ],
      )

      for (const prompt of defaultPrompts) {
        await this.firebaseService.updateDocument(this.collectionName, prompt.id, {
          is_default: false,
        })
      }
    } catch (error) {
      this.logger.error('Error unsetting defaults', error)
      throw error
    }
  }

  private async createDefaultPrompt(userId: string): Promise<UserPrompt> {
    this.logger.log(`Creating default prompt for user: ${userId}`)
    return this.createPrompt(userId, {
      name: 'Executive Coach',
      prompt_text: this.DEFAULT_PROMPT_TEXT,
      is_default: true,
    })
  }

  getDefaultPromptText(): string {
    return this.DEFAULT_PROMPT_TEXT
  }
}

