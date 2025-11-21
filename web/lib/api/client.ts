/**
 * API Client for Backend Communication
 * 
 * This client handles all HTTP requests to the NestJS backend API.
 * Authentication uses Firebase ID tokens sent in Authorization header.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
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
    this.baseUrl = API_BASE_URL
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

    // Get fresh Firebase ID token
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
        // Try to refresh token and retry once
        if (retryCount === 0 && this.getToken) {
          console.log('Token expired, retrying with fresh token...')
          return this.request<T>(endpoint, options, retryCount + 1)
        }
        
        // Session expired or invalid - redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
        throw new Error('Session expired. Please sign in again.')
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      return response.json()
    } catch (error: any) {
      console.error('API Request failed:', error)
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
