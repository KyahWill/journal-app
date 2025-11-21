'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { apiClient } from '@/lib/api/client'

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

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<User>
  signUp: (email: string, password: string, displayName?: string) => Promise<User>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
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
        credentials: 'include',
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

  // Set up API client token getter and fetch user on mount
  useEffect(() => {
    // Set up token getter for API client (gets session cookie token for backend auth)
    apiClient.setTokenGetter(async () => {
      try {
        const response = await fetch('/api/auth/token', {
          credentials: 'include',
          cache: 'no-store',
        })
        if (response.ok) {
          const data = await response.json()
          return data.token
        }
      } catch (error) {
        console.error('Failed to get token:', error)
      }
      return null
    })

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

  const value: AuthContextValue = {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signUp,
    signOut,
    refreshUser,
    isAuthenticated: !!authState.user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

