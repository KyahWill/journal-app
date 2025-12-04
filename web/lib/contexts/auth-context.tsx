'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { apiClient } from '@/lib/api/client'
import { getAuthInstance } from '@/lib/firebase/config'

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
  ready: boolean  // NEW: Indicates if auth system is ready
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<User>
  signInWithGoogle: () => Promise<User>
  signUp: (email: string, password: string, displayName?: string) => Promise<User>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Token cache with expiration
interface TokenCache {
  token: string | null
  expiry: number
}

const TOKEN_CACHE_DURATION = 4 * 60 * 1000 // 4 minutes (session is 5 days, but we refresh more often)
const MAX_TOKEN_RETRIES = 2
const RETRY_DELAY = 300 // ms

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    ready: false,
  })

  // Use ref to persist cache across re-renders
  const tokenCache = useRef<TokenCache>({
    token: null,
    expiry: 0,
  })

  // Clear token cache
  const clearTokenCache = useCallback(() => {
    tokenCache.current = {
      token: null,
      expiry: 0,
    }
  }, [])

  // Fetch token with retry and caching
  const fetchToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    // Return cached token if valid and not forcing refresh
    if (!forceRefresh && tokenCache.current.token && Date.now() < tokenCache.current.expiry) {
      return tokenCache.current.token
    }

    // Fetch fresh token with retry logic
    for (let attempt = 0; attempt < MAX_TOKEN_RETRIES; attempt++) {
      try {
        const response = await fetch('/api/auth/token', {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })

        if (response.ok) {
          const data = await response.json()
          
          // Update cache
          tokenCache.current = {
            token: data.token,
            expiry: Date.now() + TOKEN_CACHE_DURATION,
          }
          
          return data.token
        }

        // If 401, user is not authenticated - don't retry
        if (response.status === 401) {
          clearTokenCache()
          return null
        }

        // For other errors, retry after delay
        if (attempt < MAX_TOKEN_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)))
        }
      } catch (error) {
        console.error(`Token fetch attempt ${attempt + 1} failed:`, error)
        
        // Retry on network errors
        if (attempt < MAX_TOKEN_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)))
        }
      }
    }

    // All retries failed
    clearTokenCache()
    return null
  }, [clearTokenCache])

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
        ready: true,
      })
    } catch (error: any) {
      console.error('Fetch user error:', error)
      setAuthState({
        user: null,
        loading: false,
        error: error.message || 'Failed to fetch user',
        ready: true,
      })
    }
  }, [])

  // Initialize auth system on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Set up token getter for API client
      apiClient.setTokenGetter(async () => {
        return fetchToken(false)
      })

      // Warm up the token cache and fetch user
      await fetchToken(false)
      await fetchUser()
    }

    initializeAuth()
  }, [fetchUser, fetchToken])

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

      // Clear old token cache
      clearTokenCache()

      // Wait for token to be available (with timeout)
      let retries = 5
      let token = null
      while (retries > 0 && !token) {
        token = await fetchToken(true)
        if (!token) {
          await new Promise(resolve => setTimeout(resolve, 200))
          retries--
        }
      }

      if (!token) {
        console.warn('Token not available after login, but proceeding anyway')
      }

      setAuthState({
        user: data.user,
        loading: false,
        error: null,
        ready: true,
      })

      return data.user
    } catch (error: any) {
      const errorMessage = error.message || 'Sign in failed'
      setAuthState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [clearTokenCache, fetchToken])

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))
      
      // Use Firebase client-side auth for Google popup
      const auth = getAuthInstance()
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()
      
      // Send the ID token to our API to create a session
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Google sign-in failed')
      }

      // Clear old token cache
      clearTokenCache()

      // Wait for token to be available
      let retries = 5
      let token = null
      while (retries > 0 && !token) {
        token = await fetchToken(true)
        if (!token) {
          await new Promise(resolve => setTimeout(resolve, 200))
          retries--
        }
      }

      if (!token) {
        console.warn('Token not available after Google sign-in, but proceeding anyway')
      }

      setAuthState({
        user: data.user,
        loading: false,
        error: null,
        ready: true,
      })

      return data.user
    } catch (error: any) {
      const errorMessage = error.message || 'Google sign in failed'
      setAuthState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [clearTokenCache, fetchToken])

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

      // Clear old token cache
      clearTokenCache()

      // Wait for token to be available
      let retries = 5
      let token = null
      while (retries > 0 && !token) {
        token = await fetchToken(true)
        if (!token) {
          await new Promise(resolve => setTimeout(resolve, 200))
          retries--
        }
      }

      setAuthState({
        user: data.user,
        loading: false,
        error: null,
        ready: true,
      })

      return data.user
    } catch (error: any) {
      const errorMessage = error.message || 'Sign up failed'
      setAuthState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [clearTokenCache, fetchToken])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))
      
      // Clear token cache immediately
      clearTokenCache()
      
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
        ready: true,
      })
    } catch (error: any) {
      const errorMessage = error.message || 'Sign out failed'
      setAuthState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [clearTokenCache])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    return fetchUser()
  }, [fetchUser])

  const value: AuthContextValue = {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    ready: authState.ready,
    signIn,
    signInWithGoogle,
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

