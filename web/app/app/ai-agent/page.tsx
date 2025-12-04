'use client'

import { useState, useEffect } from 'react'
import { useAuthReady } from '@/lib/hooks/useAuthReady'
import { useCoachPersonalities } from '@/lib/hooks/useCoachPersonalities'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mic, Users } from 'lucide-react'
import { VoiceInterface } from '@/components/voice-interface'
import { ErrorBoundary } from '@/components/error-boundary'

export interface ConversationMessage {
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  audioUrl?: string
}

export default function AIAgentPage() {
  const isAuthReady = useAuthReady()
  const [error, setError] = useState<string | null>(null)
  const [useTextChat, setUseTextChat] = useState(false)
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)
  
  const { 
    personalities, 
    loading: loadingCoaches, 
    fetchPersonalities 
  } = useCoachPersonalities()
  
  // Filter coaches that have an ElevenLabs agent ID
  const voiceEnabledCoaches = personalities.filter(p => p.elevenLabsAgentId)
  
  // Fetch coach personalities on mount
  useEffect(() => {
    if (isAuthReady) {
      fetchPersonalities().catch(console.error)
    }
  }, [isAuthReady, fetchPersonalities])
  
  // Set default selected coach when coaches are loaded
  useEffect(() => {
    if (voiceEnabledCoaches.length > 0 && !selectedCoachId) {
      // Prefer the default coach, otherwise pick the first voice-enabled one
      const defaultCoach = voiceEnabledCoaches.find(c => c.isDefault) || voiceEnabledCoaches[0]
      setSelectedCoachId(defaultCoach.id)
    }
  }, [voiceEnabledCoaches, selectedCoachId])

  const handleConversationStart = () => {
    setError(null)
  }

  const handleConversationEnd = () => {
    // Conversation ended
  }

  const handleError = (err: Error) => {
    setError(err.message)
  }

  const handleFallbackToTextChat = () => {
    setUseTextChat(true)
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">AI Voice Coach</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Have a natural conversation with your AI coach using voice
          </p>
        </div>

        {/* Coach Selector */}
        {voiceEnabledCoaches.length > 0 && (
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-sm">Select Coach:</span>
                </div>
                <div className="flex-1 max-w-xs">
                  <Select
                    value={selectedCoachId || ''}
                    onValueChange={(value) => setSelectedCoachId(value)}
                    disabled={loadingCoaches}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a coach..." />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceEnabledCoaches.map((coach) => (
                        <SelectItem key={coach.id} value={coach.id}>
                          <div className="flex items-center gap-2">
                            <span>{coach.name}</span>
                            {coach.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCoachId && (
                  <div className="text-xs text-muted-foreground">
                    {voiceEnabledCoaches.find(c => c.id === selectedCoachId)?.description}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* No voice coaches message */}
        {!loadingCoaches && voiceEnabledCoaches.length === 0 && personalities.length > 0 && (
          <Alert className="mb-4 sm:mb-6">
            <Mic className="h-4 w-4" />
            <AlertDescription>
              None of your coaches have voice enabled. Go to Settings to create or configure a coach with voice capabilities.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4 sm:mb-6">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Voice Interface */}
        <Card>
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
                selectedPersonalityId={selectedCoachId || undefined}
              />
            )}
          </CardContent>
        </Card>

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
            </ul>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  )
}
