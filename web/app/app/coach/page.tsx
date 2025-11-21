'use client'

import { useRef, useEffect } from 'react'
import { useChat } from '@/lib/hooks/useChat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Send, RefreshCw, Loader2, Sparkles, Lightbulb } from 'lucide-react'
import { useState } from 'react'

export default function CoachChatPage() {
  const {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
    getInsights,
    getSuggestedPrompts,
  } = useChat()
  
  const [input, setInput] = useState('')
  const [showInsights, setShowInsights] = useState(false)
  const [insights, setInsights] = useState<string | null>(null)
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([])
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [loadingPrompts, setLoadingPrompts] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load suggested prompts on mount
  useEffect(() => {
    loadPrompts()
  }, [])

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
      await sendMessage(message)
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

  return (
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

      {/* Insights Panel */}
      {showInsights && insights && (
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">AI Insights</h3>
                <p className="whitespace-pre-wrap text-gray-700">{insights}</p>
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

      {/* Suggested Prompts */}
      {messages.length === 0 && suggestedPrompts.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-3">
              <Lightbulb className="h-5 w-5 text-yellow-600 mt-1 flex-shrink-0" />
              <h3 className="font-semibold">Suggested Questions</h3>
            </div>
            <div className="space-y-2">
              {suggestedPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start h-auto py-3 px-4"
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
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
                    <p className="whitespace-pre-wrap">{message.content}</p>
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
  )
}
