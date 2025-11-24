'use client'

import { useState, useCallback, useEffect } from 'react'
import { useConversation } from '@elevenlabs/react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mic, Phone, PhoneOff, AlertCircle, ExternalLink, MessageSquare } from 'lucide-react'
import { AudioControls } from '@/components/audio-controls'
import { MobileVoiceIndicators } from '@/components/mobile-voice-indicators'
import { useMobileDetection } from '@/lib/hooks/useMobileDetection'
import { apiClient } from '@/lib/api/client'
import { ConversationMessage } from '@/app/app/ai-agent/page'

interface VoiceInterfaceProps {
  onConversationStart?: () => void
  onConversationEnd?: (transcript: ConversationMessage[]) => void
  onError?: (error: Error) => void
  onFallbackToTextChat?: () => void
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error' | 'reconnecting'

type PermissionErrorType = 'denied' | 'not_found' | 'not_supported' | 'unknown'

interface PermissionErrorState {
  type: PermissionErrorType
  message: string
  canRetry: boolean
}

type ApiErrorType = 'rate_limit' | 'service_unavailable' | 'authentication' | 'unknown'

interface ApiErrorState {
  type: ApiErrorType
  message: string
  resetTime?: Date
  canRetry: boolean
}

export function VoiceInterface({
  onConversationStart,
  onConversationEnd,
  onError,
  onFallbackToTextChat,
}: VoiceInterfaceProps) {
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [transcript, setTranscript] = useState<ConversationMessage[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1.0)
  const [permissionError, setPermissionError] = useState<PermissionErrorState | null>(null)
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [apiError, setApiError] = useState<ApiErrorState | null>(null)
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null)
  const [sessionDuration, setSessionDuration] = useState<number>(0)

  // Mobile detection for browser-specific optimizations
  const { isMobile, isIOS, isSafari, isAndroid, isChrome } = useMobileDetection()

  // ElevenLabs conversation hook with enhanced callbacks
  const conversation = useConversation({
    onConnect: () => {
      console.log('[VoiceInterface] Connected to ElevenLabs')
      setStatus('connected')
      setPermissionError(null)
      setNetworkError(null)
      setIsReconnecting(false)
      
      // Generate conversation ID and track session start time
      const newConversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      setConversationId(newConversationId)
      setSessionStartTime(new Date())
      
      console.log('[VoiceInterface] Session tracking started:', {
        conversationId: newConversationId,
        startTime: new Date().toISOString(),
      })
    },
    onDisconnect: () => {
      console.log('[VoiceInterface] Disconnected from ElevenLabs')
      
      // Calculate session duration
      const sessionEndTime = new Date()
      const duration = sessionStartTime 
        ? Math.floor((sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000)
        : 0
      
      console.log('[VoiceInterface] Session ended:', {
        conversationId,
        duration,
        messageCount: transcript.length,
      })
      
      // Only set to idle if not reconnecting
      if (!isReconnecting) {
        setStatus('idle')
      }
      
      // Save conversation to backend (including partial transcripts)
      if (conversationId && transcript.length > 0 && sessionStartTime) {
        saveConversationToBackend(conversationId, transcript, sessionStartTime, sessionEndTime, duration)
      }
      
      if (onConversationEnd && !isReconnecting) {
        onConversationEnd(transcript)
      }
    },
    onMessage: (message) => {
      console.log('[VoiceInterface] Message received:', {
        source: message.source,
        messageLength: message.message?.length || 0,
        timestamp: new Date().toISOString(),
      })
      
      // Clear network error on successful message
      setNetworkError(null)
      
      // Add message to transcript
      const newMessage: ConversationMessage = {
        role: message.source === 'user' ? 'user' : 'agent',
        content: message.message,
        timestamp: new Date(),
      }
      
      setTranscript((prev) => [...prev, newMessage])
    },
    onError: (error) => {
      console.error('[VoiceInterface] Error occurred:', error)
      
      const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Voice conversation error'
      
      // Log error details for monitoring
      console.error('[VoiceInterface] Error details:', {
        conversationId,
        errorType: typeof error,
        errorMessage,
        timestamp: new Date().toISOString(),
      })
      
      // Detect network errors
      const isNetworkError = 
        errorMessage.toLowerCase().includes('network') ||
        errorMessage.toLowerCase().includes('connection') ||
        errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('websocket') ||
        (error as any)?.code === 'NETWORK_ERROR'
      
      if (isNetworkError) {
        setNetworkError(errorMessage)
        setStatus('error')
        
        // Save partial transcript on network disconnection
        if (conversationId && transcript.length > 0 && sessionStartTime) {
          const sessionEndTime = new Date()
          const duration = Math.floor((sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000)
          saveConversationToBackend(conversationId, transcript, sessionStartTime, sessionEndTime, duration)
            .then(() => {
              console.log('[VoiceInterface] Partial transcript saved due to network error')
            })
            .catch((err) => {
              console.error('[VoiceInterface] Failed to save partial transcript:', err)
            })
        }
      } else {
        setStatus('error')
      }
      
      if (onError) {
        onError(new Error(errorMessage))
      }
    },
    onModeChange: (mode) => {
      console.log('[VoiceInterface] Mode changed:', {
        mode: mode.mode,
        conversationId,
        timestamp: new Date().toISOString(),
      })
      
      // Update status based on mode for UI feedback
      if (mode.mode === 'speaking') {
        setStatus('speaking')
      } else if (mode.mode === 'listening') {
        setStatus('listening')
      } else {
        setStatus('connected')
      }
    },
  })

  // Save conversation to backend
  const saveConversationToBackend = useCallback(async (
    convId: string,
    messages: ConversationMessage[],
    startTime: Date,
    endTime: Date,
    duration: number,
  ) => {
    try {
      console.log('[VoiceInterface] Saving conversation to backend:', {
        conversationId: convId,
        messageCount: messages.length,
        duration,
      })
      
      await apiClient.saveVoiceCoachConversation({
        conversationId: convId,
        transcript: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
          audioUrl: msg.audioUrl,
        })),
        duration,
        startedAt: startTime.toISOString(),
        endedAt: endTime.toISOString(),
      })
      
      console.log('[VoiceInterface] Conversation saved successfully')
    } catch (error) {
      console.error('[VoiceInterface] Failed to save conversation:', error)
      // Don't throw - this is a background operation
    }
  }, [])

  // Get signed URL from backend
  const getSignedUrl = useCallback(async () => {
    try {
      setIsLoadingUrl(true)
      setApiError(null)
      const response = await apiClient.getVoiceCoachSignedUrl()
      return response.signedUrl
    } catch (error: any) {
      console.error('[VoiceInterface] Failed to get signed URL:', error)
      
      // Log error for monitoring
      console.error('[VoiceInterface] API Error details:', {
        status: error.status,
        statusCode: error.statusCode,
        message: error.message,
        timestamp: new Date().toISOString(),
      })
      
      // Parse error response
      let apiErrorState: ApiErrorState
      const errorMessage = error.message || error.response?.data?.message || 'Failed to connect to voice service'
      
      // Check for rate limit error
      if (error.status === 429 || error.statusCode === 429 || errorMessage.toLowerCase().includes('rate limit')) {
        // Extract reset time if available
        const retryAfter = error.response?.headers?.['retry-after']
        const resetTime = retryAfter 
          ? new Date(Date.now() + parseInt(retryAfter) * 1000)
          : new Date(Date.now() + 60 * 60 * 1000) // Default to 1 hour
        
        apiErrorState = {
          type: 'rate_limit',
          message: 'You have exceeded the voice coaching rate limit.',
          resetTime,
          canRetry: true,
        }
      } else if (error.status === 503 || error.statusCode === 503 || errorMessage.toLowerCase().includes('unavailable')) {
        apiErrorState = {
          type: 'service_unavailable',
          message: 'Voice coaching service is temporarily unavailable. Please try again later.',
          canRetry: true,
        }
      } else if (error.status === 401 || error.statusCode === 401) {
        apiErrorState = {
          type: 'authentication',
          message: 'Authentication failed. Please refresh the page and try again.',
          canRetry: false,
        }
      } else {
        apiErrorState = {
          type: 'unknown',
          message: errorMessage,
          canRetry: true,
        }
      }
      
      setApiError(apiErrorState)
      
      if (onError) {
        onError(new Error(apiErrorState.message))
      }
      
      return null
    } finally {
      setIsLoadingUrl(false)
    }
  }, [onError])

  // Reconnect to conversation
  const reconnectConversation = useCallback(async () => {
    console.log('[VoiceInterface] Attempting to reconnect...')
    setIsReconnecting(true)
    setStatus('reconnecting')
    setNetworkError(null)
    
    try {
      // Get a new signed URL
      const url = await getSignedUrl()
      
      if (!url) {
        setStatus('error')
        setNetworkError('Failed to get connection URL. Please try again.')
        setIsReconnecting(false)
        return
      }

      // Attempt to restart the session
      await conversation.startSession({ signedUrl: url })
      
      console.log('[VoiceInterface] Reconnection successful')
      setIsReconnecting(false)
      
    } catch (error: any) {
      console.error('[VoiceInterface] Reconnection failed:', error)
      setStatus('error')
      setNetworkError(error.message || 'Failed to reconnect. Please try again.')
      setIsReconnecting(false)
      
      if (onError) {
        onError(error)
      }
    }
  }, [conversation, getSignedUrl, onError])

  // Get browser-specific settings URL
  const getBrowserSettingsUrl = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return 'chrome://settings/content/microphone'
    } else if (userAgent.includes('firefox')) {
      return 'about:preferences#privacy'
    } else if (userAgent.includes('safari')) {
      return null // Safari doesn't have a direct URL
    } else if (userAgent.includes('edg')) {
      return 'edge://settings/content/microphone'
    }
    
    return null
  }, [])

  // Get browser-specific instructions
  const getBrowserInstructions = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return 'Go to Chrome Settings > Privacy and security > Site Settings > Microphone'
    } else if (userAgent.includes('firefox')) {
      return 'Go to Firefox Settings > Privacy & Security > Permissions > Microphone'
    } else if (userAgent.includes('safari')) {
      return 'Go to Safari > Settings > Websites > Microphone'
    } else if (userAgent.includes('edg')) {
      return 'Go to Edge Settings > Cookies and site permissions > Microphone'
    }
    
    return 'Check your browser settings to enable microphone access'
  }, [])

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    try {
      // Check if mediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError({
          type: 'not_supported',
          message: 'Your browser does not support microphone access. Please use a modern browser like Chrome, Firefox, or Safari.',
          canRetry: false,
        })
        
        if (onError) {
          onError(new Error('Browser does not support microphone access'))
        }
        
        return false
      }

      // iOS Safari specific: Request permission with user gesture
      // iOS requires getUserMedia to be called from a user interaction
      if (isIOS && isSafari) {
        console.log('[VoiceInterface] iOS Safari detected - requesting microphone with user gesture')
      }

      // Android Chrome specific: Use optimal audio constraints
      const audioConstraints = isAndroid && isChrome ? {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Optimize for mobile networks
          sampleRate: 16000,
        }
      } : { audio: true }

      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints)
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop())
      setPermissionError(null)
      return true
    } catch (error: any) {
      console.error('[VoiceInterface] Microphone permission error:', error)
      
      let errorState: PermissionErrorState
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorState = {
          type: 'denied',
          message: 'Microphone access was denied. Please allow microphone access to use voice coaching.',
          canRetry: true,
        }
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorState = {
          type: 'not_found',
          message: 'No microphone found. Please connect a microphone and try again.',
          canRetry: true,
        }
      } else {
        errorState = {
          type: 'unknown',
          message: error.message || 'An unknown error occurred while accessing the microphone.',
          canRetry: true,
        }
      }
      
      setPermissionError(errorState)
      
      if (onError) {
        onError(new Error(errorState.message))
      }
      
      return false
    }
  }, [onError, isIOS, isSafari, isAndroid, isChrome])

  // Start conversation
  const startConversation = useCallback(async () => {
    // Check microphone permission first
    const hasPermission = await requestMicrophonePermission()
    if (!hasPermission) {
      return
    }

    // Get signed URL
    setStatus('connecting')
    const url = await getSignedUrl()
    
    if (!url) {
      setStatus('error')
      return
    }

    // Start conversation with ElevenLabs
    try {
      await conversation.startSession({ signedUrl: url })
      setTranscript([])
      
      if (onConversationStart) {
        onConversationStart()
      }
    } catch (error: any) {
      console.error('[VoiceInterface] Failed to start conversation:', error)
      setStatus('error')
      setPermissionError(error.message || 'Failed to start conversation')
      
      if (onError) {
        onError(error)
      }
    }
  }, [conversation, requestMicrophonePermission, getSignedUrl, onConversationStart, onError])

  // End conversation
  const endConversation = useCallback(async () => {
    try {
      console.log('[VoiceInterface] Ending conversation:', { conversationId })
      await conversation.endSession()
      
      // Note: onDisconnect callback will handle saving and cleanup
    } catch (error: any) {
      console.error('[VoiceInterface] Failed to end conversation:', error)
      
      // Even if ending fails, try to save what we have
      if (conversationId && transcript.length > 0 && sessionStartTime) {
        const sessionEndTime = new Date()
        const duration = Math.floor((sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000)
        saveConversationToBackend(conversationId, transcript, sessionStartTime, sessionEndTime, duration)
      }
      
      setStatus('idle')
      
      if (onError) {
        onError(error)
      }
    }
  }, [conversation, conversationId, transcript, sessionStartTime, onError, saveConversationToBackend])

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    
    // Note: Mute functionality will be handled by the audio controls
    // The ElevenLabs SDK may not expose direct mute control
  }, [isMuted])

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    
    // Note: Volume control will be handled by the audio controls
    // The ElevenLabs SDK may not expose direct volume control
  }, [])

  // Format countdown time
  const formatCountdown = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Countdown timer for rate limit
  useEffect(() => {
    if (apiError?.type === 'rate_limit' && apiError.resetTime) {
      const interval = setInterval(() => {
        const now = Date.now()
        const resetTime = apiError.resetTime!.getTime()
        const remaining = Math.max(0, Math.ceil((resetTime - now) / 1000))
        
        setRateLimitCountdown(remaining)
        
        if (remaining === 0) {
          // Clear the error when countdown reaches zero
          setApiError(null)
          setRateLimitCountdown(null)
        }
      }, 1000)
      
      return () => clearInterval(interval)
    } else {
      setRateLimitCountdown(null)
    }
  }, [apiError])

  // Track session duration for mobile warnings
  useEffect(() => {
    if (status === 'connected' || status === 'speaking' || status === 'listening') {
      const interval = setInterval(() => {
        setSessionDuration((prev) => prev + 1)
      }, 1000)
      
      return () => clearInterval(interval)
    } else {
      setSessionDuration(0)
    }
  }, [status])

  // Get status badge color
  const getStatusBadgeVariant = () => {
    switch (status) {
      case 'connected':
        return 'default'
      case 'speaking':
        return 'default'
      case 'listening':
        return 'secondary'
      case 'connecting':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Not connected'
      case 'connecting':
        return 'Connecting...'
      case 'reconnecting':
        return 'Reconnecting...'
      case 'connected':
        return 'Connected'
      case 'speaking':
        return 'AI is speaking'
      case 'listening':
        return 'Listening...'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Indicators */}
      <MobileVoiceIndicators 
        isConnected={status === 'connected' || status === 'speaking' || status === 'listening'}
        sessionDuration={sessionDuration}
      />

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-1">Voice Connection</h3>
          <Badge variant={getStatusBadgeVariant()} className="text-xs sm:text-sm">
            {status === 'connecting' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {getStatusText()}
          </Badge>
        </div>
      </div>

      {/* Permission Error */}
      {permissionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Microphone Access Required</AlertTitle>
          <AlertDescription>
            <div className="space-y-3">
              <p>{permissionError.message}</p>
              
              {permissionError.type === 'denied' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">To enable microphone access:</p>
                  <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                    <li>Click the lock icon or settings icon in your browser's address bar</li>
                    <li>Find the microphone permission setting</li>
                    <li>Change it to "Allow"</li>
                    <li>Refresh this page</li>
                  </ol>
                  <p className="text-xs text-gray-600 mt-2">
                    {getBrowserInstructions()}
                  </p>
                  {getBrowserSettingsUrl() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = getBrowserSettingsUrl()
                        if (url) window.open(url, '_blank')
                      }}
                      className="mt-2"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open Browser Settings
                    </Button>
                  )}
                </div>
              )}
              
              {permissionError.type === 'not_found' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Troubleshooting steps:</p>
                  <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                    <li>Check that your microphone is properly connected</li>
                    <li>Make sure your microphone is not being used by another application</li>
                    <li>Try unplugging and reconnecting your microphone</li>
                    <li>Check your system sound settings</li>
                  </ul>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mt-3">
                {permissionError.canRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestMicrophonePermission}
                  >
                    Try Again
                  </Button>
                )}
                
                {onFallbackToTextChat && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onFallbackToTextChat}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Use Text Chat Instead
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Network Error */}
      {networkError && !permissionError && !apiError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Lost</AlertTitle>
          <AlertDescription>
            <div className="space-y-3">
              <p>{networkError}</p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">What happened:</p>
                <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                  <li>Your conversation was interrupted due to a network issue</li>
                  <li>Your partial transcript has been saved automatically</li>
                  <li>You can try reconnecting to continue</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Troubleshooting:</p>
                <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                  <li>Check your internet connection</li>
                  <li>Make sure you're not on a VPN that might be blocking the connection</li>
                  <li>Try moving closer to your WiFi router</li>
                  <li>Disable any browser extensions that might interfere</li>
                </ul>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reconnectConversation}
                  disabled={isReconnecting}
                >
                  {isReconnecting ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Reconnecting...
                    </>
                  ) : (
                    'Retry Connection'
                  )}
                </Button>
                
                {onFallbackToTextChat && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onFallbackToTextChat}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Use Text Chat Instead
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* API Error */}
      {apiError && !permissionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {apiError.type === 'rate_limit' && 'Rate Limit Exceeded'}
            {apiError.type === 'service_unavailable' && 'Service Unavailable'}
            {apiError.type === 'authentication' && 'Authentication Error'}
            {apiError.type === 'unknown' && 'Error'}
          </AlertTitle>
          <AlertDescription>
            <div className="space-y-3">
              <p>{apiError.message}</p>
              
              {apiError.type === 'rate_limit' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Rate limit information:</p>
                  <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                    <li>You have reached the maximum number of voice coaching sessions</li>
                    <li>This limit helps ensure fair usage for all users</li>
                    {rateLimitCountdown !== null && rateLimitCountdown > 0 && (
                      <li className="font-semibold">
                        Time until reset: {formatCountdown(rateLimitCountdown)}
                      </li>
                    )}
                  </ul>
                  {rateLimitCountdown !== null && rateLimitCountdown > 0 && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm font-medium text-yellow-800">
                        Please wait {formatCountdown(rateLimitCountdown)} before trying again
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {apiError.type === 'service_unavailable' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">What you can do:</p>
                  <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                    <li>Wait a few minutes and try again</li>
                    <li>Check our status page for any ongoing issues</li>
                    <li>Use text-based chat as an alternative</li>
                  </ul>
                </div>
              )}
              
              {apiError.type === 'authentication' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">To fix this:</p>
                  <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                    <li>Refresh the page and try again</li>
                    <li>Make sure you're logged in</li>
                    <li>Clear your browser cache if the problem persists</li>
                  </ul>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mt-3">
                {apiError.canRetry && apiError.type !== 'rate_limit' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startConversation}
                  >
                    Try Again
                  </Button>
                )}
                
                {apiError.type === 'rate_limit' && rateLimitCountdown === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setApiError(null)
                      setRateLimitCountdown(null)
                    }}
                  >
                    Dismiss
                  </Button>
                )}
                
                {onFallbackToTextChat && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onFallbackToTextChat}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Use Text Chat Instead
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Controls */}
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        {status === 'idle' || status === 'error' ? (
          <Button
            size="lg"
            onClick={startConversation}
            disabled={isLoadingUrl || isReconnecting}
            className="w-full sm:w-auto min-h-[48px] sm:min-h-[44px] text-base sm:text-lg touch-manipulation"
          >
            {isLoadingUrl || isReconnecting ? (
              <>
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 animate-spin" />
                {isReconnecting ? 'Reconnecting...' : 'Connecting...'}
              </>
            ) : (
              <>
                <Phone className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                Start Conversation
              </>
            )}
          </Button>
        ) : status === 'reconnecting' ? (
          <Button
            size="lg"
            disabled
            className="w-full sm:w-auto min-h-[48px] sm:min-h-[44px] text-base sm:text-lg"
          >
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 animate-spin" />
            Reconnecting...
          </Button>
        ) : (
          <Button
            size="lg"
            variant="destructive"
            onClick={endConversation}
            className="w-full sm:w-auto min-h-[48px] sm:min-h-[44px] text-base sm:text-lg touch-manipulation"
          >
            <PhoneOff className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
            End Conversation
          </Button>
        )}
      </div>

      {/* Audio Controls */}
      {(status === 'connected' || status === 'speaking' || status === 'listening') && (
        <AudioControls
          isMuted={isMuted}
          volume={volume}
          isConnected={true}
          onMuteToggle={handleMuteToggle}
          onVolumeChange={handleVolumeChange}
          onEndConversation={endConversation}
        />
      )}

      {/* Visual Feedback */}
      {status === 'listening' && (
        <div className="flex items-center justify-center gap-2 py-3 sm:py-4">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 sm:w-1 bg-blue-500 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 20 + 10}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <Mic className="h-6 w-6 sm:h-5 sm:w-5 text-blue-500 animate-pulse" />
        </div>
      )}

      {status === 'speaking' && (
        <div className="flex items-center justify-center gap-2 py-3 sm:py-4">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 sm:w-1 bg-green-500 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 20 + 10}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {status === 'idle' && !permissionError && (
        <div className="text-xs sm:text-sm text-gray-600 text-center space-y-1 sm:space-y-2 px-2">
          <p>Click "Start Conversation" to begin talking with your AI coach</p>
          <p className="text-xs text-gray-500">
            Make sure your microphone is connected and browser permissions are granted
          </p>
          {isMobile && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-medium mb-1">Mobile Tips:</p>
              <ul className="text-xs text-gray-500 space-y-0.5 text-left">
                {isIOS && (
                  <li>• Keep Safari in the foreground for best performance</li>
                )}
                {isAndroid && (
                  <li>• Use headphones for better audio quality</li>
                )}
                <li>• Connect to WiFi for optimal experience</li>
                <li>• Ensure sufficient battery level</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
