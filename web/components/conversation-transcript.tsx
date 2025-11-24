'use client'

import { useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, MessageSquare } from 'lucide-react'
import { ConversationMessage } from '@/app/app/ai-agent/page'
import { format } from 'date-fns'

interface ConversationTranscriptProps {
  messages: ConversationMessage[]
  isAgentSpeaking: boolean
}

export function ConversationTranscript({
  messages,
  isAgentSpeaking,
}: ConversationTranscriptProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Export transcript as text file
  const handleExport = () => {
    if (messages.length === 0) return

    const transcript = messages
      .map((msg) => {
        const timestamp = format(msg.timestamp, 'HH:mm:ss')
        const role = msg.role === 'user' ? 'You' : 'AI Coach'
        return `[${timestamp}] ${role}: ${msg.content}`
      })
      .join('\n\n')

    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversation-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          <h3 className="text-base sm:text-lg font-semibold">Transcript</h3>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-1 sm:gap-2 min-h-[44px] touch-manipulation"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 min-h-[300px] sm:min-h-[400px] max-h-[500px] sm:max-h-[600px] pr-1 sm:pr-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center px-4">
            <div className="text-gray-500">
              <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-400" />
              <p className="text-xs sm:text-sm">No messages yet</p>
              <p className="text-xs mt-1">
                Start a conversation to see the transcript here
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <Card
                  className={`max-w-[90%] sm:max-w-[85%] p-3 sm:p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <Badge
                      variant={message.role === 'user' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {message.role === 'user' ? 'You' : 'AI Coach'}
                    </Badge>
                    <span className="text-xs opacity-70">
                      {format(message.timestamp, 'HH:mm:ss')}
                    </span>
                  </div>

                  {/* Message Content */}
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </Card>
              </div>
            ))}

            {/* Speaking Indicator */}
            {isAgentSpeaking && (
              <div className="flex justify-start">
                <Card className="bg-secondary text-secondary-foreground p-3 sm:p-4 max-w-[90%] sm:max-w-[85%]">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Badge variant="secondary" className="text-xs">
                      AI Coach
                    </Badge>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Footer Info */}
      {messages.length > 0 && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {messages.length} message{messages.length !== 1 ? 's' : ''} in this
            conversation
          </p>
        </div>
      )}
    </div>
  )
}
