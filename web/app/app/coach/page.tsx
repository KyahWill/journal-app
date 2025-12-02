'use client'

import { useRef, useEffect } from 'react'
import { useChat, useChatSessions } from '@/lib/hooks/useChat'
import { usePrompts } from '@/lib/hooks/usePrompts'
import { useAuthReady } from '@/lib/hooks/useAuthReady'
import { useTextToSpeech } from '@/lib/hooks/useTextToSpeech'
import { useSpeechToText } from '@/lib/hooks/useSpeechToText'
import { useGoalChat, GoalSuggestion } from '@/lib/hooks/useGoalChat'
import { useGoals } from '@/lib/contexts/goal-context'
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
import { Send, RefreshCw, Loader2, Sparkles, Lightbulb, Brain, Volume2, VolumeX, Mic, Square, ChevronDown, ChevronUp, Target, TrendingUp, Menu } from 'lucide-react'
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
  const isAuthReady = useAuthReady()
  
  const {
    messages,
    sessionId,
    loading,
    error,
    usageWarning,
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
  const [loadingJournalInsights, setLoadingJournalInsights] = useState(false)
  const [loadingPrompts, setLoadingPrompts] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false)
  const [showGoalSuggestions, setShowGoalSuggestions] = useState(false)
  const [goalSuggestions, setGoalSuggestions] = useState<GoalSuggestion[]>([])
  const [showGoalInsights, setShowGoalInsights] = useState(false)
  const [goalInsights, setGoalInsights] = useState<string | null>(null)
  const [selectedGoalForInsights, setSelectedGoalForInsights] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Goal chat hook
  const { getGoalSuggestions, getGoalInsights, loadingSuggestions, loadingInsights } = useGoalChat()
  
  // Goals context
  const { goals } = useGoals()
  
  // Text-to-speech hook
  const { play: playAudio, stop: stopAudio, isLoading: isTTSLoading, isPlaying } = useTextToSpeech()
  
  // Speech-to-text hook
  const { 
    startRecording, 
    stopRecording, 
    transcription, 
    isRecording, 
    isProcessing, 
    error: sttError,
    clearTranscription 
  } = useSpeechToText()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle transcription result
  useEffect(() => {
    if (transcription) {
      setInput((prev) => (prev ? `${prev} ${transcription}` : transcription))
      clearTranscription()
    }
  }, [transcription, clearTranscription])

  // Load suggested prompts, sessions, and user prompts on mount
  useEffect(() => {
    // Don't make API calls until auth is ready
    if (!isAuthReady) return
    
    setIsMounted(true)
    loadPrompts()
    fetchSessions()
    loadUserPrompts()
  }, [isAuthReady])

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
      setLoadingJournalInsights(true)
      setInsights('') // Clear previous insights
      setShowInsights(true)
      
      // Use streaming to update insights in real-time
      await getInsights(true, (chunk) => {
        setInsights((prev) => (prev + '' || '') + chunk)
      })
    } catch (err: any) {
      console.error('Failed to get insights:', err)
      setShowInsights(false)
    } finally {
      setLoadingJournalInsights(false)
    }
  }

  async function handlePromptClick(prompt: string) {
    setInput(prompt)
    setShowMobileSuggestions(false) // Close mobile suggestions after selection
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
    stopAudio()
    setPlayingMessageId(null)
  }

  async function handleDeleteSession(sessionIdToDelete: string) {
    try {
      await deleteSession(sessionIdToDelete)
      // If we deleted the current session, clear the chat
      if (sessionIdToDelete === sessionId) {
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

  // Handle text-to-speech for a message
  function handlePlayMessage(messageId: string, content: string) {
    if (playingMessageId === messageId && isPlaying) {
      // Stop if already playing this message
      stopAudio()
      setPlayingMessageId(null)
    } else {
      // Play the message
      stopAudio() // Stop any current playback
      setPlayingMessageId(messageId)
      playAudio(content)
    }
  }

  // Handle microphone recording
  async function handleMicrophoneToggle() {
    if (isRecording) {
      await stopRecording()
    } else {
      await startRecording()
    }
  }

  // Handle goal suggestions
  async function handleGetGoalSuggestions() {
    try {
      const suggestions = await getGoalSuggestions()
      setGoalSuggestions(suggestions)
      setShowGoalSuggestions(true)
    } catch (err) {
      console.error('Failed to get goal suggestions:', err)
    }
  }

  // Handle goal insights with streaming
  async function handleGetGoalInsights(goalId: string) {
    try {
      setSelectedGoalForInsights(goalId)
      setGoalInsights('') // Clear previous insights
      setShowGoalInsights(true)
      
      // Use streaming to update insights in real-time
      await getGoalInsights(goalId, true, (chunk) => {
        setGoalInsights((prev) => (prev || '') + chunk)
      })
    } catch (err) {
      console.error('Failed to get goal insights:', err)
      setShowGoalInsights(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
      {/* Sessions Sidebar - Left */}
      <CoachSessionsSidebar
        sessions={sessions}
        currentSessionId={sessionId}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        loading={sessionsLoading}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      {/* Main Content - Center */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">AI Executive Coach</h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Get personalized insights based on your journal entries
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetInsights}
                disabled={loadingJournalInsights}
                className="flex-1 sm:flex-none"
              >
                {loadingJournalInsights ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Generate Insights</span>
                <span className="sm:hidden">Insights</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetGoalSuggestions}
                disabled={loadingSuggestions}
                className="flex-1 sm:flex-none"
              >
                {loadingSuggestions ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <Target className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Suggest Goals</span>
                <span className="sm:hidden">Goals</span>
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearHistory}
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  <RefreshCw className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Clear Chat</span>
                  <span className="sm:hidden">Clear</span>
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

          {/* Goal Suggestions Panel */}
          {showGoalSuggestions && goalSuggestions.length > 0 && (
            <Card className="mb-6 bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Suggested Goals</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Based on your journal entries, here are some goals you might want to pursue:
                    </p>
                    <div className="space-y-4">
                      {goalSuggestions.map((suggestion, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-base">{suggestion.title}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{suggestion.description}</p>
                          {suggestion.milestones && suggestion.milestones.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-gray-600 mb-1">Suggested Milestones:</p>
                              <ul className="text-sm text-gray-600 ml-4 list-disc space-y-1">
                                {suggestion.milestones.map((milestone, mIndex) => (
                                  <li key={mIndex}>{milestone}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {suggestion.reasoning && (
                            <p className="text-xs text-gray-500 mt-3 italic">{suggestion.reasoning}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowGoalSuggestions(false)}
                      className="mt-4"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Goal Insights Panel */}
          {showGoalInsights && goalInsights && (
            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Goal Insights</h3>
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
                              <strong className="font-semibold text-blue-900">{children}</strong>
                            ),
                          } as Components
                        }
                      >
                        {goalInsights}
                      </ReactMarkdown>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowGoalInsights(false)
                        setGoalInsights(null)
                        setSelectedGoalForInsights(null)
                      }}
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

          {usageWarning && (
            <Alert className="mb-6 border-yellow-500 bg-yellow-50 text-yellow-900">
              <AlertDescription className="flex items-center gap-2">
                <span className="font-semibold">⚠️ Note:</span> {usageWarning}
              </AlertDescription>
            </Alert>
          )}

          {sessionsError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>Sessions: {sessionsError}</AlertDescription>
            </Alert>
          )}

          {/* Mobile Suggested Questions - Collapsible */}
          <div className="lg:hidden mb-6">
            <Button
              variant="outline"
              onClick={() => setShowMobileSuggestions(!showMobileSuggestions)}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                Suggested Questions
                {suggestedPrompts.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {suggestedPrompts.length}
                  </Badge>
                )}
              </span>
              {showMobileSuggestions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            {showMobileSuggestions && (
              <Card className="mt-2 border-yellow-200 bg-yellow-50/50">
                <CardContent className="pt-4 pb-4">
                  {loadingPrompts ? (
                    <div className="flex flex-col items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500 mt-2">Loading suggestions...</span>
                    </div>
                  ) : suggestedPrompts.length > 0 ? (
                    <div className="space-y-2">
                      {suggestedPrompts.map((prompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full text-left justify-start h-auto min-h-[3rem] py-3 px-4 whitespace-normal leading-relaxed hover:bg-white hover:shadow-sm transition-all bg-white"
                          onClick={() => handlePromptClick(prompt)}
                        >
                          <span className="text-sm">{prompt}</span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No suggestions available</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="h-[500px] sm:h-[600px] flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
                      key={message.id || `msg-${index}-${message.role}`}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[95%] sm:max-w-[85%] md:max-w-[80%] rounded-lg p-3 sm:p-4 ${
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
                          {message.role === 'assistant' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePlayMessage(message.id || index.toString(), message.content)}
                              disabled={isTTSLoading && playingMessageId === (message.id || index.toString())}
                              className="h-6 w-6 p-0"
                            >
                              {isTTSLoading && playingMessageId === (message.id || index.toString()) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : playingMessageId === (message.id || index.toString()) && isPlaying ? (
                                <VolumeX className="h-3 w-3" />
                              ) : (
                                <Volume2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
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
                    <div className="flex justify-start items-center gap-2 text-sm text-gray-500 italic px-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Coach is thinking...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </CardContent>

            <div className="border-t p-3 sm:p-4">
              {sttError && (
                <Alert variant="destructive" className="mb-2">
                  <AlertDescription>{sttError}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading || isRecording || isProcessing}
                  rows={3}
                  className="resize-none text-sm sm:text-base"
                />
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleMicrophoneToggle}
                    disabled={loading || isProcessing}
                    size="sm"
                    variant={isRecording ? 'destructive' : 'outline'}
                    className={`${isRecording ? 'animate-pulse' : ''} h-auto py-2 sm:py-3`}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isRecording ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={loading || !input.trim() || isRecording || isProcessing}
                    size="sm"
                    className="h-auto py-2 sm:py-3"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Suggested Prompts Sidebar - Right (Hidden on mobile) */}
      <div className="hidden lg:block w-80 border-l bg-gray-50/50 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Suggested Questions Section */}
          <div>
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

          {/* Goal Insights Section */}
          {goals.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-start gap-3 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Goal Insights</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Get AI insights on your goals
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                {goals.slice(0, 5).map((goal) => (
                  <Button
                    key={goal.id}
                    variant="outline"
                    className="w-full text-left justify-start h-auto min-h-[3rem] py-3 px-4 whitespace-normal leading-relaxed hover:bg-white hover:shadow-sm transition-all"
                    onClick={() => handleGetGoalInsights(goal.id)}
                    disabled={loadingInsights && selectedGoalForInsights === goal.id}
                  >
                    {loadingInsights && selectedGoalForInsights === goal.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                    ) : (
                      <Target className="h-4 w-4 mr-2 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <span className="text-sm font-medium block">{goal.title}</span>
                      <span className="text-xs text-gray-500">{goal.progress_percentage}% complete</span>
                    </div>
                  </Button>
                ))}
                {goals.length > 5 && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Showing 5 of {goals.length} goals
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
