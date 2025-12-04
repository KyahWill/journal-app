import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'

export function useGoogleCalendar() {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getCalendarStatus()
      setIsConnected(response.connected)
    } catch (err: any) {
      console.error('Failed to check calendar status:', err)
      setError(err.message || 'Failed to check calendar status')
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const connect = useCallback(async () => {
    try {
      setError(null)
      const response = await apiClient.getCalendarConnectUrl()
      // Redirect to Google OAuth
      window.location.href = response.url
    } catch (err: any) {
      console.error('Failed to get calendar connect URL:', err)
      setError(err.message || 'Failed to connect to Google Calendar')
    }
  }, [])

  const disconnect = useCallback(async () => {
    try {
      setError(null)
      await apiClient.disconnectCalendar()
      setIsConnected(false)
    } catch (err: any) {
      console.error('Failed to disconnect calendar:', err)
      setError(err.message || 'Failed to disconnect Google Calendar')
    }
  }, [])

  // Check status on mount
  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  return {
    isConnected,
    loading,
    error,
    connect,
    disconnect,
    checkStatus,
  }
}

