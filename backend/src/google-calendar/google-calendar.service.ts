import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { google, calendar_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { FirebaseService } from '@/firebase/firebase.service'
import { Goal } from '@/common/types/goal.types'

export interface CalendarTokens {
  access_token: string
  refresh_token: string
  expiry_date?: number
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name)
  private readonly usersCollection = 'users'
  private oauth2Client: OAuth2Client

  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    )
  }

  /**
   * Get the OAuth2 authorization URL for calendar access
   */
  getAuthUrl(userId: string): string {
    const scopes = ['https://www.googleapis.com/auth/calendar.events']
    
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: userId, // Pass userId to identify user after OAuth callback
    })
  }

  /**
   * Exchange authorization code for tokens and store them
   */
  async handleOAuthCallback(code: string, userId: string): Promise<boolean> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code)
      
      if (!tokens.refresh_token) {
        this.logger.warn(`No refresh token received for user ${userId}`)
      }

      // Store tokens in Firestore
      await this.storeTokens(userId, {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
        expiry_date: tokens.expiry_date || undefined,
      })

      this.logger.log(`Google Calendar connected for user: ${userId}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to handle OAuth callback for user ${userId}`, error)
      throw error
    }
  }

  /**
   * Store Google Calendar tokens for a user
   */
  async storeTokens(userId: string, tokens: CalendarTokens): Promise<void> {
    try {
      const userDoc = await this.firebaseService.getDocument(this.usersCollection, userId)
      
      if (userDoc) {
        await this.firebaseService.updateDocument(this.usersCollection, userId, {
          google_calendar_refresh_token: tokens.refresh_token,
          google_calendar_access_token: tokens.access_token,
          google_calendar_expiry_date: tokens.expiry_date || null,
          google_calendar_connected: true,
        })
      } else {
        // Create user document if it doesn't exist
        const firestore = this.firebaseService.getFirestore()
        await firestore.collection(this.usersCollection).doc(userId).set({
          google_calendar_refresh_token: tokens.refresh_token,
          google_calendar_access_token: tokens.access_token,
          google_calendar_expiry_date: tokens.expiry_date || null,
          google_calendar_connected: true,
          created_at: new Date(),
          updated_at: new Date(),
        }, { merge: true })
      }

      this.logger.log(`Stored Google Calendar tokens for user: ${userId}`)
    } catch (error) {
      this.logger.error(`Failed to store tokens for user ${userId}`, error)
      throw error
    }
  }

  /**
   * Get stored tokens for a user
   */
  async getTokens(userId: string): Promise<CalendarTokens | null> {
    try {
      const userDoc = await this.firebaseService.getDocument(this.usersCollection, userId)
      
      if (!userDoc || !userDoc.google_calendar_refresh_token) {
        return null
      }

      return {
        access_token: userDoc.google_calendar_access_token,
        refresh_token: userDoc.google_calendar_refresh_token,
        expiry_date: userDoc.google_calendar_expiry_date || undefined,
      }
    } catch (error) {
      this.logger.error(`Failed to get tokens for user ${userId}`, error)
      return null
    }
  }

  /**
   * Check if user has Google Calendar connected
   */
  async isConnected(userId: string): Promise<boolean> {
    try {
      const userDoc = await this.firebaseService.getDocument(this.usersCollection, userId)
      return userDoc?.google_calendar_connected === true && !!userDoc?.google_calendar_refresh_token
    } catch (error) {
      this.logger.error(`Failed to check calendar connection for user ${userId}`, error)
      return false
    }
  }

  /**
   * Disconnect Google Calendar for a user
   */
  async disconnect(userId: string): Promise<void> {
    try {
      const tokens = await this.getTokens(userId)
      
      if (tokens?.access_token) {
        // Revoke the token
        try {
          await this.oauth2Client.revokeToken(tokens.access_token)
        } catch (revokeError) {
          this.logger.warn(`Failed to revoke token for user ${userId}`, revokeError)
        }
      }

      // Remove tokens from Firestore
      await this.firebaseService.updateDocument(this.usersCollection, userId, {
        google_calendar_refresh_token: null,
        google_calendar_access_token: null,
        google_calendar_expiry_date: null,
        google_calendar_connected: false,
      })

      this.logger.log(`Google Calendar disconnected for user: ${userId}`)
    } catch (error) {
      this.logger.error(`Failed to disconnect calendar for user ${userId}`, error)
      throw error
    }
  }

  /**
   * Get an authenticated Calendar client for a user
   */
  private async getCalendarClient(userId: string): Promise<calendar_v3.Calendar | null> {
    const tokens = await this.getTokens(userId)
    
    if (!tokens) {
      this.logger.warn(`No tokens found for user ${userId}`)
      return null
    }

    const oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
    )

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    })

    // Handle token refresh
    oauth2Client.on('tokens', async (newTokens) => {
      if (newTokens.access_token) {
        await this.storeTokens(userId, {
          access_token: newTokens.access_token,
          refresh_token: tokens.refresh_token, // Keep the refresh token
          expiry_date: newTokens.expiry_date || undefined,
        })
      }
    })

    return google.calendar({ version: 'v3', auth: oauth2Client })
  }

  /**
   * Create a calendar event for a goal
   */
  async createGoalEvent(userId: string, goal: Goal): Promise<string | null> {
    try {
      const calendar = await this.getCalendarClient(userId)
      
      if (!calendar) {
        this.logger.warn(`Cannot create event - no calendar client for user ${userId}`)
        return null
      }

      const targetDate = goal.target_date instanceof Date 
        ? goal.target_date 
        : new Date(goal.target_date)

      // Create one-time event for goal
      const event = this.createOneTimeEvent(goal, targetDate)

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      })

      const eventId = response.data.id
      this.logger.log(`Created calendar event ${eventId} for goal ${goal.id}`)
      
      return eventId || null
    } catch (error) {
      this.logger.error(`Failed to create calendar event for goal ${goal.id}`, error)
      return null
    }
  }

  /**
   * Create a one-time all-day event for a regular goal
   */
  private createOneTimeEvent(goal: Goal, targetDate: Date): calendar_v3.Schema$Event {
    const dateStr = targetDate.toISOString().split('T')[0]
    
    return {
      summary: `🎯 ${goal.title}`,
      description: goal.description || `Goal: ${goal.title}`,
      start: {
        date: dateStr,
      },
      end: {
        date: dateStr,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 * 24 }, // 1 day before
          { method: 'popup', minutes: 60 * 24 * 3 }, // 3 days before
        ],
      },
    }
  }

  /**
   * Update a calendar event for a goal
   */
  async updateGoalEvent(
    userId: string, 
    eventId: string, 
    goal: Goal
  ): Promise<boolean> {
    try {
      const calendar = await this.getCalendarClient(userId)
      
      if (!calendar) {
        return false
      }

      const targetDate = goal.target_date instanceof Date 
        ? goal.target_date 
        : new Date(goal.target_date)
      const dateStr = targetDate.toISOString().split('T')[0]

      const event: calendar_v3.Schema$Event = {
        summary: `🎯 ${goal.title}`,
        description: goal.description || `Goal: ${goal.title}`,
        start: { date: dateStr },
        end: { date: dateStr },
      }

      await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: event,
      })

      this.logger.log(`Updated calendar event ${eventId} for goal ${goal.id}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to update calendar event ${eventId}`, error)
      return false
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteGoalEvent(userId: string, eventId: string): Promise<boolean> {
    try {
      const calendar = await this.getCalendarClient(userId)
      
      if (!calendar) {
        return false
      }

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      })

      this.logger.log(`Deleted calendar event ${eventId}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to delete calendar event ${eventId}`, error)
      return false
    }
  }
}

