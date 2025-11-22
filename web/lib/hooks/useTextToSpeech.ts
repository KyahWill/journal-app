'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'

type PlaybackState = 'idle' | 'loading' | 'playing' | 'error'

interface UseTextToSpeechReturn {
  playbackState: PlaybackState
  error: string | null
  play: (text: string, voiceId?: string) => Promise<void>
  stop: () => void
  isPlaying: boolean
  isLoading: boolean
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
  }, [])

  // Play audio from text
  const play = useCallback(async (text: string, voiceId?: string) => {
    try {
      // Stop any currently playing audio
      cleanup()
      
      setPlaybackState('loading')
      setError(null)

      console.log('Requesting text-to-speech for:', text.substring(0, 50) + '...')

      // Get audio from API
      const audioBlob = await apiClient.textToSpeech(text, voiceId)
      
      console.log('Received audio blob:', {
        size: audioBlob.size,
        type: audioBlob.type
      })

      // Create audio URL
      const audioUrl = URL.createObjectURL(audioBlob)
      audioUrlRef.current = audioUrl

      // Create and setup audio element
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      // Setup event listeners
      audio.addEventListener('ended', () => {
        setPlaybackState('idle')
        cleanup()
      })

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e)
        // Try to get more specific error information
        const mediaError = (e.target as HTMLAudioElement)?.error
        let errorMessage = 'Failed to play audio'
        
        if (mediaError) {
          switch (mediaError.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = 'Audio playback was aborted'
              break
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = 'Network error while loading audio'
              break
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = 'Audio format not supported or corrupted'
              break
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Audio format not supported by browser'
              break
            default:
              errorMessage = `Audio playback error: ${mediaError.message || 'Unknown error'}`
          }
        }
        
        setError(errorMessage)
        setPlaybackState('error')
        cleanup()
      })

      audio.addEventListener('canplay', () => {
        setPlaybackState('playing')
      })

      // Start playing
      await audio.play()
    } catch (err: any) {
      console.error('Text-to-speech error:', err)
      setError(err.message || 'Failed to convert text to speech')
      setPlaybackState('error')
      cleanup()
    }
  }, [cleanup])

  // Stop playback
  const stop = useCallback(() => {
    cleanup()
    setPlaybackState('idle')
    setError(null)
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    playbackState,
    error,
    play,
    stop,
    isPlaying: playbackState === 'playing',
    isLoading: playbackState === 'loading',
  }
}

