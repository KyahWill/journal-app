'use client'

import { useRef, useEffect } from 'react'
import { useChat, useChatSessions } from '@/lib/hooks/useChat'
import { usePrompts } from '@/lib/hooks/usePrompts'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, RefreshCw, Loader2, Sparkles, Lightbulb, Brain } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { CoachSessionsSidebar } from '@/components/coach-sessions-sidebar'
import { ChatSession } from '@/lib/api/client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import type { Components } from 'react-markdown'

export default function CoachChatPage() {
  const {
    messages,
    sessionId,
    loading,
    error,
    sendMessage,
    loadSession,
    clearChat,
    getInsights,
    getSuggestedPrompts,
  } = useChat()
  
  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    fetchSessions,
    deleteSession,
    updateSessionTitle,
  } = useChatSessions()
  
  const {
    prompts,
    loading: promptsLoading,
    fetchPrompts,
    getDefaultPrompt,
  } = usePrompts()
  
  const [input, setInput] = useState('')
  const [showInsights, setShowInsights] = useState(false)
  const [insights, setInsights] = useState<string | null>(null)
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([])
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [loadingPrompts, setLoadingPrompts] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load suggested prompts, sessions, and user prompts on mount
  useEffect(() => {
    setIsMounted(true)
    loadPrompts()
    fetchSessions()
    loadUserPrompts()
  }, [])

  async function loadUserPrompts() {
    try {
      await fetchPrompts()
      // Load and set default prompt
      const defaultPrompt = await getDefaultPrompt()
      if (defaultPrompt) {
        setSelectedPromptId(defaultPrompt.id)
      }
    } catch (err) {
      console.error('Failed to load user prompts:', err)
    }
  }

  async function loadPrompts() {
    try {
      setLoadingPrompts(true)
      const prompts = await getSuggestedPrompts()
      setSuggestedPrompts(prompts)
    } catch (err) {
      console.error('Failed to load prompts:', err)
    } finally {
      setLoadingPrompts(false)
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return

    const message = input.trim()
    setInput('')

    try {
      await sendMessage(message, selectedPromptId || undefined)
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  async function handleGetInsights() {
    try {
      setLoadingInsights(true)
      const insightsData = await getInsights()
      setInsights(insightsData)
      setShowInsights(true)
    } catch (err: any) {
      console.error('Failed to get insights:', err)
    } finally {
      setLoadingInsights(false)
    }
  }

  async function handlePromptClick(prompt: string) {
    setInput(prompt)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleClearHistory() {
    clearChat()
    setInsights(null)
    setShowInsights(false)
  }

  async function handleSessionSelect(session: ChatSession) {
    try {
      await loadSession(session.id)
      setInsights(null)
      setShowInsights(false)
    } catch (err) {
      console.error('Failed to load session:', err)
    }
  }

  function handleNewSession() {
    clearChat()
    setInsights(null)
    setShowInsights(false)
  }

  async function handleDeleteSession(sessionId: string) {
    try {
      await deleteSession(sessionId)
      // If we deleted the current session, clear the chat
      if (sessionId === sessionId) {
        clearChat()
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

  async function handleRenameSession(sessionId: string, title: string) {
    try {
      await updateSessionTitle(sessionId, title)
    } catch (err) {
      console.error('Failed to rename session:', err)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sessions Sidebar - Left */}
      <CoachSessionsSidebar
        sessions={sessions}
        currentSessionId={sessionId}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        loading={sessionsLoading}
      />

      {/* Main Content - Center */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold">AI Executive Coach</h2>
              <p className="text-gray-600 mt-1">
                Get personalized insights based on your journal entries
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetInsights}
                disabled={loadingInsights}
              >
                {loadingInsights ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Insights
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearHistory}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Chat
                </Button>
              )}
            </div>
          </div>

          {/* Prompt Selector */}
          {isMounted && prompts.length > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <Label htmlFor="prompt-select" className="text-sm font-medium mb-2 block">
                      AI Personality
                    </Label>
                    <Select
                      value={selectedPromptId || undefined}
                      onValueChange={setSelectedPromptId}
                    >
                      <SelectTrigger id="prompt-select" className="w-full">
                        <SelectValue placeholder="Select a prompt..." />
                      </SelectTrigger>
                      <SelectContent>
                        {prompts.map((prompt) => (
                          <SelectItem key={prompt.id} value={prompt.id}>
                            {prompt.name}
                            {prompt.is_default && ' (Default)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights Panel */}
          {showInsights && insights && (
            <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">AI Insights</h3>
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed text-gray-700">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={
                          {
                            p: ({ children }: any) => (
                              <p className="mb-2 last:mb-0">{children}</p>
                            ),
                            ul: ({ children }: any) => (
                              <ul className="mb-2 ml-4 list-disc">{children}</ul>
                            ),
                            ol: ({ children }: any) => (
                              <ol className="mb-2 ml-4 list-decimal">{children}</ol>
                            ),
                            li: ({ children }: any) => (
                              <li className="mb-1">{children}</li>
                            ),
                            strong: ({ children }: any) => (
                              <strong className="font-semibold text-purple-900">{children}</strong>
                            ),
                          } as Components
                        }
                      >
                        {insights}
                      </ReactMarkdown>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInsights(false)}
                      className="mt-2"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sessionsError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>Sessions: {sessionsError}</AlertDescription>
            </Alert>
          )}

          <Card className="h-[600px] flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <p className="text-gray-500 mb-4">
                      Start a conversation with your AI coach
                    </p>
                    <p className="text-sm text-gray-400">
                      I have access to all your journal entries and can provide
                      personalized guidance
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              message.role === 'user' ? 'default' : 'secondary'
                            }
                          >
                            {message.role === 'user' ? 'You' : 'Coach'}
                          </Badge>
                        </div>
                        {message.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={
                                {
                                  p: ({ children }: any) => (
                                    <p className="mb-2 last:mb-0">{children}</p>
                                  ),
                                  ul: ({ children }: any) => (
                                    <ul className="mb-2 ml-4 list-disc">{children}</ul>
                                  ),
                                  ol: ({ children }: any) => (
                                    <ol className="mb-2 ml-4 list-decimal">{children}</ol>
                                  ),
                                  li: ({ children }: any) => (
                                    <li className="mb-1">{children}</li>
                                  ),
                                  code: ({ className, children, ...props }: any) => {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return match ? (
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    ) : (
                                      <code
                                        className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm"
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    )
                                  },
                                  pre: ({ children }: any) => (
                                    <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-2">
                                      {children}
                                    </pre>
                                  ),
                                } as Components
                              }
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-secondary rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-600">
                            Coach is thinking...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </CardContent>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  rows={3}
                  className="resize-none"
                />
                <Button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Suggested Prompts Sidebar - Right */}
      <div className="w-80 border-l bg-gray-50/50 overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg">Suggested Questions</h3>
              <p className="text-sm text-gray-500 mt-1">
                Click any question to start
              </p>
            </div>
          </div>
          
          {loadingPrompts ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500 mt-2">Loading suggestions...</span>
            </div>
          ) : suggestedPrompts.length > 0 ? (
            <div className="space-y-2">
              {suggestedPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start h-auto min-h-[3rem] py-3 px-4 whitespace-normal leading-relaxed hover:bg-white hover:shadow-sm transition-all"
                  onClick={() => handlePromptClick(prompt)}
                >
                  <span className="text-sm">{prompt}</span>
                </Button>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-gray-500 text-center">No suggestions available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
