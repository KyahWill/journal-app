import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { WeeklyInsight } from '@/common/types/journal.types'

@Injectable()
export class WeeklyInsightsService {
  private readonly logger = new Logger(WeeklyInsightsService.name)
  private readonly collectionName = 'weekly_insights'

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Get the Saturday that starts the current week
   * Week runs Saturday to Friday
   */
  getCurrentWeekStart(): Date {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday
    
    // Calculate days to subtract to get to the previous Saturday
    // If today is Saturday (6), we're at the start
    // If today is Sunday (0), go back 1 day
    // If today is Monday (1), go back 2 days
    // etc.
    const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek + 1
    
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysToSubtract)
    weekStart.setHours(0, 0, 0, 0)
    
    return weekStart
  }

  /**
   * Get the Friday that ends the current week
   */
  getCurrentWeekEnd(): Date {
    const weekStart = this.getCurrentWeekStart()
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // Saturday + 6 = Friday
    weekEnd.setHours(23, 59, 59, 999)
    
    return weekEnd
  }

  /**
   * Get the Saturday start for a specific week based on a date
   */
  getWeekStartForDate(date: Date): Date {
    const d = new Date(date)
    const dayOfWeek = d.getDay()
    const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek + 1
    
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - daysToSubtract)
    weekStart.setHours(0, 0, 0, 0)
    
    return weekStart
  }

  /**
   * Get the Friday end for a specific week based on a date
   */
  getWeekEndForDate(date: Date): Date {
    const weekStart = this.getWeekStartForDate(date)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    return weekEnd
  }

  /**
   * Format week identifier string (e.g., "2025-W49")
   */
  getWeekIdentifier(weekStart: Date): string {
    const year = weekStart.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const daysSinceStart = Math.floor((weekStart.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
    const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7)
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`
  }

  /**
   * Save weekly insights to the database
   */
  async saveInsights(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
    content: string,
    entryCount: number,
  ): Promise<WeeklyInsight> {
    try {
      // Check if insights already exist for this week
      const existing = await this.getInsightsForWeek(userId, weekStart)
      
      if (existing) {
        // Update existing insights
        await this.firebaseService.updateDocument(this.collectionName, existing.id, {
          content,
          entry_count: entryCount,
        })
        
        this.logger.log(`Updated weekly insights ${existing.id} for user: ${userId}`)
        
        return {
          ...existing,
          content,
          entry_count: entryCount,
          updated_at: new Date(),
        }
      }
      
      // Create new insights
      const data = {
        user_id: userId,
        week_start: weekStart,
        week_end: weekEnd,
        content,
        entry_count: entryCount,
      }

      const result = await this.firebaseService.addDocument(this.collectionName, data)

      this.logger.log(`Created weekly insights ${result.id} for user: ${userId}`)

      return {
        id: result.id,
        user_id: userId,
        week_start: weekStart,
        week_end: weekEnd,
        content,
        entry_count: entryCount,
        created_at: result.created_at.toDate(),
        updated_at: result.updated_at.toDate(),
      }
    } catch (error) {
      this.logger.error('Error saving weekly insights', error)
      throw error
    }
  }

  /**
   * Get insights for a specific week
   */
  async getInsightsForWeek(userId: string, weekStart: Date): Promise<WeeklyInsight | null> {
    try {
      // Normalize the week start to midnight
      const normalizedStart = new Date(weekStart)
      normalizedStart.setHours(0, 0, 0, 0)
      
      // Create end of day for the query (to handle any time zone issues)
      const queryStart = new Date(normalizedStart)
      queryStart.setHours(0, 0, 0, 0)
      
      const queryEnd = new Date(normalizedStart)
      queryEnd.setHours(23, 59, 59, 999)
      
      const insights = await this.firebaseService.getCollection(
        this.collectionName,
        [
          { field: 'user_id', operator: '==', value: userId },
          { field: 'week_start', operator: '>=', value: queryStart },
          { field: 'week_start', operator: '<=', value: queryEnd },
        ],
        'created_at',
        'desc',
      )

      if (insights.length === 0) {
        return null
      }

      const insight = insights[0]
      return {
        id: insight.id,
        user_id: insight.user_id,
        week_start: insight.week_start?.toDate() || new Date(),
        week_end: insight.week_end?.toDate() || new Date(),
        content: insight.content,
        entry_count: insight.entry_count || 0,
        created_at: insight.created_at?.toDate() || new Date(),
        updated_at: insight.updated_at?.toDate() || new Date(),
      }
    } catch (error) {
      this.logger.error('Error fetching weekly insights', error)
      throw error
    }
  }

  /**
   * Get insights for the current week
   */
  async getCurrentWeekInsights(userId: string): Promise<WeeklyInsight | null> {
    const weekStart = this.getCurrentWeekStart()
    return this.getInsightsForWeek(userId, weekStart)
  }

  /**
   * Get all historical insights for a user
   */
  async getAllInsights(userId: string, limit: number = 52): Promise<WeeklyInsight[]> {
    try {
      const insights = await this.firebaseService.getCollection(
        this.collectionName,
        [{ field: 'user_id', operator: '==', value: userId }],
        'week_start',
        'desc',
      )

      return insights.slice(0, limit).map((insight: any) => ({
        id: insight.id,
        user_id: insight.user_id,
        week_start: insight.week_start?.toDate() || new Date(),
        week_end: insight.week_end?.toDate() || new Date(),
        content: insight.content,
        entry_count: insight.entry_count || 0,
        created_at: insight.created_at?.toDate() || new Date(),
        updated_at: insight.updated_at?.toDate() || new Date(),
      }))
    } catch (error) {
      this.logger.error('Error fetching all weekly insights', error)
      throw error
    }
  }

  /**
   * Get a specific insight by ID
   */
  async getInsightById(userId: string, insightId: string): Promise<WeeklyInsight> {
    try {
      const insight = await this.firebaseService.getDocument(this.collectionName, insightId)

      if (!insight) {
        throw new NotFoundException('Weekly insight not found')
      }

      if (insight.user_id !== userId) {
        throw new NotFoundException('Weekly insight not found')
      }

      return {
        id: insight.id,
        user_id: insight.user_id,
        week_start: insight.week_start?.toDate() || new Date(),
        week_end: insight.week_end?.toDate() || new Date(),
        content: insight.content,
        entry_count: insight.entry_count || 0,
        created_at: insight.created_at?.toDate() || new Date(),
        updated_at: insight.updated_at?.toDate() || new Date(),
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error('Error fetching weekly insight by ID', error)
      throw error
    }
  }

  /**
   * Delete a specific insight
   */
  async deleteInsight(userId: string, insightId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify ownership
      await this.getInsightById(userId, insightId)

      await this.firebaseService.deleteDocument(this.collectionName, insightId)

      this.logger.log(`Deleted weekly insight ${insightId} for user: ${userId}`)

      return { success: true, message: 'Weekly insight deleted successfully' }
    } catch (error) {
      this.logger.error('Error deleting weekly insight', error)
      throw error
    }
  }
}

