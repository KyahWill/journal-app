import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { RagService } from '@/rag/rag.service'
import { CreateJournalDto, UpdateJournalDto } from '@/common/dto/journal.dto'
import { JournalEntry, JournalEntryWithGoals } from '@/common/types/journal.types'

@Injectable()
export class JournalService {
  private readonly logger = new Logger(JournalService.name)
  private readonly collectionName = 'journal-entries'
  private readonly linksCollection = 'goal_journal_links'

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly ragService: RagService,
  ) {}

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

      // Generate embedding for the journal entry (non-blocking)
      const embeddingText = `${createJournalDto.title}\n\n${createJournalDto.content}`
      const metadata: Record<string, any> = {
        tags: createJournalDto.tags || [],
      }
      
      if (createJournalDto.mood) {
        metadata.mood = createJournalDto.mood
      }

      this.ragService
        .embedContent({
          userId,
          contentType: 'journal',
          documentId: result.id,
          text: embeddingText,
          metadata,
        })
        .catch((err) => {
          this.logger.error(`Failed to embed journal entry ${result.id}`, err)
        })

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

  async findAll(
    userId: string,
    limit?: number,
    cursor?: string,
  ): Promise<{ entries: JournalEntry[]; nextCursor: string | null }> {
    try {
      // Default page size
      const pageLimit = limit || 10

      this.logger.log(`[findAll] Fetching entries - pageLimit: ${pageLimit}, cursor: ${cursor || 'null'}`)

      // Fetch one extra to determine if there are more entries
      const entries = await this.firebaseService.getCollection(
        this.collectionName,
        [{ field: 'user_id', operator: '==', value: userId }],
        'created_at',
        'desc',
        pageLimit + 1,
        cursor,
      )

      this.logger.log(`[findAll] Firestore returned ${entries.length} entries (requested ${pageLimit + 1})`)

      // Determine if there are more entries
      const hasMore = entries.length > pageLimit
      const entriesToReturn = hasMore ? entries.slice(0, pageLimit) : entries

      this.logger.log(`[findAll] hasMore: ${hasMore}, returning ${entriesToReturn.length} entries`)

      // Map entries to JournalEntry type
      const mappedEntries = entriesToReturn.map((entry: any) => ({
        id: entry.id,
        user_id: entry.user_id,
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        tags: entry.tags || [],
        created_at: entry.created_at?.toDate() || new Date(),
        updated_at: entry.updated_at?.toDate() || new Date(),
      }))

      // Get the cursor for the next page (last entry's ID)
      const nextCursor = hasMore ? mappedEntries[mappedEntries.length - 1].id : null

      if (mappedEntries.length > 0) {
        this.logger.log(`[findAll] First entry ID: ${mappedEntries[0].id}, Last entry ID: ${mappedEntries[mappedEntries.length - 1].id}`)
      }
      this.logger.log(`[findAll] nextCursor: ${nextCursor || 'null'}`)

      return { entries: mappedEntries, nextCursor }
    } catch (error) {
      this.logger.error('Error fetching journal entries', error)
      throw error
    }
  }

  /**
   * Get all entries without pagination (for use by other services that need all entries)
   */
  async findAllUnpaginated(userId: string): Promise<JournalEntry[]> {
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
      this.logger.error('Error fetching all journal entries', error)
      throw error
    }
  }

  async findOne(id: string, userId: string): Promise<JournalEntryWithGoals> {
    try {
      const entry = await this.firebaseService.getDocument(this.collectionName, id)

      if (!entry) {
        throw new NotFoundException('Journal entry not found')
      }

      // Check if the entry belongs to the user
      if (entry.user_id !== userId) {
        throw new ForbiddenException('You do not have access to this journal entry')
      }

      // Fetch linked goals
      const linkedGoalIds = await this.getLinkedGoals(userId, id)

      return {
        id: entry.id,
        user_id: entry.user_id,
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        tags: entry.tags || [],
        created_at: entry.created_at?.toDate() || new Date(),
        updated_at: entry.updated_at?.toDate() || new Date(),
        linked_goal_ids: linkedGoalIds,
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
      const existingEntry = await this.findOne(id, userId)

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

      // Update embedding if title or content changed
      if (updateJournalDto.title !== undefined || updateJournalDto.content !== undefined) {
        const updatedTitle = updateJournalDto.title ?? existingEntry.title
        const updatedContent = updateJournalDto.content ?? existingEntry.content
        const embeddingText = `${updatedTitle}\n\n${updatedContent}`
        
        const metadata: Record<string, any> = {
          tags: updateJournalDto.tags ?? existingEntry.tags ?? [],
        }
        
        const updatedMood = updateJournalDto.mood ?? existingEntry.mood
        if (updatedMood) {
          metadata.mood = updatedMood
        }

        // Delete old embedding and create new one with updated metadata
        this.ragService
          .deleteEmbeddings(userId, id)
          .then(() => {
            return this.ragService.embedContent({
              userId,
              contentType: 'journal',
              documentId: id,
              text: embeddingText,
              metadata,
            })
          })
          .catch((err) => {
            this.logger.error(`Failed to update embedding for journal entry ${id}`, err)
          })
      }

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

      // Delete embeddings before deleting the document
      try {
        await this.ragService.deleteEmbeddings(userId, id)
        this.logger.log(`Embeddings deleted for journal entry: ${id}`)
      } catch (err) {
        this.logger.error(`Failed to delete embeddings for journal entry ${id}`, err)
        // Continue with document deletion even if embedding deletion fails
      }

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
      const allEntries = await this.findAllUnpaginated(userId)

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
      // Use pagination for efficiency - only fetch what we need
      const result = await this.findAll(userId, limit)
      return result.entries
    } catch (error) {
      this.logger.error('Error fetching recent journal entries', error)
      throw error
    }
  }

  async getEntriesFromPastDays(userId: string, days: number = 7): Promise<JournalEntry[]> {
    try {
      const entries = await this.findAllUnpaginated(userId)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      return entries.filter((entry) => {
        const entryDate = new Date(entry.created_at)
        return entryDate >= cutoffDate
      })
    } catch (error) {
      this.logger.error(`Error fetching journal entries from past ${days} days`, error)
      throw error
    }
  }

  async findAllGroupedByDate(
    userId: string,
    limit?: number,
    cursor?: string,
  ): Promise<{ groupedEntries: Record<string, JournalEntry[]>; nextCursor: string | null }> {
    try {
      // Get paginated entries
      const { entries, nextCursor } = await this.findAll(userId, limit, cursor)

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

      return { groupedEntries: grouped, nextCursor }
    } catch (error) {
      this.logger.error('Error fetching grouped journal entries', error)
      throw error
    }
  }

  async getLinkedGoals(userId: string, journalEntryId: string): Promise<any[]> {
    try {
      const firestore = this.firebaseService.getFirestore()
      const linksRef = firestore.collection(this.linksCollection)
      
      const linksSnapshot = await linksRef
        .where('journal_entry_id', '==', journalEntryId)
        .where('user_id', '==', userId)
        .get()

      const goalIds = linksSnapshot.docs.map((doc) => {
        const data = doc.data()
        return data.goal_id
      })

      this.logger.log(`Found ${goalIds.length} linked goals for journal entry ${journalEntryId}`)

      // Fetch full goal objects
      if (goalIds.length === 0) {
        return []
      }

      const goalsRef = firestore.collection('goals')
      const goalsPromises = goalIds.map((goalId) => goalsRef.doc(goalId).get())
      const goalDocs = await Promise.all(goalsPromises)

      const goals = goalDocs
        .filter((doc) => doc.exists && doc.data()?.user_id === userId)
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data()?.created_at?.toDate() || new Date(),
          updated_at: doc.data()?.updated_at?.toDate() || new Date(),
          target_date: doc.data()?.target_date?.toDate() || new Date(),
          completed_at: doc.data()?.completed_at?.toDate() || null,
          status_changed_at: doc.data()?.status_changed_at?.toDate() || new Date(),
          last_activity: doc.data()?.last_activity?.toDate() || new Date(),
        }))

      return goals
    } catch (error) {
      this.logger.error('Error fetching linked goals for journal entry', error)
      throw error
    }
  }
}

