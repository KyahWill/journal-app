/**
 * Chat Hook
 * 
 * Manages AI coach chat with the backend API
 */

'use client'

import { useState, useCallback } from 'react'
import { apiClient, ChatMessage, ChatSession } from '@/lib/api/client'

interface ChatState {
  messages: ChatMessage[]
  sessionId: string | null
  loading: boolean
  error: string | null
}

export function useChat(initialSessionId?: string) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    sessionId: initialSessionId || null,
    loading: false,
    error: null,
  })

  // Send a message to the AI coach
  const sendMessage = useCallback(
    async (content: string, promptId?: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      // Add user message to state immediately
      const tempUserMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      }

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, tempUserMessage],
      }))

      try {
        const response = await apiClient.sendChatMessage(
          content,
          state.sessionId || undefined,
          promptId
        )

        // Update messages with actual response
        setState((prev) => ({
          messages: [
            ...prev.messages.filter((m) => m.id !== tempUserMessage.id),
            response.userMessage,
            response.assistantMessage,
          ],
          sessionId: response.sessionId,
          loading: false,
          error: null,
        }))

        return response.assistantMessage
      } catch (error: any) {
        // Remove the temporary user message on error
        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.id !== tempUserMessage.id),
          loading: false,
          error: error.message || 'Failed to send message',
        }))
        throw error
      }
    },
    [state.sessionId]
  )

  // Load a chat session
  const loadSession = useCallback(async (sessionId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const session = await apiClient.getChatSession(sessionId)
      setState({
        messages: session.messages,
        sessionId: session.id,
        loading: false,
        error: null,
      })
      return session
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load session',
      }))
      throw error
    }
  }, [])

  // Create a new chat session
  const createSession = useCallback(async () => {
    try {
      const session = await apiClient.createChatSession()
      setState({
        messages: [],
        sessionId: session.id,
        loading: false,
        error: null,
      })
      return session
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to create session',
      }))
      throw error
    }
  }, [])

  // Clear current chat
  const clearChat = useCallback(() => {
    setState({
      messages: [],
      sessionId: null,
      loading: false,
      error: null,
    })
  }, [])

  // Get AI insights
  const getInsights = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const response = await apiClient.generateInsights()
      setState((prev) => ({ ...prev, loading: false, error: null }))
      return response.insights
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to generate insights',
      }))
      throw error
    }
  }, [])

  // Get suggested prompts
  const getSuggestedPrompts = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const response = await apiClient.getSuggestedPrompts()
      setState((prev) => ({ ...prev, loading: false, error: null }))
      return response.prompts
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to get prompts',
      }))
      throw error
    }
  }, [])

  // Rename session
  const renameSession = useCallback(async (title: string) => {
    if (!state.sessionId) {
      throw new Error('No active session to rename')
    }
    try {
      await apiClient.updateChatSessionTitle(state.sessionId, title)
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to rename session',
      }))
      throw error
    }
  }, [state.sessionId])

  return {
    messages: state.messages,
    sessionId: state.sessionId,
    loading: state.loading,
    error: state.error,
    sendMessage,
    loadSession,
    createSession,
    clearChat,
    getInsights,
    getSuggestedPrompts,
    renameSession,
  }
}

// Hook to manage all chat sessions
export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getChatSessions()
      setSessions(data)
    } catch (error: any) {
      setError(error.message || 'Failed to fetch sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await apiClient.deleteChatSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch (error: any) {
      setError(error.message || 'Failed to delete session')
      throw error
    }
  }, [])

  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    try {
      await apiClient.updateChatSessionTitle(sessionId, title)
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
      )
    } catch (error: any) {
      setError(error.message || 'Failed to update session title')
      throw error
    }
  }, [])

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    deleteSession,
    updateSessionTitle,
  }
}

