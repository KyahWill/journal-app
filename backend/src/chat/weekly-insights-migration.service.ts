import { Injectable, Logger } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { JournalService } from '@/journal/journal.service'
import { GeminiService } from '@/gemini/gemini.service'
import { WeeklyInsightsService } from './weekly-insights.service'
import { JournalEntry, WeeklyInsight } from '@/common/types/journal.types'

interface MigrationResult {
  userId: string
  totalWeeks: number
  generatedCount: number
  skippedCount: number
  failedCount: number
  errors: { weekStart: Date; error: string }[]
  duration: number
}

interface WeekGroup {
  weekStart: Date
  weekEnd: Date
  entries: JournalEntry[]
}

@Injectable()
export class WeeklyInsightsMigrationService {
  private readonly logger = new Logger(WeeklyInsightsMigrationService.name)

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly journalService: JournalService,
    private readonly geminiService: GeminiService,
    private readonly weeklyInsightsService: WeeklyInsightsService,
  ) {}

  /**
   * Get all unique user IDs from journal entries
   */
  async getAllUserIds(): Promise<string[]> {
    const firestore = this.firebaseService.getFirestore()
    const journalRef = firestore.collection('journal-entries')
    const snapshot = await journalRef.get()

    const userIds = new Set<string>()
    snapshot.docs.forEach((doc) => {
      const userId = doc.data().user_id
      if (userId) {
        userIds.add(userId)
      }
    })

    return Array.from(userIds)
  }

  /**
   * Group journal entries by week (Saturday to Friday)
   */
  groupEntriesByWeek(entries: JournalEntry[]): WeekGroup[] {
    const weekMap = new Map<string, WeekGroup>()

    for (const entry of entries) {
      const entryDate = new Date(entry.created_at)
      const weekStart = this.weeklyInsightsService.getWeekStartForDate(entryDate)
      const weekEnd = this.weeklyInsightsService.getWeekEndForDate(entryDate)
      const weekKey = weekStart.toISOString()

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekStart,
          weekEnd,
          entries: [],
        })
      }

      weekMap.get(weekKey)!.entries.push(entry)
    }

    // Sort by week start date (oldest first)
    return Array.from(weekMap.values()).sort(
      (a, b) => a.weekStart.getTime() - b.weekStart.getTime(),
    )
  }

  /**
   * Get weeks that need insights generated (excluding current week)
   */
  async getWeeksNeedingInsights(userId: string): Promise<WeekGroup[]> {
    // Get all journal entries for the user
    const allEntries = await this.journalService.findAllUnpaginated(userId)

    if (allEntries.length === 0) {
      return []
    }

    // Group entries by week
    const weeks = this.groupEntriesByWeek(allEntries)

    // Get existing insights
    const existingInsights = await this.weeklyInsightsService.getAllInsights(userId, 1000)
    const existingWeekKeys = new Set(
      existingInsights.map((i) => new Date(i.week_start).toISOString().split('T')[0]),
    )

    // Get current week start to exclude it
    const currentWeekStart = this.weeklyInsightsService.getCurrentWeekStart()

    // Filter to weeks that:
    // 1. Don't already have insights
    // 2. Are not the current week (we generate current week insights on demand)
    const weeksNeedingInsights = weeks.filter((week) => {
      const weekKey = week.weekStart.toISOString().split('T')[0]
      const isCurrentWeek = week.weekStart.getTime() >= currentWeekStart.getTime()
      const hasInsights = existingWeekKeys.has(weekKey)

      return !isCurrentWeek && !hasInsights
    })

    return weeksNeedingInsights
  }

  /**
   * Get migration statistics for a user
   */
  async getMigrationStats(userId: string): Promise<{
    totalEntries: number
    totalWeeks: number
    existingInsights: number
    weeksNeedingMigration: number
    currentWeekExcluded: boolean
  }> {
    const allEntries = await this.journalService.findAllUnpaginated(userId)
    const weeks = this.groupEntriesByWeek(allEntries)
    const existingInsights = await this.weeklyInsightsService.getAllInsights(userId, 1000)
    const weeksNeeding = await this.getWeeksNeedingInsights(userId)

    const currentWeekStart = this.weeklyInsightsService.getCurrentWeekStart()
    const hasCurrentWeekEntries = weeks.some(
      (w) => w.weekStart.getTime() >= currentWeekStart.getTime(),
    )

    return {
      totalEntries: allEntries.length,
      totalWeeks: weeks.length,
      existingInsights: existingInsights.length,
      weeksNeedingMigration: weeksNeeding.length,
      currentWeekExcluded: hasCurrentWeekEntries,
    }
  }

  /**
   * Migrate weekly insights for a single user
   */
  async migrateUserInsights(
    userId: string,
    options: { dryRun?: boolean; delayMs?: number } = {},
  ): Promise<MigrationResult> {
    const { dryRun = false, delayMs = 2000 } = options
    const startTime = Date.now()

    this.logger.log(`Starting weekly insights migration for user: ${userId}`)

    const weeksNeedingInsights = await this.getWeeksNeedingInsights(userId)

    const result: MigrationResult = {
      userId,
      totalWeeks: weeksNeedingInsights.length,
      generatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
      duration: 0,
    }

    if (weeksNeedingInsights.length === 0) {
      this.logger.log(`No weeks need insights migration for user: ${userId}`)
      result.duration = Date.now() - startTime
      return result
    }

    this.logger.log(`Found ${weeksNeedingInsights.length} weeks needing insights for user: ${userId}`)

    for (let i = 0; i < weeksNeedingInsights.length; i++) {
      const week = weeksNeedingInsights[i]
      const weekLabel = `${week.weekStart.toLocaleDateString()} - ${week.weekEnd.toLocaleDateString()}`

      this.logger.log(
        `[${i + 1}/${weeksNeedingInsights.length}] Processing week: ${weekLabel} (${week.entries.length} entries)`,
      )

      if (dryRun) {
        this.logger.log(`  [DRY RUN] Would generate insights for week: ${weekLabel}`)
        result.generatedCount++
        continue
      }

      try {
        // Generate insights
        const content = await this.geminiService.generateWeeklyInsights(
          week.entries,
          week.weekStart,
          week.weekEnd,
        )

        // Save to database
        await this.weeklyInsightsService.saveInsights(
          userId,
          week.weekStart,
          week.weekEnd,
          content,
          week.entries.length,
        )

        result.generatedCount++
        this.logger.log(`  ✓ Generated insights for week: ${weekLabel}`)

        // Add delay between API calls to avoid rate limiting
        if (i < weeksNeedingInsights.length - 1) {
          await this.sleep(delayMs)
        }
      } catch (error: any) {
        result.failedCount++
        result.errors.push({
          weekStart: week.weekStart,
          error: error.message || 'Unknown error',
        })
        this.logger.error(`  ✗ Failed to generate insights for week: ${weekLabel}`, error.message)
      }
    }

    result.duration = Date.now() - startTime
    this.logger.log(
      `Completed migration for user ${userId}: ${result.generatedCount} generated, ${result.failedCount} failed`,
    )

    return result
  }

  /**
   * Migrate weekly insights for all users
   */
  async migrateAllUsers(
    options: { dryRun?: boolean; delayMs?: number; delayBetweenUsers?: number } = {},
  ): Promise<{
    totalUsers: number
    results: MigrationResult[]
    totalGenerated: number
    totalFailed: number
    duration: number
  }> {
    const { dryRun = false, delayMs = 2000, delayBetweenUsers = 5000 } = options
    const startTime = Date.now()

    const userIds = await this.getAllUserIds()
    this.logger.log(`Found ${userIds.length} users with journal entries`)

    const results: MigrationResult[] = []
    let totalGenerated = 0
    let totalFailed = 0

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i]
      this.logger.log(`\n[${ i + 1}/${userIds.length}] Processing user: ${userId}`)

      try {
        const result = await this.migrateUserInsights(userId, { dryRun, delayMs })
        results.push(result)
        totalGenerated += result.generatedCount
        totalFailed += result.failedCount
      } catch (error: any) {
        this.logger.error(`Failed to migrate user ${userId}:`, error.message)
        results.push({
          userId,
          totalWeeks: 0,
          generatedCount: 0,
          skippedCount: 0,
          failedCount: 1,
          errors: [{ weekStart: new Date(), error: error.message }],
          duration: 0,
        })
        totalFailed++
      }

      // Add delay between users
      if (i < userIds.length - 1) {
        this.logger.log(`Waiting ${delayBetweenUsers / 1000}s before next user...`)
        await this.sleep(delayBetweenUsers)
      }
    }

    return {
      totalUsers: userIds.length,
      results,
      totalGenerated,
      totalFailed,
      duration: Date.now() - startTime,
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

