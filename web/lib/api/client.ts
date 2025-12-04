/**
 * API Client for Backend Communication
 * 
 * This client handles all HTTP requests to the NestJS backend API.
 * Authentication uses Firebase ID tokens sent in Authorization header.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export interface UsageInfo {
  allowed: boolean
  remaining: number
  limit: number
  resetsAt: string
  warning?: string
}

export interface ApiError extends Error {
  usageInfo?: UsageInfo
  statusCode?: number
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  usageInfo?: UsageInfo
}

export interface JournalEntry {
  id: string
  user_id: string
  title: string
  content: string
  mood?: string
  tags?: string[]
  created_at: string | Date
  updated_at: string | Date
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string | Date
}

export interface ChatSession {
  id: string
  user_id: string
  title?: string
  messages: ChatMessage[]
  personality_id?: string
  created_at: string | Date
  updated_at: string | Date
}

// ============================================================================
// Coach Personality Types
// ============================================================================

export type CoachingStyle = 'supportive' | 'direct' | 'motivational' | 'analytical' | 'empathetic'

export interface CoachPersonality {
  id: string
  userId: string
  name: string
  description: string
  style: CoachingStyle
  systemPrompt: string
  voiceId?: string
  voiceStability?: number
  voiceSimilarityBoost?: number
  firstMessage?: string
  language?: string
  isDefault: boolean
  elevenLabsAgentId?: string
  createdAt: string | Date
  updatedAt: string | Date
}

export interface CreateCoachPersonalityData {
  name: string
  description: string
  style: CoachingStyle
  systemPrompt: string
  voiceId?: string
  voiceStability?: number
  voiceSimilarityBoost?: number
  firstMessage?: string
  language?: string
  isDefault?: boolean
}

export interface UpdateCoachPersonalityData {
  name?: string
  description?: string
  style?: CoachingStyle
  systemPrompt?: string
  voiceId?: string
  voiceStability?: number
  voiceSimilarityBoost?: number
  firstMessage?: string
  language?: string
  isDefault?: boolean
}

export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
}

export interface ThemeTypography {
  fontFamily: string
  baseFontSize: number
  headingScale: number
  lineHeight: number
}

export interface ThemeSpacing {
  scale: number
}

export interface ThemeAnimations {
  duration: number
  easing: string
}

export type ThemeDensity = 'comfortable' | 'compact' | 'spacious'
export type ThemeShadowIntensity = 'none' | 'subtle' | 'medium' | 'strong'

export interface UserTheme {
  id: string
  user_id: string
  name: string
  is_default: boolean
  is_public: boolean
  colors: ThemeColors
  typography: ThemeTypography
  spacing: ThemeSpacing
  borderRadius: number
  shadowIntensity: ThemeShadowIntensity
  animations: ThemeAnimations
  density: ThemeDensity
  created_at: string | Date
  updated_at: string | Date
}

// ============================================================================
// Category Types
// ============================================================================

export type DefaultGoalCategory = 'career' | 'health' | 'personal' | 'financial' | 'relationships' | 'learning' | 'other'

export interface CustomCategory {
  id: string
  user_id: string
  name: string
  color?: string
  icon?: string
  created_at: string | Date
  updated_at: string | Date
}

export interface CategoryWithType extends CustomCategory {
  is_default: boolean
}

export interface CreateCategoryData {
  name: string
  color?: string
  icon?: string
}

export interface UpdateCategoryData {
  name?: string
  color?: string
  icon?: string
}

// ============================================================================
// Goal Types
// ============================================================================

export type GoalCategory = 'career' | 'health' | 'personal' | 'financial' | 'relationships' | 'learning' | 'other'
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned'
export type HabitFrequency = 'daily' | 'weekly' | 'monthly'

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string
  category: string | CustomCategory   // Can be a default category or custom category ID
  status: GoalStatus
  target_date: string | Date
  created_at: string | Date
  updated_at: string | Date
  completed_at: string | Date | null
  status_changed_at: string | Date
  last_activity: string | Date
  progress_percentage: number
  milestones: Milestone[]
  // Habit-related fields
  is_habit: boolean
  habit_frequency?: HabitFrequency
  habit_streak: number
  habit_completed_dates: string[]
}

export interface Milestone {
  id: string
  title: string
  due_date: string | Date | null
  completed: boolean
  completed_at: string | Date | null
  order: number
  created_at: string | Date
}

export interface ProgressUpdate {
  id: string
  goal_id: string
  content: string
  created_at: string | Date
}

export interface GoalJournalLink {
  id: string
  goal_id: string
  journal_entry_id: string
  user_id: string
  created_at: string | Date
}

export interface CreateGoalData {
  title: string
  description?: string
  category: string | CustomCategory 
  target_date: string
  is_habit?: boolean
  habit_frequency?: HabitFrequency
}

export interface UpdateGoalData {
  title?: string
  description?: string
  category?: string | CustomCategory
  target_date?: string
  is_habit?: boolean
  habit_frequency?: HabitFrequency
}

export interface GoalFilters {
  category?: string
  status?: string
}

class ApiClient {
  private baseUrl: string
  private getToken: (() => Promise<string | null>) | null = null

  constructor() {
    this.baseUrl = API_BASE_URL || ''
  }

  /**
   * Set token getter function (to get fresh Firebase ID token)
   */
  setTokenGetter(getter: () => Promise<string | null>) {
    this.getToken = getter
  }

  /**
   * Generic request handler with Firebase ID token authentication
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    }

    let tokenObtained = false
    let tokenFetchFailed = false

    // Get fresh Firebase ID token
    if (this.getToken) {
      try {
        const token = await this.getToken()
        if (token) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
          tokenObtained = true
        } else {
          tokenFetchFailed = true
          console.warn('Token getter returned null - proceeding without token')
        }
      } catch (error) {
        tokenFetchFailed = true
        console.error('Failed to get Firebase token:', error)
      }
    }

    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        cache: 'no-store',
        credentials: 'include',
      })

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // If we got 401 AND token fetch failed, might be transient - retry once
        if (retryCount === 0 && tokenFetchFailed && this.getToken) {
          console.log('Token fetch failed, retrying request...')
          await new Promise(resolve => setTimeout(resolve, 500))
          return this.request<T>(endpoint, options, retryCount + 1)
        }
        
        // If we got 401 AND had a token, it might be expired - retry once with fresh token
        if (retryCount === 0 && tokenObtained && this.getToken) {
          console.log('Token might be expired, retrying with fresh token...')
          // Note: token getter has its own retry logic and caching
          return this.request<T>(endpoint, options, retryCount + 1)
        }
        
        // Give up and throw appropriate error
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.message || errorData.error || 'Authentication required'
        
        if (tokenFetchFailed) {
          throw new Error(`Authentication failed: Unable to retrieve auth token. ${message}`)
        } else {
          throw new Error(`Authentication failed: ${message}`)
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(
          errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        ) as ApiError
        
        error.statusCode = response.status
        if (errorData.usageInfo) {
          error.usageInfo = errorData.usageInfo
        }
        
        throw error
      }

      return response.json()
    } catch (error: any) {
      // Add context to error message
      if (error.message?.includes('Authentication')) {
        console.error('API Authentication error:', {
          endpoint,
          tokenObtained,
          tokenFetchFailed,
          retryCount,
        })
      } else {
        console.error('API Request failed:', error)
      }
      throw error
    }
  }

  // ============================================================================
  // Authentication APIs
  // ============================================================================

  async signup(email: string, password: string, displayName?: string) {
    return this.request<{ uid: string; email: string; displayName?: string; customToken: string }>(
      '/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName }),
      }
    )
  }

  async verifyToken(token: string) {
    return this.request<{ uid: string; email: string; emailVerified: boolean }>(
      '/auth/verify',
      {
        method: 'POST',
        body: JSON.stringify({ token }),
      }
    )
  }

  async getCurrentUser() {
    return this.request<{
      uid: string
      email: string
      displayName?: string
      emailVerified: boolean
      createdAt: string
    }>('/auth/me')
  }

  async updateUser(uid: string, data: { displayName?: string; email?: string }) {
    return this.request(`/auth/user/${uid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteUser(uid: string) {
    return this.request(`/auth/user/${uid}`, {
      method: 'DELETE',
    })
  }

  // ============================================================================
  // Journal APIs
  // ============================================================================

  async getJournalEntries(): Promise<JournalEntry[]> {
    return this.request<JournalEntry[]>('/journal')
  }

  async getJournalEntry(id: string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/journal/${id}`)
  }

  async createJournalEntry(data: {
    title: string
    content: string
    mood?: string
    tags?: string[]
  }): Promise<JournalEntry> {
    return this.request<JournalEntry>('/journal', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateJournalEntry(
    id: string,
    data: {
      title?: string
      content?: string
      mood?: string
      tags?: string[]
    }
  ): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteJournalEntry(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/journal/${id}`, {
      method: 'DELETE',
    })
  }

  async searchJournalEntries(query: string): Promise<JournalEntry[]> {
    return this.request<JournalEntry[]>(`/journal/search?q=${encodeURIComponent(query)}`)
  }

  async getRecentJournalEntries(limit: number = 10): Promise<JournalEntry[]> {
    return this.request<JournalEntry[]>(`/journal/recent?limit=${limit}`)
  }

  async getGroupedJournalEntries(): Promise<Record<string, JournalEntry[]>> {
    return this.request<Record<string, JournalEntry[]>>('/journal/grouped')
  }

  // ============================================================================
  // Chat/Coach APIs
  // ============================================================================

  async sendChatMessage(
    message: string,
    sessionId?: string,
    personalityId?: string
  ): Promise<{
    sessionId: string
    userMessage: ChatMessage
    assistantMessage: ChatMessage
    usageInfo?: UsageInfo
  }> {
    return this.request('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId, personalityId }),
    })
  }

  async createChatSession(): Promise<ChatSession> {
    return this.request<ChatSession>('/chat/session', {
      method: 'POST',
    })
  }

  async getChatSessions(): Promise<ChatSession[]> {
    return this.request<ChatSession[]>('/chat/sessions')
  }

  async getChatSession(id: string): Promise<ChatSession> {
    return this.request<ChatSession>(`/chat/session/${id}`)
  }

  async deleteChatSession(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/chat/session/${id}`, {
      method: 'DELETE',
    })
  }

  async updateChatSessionTitle(id: string, title: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/chat/session/${id}/title`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    })
  }

  async generateInsights(): Promise<{ insights: string }> {
    return this.request<{ insights: string }>('/chat/insights')
  }

  async getSuggestedPrompts(): Promise<{ prompts: string[] }> {
    return this.request<{ prompts: string[] }>('/chat/prompts')
  }

  async suggestGoals(): Promise<{ suggestions: any[]; usageInfo?: UsageInfo; message?: string }> {
    return this.request('/chat/suggest-goals', {
      method: 'POST',
    })
  }

  async getGoalInsights(goalId: string): Promise<{ insights: string; usageInfo?: UsageInfo }> {
    return this.request(`/chat/goal-insights/${goalId}`)
  }

  /**
   * Stream chat message response using Server-Sent Events
   */
  async *sendChatMessageStream(
    message: string,
    sessionId?: string,
    personalityId?: string,
    onChunk?: (chunk: string) => void
  ): AsyncGenerator<{ type: string; content?: string; sessionId?: string; userMessage?: ChatMessage; assistantMessage?: ChatMessage; usageInfo?: UsageInfo }, void, unknown> {
    console.log('[apiClient] sendChatMessageStream called:', { message, sessionId, personalityId })
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.getToken) {
      try {
        const token = await this.getToken()
        if (token) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Failed to get Firebase token:', error)
      }
    }

    const url = `${this.baseUrl}/chat/message/stream`
    console.log('[apiClient] Fetching:', url)
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, sessionId, personalityId }),
      credentials: 'include',
    })

    console.log('[apiClient] Response status:', response.status, response.ok)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[apiClient] Error response:', errorData)
      throw new Error(errorData.message || 'Failed to send message')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body is not readable')
    }

    try {
      console.log('[apiClient] ========== STARTING SSE STREAM ==========')
      let eventCount = 0
      let chunkCount = 0
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('[apiClient] ========== STREAM COMPLETE ==========')
          console.log(`[apiClient] Total events received: ${eventCount}`)
          console.log(`[apiClient] Total chunks received: ${chunkCount}`)
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        console.log(`[apiClient] 📦 Raw SSE data (${chunk.length} bytes):`, chunk)
        
        const lines = chunk.split('\n')
        console.log(`[apiClient] Split into ${lines.length} lines`)

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          console.log(`[apiClient] Line ${i}: "${line}"`)
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            console.log(`[apiClient] 🔍 Found SSE data line:`, data)
            
            try {
              const parsed = JSON.parse(data)
              eventCount++
              
              console.log(`[apiClient] ✅ SSE Event #${eventCount}:`, {
                type: parsed.type,
                hasContent: !!parsed.content,
                contentLength: parsed.content?.length || 0,
                contentPreview: parsed.content?.substring(0, 100),
                hasSessionId: !!parsed.sessionId,
                sessionId: parsed.sessionId,
                hasUserMessage: !!parsed.userMessage,
                hasAssistantMessage: !!parsed.assistantMessage,
                hasUsageInfo: !!parsed.usageInfo,
                fullEvent: parsed
              })
              
              if (parsed.type === 'chunk') {
                chunkCount++
                console.log(`[apiClient] 📝 Chunk #${chunkCount}: "${parsed.content}"`)
                if (onChunk) {
                  onChunk(parsed.content)
                }
              }               
              yield parsed
            } catch (e) {
              console.error('[apiClient] ❌ Failed to parse JSON:', {
                error: e,
                data: data.substring(0, 200),
                fullData: data
              })
              // Skip invalid JSON
            }
          } 
        }
      }
    } finally {
      console.log('[apiClient] 🔒 Releasing reader lock')
      reader.releaseLock()
    }
  }

  /**
   * Stream insights generation using Server-Sent Events
   */
  async *generateInsightsStream(onChunk?: (chunk: string) => void): AsyncGenerator<any, void, unknown> {
    const headers: HeadersInit = {}

    if (this.getToken) {
      try {
        const token = await this.getToken()
        if (token) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Failed to get Firebase token:', error)
      }
    }

    const url = `${this.baseUrl}/chat/insights/stream`
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to generate insights')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body is not readable')
    }

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data) {
              try {
                const event = JSON.parse(data)
                
                // Handle chunk events - call onChunk callback
                if (event.type === 'chunk' && event.content && onChunk) {
                  onChunk(event.content)
                }
                
                yield event
              } catch (e) {
                // If not JSON, treat as raw string (backward compatibility)
                if (onChunk) {
                  onChunk(data)
                }
                yield { type: 'chunk', content: data }
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Stream goal insights generation using Server-Sent Events
   */
  async *getGoalInsightsStream(goalId: string, onChunk?: (chunk: string) => void): AsyncGenerator<any, void, unknown> {
    const headers: HeadersInit = {}

    if (this.getToken) {
      try {
        const token = await this.getToken()
        if (token) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Failed to get Firebase token:', error)
      }
    }

    const url = `${this.baseUrl}/chat/goal-insights/${goalId}/stream`
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to generate goal insights')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body is not readable')
    }

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data) {
              try {
                const event = JSON.parse(data)
                
                // Handle chunk events - call onChunk callback
                if (event.type === 'chunk' && event.content && onChunk) {
                  onChunk(event.content)
                }
                
                yield event
              } catch (e) {
                // If not JSON, treat as raw string (backward compatibility)
                if (onChunk) {
                  onChunk(data)
                }
                yield { type: 'chunk', content: data }
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  // ============================================================================
  // Coach Personality APIs (Unified Coach System)
  // ============================================================================

  async getCoachPersonalities(): Promise<CoachPersonality[]> {
    return this.request<CoachPersonality[]>('/coach-personalities')
  }

  async getCoachPersonality(id: string): Promise<CoachPersonality> {
    return this.request<CoachPersonality>(`/coach-personalities/${id}`)
  }

  async getDefaultCoachPersonality(): Promise<CoachPersonality | null> {
    return this.request<CoachPersonality | null>('/coach-personalities/default')
  }

  async createCoachPersonality(data: CreateCoachPersonalityData): Promise<CoachPersonality> {
    return this.request<CoachPersonality>('/coach-personalities', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCoachPersonality(
    id: string,
    data: UpdateCoachPersonalityData
  ): Promise<CoachPersonality> {
    return this.request<CoachPersonality>(`/coach-personalities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCoachPersonality(id: string): Promise<void> {
    await this.request(`/coach-personalities/${id}`, {
      method: 'DELETE',
    })
  }

  async initializeCoachPersonalities(): Promise<CoachPersonality[]> {
    return this.request<CoachPersonality[]>('/coach-personalities/initialize', {
      method: 'POST',
    })
  }

  async generateCoachPersonalityAgent(id: string): Promise<CoachPersonality> {
    return this.request<CoachPersonality>(`/coach-personalities/${id}/generate-agent`, {
      method: 'POST',
    })
  }

  // ============================================================================
  // Theme APIs
  // ============================================================================

  async getUserThemes(): Promise<UserTheme[]> {
    return this.request<UserTheme[]>('/theme')
  }

  async getTheme(id: string): Promise<UserTheme> {
    return this.request<UserTheme>(`/theme/${id}`)
  }

  async getDefaultTheme(): Promise<UserTheme> {
    return this.request<UserTheme>('/theme/default')
  }

  async getPublicTheme(id: string): Promise<UserTheme> {
    return this.request<UserTheme>(`/theme/public/${id}`)
  }

  async createTheme(data: {
    name: string
    is_default?: boolean
    is_public?: boolean
    colors: ThemeColors
    typography: ThemeTypography
    spacing: ThemeSpacing
    borderRadius: number
    shadowIntensity: ThemeShadowIntensity
    animations: ThemeAnimations
    density: ThemeDensity
  }): Promise<UserTheme> {
    return this.request<UserTheme>('/theme', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTheme(
    id: string,
    data: {
      name?: string
      is_default?: boolean
      is_public?: boolean
      colors?: ThemeColors
      typography?: ThemeTypography
      spacing?: ThemeSpacing
      borderRadius?: number
      shadowIntensity?: ThemeShadowIntensity
      animations?: ThemeAnimations
      density?: ThemeDensity
    }
  ): Promise<UserTheme> {
    return this.request<UserTheme>(`/theme/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteTheme(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/theme/${id}`, {
      method: 'DELETE',
    })
  }

  async setDefaultTheme(id: string): Promise<UserTheme> {
    return this.request<UserTheme>(`/theme/${id}/set-default`, {
      method: 'PATCH',
    })
  }

  async getThemeRecommendations(data: {
    mood?: string
    preferences?: string
  }): Promise<{ suggestions: string }> {
    return this.request<{ suggestions: string }>('/theme/recommend', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ============================================================================
  // ElevenLabs APIs (Text-to-Speech & Speech-to-Text)
  // ============================================================================

  async textToSpeech(text: string, voiceId?: string): Promise<Blob> {
    const url = `${this.baseUrl}/elevenlabs/text-to-speech`
    
    // Get fresh Firebase ID token
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.getToken) {
      try {
        const token = await this.getToken()
        if (token) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Failed to get Firebase token:', error)
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, voiceId }),
      credentials: 'include',
    })

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Failed to convert text to speech (HTTP ${response.status})`
      let usageInfo: UsageInfo | undefined

      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
          usageInfo = errorData.usageInfo
        } else {
          const errorText = await response.text()
          if (errorText) {
            errorMessage = errorText
          }
        }
      } catch (e) {
        // Ignore parsing errors, use default message
      }
      
      const error = new Error(errorMessage) as ApiError
      error.statusCode = response.status
      error.usageInfo = usageInfo
      throw error
    }

    // Verify we got audio content
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('audio')) {
      console.error('Invalid content type:', contentType)
      throw new Error('Server did not return audio data. Got: ' + contentType)
    }

    const blob = await response.blob()
    
    // Verify blob size
    if (blob.size === 0) {
      throw new Error('Received empty audio data')
    }

    return blob
  }

  async speechToText(audioBlob: Blob): Promise<string> {
    const url = `${this.baseUrl}/elevenlabs/speech-to-text`
    
    // Get fresh Firebase ID token
    const headers: HeadersInit = {}

    if (this.getToken) {
      try {
        const token = await this.getToken()
        if (token) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Failed to get Firebase token:', error)
      }
    }

    // Create FormData to upload audio file
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to convert speech to text')
    }

    const data = await response.json()
    return data.text
  }

  // ============================================================================
  // Category APIs
  // ============================================================================

  async getCategories(): Promise<CategoryWithType[]> {
    return this.request<CategoryWithType[]>('/category')
  }

  async getCategory(id: string): Promise<CustomCategory> {
    return this.request<CustomCategory>(`/category/${id}`)
  }

  async createCategory(data: CreateCategoryData): Promise<CustomCategory> {
    return this.request<CustomCategory>('/category', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCategory(id: string, data: UpdateCategoryData): Promise<CustomCategory> {
    return this.request<CustomCategory>(`/category/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCategory(id: string): Promise<{ success: boolean; message: string; goalsAffected: number }> {
    return this.request<{ success: boolean; message: string; goalsAffected: number }>(`/category/${id}`, {
      method: 'DELETE',
    })
  }

  // ============================================================================
  // Goal APIs
  // ============================================================================

  async getGoals(filters?: GoalFilters): Promise<Goal[]> {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.status) params.append('status', filters.status)
    
    const queryString = params.toString()
    const response = await this.request<{ goals: Goal[]; nextCursor: string | null }>(`/goal${queryString ? `?${queryString}` : ''}`)
    
    // Handle paginated response
    return response.goals || []
  }

  async getGoal(id: string): Promise<Goal> {
    return this.request<Goal>(`/goal/${id}`)
  }

  async createGoal(data: CreateGoalData): Promise<Goal> {
    return this.request<Goal>('/goal', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateGoal(id: string, data: UpdateGoalData): Promise<Goal> {
    return this.request<Goal>(`/goal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getGoalDeletionInfo(id: string): Promise<{
    milestonesCount: number
    progressUpdatesCount: number
    linkedJournalEntriesCount: number
  }> {
    return this.request(`/goal/${id}/deletion-info`)
  }

  async deleteGoal(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/goal/${id}`, {
      method: 'DELETE',
    })
  }

  async updateGoalStatus(id: string, status: GoalStatus): Promise<Goal> {
    return this.request<Goal>(`/goal/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async getOverdueGoals(): Promise<Goal[]> {
    return this.request<Goal[]>('/goal/overdue')
  }

  async toggleHabitCompletion(id: string): Promise<Goal> {
    return this.request<Goal>(`/goal/${id}/habit/toggle`, {
      method: 'PATCH',
    })
  }

  async getGoalsByCategory(category: string): Promise<Goal[]> {
    return this.request<Goal[]>(`/goal/category/${category}`)
  }

  // ============================================================================
  // Milestone APIs
  // ============================================================================

  async addMilestone(
    goalId: string,
    data: { title: string; due_date?: string }
  ): Promise<Milestone> {
    return this.request<Milestone>(`/goal/${goalId}/milestone`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getMilestones(goalId: string): Promise<Milestone[]> {
    return this.request<Milestone[]>(`/goal/${goalId}/milestone`)
  }

  async updateMilestone(
    goalId: string,
    milestoneId: string,
    data: { title?: string; due_date?: string }
  ): Promise<Milestone> {
    return this.request<Milestone>(`/goal/${goalId}/milestone/${milestoneId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async toggleMilestone(goalId: string, milestoneId: string): Promise<Milestone> {
    return this.request<Milestone>(`/goal/${goalId}/milestone/${milestoneId}/complete`, {
      method: 'PATCH',
    })
  }

  async deleteMilestone(
    goalId: string,
    milestoneId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/goal/${goalId}/milestone/${milestoneId}`, {
      method: 'DELETE',
    })
  }

  // ============================================================================
  // Progress Update APIs
  // ============================================================================

  async addProgressUpdate(goalId: string, content: string): Promise<ProgressUpdate> {
    return this.request<ProgressUpdate>(`/goal/${goalId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  async getProgressUpdates(goalId: string): Promise<ProgressUpdate[]> {
    return this.request<ProgressUpdate[]>(`/goal/${goalId}/progress`)
  }

  async deleteProgressUpdate(
    goalId: string,
    progressId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/goal/${goalId}/progress/${progressId}`, {
      method: 'DELETE',
    })
  }

  // ============================================================================
  // Goal-Journal Linking APIs
  // ============================================================================

  async linkJournalEntry(goalId: string, journalEntryId: string): Promise<GoalJournalLink> {
    return this.request<GoalJournalLink>(`/goal/${goalId}/link-journal`, {
      method: 'POST',
      body: JSON.stringify({ journal_entry_id: journalEntryId }),
    })
  }

  async unlinkJournalEntry(
    goalId: string,
    entryId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/goal/${goalId}/link-journal/${entryId}`, {
      method: 'DELETE',
    })
  }

  async getLinkedJournalEntries(goalId: string): Promise<JournalEntry[]> {
    return this.request<JournalEntry[]>(`/goal/${goalId}/linked-journals`)
  }

  async getLinkedGoalsForJournal(journalEntryId: string): Promise<Goal[]> {
    return this.request<Goal[]>(`/journal/${journalEntryId}/goals`)
  }

  // ============================================================================
  // Voice Conversation APIs
  // ============================================================================

  async getVoiceCoachSignedUrl(): Promise<{ signedUrl: string }> {
    return this.request<{ signedUrl: string }>('/voice-coach/signed-url')
  }

  async saveVoiceCoachConversation(data: {
    conversationId: string
    transcript: Array<{
      role: string
      content: string
      timestamp: string
      audioUrl?: string
    }>
    duration: number
    startedAt: string
    endedAt: string
  }): Promise<{ success: boolean; message: string }> {
    return this.request('/voice-coach/conversation', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getVoiceConversationHistory(params?: {
    limit?: number
    search?: string
    startDate?: string
    endDate?: string
    sortBy?: 'newest' | 'oldest' | 'longest' | 'shortest'
  }): Promise<{ conversations: any[] }> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    
    const queryString = queryParams.toString()
    return this.request<{ conversations: any[] }>(
      `/voice-coach/conversations${queryString ? `?${queryString}` : ''}`
    )
  }

  async deleteVoiceConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/voice-coach/conversation/${conversationId}`, {
      method: 'DELETE',
    })
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  async healthCheck() {
    return this.request('/health')
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for testing
export { ApiClient }
