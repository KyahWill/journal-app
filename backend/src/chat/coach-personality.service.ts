import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { CreateCoachPersonalityDto, UpdateCoachPersonalityDto } from '@/common/dto/coach-personality.dto'

export interface CoachPersonality {
  id: string
  user_id: string
  name: string
  description: string
  style: string
  systemPrompt: string
  firstMessage?: string
  voiceId?: string
  voiceStability?: number
  voiceSimilarityBoost?: number
  language?: string
  isDefault: boolean
  elevenLabsAgentId?: string
  created_at: Date
  updated_at: Date
}

@Injectable()
export class CoachPersonalityService {
  private readonly logger = new Logger(CoachPersonalityService.name)
  private readonly collectionName = 'coach_personalities'

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Get all coach personalities for a user
   */
  async findAll(userId: string): Promise<CoachPersonality[]> {
    try {
      const personalities = await this.firebaseService.getCollection(
        this.collectionName,
        [{ field: 'user_id', operator: '==', value: userId }],
        'created_at',
        'desc',
      )

      return personalities.map((p: any) => this.mapToCoachPersonality(p))
    } catch (error) {
      this.logger.error('Error fetching coach personalities', error)
      throw error
    }
  }

  /**
   * Get a specific coach personality by ID
   */
  async findOne(userId: string, id: string): Promise<CoachPersonality> {
    try {
      const personality = await this.firebaseService.getDocument(this.collectionName, id)

      if (!personality) {
        throw new NotFoundException('Coach personality not found')
      }

      if (personality.user_id !== userId) {
        throw new NotFoundException('You do not have access to this coach personality')
      }

      return this.mapToCoachPersonality(personality)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error('Error fetching coach personality', error)
      throw error
    }
  }

  /**
   * Get the default personality for a user
   */
  async findDefault(userId: string): Promise<CoachPersonality | null> {
    try {
      const personalities = await this.firebaseService.getCollection(
        this.collectionName,
        [
          { field: 'user_id', operator: '==', value: userId },
          { field: 'isDefault', operator: '==', value: true },
        ],
      )

      if (personalities.length === 0) {
        return null
      }

      return this.mapToCoachPersonality(personalities[0])
    } catch (error) {
      this.logger.error('Error fetching default coach personality', error)
      return null
    }
  }

  /**
   * Create a new coach personality
   */
  async create(userId: string, dto: CreateCoachPersonalityDto): Promise<CoachPersonality> {
    try {
      // If this is set as default, unset any existing defaults
      if (dto.isDefault) {
        await this.unsetAllDefaults(userId)
      }

      const personalityData = {
        user_id: userId,
        name: dto.name,
        description: dto.description,
        style: dto.style,
        systemPrompt: dto.systemPrompt,
        firstMessage: dto.firstMessage,
        voiceId: dto.voiceId,
        voiceStability: dto.voiceStability,
        voiceSimilarityBoost: dto.voiceSimilarityBoost,
        language: dto.language || 'en',
        isDefault: dto.isDefault || false,
        elevenLabsAgentId: dto.elevenLabsAgentId,
      }

      const result = await this.firebaseService.addDocument(this.collectionName, personalityData)

      this.logger.log(`Coach personality created: ${result.id} for user: ${userId}`)

      return {
        id: result.id,
        ...personalityData,
        created_at: result.created_at.toDate(),
        updated_at: result.updated_at.toDate(),
      }
    } catch (error) {
      this.logger.error('Error creating coach personality', error)
      throw error
    }
  }

  /**
   * Update a coach personality
   */
  async update(
    userId: string,
    id: string,
    dto: UpdateCoachPersonalityDto,
  ): Promise<CoachPersonality> {
    try {
      // Verify personality belongs to user
      await this.findOne(userId, id)

      // If this is being set as default, unset any existing defaults
      if (dto.isDefault) {
        await this.unsetAllDefaults(userId)
      }

      const updateData: any = {}
      if (dto.name !== undefined) updateData.name = dto.name
      if (dto.description !== undefined) updateData.description = dto.description
      if (dto.style !== undefined) updateData.style = dto.style
      if (dto.systemPrompt !== undefined) updateData.systemPrompt = dto.systemPrompt
      if (dto.firstMessage !== undefined) updateData.firstMessage = dto.firstMessage
      if (dto.voiceId !== undefined) updateData.voiceId = dto.voiceId
      if (dto.voiceStability !== undefined) updateData.voiceStability = dto.voiceStability
      if (dto.voiceSimilarityBoost !== undefined) updateData.voiceSimilarityBoost = dto.voiceSimilarityBoost
      if (dto.language !== undefined) updateData.language = dto.language
      if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault
      if (dto.elevenLabsAgentId !== undefined) updateData.elevenLabsAgentId = dto.elevenLabsAgentId

      await this.firebaseService.updateDocument(this.collectionName, id, updateData)

      this.logger.log(`Coach personality updated: ${id} for user: ${userId}`)

      return this.findOne(userId, id)
    } catch (error) {
      this.logger.error('Error updating coach personality', error)
      throw error
    }
  }

  /**
   * Set a personality as the default
   */
  async setDefault(userId: string, id: string): Promise<CoachPersonality> {
    try {
      // Verify personality belongs to user
      await this.findOne(userId, id)

      // Unset all existing defaults
      await this.unsetAllDefaults(userId)

      // Set this one as default
      await this.firebaseService.updateDocument(this.collectionName, id, {
        isDefault: true,
      })

      this.logger.log(`Coach personality set as default: ${id} for user: ${userId}`)

      return this.findOne(userId, id)
    } catch (error) {
      this.logger.error('Error setting default coach personality', error)
      throw error
    }
  }

  /**
   * Delete a coach personality
   */
  async delete(userId: string, id: string) {
    try {
      // Verify personality belongs to user
      const personality = await this.findOne(userId, id)

      // Prevent deletion if it's the only personality
      const allPersonalities = await this.findAll(userId)
      if (allPersonalities.length === 1) {
        throw new ConflictException('Cannot delete your only coach personality')
      }

      // If deleting the default, set another one as default
      if (personality.isDefault && allPersonalities.length > 1) {
        const nextDefault = allPersonalities.find((p) => p.id !== id)
        if (nextDefault) {
          await this.firebaseService.updateDocument(this.collectionName, nextDefault.id, {
            isDefault: true,
          })
        }
      }

      await this.firebaseService.deleteDocument(this.collectionName, id)

      this.logger.log(`Coach personality deleted: ${id} for user: ${userId}`)

      return { success: true, message: 'Coach personality deleted successfully' }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error
      }
      this.logger.error('Error deleting coach personality', error)
      throw error
    }
  }

  /**
   * Unset all default personalities for a user
   */
  private async unsetAllDefaults(userId: string): Promise<void> {
    try {
      const defaults = await this.firebaseService.getCollection(
        this.collectionName,
        [
          { field: 'user_id', operator: '==', value: userId },
          { field: 'isDefault', operator: '==', value: true },
        ],
      )

      for (const personality of defaults) {
        await this.firebaseService.updateDocument(this.collectionName, personality.id, {
          isDefault: false,
        })
      }
    } catch (error) {
      this.logger.error('Error unsetting default personalities', error)
    }
  }

  /**
   * Map Firestore document to CoachPersonality
   */
  private mapToCoachPersonality(doc: any): CoachPersonality {
    return {
      id: doc.id,
      user_id: doc.user_id,
      name: doc.name,
      description: doc.description,
      style: doc.style,
      systemPrompt: doc.systemPrompt,
      firstMessage: doc.firstMessage,
      voiceId: doc.voiceId,
      voiceStability: doc.voiceStability,
      voiceSimilarityBoost: doc.voiceSimilarityBoost,
      language: doc.language || 'en',
      isDefault: doc.isDefault || false,
      elevenLabsAgentId: doc.elevenLabsAgentId,
      created_at: doc.created_at?.toDate() || new Date(),
      updated_at: doc.updated_at?.toDate() || new Date(),
    }
  }
}

