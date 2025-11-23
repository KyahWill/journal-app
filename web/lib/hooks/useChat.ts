/**
 * Chat Hook
 * 
 * Manages AI coach chat with the backend API
 */

'use client'

import { useState, useCallback } from 'react'
import { apiClient, ChatMessage, ChatSession, UsageInfo } from '@/lib/api/client'

interface ChatState {
  messages: ChatMessage[]
  sessionId: string | null
  loading: boolean
  error: string | null
  usageWarning: string | null
}

export function useChat(initialSessionId?: string) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    sessionId: initialSessionId || null,
    loading: false,
    error: null,
    usageWarning: null,
  })

  // Send a message to the AI coach with streaming
  const sendMessage = useCallback(
    async (content: string, promptId?: string, useStreaming: boolean = true) => {
      console.group('🚀 [useChat] Sending Message')
      console.log('[useChat] sendMessage called:', { content, promptId, useStreaming })
      setState((prev) => ({ ...prev, loading: true, error: null, usageWarning: null }))

      // Generate unique IDs using timestamp + random suffix to avoid collisions
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 9)
      
      // Add user message to state immediately
      const tempUserMessage: ChatMessage = {
        id: `temp-user-${timestamp}-${randomSuffix}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      }

      console.log('[useChat] Adding user message:', tempUserMessage)
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, tempUserMessage],
      }))

      try {
        if (useStreaming) {
          console.log('[useChat] Using streaming API')
          // Use streaming API
          let streamedContent = ''
          let sessionIdFromStream: string | null = null
          let userMessageFromStream: ChatMessage | null = null
          let usageInfoFromStream: UsageInfo | null = null

          // Add temporary assistant message for streaming
          const tempAssistantMessage: ChatMessage = {
            id: `temp-assistant-${timestamp}-${randomSuffix}`,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
          }

          console.log('[useChat] Adding temporary assistant message:', tempAssistantMessage)
          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, tempAssistantMessage],
          }))

          console.group('📡 [useChat] Processing SSE Stream')
          let doneReceived = false
          for await (const event of apiClient.sendChatMessageStream(
            content,
            state.sessionId || undefined,
            promptId,
            (chunk) => {
              streamedContent += chunk
              console.log(`[useChat] 📝 Chunk received (${chunk.length} chars), total: ${streamedContent.length} chars`)
              console.log(`[useChat] 👁️ USER SEES: "${chunk}"`)
              console.log(`[useChat] 💬 FULL MESSAGE SO FAR: "${streamedContent}"`)
              
              // Update the assistant message in real-time
              setState((prev) => {
                const updatedMessages = prev.messages.map((m) =>
                  m.id === tempAssistantMessage.id
                    ? { ...m, content: streamedContent }
                    : m
                )
                console.log(`[useChat] ✨ UI Updated - Message count: ${updatedMessages.length}`)
                return {
                  ...prev,
                  messages: updatedMessages,
                }
              })
            }
          )) {
            console.log(`[useChat] 📨 Event received:`, event.type)
            if (event.type === 'session') {
              sessionIdFromStream = event.sessionId || null
              userMessageFromStream = event.userMessage || null
              usageInfoFromStream = event.usageInfo || null
              console.log('[useChat] 🎯 Session info:', { 
                sessionId: sessionIdFromStream, 
                userMessageId: userMessageFromStream?.id,
                usageAllowed: usageInfoFromStream?.allowed,
                usageRemaining: usageInfoFromStream?.remaining
              })
            } else if (event.type === 'done') {
              doneReceived = true
              console.log('[useChat] ✅ Stream DONE - Final message:', {
                messageId: event.assistantMessage?.id,
                contentLength: event.assistantMessage?.content?.length,
                contentPreview: event.assistantMessage?.content?.substring(0, 100)
              })
              // Replace temp messages with final ones
              setState((prev) => ({
                messages: [
                  ...prev.messages.filter(
                    (m) => m.id !== tempUserMessage.id && m.id !== tempAssistantMessage.id
                  ),
                  userMessageFromStream || tempUserMessage,
                  event.assistantMessage!,
                ],
                sessionId: sessionIdFromStream || prev.sessionId,
                loading: false,
                error: null,
                usageWarning: usageInfoFromStream?.warning || null,
              }))
              console.log('[useChat] ✔️ State updated, loading=false')
              console.groupEnd()
              console.groupEnd()
              return event.assistantMessage
            }
          }
          console.groupEnd()

          // If stream ended without 'done' event, finalize with what we have
          if (!doneReceived) {
            console.warn('[useChat] ⚠️ Stream ended WITHOUT done event!')
            console.log('[useChat] Finalizing with streamed content:', {
              contentLength: streamedContent.length,
              contentPreview: streamedContent.substring(0, 100)
            })
            const finalAssistantMessage: ChatMessage = {
              id: tempAssistantMessage.id,
              role: 'assistant',
              content: streamedContent,
              timestamp: new Date().toISOString(),
            }
            setState((prev) => ({
              messages: [
                ...prev.messages.filter((m) => m.id !== tempUserMessage.id),
                userMessageFromStream || tempUserMessage,
                finalAssistantMessage,
              ],
              sessionId: sessionIdFromStream || prev.sessionId,
              loading: false,
              error: null,
              usageWarning: usageInfoFromStream?.warning || null,
            }))
            console.groupEnd()
            console.groupEnd()
            return finalAssistantMessage
          }
        } else {
          console.log('[useChat] Using non-streaming API (fallback)')
          // Use non-streaming API (fallback)
          const response = await apiClient.sendChatMessage(
            content,
            state.sessionId || undefined,
            promptId
          )

          console.log('[useChat] Non-streaming response received:', response)
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
            usageWarning: response.usageInfo?.warning || null,
          }))

          console.groupEnd()
          return response.assistantMessage
        }
      } catch (error: any) {
        console.error('[useChat] ❌ ERROR:', error)
        console.groupEnd()
        // Remove the temporary user message on error
        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.id !== tempUserMessage.id),
          loading: false,
          error: error.message || 'Failed to send message',
          usageWarning: error.usageInfo?.warning || null,
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
        usageWarning: null,
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
        usageWarning: null,
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
      usageWarning: null,
    })
  }, [])

  // Get AI insights with streaming
  const getInsights = useCallback(async (useStreaming: boolean = true, onChunk?: (chunk: string) => void) => {
    setState((prev) => ({ ...prev, loading: true, error: null, usageWarning: null }))
    try {
      if (useStreaming) {
        let fullInsights = ''
        for await (const chunk of apiClient.generateInsightsStream((c) => {
          fullInsights += c
          if (onChunk) onChunk(c)
        })) {
          // Chunks are already handled by the callback
        }
        setState((prev) => ({ ...prev, loading: false, error: null }))
        return fullInsights
      } else {
        const response = await apiClient.generateInsights()
        setState((prev) => ({ ...prev, loading: false, error: null }))
        return response.insights
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to generate insights',
        usageWarning: error.usageInfo?.warning || null,
      }))
      throw error
    }
  }, [])

  // Get suggested prompts
  const getSuggestedPrompts = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null, usageWarning: null }))
    try {
      const response = await apiClient.getSuggestedPrompts()
      setState((prev) => ({ ...prev, loading: false, error: null }))
      return response.prompts
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to get prompts',
        usageWarning: error.usageInfo?.warning || null,
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
    usageWarning: state.usageWarning,
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

