import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import {
  CreateGoalDto,
  UpdateGoalDto,
  UpdateGoalStatusDto,
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreateProgressDto,
} from '@/common/dto/goal.dto'
import { Goal, Milestone, GoalStatus, ProgressUpdate } from '@/common/types/goal.types'
import { RagService } from '@/rag/rag.service'

@Injectable()
export class GoalService {
  private readonly logger = new Logger(GoalService.name)
  private readonly goalsCollection = 'goals'
  private readonly linksCollection = 'goal_journal_links'
  
  // Cache for frequently accessed data
  private readonly goalCountsCache = new Map<string, { counts: any; timestamp: number }>()
  private readonly CACHE_TTL = 60000 // 1 minute cache TTL

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly ragService: RagService,
  ) {}

  async createGoal(userId: string, createGoalDto: CreateGoalDto): Promise<Goal> {
    try {
      // Validate target date is in the future
      const targetDate = new Date(createGoalDto.target_date)
      if (targetDate < new Date()) {
        throw new BadRequestException('Target date must be in the future')
      }

      const now = new Date()
      const data: any = {
        user_id: userId,
        title: createGoalDto.title,
        description: createGoalDto.description || '',
        category: createGoalDto.category,
        status: 'not_started' as GoalStatus,
        target_date: targetDate,
        completed_at: null,
        status_changed_at: now,
        last_activity: now,
        progress_percentage: 0,
      }

      this.logger.log(`Creating goal for user: ${userId}`)
      const result = await this.firebaseService.addDocument(this.goalsCollection, data)

      // Clear cache after creating goal
      this.clearUserCache(userId)

      this.logger.log(`Goal created: ${result.id} for user: ${userId}`)

      // Generate embedding for the goal (async, non-blocking)
      this.ragService.embedContent({
        userId,
        contentType: 'goal',
        documentId: result.id,
        text: `${createGoalDto.title}\n\n${createGoalDto.description || ''}`,
        metadata: {
          category: createGoalDto.category,
          status: 'not_started',
          target_date: targetDate.toISOString(),
        },
      }, true).catch(err => {
        this.logger.error('Failed to embed goal', {
          error: err.message,
          goalId: result.id,
          userId,
        });
      });

      return {
        id: result.id,
        ...data,
        created_at: result.created_at.toDate(),
        updated_at: result.updated_at.toDate(),
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      this.logger.error('Error creating goal', error)
      throw error
    }
  }
  
  // Batch create multiple goals
  async batchCreateGoals(userId: string, goalsData: CreateGoalDto[]): Promise<Goal[]> {
    try {
      const firestore = this.firebaseService.getFirestore()
      const batch = firestore.batch()
      const now = new Date()
      const createdGoals: Goal[] = []

      for (const goalDto of goalsData) {
        // Validate target date
        const targetDate = new Date(goalDto.target_date)
        if (targetDate < new Date()) {
          throw new BadRequestException(`Target date must be in the future for goal: ${goalDto.title}`)
        }

        const goalRef = firestore.collection(this.goalsCollection).doc()
        const data = {
          user_id: userId,
          title: goalDto.title,
          description: goalDto.description || '',
          category: goalDto.category,
          status: 'not_started' as GoalStatus,
          target_date: targetDate,
          completed_at: null,
          status_changed_at: now,
          last_activity: now,
          progress_percentage: 0,
          created_at: now,
          updated_at: now,
        }

        batch.set(goalRef, data)
        
        createdGoals.push({
          id: goalRef.id,
          ...data,
        })
      }

      await batch.commit()
      
      // Clear cache after batch create
      this.clearUserCache(userId)

      this.logger.log(`Batch created ${goalsData.length} goals for user: ${userId}`)

      // Generate embeddings for all created goals (async, non-blocking)
      createdGoals.forEach((goal, index) => {
        const goalDto = goalsData[index];
        this.ragService.embedContent({
          userId,
          contentType: 'goal',
          documentId: goal.id,
          text: `${goalDto.title}\n\n${goalDto.description || ''}`,
          metadata: {
            category: goalDto.category,
            status: 'not_started',
            target_date: goal.target_date.toISOString(),
          },
        }, true).catch(err => {
          this.logger.error('Failed to embed goal in batch', {
            error: err.message,
            goalId: goal.id,
            userId,
          });
        });
      });

      return createdGoals
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      this.logger.error('Error batch creating goals', error)
      throw error
    }
  }
  
  // Batch update multiple goals
  async batchUpdateGoals(
    userId: string, 
    updates: Array<{ goalId: string; data: UpdateGoalDto }>
  ): Promise<Goal[]> {
    try {
      const firestore = this.firebaseService.getFirestore()
      const batch = firestore.batch()
      const updatedGoals: Goal[] = []

      // Verify ownership of all goals first
      for (const update of updates) {
        await this.getGoalById(userId, update.goalId)
      }

      // Perform batch update
      for (const update of updates) {
        const goalRef = firestore.collection(this.goalsCollection).doc(update.goalId)
        const updateData: any = { ...update.data }
        
        if (updateData.target_date) {
          const targetDate = new Date(updateData.target_date)
          if (targetDate < new Date()) {
            throw new BadRequestException(`Target date must be in the future for goal: ${update.goalId}`)
          }
          updateData.target_date = targetDate
        }
        
        updateData.updated_at = new Date()
        batch.update(goalRef, updateData)
      }

      await batch.commit()
      
      // Clear cache after batch update
      this.clearUserCache(userId)

      // Fetch updated goals
      for (const update of updates) {
        const goal = await this.getGoalById(userId, update.goalId)
        updatedGoals.push(goal)
      }

      this.logger.log(`Batch updated ${updates.length} goals for user: ${userId}`)
      return updatedGoals
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error batch updating goals', error)
      throw error
    }
  }

  async getGoals(
    userId: string, 
    filters?: { category?: string; status?: string },
    limit?: number,
    startAfter?: string
  ): Promise<{ goals: Goal[]; nextCursor: string | null }> {
    try {
      const conditions: any[] = [{ field: 'user_id', operator: '==', value: userId }]

      if (filters?.category) {
        conditions.push({ field: 'category', operator: '==', value: filters.category })
      }

      if (filters?.status) {
        conditions.push({ field: 'status', operator: '==', value: filters.status })
      }

      // Default limit for pagination
      const pageLimit = limit || 20
      
      // Fetch one extra to determine if there are more results
      const goals = await this.firebaseService.getCollection(
        this.goalsCollection,
        conditions,
        'created_at',
        'desc',
        pageLimit + 1,
        startAfter
      )

      // Check if there are more results
      const hasMore = goals.length > pageLimit
      const goalsToReturn = hasMore ? goals.slice(0, pageLimit) : goals
      const nextCursor = hasMore ? goalsToReturn[goalsToReturn.length - 1].id : null

      const mappedGoals = goalsToReturn.map((goal: any) => ({
        id: goal.id,
        user_id: goal.user_id,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        status: goal.status,
        target_date: goal.target_date?.toDate() || new Date(),
        created_at: goal.created_at?.toDate() || new Date(),
        updated_at: goal.updated_at?.toDate() || new Date(),
        completed_at: goal.completed_at?.toDate() || null,
        status_changed_at: goal.status_changed_at?.toDate() || new Date(),
        last_activity: goal.last_activity?.toDate() || new Date(),
        progress_percentage: goal.progress_percentage || 0,
      }))

      return { goals: mappedGoals, nextCursor }
    } catch (error) {
      this.logger.error('Error fetching goals', error)
      throw error
    }
  }
  
  // Backward compatibility method without pagination
  async getAllGoals(userId: string, filters?: { category?: string; status?: string }): Promise<Goal[]> {
    const result = await this.getGoals(userId, filters, 1000) // Large limit for backward compatibility
    return result.goals
  }

  async getGoalById(userId: string, goalId: string): Promise<Goal> {
    try {
      const goal = await this.firebaseService.getDocument(this.goalsCollection, goalId)

      if (!goal) {
        throw new NotFoundException('Goal not found')
      }

      if (goal.user_id !== userId) {
        throw new ForbiddenException('You do not have access to this goal')
      }

      return {
        id: goal.id,
        user_id: goal.user_id,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        status: goal.status,
        target_date: goal.target_date?.toDate() || new Date(),
        created_at: goal.created_at?.toDate() || new Date(),
        updated_at: goal.updated_at?.toDate() || new Date(),
        completed_at: goal.completed_at?.toDate() || null,
        status_changed_at: goal.status_changed_at?.toDate() || new Date(),
        last_activity: goal.last_activity?.toDate() || new Date(),
        progress_percentage: goal.progress_percentage || 0,
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error fetching goal', error)
      throw error
    }
  }

  async updateGoal(userId: string, goalId: string, updateGoalDto: UpdateGoalDto): Promise<Goal> {
    try {
      // Verify ownership
      await this.getGoalById(userId, goalId)

      const updateData: any = {}

      if (updateGoalDto.title !== undefined) {
        updateData.title = updateGoalDto.title
      }

      if (updateGoalDto.description !== undefined) {
        updateData.description = updateGoalDto.description
      }

      if (updateGoalDto.category !== undefined) {
        updateData.category = updateGoalDto.category
      }

      if (updateGoalDto.target_date !== undefined) {
        const targetDate = new Date(updateGoalDto.target_date)
        if (targetDate < new Date()) {
          throw new BadRequestException('Target date must be in the future')
        }
        updateData.target_date = targetDate
      }

      await this.firebaseService.updateDocument(this.goalsCollection, goalId, updateData)

      // Clear cache after update
      this.clearUserCache(userId)

      this.logger.log(`Goal updated: ${goalId} for user: ${userId}`)

      // Update embedding if title or description changed
      if (updateGoalDto.title !== undefined || updateGoalDto.description !== undefined) {
        const updatedGoal = await this.getGoalById(userId, goalId);
        this.ragService.embedContent({
          userId,
          contentType: 'goal',
          documentId: goalId,
          text: `${updatedGoal.title}\n\n${updatedGoal.description || ''}`,
          metadata: {
            category: updatedGoal.category,
            status: updatedGoal.status,
            target_date: updatedGoal.target_date.toISOString(),
          },
        }, true).catch(err => {
          this.logger.error('Failed to update goal embedding', {
            error: err.message,
            goalId,
            userId,
          });
        });
      }

      return this.getGoalById(userId, goalId)
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error
      }
      this.logger.error('Error updating goal', error)
      throw error
    }
  }

  async getGoalDeletionInfo(userId: string, goalId: string): Promise<{
    milestonesCount: number
    progressUpdatesCount: number
    linkedJournalEntriesCount: number
  }> {
    try {
      // Verify ownership
      await this.getGoalById(userId, goalId)

      const firestore = this.firebaseService.getFirestore()

      // Count milestones
      const milestonesRef = firestore.collection(`${this.goalsCollection}/${goalId}/milestones`)
      const milestonesSnapshot = await milestonesRef.get()
      const milestonesCount = milestonesSnapshot.size

      // Count progress updates
      const progressRef = firestore.collection(`${this.goalsCollection}/${goalId}/progress_updates`)
      const progressSnapshot = await progressRef.get()
      const progressUpdatesCount = progressSnapshot.size

      // Count linked journal entries
      const linksRef = firestore.collection(this.linksCollection)
      const linksSnapshot = await linksRef.where('goal_id', '==', goalId).get()
      const linkedJournalEntriesCount = linksSnapshot.size

      this.logger.log(`Deletion info for goal ${goalId}: ${milestonesCount} milestones, ${progressUpdatesCount} progress updates, ${linkedJournalEntriesCount} journal links`)

      return {
        milestonesCount,
        progressUpdatesCount,
        linkedJournalEntriesCount,
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error getting goal deletion info', error)
      throw error
    }
  }

  async deleteGoal(userId: string, goalId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify ownership
      await this.getGoalById(userId, goalId)

      const firestore = this.firebaseService.getFirestore()
      const batch = firestore.batch()

      // Delete milestones subcollection
      const milestonesRef = firestore.collection(`${this.goalsCollection}/${goalId}/milestones`)
      const milestonesSnapshot = await milestonesRef.get()
      milestonesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // Delete progress_updates subcollection
      const progressRef = firestore.collection(`${this.goalsCollection}/${goalId}/progress_updates`)
      const progressSnapshot = await progressRef.get()
      progressSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // Delete goal_journal_links where goal_id matches
      const linksRef = firestore.collection(this.linksCollection)
      const linksSnapshot = await linksRef.where('goal_id', '==', goalId).get()
      linksSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // Delete the goal document itself
      const goalRef = firestore.collection(this.goalsCollection).doc(goalId)
      batch.delete(goalRef)

      // Commit the batch
      await batch.commit()

      // Clear cache after delete
      this.clearUserCache(userId)

      this.logger.log(`Goal deleted with cascade: ${goalId} for user: ${userId}`)

      // Delete embeddings for goal and all related content (async, non-blocking)
      // Delete goal embedding
      this.ragService.deleteEmbeddings(userId, goalId).catch(err => {
        this.logger.error('Failed to delete goal embedding', {
          error: err.message,
          goalId,
          userId,
        });
      });

      // Delete milestone embeddings
      milestonesSnapshot.docs.forEach((doc) => {
        this.ragService.deleteEmbeddings(userId, doc.id).catch(err => {
          this.logger.error('Failed to delete milestone embedding', {
            error: err.message,
            milestoneId: doc.id,
            goalId,
            userId,
          });
        });
      });

      // Delete progress update embeddings
      progressSnapshot.docs.forEach((doc) => {
        this.ragService.deleteEmbeddings(userId, doc.id).catch(err => {
          this.logger.error('Failed to delete progress update embedding', {
            error: err.message,
            progressId: doc.id,
            goalId,
            userId,
          });
        });
      });

      return { success: true, message: 'Goal deleted successfully' }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error deleting goal', error)
      throw error
    }
  }

  async updateGoalStatus(
    userId: string,
    goalId: string,
    updateStatusDto: UpdateGoalStatusDto,
  ): Promise<Goal> {
    try {
      // Verify ownership
      await this.getGoalById(userId, goalId)

      const updateData: any = {
        status: updateStatusDto.status,
        status_changed_at: new Date(),
      }

      // If marking as completed, set completed_at
      if (updateStatusDto.status === 'completed') {
        const milestones = await this.getMilestones(userId,goalId)
        milestones.map( async (milestone) => {
          if( !milestone.completed) {
            await this.toggleMilestone(userId,goalId,milestone.id)
          }
        });
        updateData.completed_at = new Date()
        updateData.progress_percentage = 100
      } else {
        updateData.completed_at = null
      }

      await this.firebaseService.updateDocument(this.goalsCollection, goalId, updateData)

      // Clear cache after status update
      this.clearUserCache(userId)

      this.logger.log(`Goal status updated: ${goalId} to ${updateStatusDto.status} for user: ${userId}`)

      return this.getGoalById(userId, goalId)
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error updating goal status', error)
      throw error
    }
  }

  async getOverdueGoals(userId: string): Promise<Goal[]> {
    try {
      const result = await this.getAllGoals(userId)
      const now = new Date()

      return result.filter(
        (goal) =>
          goal.target_date < now &&
          goal.status !== 'completed' &&
          goal.status !== 'abandoned',
      )
    } catch (error) {
      this.logger.error('Error fetching overdue goals', error)
      throw error
    }
  }

  async getGoalsByCategory(userId: string, category: string): Promise<Goal[]> {
    try {
      const result = await this.getAllGoals(userId, { category })
      return result
    } catch (error) {
      this.logger.error('Error fetching goals by category', error)
      throw error
    }
  }
  
  // Get goal counts with caching
  async getGoalCounts(userId: string): Promise<{
    total: number
    active: number
    completed: number
    abandoned: number
    overdue: number
  }> {
    try {
      // Check cache first
      const cached = this.goalCountsCache.get(userId)
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        this.logger.log(`Returning cached goal counts for user: ${userId}`)
        return cached.counts
      }

      // Fetch all goals
      const goals = await this.getAllGoals(userId)
      const now = new Date()

      const counts = {
        total: goals.length,
        active: goals.filter(g => g.status === 'in_progress' || g.status === 'not_started').length,
        completed: goals.filter(g => g.status === 'completed').length,
        abandoned: goals.filter(g => g.status === 'abandoned').length,
        overdue: goals.filter(g => 
          g.target_date < now && 
          g.status !== 'completed' && 
          g.status !== 'abandoned'
        ).length,
      }

      // Cache the result
      this.goalCountsCache.set(userId, { counts, timestamp: Date.now() })
      
      this.logger.log(`Calculated and cached goal counts for user: ${userId}`)
      return counts
    } catch (error) {
      this.logger.error('Error getting goal counts', error)
      throw error
    }
  }
  
  // Clear cache for a user (call after goal updates)
  private clearUserCache(userId: string): void {
    this.goalCountsCache.delete(userId)
  }

  // Milestone Management Methods

  async addMilestone(
    userId: string,
    goalId: string,
    createMilestoneDto: CreateMilestoneDto,
  ): Promise<Milestone> {
    try {
      // Verify goal ownership
      await this.getGoalById(userId, goalId)

      // Get existing milestones to determine order
      const existingMilestones = await this.getMilestones(userId, goalId)
      const maxOrder = existingMilestones.length > 0 
        ? Math.max(...existingMilestones.map(m => m.order))
        : 0

      const firestore = this.firebaseService.getFirestore()
      const milestonesRef = firestore.collection(`${this.goalsCollection}/${goalId}/milestones`)
      
      const now = new Date()
      const milestoneData: any = {
        goal_id: goalId,
        title: createMilestoneDto.title,
        due_date: createMilestoneDto.due_date ? new Date(createMilestoneDto.due_date) : null,
        completed: false,
        completed_at: null,
        order: maxOrder + 1,
        created_at: now,
      }

      const docRef = await milestonesRef.add(milestoneData)

      // Update goal's last_activity
      await this.firebaseService.updateDocument(this.goalsCollection, goalId, {
        last_activity: now,
      })

      // Recalculate progress
      await this.calculateProgress(userId, goalId)

      this.logger.log(`Milestone added: ${docRef.id} to goal: ${goalId}`)

      // Generate embedding for the milestone (async, non-blocking)
      this.ragService.embedContent({
        userId,
        contentType: 'milestone',
        documentId: docRef.id,
        text: createMilestoneDto.title,
        metadata: {
          goal_id: goalId,
          due_date: milestoneData.due_date ? milestoneData.due_date.toISOString() : null,
          completed: false,
          order: milestoneData.order,
        },
      }, true).catch(err => {
        this.logger.error('Failed to embed milestone', {
          error: err.message,
          milestoneId: docRef.id,
          goalId,
          userId,
        });
      });

      return {
        id: docRef.id,
        ...milestoneData,
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error adding milestone', error)
      throw error
    }
  }

  async getMilestones(userId: string, goalId: string): Promise<Milestone[]> {
    try {
      // Verify goal ownership
      await this.getGoalById(userId, goalId)

      const firestore = this.firebaseService.getFirestore()
      const milestonesRef = firestore.collection(`${this.goalsCollection}/${goalId}/milestones`)
      
      const snapshot = await milestonesRef.orderBy('order', 'asc').get()

      return snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          goal_id: goalId,
          title: data.title,
          due_date: data.due_date?.toDate() || null,
          completed: data.completed || false,
          completed_at: data.completed_at?.toDate() || null,
          order: data.order || 0,
          created_at: data.created_at?.toDate() || new Date(),
        }
      })
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error fetching milestones', error)
      throw error
    }
  }

  async updateMilestone(
    userId: string,
    goalId: string,
    milestoneId: string,
    updateMilestoneDto: UpdateMilestoneDto,
  ): Promise<Milestone> {
    try {
      // Verify goal ownership
      await this.getGoalById(userId, goalId)

      const firestore = this.firebaseService.getFirestore()
      const milestoneRef = firestore
        .collection(`${this.goalsCollection}/${goalId}/milestones`)
        .doc(milestoneId)

      const milestoneDoc = await milestoneRef.get()
      if (!milestoneDoc.exists) {
        throw new NotFoundException('Milestone not found')
      }

      const updateData: any = {}

      if (updateMilestoneDto.title !== undefined) {
        updateData.title = updateMilestoneDto.title
      }

      if (updateMilestoneDto.due_date !== undefined) {
        updateData.due_date = updateMilestoneDto.due_date ? new Date(updateMilestoneDto.due_date) : null
      }

      await milestoneRef.update(updateData)

      // Update goal's last_activity
      await this.firebaseService.updateDocument(this.goalsCollection, goalId, {
        last_activity: new Date(),
      })

      this.logger.log(`Milestone updated: ${milestoneId} in goal: ${goalId}`)

      // Fetch and return updated milestone
      const updatedDoc = await milestoneRef.get()
      const data = updatedDoc.data()

      if (!data) {
        throw new NotFoundException('Milestone not found after update')
      }

      // Update embedding if title changed
      if (updateMilestoneDto.title !== undefined) {
        this.ragService.embedContent({
          userId,
          contentType: 'milestone',
          documentId: milestoneId,
          text: data.title,
          metadata: {
            goal_id: goalId,
            due_date: data.due_date ? data.due_date.toDate().toISOString() : null,
            completed: data.completed || false,
            order: data.order || 0,
          },
        }, true).catch(err => {
          this.logger.error('Failed to update milestone embedding', {
            error: err.message,
            milestoneId,
            goalId,
            userId,
          });
        });
      }

      return {
        id: updatedDoc.id,
        goal_id: goalId,
        title: data.title,
        due_date: data.due_date?.toDate() || null,
        completed: data.completed || false,
        completed_at: data.completed_at?.toDate() || null,
        order: data.order || 0,
        created_at: data.created_at?.toDate() || new Date(),
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error updating milestone', error)
      throw error
    }
  }

  async toggleMilestone(
    userId: string,
    goalId: string,
    milestoneId: string,
  ): Promise<Milestone> {
    try {
      // Verify goal ownership
      await this.getGoalById(userId, goalId)

      const firestore = this.firebaseService.getFirestore()
      const milestoneRef = firestore
        .collection(`${this.goalsCollection}/${goalId}/milestones`)
        .doc(milestoneId)

      const milestoneDoc = await milestoneRef.get()
      if (!milestoneDoc.exists) {
        throw new NotFoundException('Milestone not found')
      }

      const currentData = milestoneDoc.data()
      if (!currentData) {
        throw new NotFoundException('Milestone data not found')
      }

      const newCompletedStatus = !currentData.completed
      const now = new Date()

      await milestoneRef.update({
        completed: newCompletedStatus,
        completed_at: newCompletedStatus ? now : null,
      })

      // Update goal's last_activity
      await this.firebaseService.updateDocument(this.goalsCollection, goalId, {
        last_activity: now,
      })

      // Recalculate progress
      await this.calculateProgress(userId, goalId)

      this.logger.log(`Milestone toggled: ${milestoneId} in goal: ${goalId} to ${newCompletedStatus}`)

      // Fetch and return updated milestone
      const updatedDoc = await milestoneRef.get()
      const data = updatedDoc.data()

      if (!data) {
        throw new NotFoundException('Milestone not found after toggle')
      }

      return {
        id: updatedDoc.id,
        goal_id: goalId,
        title: data.title,
        due_date: data.due_date?.toDate() || null,
        completed: data.completed || false,
        completed_at: data.completed_at?.toDate() || null,
        order: data.order || 0,
        created_at: data.created_at?.toDate() || new Date(),
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error toggling milestone', error)
      throw error
    }
  }

  async deleteMilestone(
    userId: string,
    goalId: string,
    milestoneId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify goal ownership
      await this.getGoalById(userId, goalId)

      const firestore = this.firebaseService.getFirestore()
      const milestoneRef = firestore
        .collection(`${this.goalsCollection}/${goalId}/milestones`)
        .doc(milestoneId)

      const milestoneDoc = await milestoneRef.get()
      if (!milestoneDoc.exists) {
        throw new NotFoundException('Milestone not found')
      }

      await milestoneRef.delete()

      // Update goal's last_activity
      await this.firebaseService.updateDocument(this.goalsCollection, goalId, {
        last_activity: new Date(),
      })

      // Recalculate progress
      await this.calculateProgress(userId, goalId)

      this.logger.log(`Milestone deleted: ${milestoneId} from goal: ${goalId}`)

      // Delete milestone embedding (async, non-blocking)
      this.ragService.deleteEmbeddings(userId, milestoneId).catch(err => {
        this.logger.error('Failed to delete milestone embedding', {
          error: err.message,
          milestoneId,
          goalId,
          userId,
        });
      });

      return { success: true, message: 'Milestone deleted successfully' }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error deleting milestone', error)
      throw error
    }
  }

  async calculateProgress(userId: string, goalId: string): Promise<number> {
    try {
      // Verify goal ownership
      await this.getGoalById(userId, goalId)

      const milestones = await this.getMilestones(userId, goalId)

      let progressPercentage = 0

      if (milestones.length > 0) {
        const completedCount = milestones.filter((m) => m.completed).length
        progressPercentage = Math.round((completedCount / milestones.length) * 100)
      }

      // Update the goal's progress_percentage
      await this.firebaseService.updateDocument(this.goalsCollection, goalId, {
        progress_percentage: progressPercentage,
      })

      this.logger.log(`Progress calculated for goal ${goalId}: ${progressPercentage}%`)

      return progressPercentage
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error calculating progress', error)
      throw error
    }
  }

  // Progress Update Management Methods

  async addProgressUpdate(
    userId: string,
    goalId: string,
    createProgressDto: CreateProgressDto,
  ): Promise<ProgressUpdate> {
    try {
      // Verify goal ownership
      await this.getGoalById(userId, goalId)

      const firestore = this.firebaseService.getFirestore()
      const progressRef = firestore.collection(`${this.goalsCollection}/${goalId}/progress_updates`)
      
      const now = new Date()
      const progressData: any = {
        goal_id: goalId,
        content: createProgressDto.content,
        created_at: now,
      }

      const docRef = await progressRef.add(progressData)

      // Update goal's last_activity timestamp
      await this.firebaseService.updateDocument(this.goalsCollection, goalId, {
        last_activity: now,
      })

      this.logger.log(`Progress update added: ${docRef.id} to goal: ${goalId}`)

      // Generate embedding for the progress update (async, non-blocking)
      this.ragService.embedContent({
        userId,
        contentType: 'progress_update',
        documentId: docRef.id,
        text: createProgressDto.content,
        metadata: {
          goal_id: goalId,
          created_at: now.toISOString(),
        },
      }, true).catch(err => {
        this.logger.error('Failed to embed progress update', {
          error: err.message,
          progressId: docRef.id,
          goalId,
          userId,
        });
      });

      return {
        id: docRef.id,
        ...progressData,
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error adding progress update', error)
      throw error
    }
  }

  async getProgressUpdates(userId: string, goalId: string): Promise<ProgressUpdate[]> {
    try {
      // Verify goal ownership
      await this.getGoalById(userId, goalId)

      const firestore = this.firebaseService.getFirestore()
      const progressRef = firestore.collection(`${this.goalsCollection}/${goalId}/progress_updates`)
      
      // Fetch in reverse chronological order (newest first)
      const snapshot = await progressRef.orderBy('created_at', 'desc').get()

      return snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          goal_id: goalId,
          content: data.content,
          created_at: data.created_at?.toDate() || new Date(),
        }
      })
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error fetching progress updates', error)
      throw error
    }
  }

  async deleteProgressUpdate(
    userId: string,
    goalId: string,
    progressId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify goal ownership
      await this.getGoalById(userId, goalId)

      const firestore = this.firebaseService.getFirestore()
      const progressRef = firestore
        .collection(`${this.goalsCollection}/${goalId}/progress_updates`)
        .doc(progressId)

      const progressDoc = await progressRef.get()
      if (!progressDoc.exists) {
        throw new NotFoundException('Progress update not found')
      }

      await progressRef.delete()

      this.logger.log(`Progress update deleted: ${progressId} from goal: ${goalId}`)

      // Delete progress update embedding (async, non-blocking)
      this.ragService.deleteEmbeddings(userId, progressId).catch(err => {
        this.logger.error('Failed to delete progress update embedding', {
          error: err.message,
          progressId,
          goalId,
          userId,
        });
      });

      return { success: true, message: 'Progress update deleted successfully' }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error deleting progress update', error)
      throw error
    }
  }

  // Goal-Journal Linking Methods

  async linkJournalEntry(
    userId: string,
    goalId: string,
    journalEntryId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify goal ownership
      await this.getGoalById(userId, goalId)

      // Check if link already exists
      const firestore = this.firebaseService.getFirestore()
      const linksRef = firestore.collection(this.linksCollection)
      
      const existingLinks = await linksRef
        .where('goal_id', '==', goalId)
        .where('journal_entry_id', '==', journalEntryId)
        .where('user_id', '==', userId)
        .get()

      if (!existingLinks.empty) {
        throw new BadRequestException('This journal entry is already linked to this goal')
      }

      const now = new Date()
      const linkData = {
        goal_id: goalId,
        journal_entry_id: journalEntryId,
        user_id: userId,
        created_at: now,
      }

      const docRef = await linksRef.add(linkData)

      this.logger.log(`Journal entry ${journalEntryId} linked to goal ${goalId}`)

      return { success: true, message: 'Journal entry linked successfully' }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error
      }
      this.logger.error('Error linking journal entry', error)
      throw error
    }
  }

  async unlinkJournalEntry(
    userId: string,
    goalId: string,
    journalEntryId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify goal ownership
      await this.getGoalById(userId, goalId)

      const firestore = this.firebaseService.getFirestore()
      const linksRef = firestore.collection(this.linksCollection)
      
      const linksSnapshot = await linksRef
        .where('goal_id', '==', goalId)
        .where('journal_entry_id', '==', journalEntryId)
        .where('user_id', '==', userId)
        .get()

      if (linksSnapshot.empty) {
        throw new NotFoundException('Link not found')
      }

      // Delete all matching links (should only be one, but handle multiple just in case)
      const batch = firestore.batch()
      linksSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })
      await batch.commit()

      this.logger.log(`Journal entry ${journalEntryId} unlinked from goal ${goalId}`)

      return { success: true, message: 'Journal entry unlinked successfully' }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error unlinking journal entry', error)
      throw error
    }
  }

  async getLinkedJournalEntries(userId: string, goalId: string): Promise<string[]> {
    try {
      // Verify goal ownership
      await this.getGoalById(userId, goalId)

      const firestore = this.firebaseService.getFirestore()
      const linksRef = firestore.collection(this.linksCollection)
      
      const linksSnapshot = await linksRef
        .where('goal_id', '==', goalId)
        .where('user_id', '==', userId)
        .get()

      const journalEntryIds = linksSnapshot.docs.map((doc) => {
        const data = doc.data()
        return data.journal_entry_id
      })

      this.logger.log(`Found ${journalEntryIds.length} linked journal entries for goal ${goalId}`)

      return journalEntryIds
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error fetching linked journal entries', error)
      throw error
    }
  }

  async getLinkedGoals(userId: string, journalEntryId: string): Promise<string[]> {
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

      return goalIds
    } catch (error) {
      this.logger.error('Error fetching linked goals', error)
      throw error
    }
  }

  // AI Context Building Methods

  async getGoalsForAIContext(userId: string): Promise<any[]> {
    try {
      // Get all active goals (not_started or in_progress)
      const activeGoals = await this.getAllGoals(userId, { status: 'in_progress' })
      const notStartedGoals = await this.getAllGoals(userId, { status: 'not_started' })
      const allActiveGoals = [...activeGoals, ...notStartedGoals]

      const goalsWithDetails = await Promise.all(
        allActiveGoals.map(async (goal) => {
          const milestones = await this.getMilestones(userId, goal.id)
          const progressUpdates = await this.getProgressUpdates(userId, goal.id)
          
          // Get only the 3 most recent progress updates
          const recentProgress = progressUpdates.slice(0, 3)

          const now = new Date()
          const daysRemaining = Math.ceil(
            (goal.target_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )

          return {
            title: goal.title,
            description: goal.description,
            category: goal.category,
            status: goal.status,
            targetDate: goal.target_date.toISOString().split('T')[0],
            daysRemaining,
            progress: goal.progress_percentage,
            milestones: milestones.map((m) => ({
              title: m.title,
              completed: m.completed,
              dueDate: m.due_date ? m.due_date.toISOString().split('T')[0] : null,
            })),
            recentProgress: recentProgress.map((p) => ({
              content: p.content,
              date: p.created_at.toISOString().split('T')[0],
            })),
          }
        })
      )

      this.logger.log(`Retrieved ${goalsWithDetails.length} active goals for AI context for user: ${userId}`)

      return goalsWithDetails
    } catch (error) {
      this.logger.error('Error getting goals for AI context', error)
      throw error
    }
  }

  async getInactiveGoals(userId: string): Promise<any[]> {
    try {
      const goals = await this.getAllGoals(userId)
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const inactiveGoals = goals.filter(
        (goal) =>
          (goal.status === 'in_progress' || goal.status === 'not_started') &&
          goal.last_activity < sevenDaysAgo
      )

      const inactiveGoalsWithDetails = inactiveGoals.map((goal) => {
        const daysSinceLastActivity = Math.floor(
          (now.getTime() - goal.last_activity.getTime()) / (1000 * 60 * 60 * 24)
        )

        return {
          title: goal.title,
          category: goal.category,
          daysSinceLastActivity,
          targetDate: goal.target_date.toISOString().split('T')[0],
        }
      })

      this.logger.log(`Found ${inactiveGoalsWithDetails.length} inactive goals for user: ${userId}`)

      return inactiveGoalsWithDetails
    } catch (error) {
      this.logger.error('Error getting inactive goals', error)
      throw error
    }
  }

  async getRecentCompletions(userId: string, days: number = 30): Promise<any[]> {
    try {
      const completedGoals = await this.getAllGoals(userId, { status: 'completed' })
      const now = new Date()
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

      const recentCompletions = completedGoals
        .filter((goal) => goal.completed_at && goal.completed_at >= cutoffDate)
        .map((goal) => {
          const daysTaken = goal.completed_at && goal.created_at
            ? Math.floor(
                (goal.completed_at.getTime() - goal.created_at.getTime()) / (1000 * 60 * 60 * 24)
              )
            : 0

          return {
            title: goal.title,
            category: goal.category,
            completedAt: goal.completed_at ? goal.completed_at.toISOString().split('T')[0] : null,
            daysTaken,
          }
        })

      this.logger.log(`Found ${recentCompletions.length} recent completions for user: ${userId}`)

      return recentCompletions
    } catch (error) {
      this.logger.error('Error getting recent completions', error)
      throw error
    }
  }
}
