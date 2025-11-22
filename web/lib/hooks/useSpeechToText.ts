'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'

type RecordingState = 'idle' | 'recording' | 'processing' | 'error'

interface UseSpeechToTextReturn {
  recordingState: RecordingState
  error: string | null
  transcription: string | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  isRecording: boolean
  isProcessing: boolean
  clearTranscription: () => void
}

export function useSpeechToText(): UseSpeechToTextReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Check if browser supports MediaRecorder
  const checkSupport = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser does not support audio recording')
    }
    if (!window.MediaRecorder) {
      throw new Error('Your browser does not support MediaRecorder API')
    }
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      checkSupport()
      
      setRecordingState('recording')
      setError(null)
      setTranscription(null)
      chunksRef.current = []

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      })
      
      streamRef.current = stream

      // Determine the best MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      })
      mediaRecorderRef.current = mediaRecorder

      // Collect audio chunks
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      })

      // Handle recording stop
      mediaRecorder.addEventListener('stop', async () => {
        try {
          setRecordingState('processing')
          
          // Create blob from chunks
          const audioBlob = new Blob(chunksRef.current, { type: mimeType })
          
          // Send to API for transcription
          const text = await apiClient.speechToText(audioBlob)
          
          setTranscription(text)
          setRecordingState('idle')
        } catch (err: any) {
          console.error('Speech-to-text error:', err)
          setError(err.message || 'Failed to transcribe audio')
          setRecordingState('error')
        } finally {
          // Cleanup stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }
        }
      })

      // Start recording
      mediaRecorder.start()
    } catch (err: any) {
      console.error('Recording error:', err)
      setError(err.message || 'Failed to start recording')
      setRecordingState('error')
      
      // Cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [checkSupport])

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [recordingState])

  // Clear transcription
  const clearTranscription = useCallback(() => {
    setTranscription(null)
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && recordingState === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [recordingState])

  return {
    recordingState,
    error,
    transcription,
    startRecording,
    stopRecording,
    isRecording: recordingState === 'recording',
    isProcessing: recordingState === 'processing',
    clearTranscription,
  }
}

