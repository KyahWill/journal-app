/**
 * API Client for Backend Communication
 * 
 * This client handles all HTTP requests to the NestJS backend API.
 * It automatically includes Firebase ID tokens for authentication.
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
  messages: ChatMessage[]
  created_at: string | Date
  updated_at: string | Date
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null
  private tokenRefreshCallback: (() => Promise<string | null>) | null = null

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  /**
   * Set the Firebase ID token for authenticated requests
   */
  setToken(token: string | null) {
    this.token = token
  }

  /**
   * Get the current token
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * Set a callback function to refresh the token when it expires
   */
  setTokenRefreshCallback(callback: () => Promise<string | null>) {
    this.tokenRefreshCallback = callback
  }

  /**
   * Generic request handler with automatic token refresh on 401
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

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`
    }

    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        cache: 'no-store',
      })

      // Handle 401 Unauthorized - token may be expired
      if (response.status === 401 && retryCount === 0 && this.tokenRefreshCallback) {
        console.log('Token expired, attempting to refresh...')
        try {
          const newToken = await this.tokenRefreshCallback()
          if (newToken) {
            this.token = newToken
            // Retry the request with the new token
            return this.request<T>(endpoint, options, retryCount + 1)
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          throw new Error('Session expired. Please sign in again.')
        }
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
    sessionId?: string
  ): Promise<{
    sessionId: string
    userMessage: ChatMessage
    assistantMessage: ChatMessage
  }> {
    return this.request('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
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

  async generateInsights(): Promise<{ insights: string }> {
    return this.request<{ insights: string }>('/chat/insights')
  }

  async getSuggestedPrompts(): Promise<{ prompts: string[] }> {
    return this.request<{ prompts: string[] }>('/chat/prompts')
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

