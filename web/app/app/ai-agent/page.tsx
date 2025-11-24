'use client'

import { useState, useEffect } from 'react'
import { useAuthReady } from '@/lib/hooks/useAuthReady'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { VoiceInterface } from '@/components/voice-interface'
import { ConversationTranscript } from '@/components/conversation-transcript'
import { VoiceHistorySidebar } from '@/components/voice-history-sidebar'
import { ErrorBoundary } from '@/components/error-boundary'
import { VoiceCoachOnboarding } from '@/components/voice-coach-onboarding'
import { useVoiceCoachOnboarding } from '@/lib/hooks/useVoiceCoachOnboarding'
import { isFeatureEnabled } from '@/lib/config/features'

export interface ConversationMessage {
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  audioUrl?: string
}

interface StoredConversation {
  id: string
  userId: string
  conversationId: string
  transcript: ConversationMessage[]
  duration: number
  startedAt: Date
  endedAt: Date
  summary?: string
}

export default function AIAgentPage() {
  const isAuthReady = useAuthReady()
  const [transcript, setTranscript] = useState<ConversationMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [useTextChat, setUseTextChat] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  
  const {
    shouldShowOnboarding,
    completeOnboarding,
  } = useVoiceCoachOnboarding()

  const onboardingEnabled = isFeatureEnabled('voiceCoachOnboarding')

  const handleConversationStart = () => {
    setTranscript([])
    setError(null)
    setCurrentConversationId(null)
  }

  const handleConversationEnd = (messages: ConversationMessage[]) => {
    setTranscript(messages)
  }

  const handleError = (err: Error) => {
    setError(err.message)
  }

  const handleFallbackToTextChat = () => {
    setUseTextChat(true)
    setError(null)
  }

  const handleLoadConversation = (conversation: StoredConversation) => {
    setTranscript(conversation.transcript)
    setCurrentConversationId(conversation.conversationId)
    setError(null)
  }

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">AI Voice Coach</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Have a natural conversation with your AI coach using voice
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4 sm:mb-6">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Voice Interface */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Voice Controls */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardContent className="p-4 sm:p-6">
                    {useTextChat ? (
                      <div className="space-y-4">
                        <Alert>
                          <AlertDescription>
                            Text chat mode is active. Voice features are unavailable.
                          </AlertDescription>
                        </Alert>
                        <p className="text-sm text-gray-600">
                          Text-based chat with your AI coach will be available in a future update.
                          For now, you can use the regular coach chat feature.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setUseTextChat(false)}
                        >
                          Try Voice Again
                        </Button>
                      </div>
                    ) : (
                      <VoiceInterface
                        onConversationStart={handleConversationStart}
                        onConversationEnd={handleConversationEnd}
                        onError={handleError}
                        onFallbackToTextChat={handleFallbackToTextChat}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Conversation Transcript */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardContent className="p-4 sm:p-6">
                    <ConversationTranscript
                      messages={transcript}
                      isAgentSpeaking={false}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Conversation History Sidebar */}
          <div className="lg:col-span-1">
            <VoiceHistorySidebar
              onLoadConversation={handleLoadConversation}
              currentConversationId={currentConversationId}
            />
          </div>
        </div>

        {/* Info Section */}
        <Card className="mt-4 sm:mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4 sm:p-6">
            <h3 className="font-semibold text-base sm:text-lg mb-2">How it works</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Click the microphone button to start a conversation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Speak naturally - the AI coach has access to your goals and journal entries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Listen to personalized coaching advice and insights</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>View the conversation transcript in real-time</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Voice Coach Onboarding Dialog */}
      {onboardingEnabled && (
        <VoiceCoachOnboarding
          open={shouldShowOnboarding}
          onComplete={completeOnboarding}
        />
      )}
    </ErrorBoundary>
  )
}
