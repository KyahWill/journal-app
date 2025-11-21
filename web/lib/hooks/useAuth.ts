/**
 * Authentication Hook - Server-Side Edition
 * 
 * All authentication is now handled server-side via API routes.
 * No client-side Firebase Auth SDK usage.
 */

'use client'

import { useEffect, useState, useCallback } from 'react'

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  emailVerified: boolean
  createdAt?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  // Fetch current user from server
  const fetchUser = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include', // Include cookies
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }

      const data = await response.json()
      
      setAuthState({
        user: data.user || null,
        loading: false,
        error: null,
      })
    } catch (error: any) {
      console.error('Fetch user error:', error)
      setAuthState({
        user: null,
        loading: false,
        error: error.message || 'Failed to fetch user',
      })
    }
  }, [])

  // Fetch user on mount
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      setAuthState({
        user: data.user,
        loading: false,
        error: null,
      })

      return data.user
    } catch (error: any) {
      const errorMessage = error.message || 'Sign in failed'
      setAuthState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, displayName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      setAuthState({
        user: data.user,
        loading: false,
        error: null,
      })

      return data.user
    } catch (error: any) {
      const errorMessage = error.message || 'Sign up failed'
      setAuthState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      setAuthState({
        user: null,
        loading: false,
        error: null,
      })
    } catch (error: any) {
      const errorMessage = error.message || 'Sign out failed'
      setAuthState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    return fetchUser()
  }, [fetchUser])

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signUp,
    signOut,
    refreshUser,
    isAuthenticated: !!authState.user,
  }
}
