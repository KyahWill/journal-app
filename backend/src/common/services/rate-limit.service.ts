import { Injectable, Logger } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { firestore } from 'firebase-admin'

export interface UsageInfo {
  allowed: boolean
  remaining: number
  limit: number
  resetsAt: Date
  warning?: string
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name)

  // Rate limits configuration
  private readonly LIMITS = {
    chat: 20,
    insights: 3,
    tts: 5,
    prompt_suggestions: 20,
    goal_suggestions: 10,
    goal_insights: 10,
    rag_embedding: 100, // Embedding generation per day
    rag_search: 200, // Semantic search queries per day
    voice_coach_session: 10, // Voice coaching sessions per day
  }

  // Warning thresholds (when to start showing warnings)
  private readonly WARNING_THRESHOLDS = {
    chat: 2, // Warn when 2 or fewer remaining
    insights: 1,
    tts: 1,
    prompt_suggestions: 1,
    goal_suggestions: 1,
    goal_insights: 1,
    rag_embedding: 10,
    rag_search: 20,
    voice_coach_session: 2,
  }

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Check if a user can use a feature, and increment usage if allowed.
   * Returns usage info including remaining quota and warnings.
   */
  async checkAndIncrement(userId: string, feature: keyof typeof this.LIMITS): Promise<UsageInfo> {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const usageRef = this.firebaseService
      .getFirestore()
      .collection('user_usage')
      .doc(userId)
      .collection('daily')
      .doc(today)

    const limit = this.LIMITS[feature]
    const warningThreshold = this.WARNING_THRESHOLDS[feature]

    try {
      return await this.firebaseService.runTransaction(async (transaction) => {
        const doc = await transaction.get(usageRef)
        
        let currentUsage = 0
        const data = doc.data() || {}
        
        if (doc.exists) {
          currentUsage = data[`${feature}_count`] || 0
        }

        const remaining = Math.max(0, limit - currentUsage)
        const allowed = remaining > 0

        if (!allowed) {
          return {
            allowed: false,
            remaining: 0,
            limit,
            resetsAt: this.getNextResetTime(),
            warning: `You have reached your daily limit of ${limit} for ${this.getFeatureName(feature)}.`,
          }
        }

        // Increment usage
        const updateData: any = {
          [`${feature}_count`]: currentUsage + 1,
          last_updated: firestore.Timestamp.now(),
        }
        
        transaction.set(usageRef, updateData, { merge: true })

        const newRemaining = remaining - 1
        let warning: string | undefined

        if (newRemaining <= warningThreshold) {
          warning = `You have ${newRemaining} ${this.getFeatureUnit(feature)} remaining today.`
        }

        return {
          allowed: true,
          remaining: newRemaining,
          limit,
          resetsAt: this.getNextResetTime(),
          warning,
        }
      })
    } catch (error) {
      this.logger.error(`Error checking rate limit for user ${userId} feature ${feature}`, error)
      // Fail open if database error, but log it
      return {
        allowed: true,
        remaining: 1,
        limit,
        resetsAt: this.getNextResetTime(),
      }
    }
  }

  /**
   * Get current remaining usage without incrementing
   */
  async getRemainingUsage(userId: string, feature: keyof typeof this.LIMITS): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const usageRef = this.firebaseService
      .getFirestore()
      .collection('user_usage')
      .doc(userId)
      .collection('daily')
      .doc(today)

    const doc = await usageRef.get()
    const currentUsage = doc.exists ? (doc.data()?.[`${feature}_count`] || 0) : 0
    
    return Math.max(0, this.LIMITS[feature] - currentUsage)
  }

  private getNextResetTime(): Date {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
  }

  private getFeatureName(feature: string): string {
    switch (feature) {
      case 'chat': return 'chat messages'
      case 'insights': return 'AI insights'
      case 'tts': return 'text-to-speech'
      case 'prompt_suggestions': return 'prompt suggestions'
      case 'goal_suggestions': return 'goal suggestions'
      case 'goal_insights': return 'goal insights'
      case 'rag_embedding': return 'content embedding generation'
      case 'rag_search': return 'semantic search queries'
      case 'voice_coach_session': return 'voice coaching sessions'
      default: return feature
    }
  }

  private getFeatureUnit(feature: string): string {
    switch (feature) {
      case 'chat': return 'messages'
      case 'insights': return 'uses'
      case 'tts': return 'uses'
      case 'prompt_suggestions': return 'uses'
      case 'goal_suggestions': return 'uses'
      case 'goal_insights': return 'uses'
      case 'rag_embedding': return 'embeddings'
      case 'rag_search': return 'searches'
      case 'voice_coach_session': return 'sessions'
      default: return 'uses'
    }
  }
}

