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
  prompt_id?: string
  created_at: string | Date
  updated_at: string | Date
}

export interface UserPrompt {
  id: string
  user_id: string
  name: string
  prompt_text: string
  is_default: boolean
  created_at: string | Date
  updated_at: string | Date
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
    promptId?: string
  ): Promise<{
    sessionId: string
    userMessage: ChatMessage
    assistantMessage: ChatMessage
    usageInfo?: UsageInfo
  }> {
    return this.request('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId, promptId }),
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

  // ============================================================================
  // Prompt APIs
  // ============================================================================

  async getUserPrompts(): Promise<UserPrompt[]> {
    return this.request<UserPrompt[]>('/prompt')
  }

  async getPrompt(id: string): Promise<UserPrompt> {
    return this.request<UserPrompt>(`/prompt/${id}`)
  }

  async getDefaultPrompt(): Promise<UserPrompt> {
    return this.request<UserPrompt>('/prompt/default')
  }

  async createPrompt(data: {
    name: string
    prompt_text: string
    is_default?: boolean
  }): Promise<UserPrompt> {
    return this.request<UserPrompt>('/prompt', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePrompt(
    id: string,
    data: {
      name?: string
      prompt_text?: string
      is_default?: boolean
    }
  ): Promise<UserPrompt> {
    return this.request<UserPrompt>(`/prompt/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deletePrompt(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/prompt/${id}`, {
      method: 'DELETE',
    })
  }

  async setDefaultPrompt(id: string): Promise<UserPrompt> {
    return this.request<UserPrompt>(`/prompt/${id}/set-default`, {
      method: 'PATCH',
    })
  }

  async getPromptImprovements(promptText: string): Promise<{ suggestions: string }> {
    return this.request<{ suggestions: string }>('/prompt/improve', {
      method: 'POST',
      body: JSON.stringify({ prompt_text: promptText }),
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
