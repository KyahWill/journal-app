import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { EncryptionService } from '@/common/services/encryption.service'
import { CreateRoutineDto, UpdateRoutineDto } from '@/common/dto/routine.dto'
import { Routine, RoutineStep, RoutineFrequency } from '@/common/types/routine.types'
import { format, isToday, isThisWeek, startOfWeek, startOfMonth, isThisMonth, subDays, subWeeks, subMonths, differenceInDays, differenceInWeeks, differenceInMonths } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

// Fields to encrypt in routines
const ENCRYPTED_FIELDS = ['title', 'description']
const ENCRYPTED_STEP_FIELDS = ['title']

@Injectable()
export class RoutineService {
  private readonly logger = new Logger(RoutineService.name)
  private readonly routinesCollection = 'routines'

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Encrypt routine fields
   */
  private encryptRoutine(routine: any, encryptionKey?: Buffer): any {
    if (!encryptionKey || !this.encryptionService.isEnabled()) {
      return routine
    }
    const encrypted = this.encryptionService.encryptFields(routine, ENCRYPTED_FIELDS, encryptionKey)
    
    // Encrypt step titles
    if (encrypted.steps && Array.isArray(encrypted.steps)) {
      encrypted.steps = encrypted.steps.map((step: any) =>
        this.encryptionService.encryptFields(step, ENCRYPTED_STEP_FIELDS, encryptionKey)
      )
    }
    
    return encrypted
  }

  /**
   * Decrypt routine fields
   */
  private decryptRoutine(routine: any, encryptionKey?: Buffer): any {
    if (!encryptionKey || !this.encryptionService.isEnabled()) {
      return routine
    }
    const decrypted = this.encryptionService.decryptFields(routine, ENCRYPTED_FIELDS, encryptionKey)
    
    // Decrypt step titles
    if (decrypted.steps && Array.isArray(decrypted.steps)) {
      decrypted.steps = decrypted.steps.map((step: any) =>
        this.encryptionService.decryptFields(step, ENCRYPTED_STEP_FIELDS, encryptionKey)
      )
    }
    
    return decrypted
  }

  async createRoutine(userId: string, createRoutineDto: CreateRoutineDto, encryptionKey?: Buffer): Promise<Routine> {
    try {
      const now = new Date()
      
      // Create steps with IDs
      const steps: RoutineStep[] = createRoutineDto.steps.map((step, index) => ({
        id: uuidv4(),
        title: step.title,
        completed: false,
        order: step.order !== undefined ? step.order : index,
      }))

      let data: any = {
        user_id: userId,
        title: createRoutineDto.title,
        description: createRoutineDto.description || '',
        group: createRoutineDto.group || null,
        frequency: createRoutineDto.frequency,
        steps,
        completed_dates: [],
        streak: 0,
        last_completed_at: null,
        created_at: now,
        updated_at: now,
      }

      // Encrypt data before saving
      data = this.encryptRoutine(data, encryptionKey)

      this.logger.log(`Creating routine for user: ${userId}`)
      const result = await this.firebaseService.addDocument(this.routinesCollection, data)

      this.logger.log(`Routine created: ${result.id} for user: ${userId}`)
      
      // Return decrypted version
      return this.convertToRoutine({ id: result.id, ...data }, encryptionKey)
    } catch (error) {
      this.logger.error('Error creating routine', error)
      throw error
    }
  }

  async getRoutines(userId: string, encryptionKey?: Buffer): Promise<Routine[]> {
    try {
      const conditions = [{ field: 'user_id', operator: '==' as const, value: userId }]
      const routines = await this.firebaseService.getCollection(
        this.routinesCollection,
        conditions,
        'created_at',
        'desc',
      )

      return routines.map(routine => this.convertToRoutine(routine, encryptionKey))
    } catch (error) {
      this.logger.error('Error getting routines', error)
      throw error
    }
  }

  async getRoutineById(userId: string, routineId: string, encryptionKey?: Buffer): Promise<Routine> {
    try {
      const routine = await this.firebaseService.getDocument(this.routinesCollection, routineId)

      if (!routine) {
        throw new NotFoundException(`Routine with ID ${routineId} not found`)
      }

      if (routine.user_id !== userId) {
        throw new ForbiddenException('Access denied to this routine')
      }

      return this.convertToRoutine(routine, encryptionKey)
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error getting routine by ID', error)
      throw error
    }
  }

  async updateRoutine(userId: string, routineId: string, updateRoutineDto: UpdateRoutineDto, encryptionKey?: Buffer): Promise<Routine> {
    try {
      // Verify ownership
      await this.getRoutineById(userId, routineId, encryptionKey)

      let updateData: any = { ...updateRoutineDto }
      
      // If steps are being updated, ensure they have IDs
      if (updateData.steps) {
        updateData.steps = updateData.steps.map((step: any, index: number) => ({
          id: step.id || uuidv4(),
          title: step.title,
          completed: step.completed !== undefined ? step.completed : false,
          order: step.order !== undefined ? step.order : index,
        }))
      }
      
      updateData.updated_at = new Date()

      // Encrypt data before updating
      updateData = this.encryptRoutine(updateData, encryptionKey)

      await this.firebaseService.updateDocument(this.routinesCollection, routineId, updateData)

      this.logger.log(`Routine updated: ${routineId} for user: ${userId}`)
      return this.getRoutineById(userId, routineId, encryptionKey)
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error updating routine', error)
      throw error
    }
  }

  async toggleStepCompletion(userId: string, routineId: string, stepId: string, encryptionKey?: Buffer): Promise<Routine> {
    try {
      const routine = await this.getRoutineById(userId, routineId, encryptionKey)

      // Find the step and toggle its completion
      const steps = routine.steps.map(step => {
        if (step.id === stepId) {
          return { ...step, completed: !step.completed }
        }
        return step
      })

      let updateData: any = {
        steps,
        updated_at: new Date(),
      }

      // Encrypt step data
      updateData = this.encryptRoutine(updateData, encryptionKey)

      await this.firebaseService.updateDocument(this.routinesCollection, routineId, updateData)

      this.logger.log(`Toggled step ${stepId} for routine: ${routineId}`)
      return this.getRoutineById(userId, routineId, encryptionKey)
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error toggling step completion', error)
      throw error
    }
  }

  async completeRoutine(userId: string, routineId: string, encryptionKey?: Buffer): Promise<Routine> {
    try {
      const routine = await this.getRoutineById(userId, routineId, encryptionKey)
      const today = format(new Date(), 'yyyy-MM-dd')

      // Check if already completed today
      if (routine.completed_dates.includes(today)) {
        throw new BadRequestException('Routine already completed today')
      }

      // Mark all steps as completed
      const steps = routine.steps.map(step => ({ ...step, completed: true }))

      // Add today to completed dates
      const completed_dates = [...routine.completed_dates, today]

      // Calculate new streak
      const streak = this.calculateStreak(completed_dates, routine.frequency)

      let updateData: any = {
        steps,
        completed_dates,
        streak,
        last_completed_at: new Date(),
        updated_at: new Date(),
      }

      // Encrypt step data
      updateData = this.encryptRoutine(updateData, encryptionKey)

      await this.firebaseService.updateDocument(this.routinesCollection, routineId, updateData)

      this.logger.log(`Routine completed: ${routineId} for user: ${userId}`)
      return this.getRoutineById(userId, routineId, encryptionKey)
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error
      }
      this.logger.error('Error completing routine', error)
      throw error
    }
  }

  async resetRoutineSteps(userId: string, routineId: string, encryptionKey?: Buffer): Promise<Routine> {
    try {
      const routine = await this.getRoutineById(userId, routineId, encryptionKey)

      // Reset all steps to uncompleted
      const steps = routine.steps.map(step => ({ ...step, completed: false }))

      let updateData: any = {
        steps,
        updated_at: new Date(),
      }

      // Encrypt step data
      updateData = this.encryptRoutine(updateData, encryptionKey)

      await this.firebaseService.updateDocument(this.routinesCollection, routineId, updateData)

      this.logger.log(`Reset steps for routine: ${routineId}`)
      return this.getRoutineById(userId, routineId, encryptionKey)
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error resetting routine steps', error)
      throw error
    }
  }

  async deleteRoutine(userId: string, routineId: string, encryptionKey?: Buffer): Promise<void> {
    try {
      // Verify ownership
      await this.getRoutineById(userId, routineId, encryptionKey)

      await this.firebaseService.deleteDocument(this.routinesCollection, routineId)

      this.logger.log(`Routine deleted: ${routineId} for user: ${userId}`)
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error deleting routine', error)
      throw error
    }
  }

  async getRoutineGroups(userId: string, encryptionKey?: Buffer): Promise<string[]> {
    try {
      const routines = await this.getRoutines(userId, encryptionKey)
      
      // Extract unique groups
      const groups = new Set<string>()
      routines.forEach(routine => {
        if (routine.group) {
          groups.add(routine.group)
        }
      })

      return Array.from(groups).sort()
    } catch (error) {
      this.logger.error('Error getting routine groups', error)
      throw error
    }
  }

  private calculateStreak(completedDates: string[], frequency: RoutineFrequency): number {
    if (completedDates.length === 0) return 0

    // Sort dates in descending order (most recent first)
    const sortedDates = [...completedDates].sort((a, b) => b.localeCompare(a))
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')

    let streak = 0

    switch (frequency) {
      case 'daily': {
        // Check if completed today or yesterday (allows for checking yesterday's streak)
        const mostRecentDate = new Date(sortedDates[0])
        const daysDiff = differenceInDays(today, mostRecentDate)
        
        if (daysDiff > 1) {
          // Streak is broken
          return 0
        }

        // Count consecutive days
        for (let i = 0; i < sortedDates.length; i++) {
          const currentDate = new Date(sortedDates[i])
          const expectedDate = subDays(today, i + (daysDiff === 1 ? 1 : 0))
          
          if (format(currentDate, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
            streak++
          } else {
            break
          }
        }
        break
      }

      case 'weekly': {
        // Check if completed this week or last week
        const mostRecentDate = new Date(sortedDates[0])
        const weeksDiff = differenceInWeeks(today, mostRecentDate)
        
        if (weeksDiff > 1) {
          return 0
        }

        // Count consecutive weeks
        const currentWeekStart = startOfWeek(today)
        for (let i = 0; i < sortedDates.length; i++) {
          const date = new Date(sortedDates[i])
          const expectedWeekStart = startOfWeek(subWeeks(currentWeekStart, i + (weeksDiff === 1 ? 1 : 0)))
          const dateWeekStart = startOfWeek(date)
          
          if (format(dateWeekStart, 'yyyy-MM-dd') === format(expectedWeekStart, 'yyyy-MM-dd')) {
            streak++
          } else {
            break
          }
        }
        break
      }

      case 'monthly': {
        // Check if completed this month or last month
        const mostRecentDate = new Date(sortedDates[0])
        const monthsDiff = differenceInMonths(today, mostRecentDate)
        
        if (monthsDiff > 1) {
          return 0
        }

        // Count consecutive months
        const currentMonthStart = startOfMonth(today)
        for (let i = 0; i < sortedDates.length; i++) {
          const date = new Date(sortedDates[i])
          const expectedMonthStart = startOfMonth(subMonths(currentMonthStart, i + (monthsDiff === 1 ? 1 : 0)))
          const dateMonthStart = startOfMonth(date)
          
          if (format(dateMonthStart, 'yyyy-MM-dd') === format(expectedMonthStart, 'yyyy-MM-dd')) {
            streak++
          } else {
            break
          }
        }
        break
      }
    }

    return streak
  }

  private convertToRoutine(data: any, encryptionKey?: Buffer): Routine {
    // Decrypt the data
    const decrypted = this.decryptRoutine(data, encryptionKey)
    
    return {
      id: decrypted.id,
      user_id: decrypted.user_id,
      title: decrypted.title,
      description: decrypted.description || '',
      group: decrypted.group || null,
      frequency: decrypted.frequency,
      steps: decrypted.steps || [],
      completed_dates: decrypted.completed_dates || [],
      streak: decrypted.streak || 0,
      last_completed_at: decrypted.last_completed_at?.toDate?.() || decrypted.last_completed_at || null,
      created_at: decrypted.created_at?.toDate?.() || decrypted.created_at,
      updated_at: decrypted.updated_at?.toDate?.() || decrypted.updated_at,
    }
  }
}
