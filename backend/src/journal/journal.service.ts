import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { CreateJournalDto, UpdateJournalDto } from '@/common/dto/journal.dto'
import { JournalEntry } from '@/common/types/journal.types'

@Injectable()
export class JournalService {
  private readonly logger = new Logger(JournalService.name)
  private readonly collectionName = 'journal-entries'

  constructor(private readonly firebaseService: FirebaseService) {}

  async create(userId: string, createJournalDto: CreateJournalDto): Promise<JournalEntry> {
    try {
      const data: any = {
        user_id: userId,
        title: createJournalDto.title,
        content: createJournalDto.content,
        tags: createJournalDto.tags || [],
      }

      // Only add mood if it's provided
      // this is because the mood is optional and not required
      if (createJournalDto.mood) {
        data.mood = createJournalDto.mood
      }

      this.logger.log(`Creating journal entry for user:`)
      const result = await this.firebaseService.addDocument(this.collectionName, data)

      this.logger.log(`Journal entry created: ${result.id} for user: ${userId}`)

      return {
        id: result.id,
        ...data,
        created_at: result.created_at.toDate(),
        updated_at: result.updated_at.toDate(),
      }
    } catch (error) {
      this.logger.error('Error creating journal entry', error)
      throw error
    }
  }

  async findAll(userId: string): Promise<JournalEntry[]> {
    try {
      const entries = await this.firebaseService.getCollection(
        this.collectionName,
        [{ field: 'user_id', operator: '==', value: userId }],
        'created_at',
        'desc',
      )

      return entries.map((entry: any) => ({
        id: entry.id,
        user_id: entry.user_id,
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        tags: entry.tags || [],
        created_at: entry.created_at?.toDate() || new Date(),
        updated_at: entry.updated_at?.toDate() || new Date(),
      }))
    } catch (error) {
      this.logger.error('Error fetching journal entries', error)
      throw error
    }
  }

  async findOne(id: string, userId: string): Promise<JournalEntry> {
    try {
      const entry = await this.firebaseService.getDocument(this.collectionName, id)

      if (!entry) {
        throw new NotFoundException('Journal entry not found')
      }

      // Check if the entry belongs to the user
      if (entry.user_id !== userId) {
        throw new ForbiddenException('You do not have access to this journal entry')
      }

      return {
        id: entry.id,
        user_id: entry.user_id,
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        tags: entry.tags || [],
        created_at: entry.created_at?.toDate() || new Date(),
        updated_at: entry.updated_at?.toDate() || new Date(),
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error fetching journal entry', error)
      throw error
    }
  }

  async update(id: string, userId: string, updateJournalDto: UpdateJournalDto): Promise<JournalEntry> {
    try {
      // First check if the entry exists and belongs to the user
      await this.findOne(id, userId)

      const updateData: any = {}

      if (updateJournalDto.title !== undefined) {
        updateData.title = updateJournalDto.title
      }

      if (updateJournalDto.content !== undefined) {
        updateData.content = updateJournalDto.content
      }

      if (updateJournalDto.mood !== undefined) {
        updateData.mood = updateJournalDto.mood
      }

      if (updateJournalDto.tags !== undefined) {
        updateData.tags = updateJournalDto.tags
      }

      await this.firebaseService.updateDocument(this.collectionName, id, updateData)

      this.logger.log(`Journal entry updated: ${id} for user: ${userId}`)

      // Return the updated entry
      return this.findOne(id, userId)
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error updating journal entry', error)
      throw error
    }
  }

  async remove(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // First check if the entry exists and belongs to the user
      await this.findOne(id, userId)

      await this.firebaseService.deleteDocument(this.collectionName, id)

      this.logger.log(`Journal entry deleted: ${id} for user: ${userId}`)

      return { success: true, message: 'Journal entry deleted successfully' }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error deleting journal entry', error)
      throw error
    }
  }

  async search(userId: string, searchTerm: string): Promise<JournalEntry[]> {
    try {
      // Get all user's entries (Firestore doesn't support text search natively)
      const allEntries = await this.findAll(userId)

      // Filter entries that match the search term
      const searchLower = searchTerm.toLowerCase()
      const filteredEntries = allEntries.filter(
        (entry) =>
          entry.title.toLowerCase().includes(searchLower) ||
          entry.content.toLowerCase().includes(searchLower) ||
          entry.tags?.some((tag) => tag.toLowerCase().includes(searchLower)),
      )

      return filteredEntries
    } catch (error) {
      this.logger.error('Error searching journal entries', error)
      throw error
    }
  }

  async getRecent(userId: string, limit: number = 10): Promise<JournalEntry[]> {
    try {
      const entries = await this.findAll(userId)
      return entries.slice(0, limit)
    } catch (error) {
      this.logger.error('Error fetching recent journal entries', error)
      throw error
    }
  }

  async findAllGroupedByDate(userId: string): Promise<Record<string, JournalEntry[]>> {
    try {
      const entries = await this.findAll(userId)

      // Group entries by date (YYYY-MM-DD format)
      const grouped = entries.reduce((acc, entry) => {
        const dateKey = entry.created_at.toISOString().split('T')[0]
        
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        
        acc[dateKey].push(entry)
        
        return acc
      }, {} as Record<string, JournalEntry[]>)

      // Sort entries within each date group by created_at (most recent first)
      Object.keys(grouped).forEach(dateKey => {
        grouped[dateKey].sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      })

      return grouped
    } catch (error) {
      this.logger.error('Error fetching grouped journal entries', error)
      throw error
    }
  }
}

