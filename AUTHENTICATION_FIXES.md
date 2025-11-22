# Authentication Fixes Implementation Guide

## Summary of Changes

This document provides complete, production-ready code to fix the authentication edge cases identified in `AUTHENTICATION_ISSUES_ANALYSIS.md`.

## File Changes Overview

1. **web/lib/contexts/auth-context.tsx** - Add token caching and retry logic
2. **web/lib/api/client.ts** - Improve error handling and retry logic
3. **web/app/api/auth/token/route.ts** - Add better error responses
4. **web/lib/hooks/useAuthReady.ts** - New hook to ensure auth is ready

---

## 1. Enhanced Auth Context (with Token Caching)

**File**: `web/lib/contexts/auth-context.tsx`

### Key Improvements:
- ✅ Token caching to avoid repeated fetches
- ✅ Retry logic for failed token fetches
- ✅ Clear cache on logout/errors
- ✅ Authentication readiness flag
- ✅ Better error handling

### Implementation:

```typescript
'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react'
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
  ready: boolean  // NEW: Indicates if auth system is ready
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<User>
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
```

---

## 2. New Hook: useAuthReady

**File**: `web/lib/hooks/useAuthReady.ts`

This hook helps components wait for authentication to be ready before making API calls.

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'

/**
 * Hook to check if authentication system is ready
 * Use this to delay API calls until auth is initialized
 */
export function useAuthReady() {
  const { ready, loading } = useAuth()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Auth is ready when not loading and ready flag is true
    setIsReady(!loading && ready)
  }, [ready, loading])

  return isReady
}

/**
 * HOC to wrap components that need auth to be ready
 */
export function withAuthReady<P extends object>(
  Component: React.ComponentType<P>,
  LoadingComponent?: React.ComponentType
) {
  return function AuthReadyComponent(props: P) {
    const isReady = useAuthReady()

    if (!isReady) {
      if (LoadingComponent) {
        return <LoadingComponent />
      }
      return <div>Loading...</div>
    }

    return <Component {...props} />
  }
}
```

---

## 3. Enhanced API Client

**File**: `web/lib/api/client.ts`

### Changes:
- Better error handling for authentication failures
- Distinguish between different types of auth errors
- Retry logic improvements

**Only showing the changed `request` method** (replace lines 130-193):

```typescript
  /**
   * Generic request handler with Firebase ID token authentication
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    }

    let tokenObtained = false
    let tokenFetchFailed = false

    // Get fresh Firebase ID token
    if (this.getToken) {
      try {
        const token = await this.getToken()
        if (token) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
          tokenObtained = true
        } else {
          tokenFetchFailed = true
          console.warn('Token getter returned null - proceeding without token')
        }
      } catch (error) {
        tokenFetchFailed = true
        console.error('Failed to get Firebase token:', error)
      }
    }

    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        cache: 'no-store',
        credentials: 'include',
      })

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // If we got 401 AND token fetch failed, might be transient - retry once
        if (retryCount === 0 && tokenFetchFailed && this.getToken) {
          console.log('Token fetch failed, retrying request...')
          await new Promise(resolve => setTimeout(resolve, 500))
          return this.request<T>(endpoint, options, retryCount + 1)
        }
        
        // If we got 401 AND had a token, it might be expired - retry once with fresh token
        if (retryCount === 0 && tokenObtained && this.getToken) {
          console.log('Token might be expired, retrying with fresh token...')
          // Note: token getter has its own retry logic and caching
          return this.request<T>(endpoint, options, retryCount + 1)
        }
        
        // Give up and throw appropriate error
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.message || errorData.error || 'Authentication required'
        
        if (tokenFetchFailed) {
          throw new Error(`Authentication failed: Unable to retrieve auth token. ${message}`)
        } else {
          throw new Error(`Authentication failed: ${message}`)
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      return response.json()
    } catch (error: any) {
      // Add context to error message
      if (error.message?.includes('Authentication')) {
        console.error('API Authentication error:', {
          endpoint,
          tokenObtained,
          tokenFetchFailed,
          retryCount,
        })
      } else {
        console.error('API Request failed:', error)
      }
      throw error
    }
  }
```

---

## 4. Enhanced Token Route

**File**: `web/app/api/auth/token/route.ts`

### Changes:
- Better error responses
- Add logging for debugging

```typescript
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Get the session cookie value to send to the backend
 * The backend will verify this session cookie using Firebase Admin SDK
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value

    if (!sessionCookie) {
      console.warn('[/api/auth/token] No session cookie found')
      return NextResponse.json(
        { 
          error: 'No session',
          code: 'NO_SESSION',
          message: 'Session cookie not found. User may need to log in.'
        },
        { status: 401 }
      )
    }

    // Return the session cookie - the backend will verify it
    return NextResponse.json({ token: sessionCookie })
  } catch (error: any) {
    console.error('[/api/auth/token] Token fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get token',
        code: 'TOKEN_FETCH_ERROR',
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
```

---

## 5. Usage Example: Protected Component

**File**: Example usage in a component

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { useAuthReady } from '@/lib/hooks/useAuthReady'
import { apiClient } from '@/lib/api/client'

export default function JournalPage() {
  const { isAuthenticated } = useAuth()
  const isAuthReady = useAuthReady()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Don't fetch until auth is ready
    if (!isAuthReady) {
      return
    }

    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    // Now safe to make API calls
    const fetchEntries = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getJournalEntries()
        setEntries(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
  }, [isAuthReady, isAuthenticated])

  if (!isAuthReady) {
    return <div>Initializing authentication...</div>
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>
  }

  if (loading) {
    return <div>Loading entries...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div>
      {/* Render entries */}
    </div>
  )
}
```

---

## Deployment Checklist

### Before Deploying:

1. ✅ Back up current code
2. ✅ Review all changes
3. ✅ Test in development environment
4. ✅ Add logging/monitoring

### Test Scenarios:

1. **Rapid Page Refresh**: Refresh multiple times quickly
2. **Network Throttling**: Test with slow 3G in DevTools
3. **Multiple Tabs**: Open 5+ tabs simultaneously
4. **After Login**: Test immediately after logging in
5. **Token Expiry**: Wait for token cache to expire (4 minutes)
6. **Concurrent Requests**: Load pages with multiple API calls

### Expected Improvements:

- ✅ No more "No token provided" errors for authenticated users
- ✅ Reduced number of requests to `/api/auth/token`
- ✅ Faster API calls (due to caching)
- ✅ More reliable authentication across page loads
- ✅ Better error messages for actual auth failures

### Monitoring:

Add these console logs to track improvements:
- Token cache hit/miss rate
- Number of token fetch retries
- Time from login to first successful API call
- Authentication errors by type

---

## Rollback Plan

If issues arise, revert these files:
1. `web/lib/contexts/auth-context.tsx`
2. `web/lib/api/client.ts`
3. `web/app/api/auth/token/route.ts`

Delete new file:
- `web/lib/hooks/useAuthReady.ts`

The changes are backward compatible, so a simple file revert will work.

---

## Additional Improvements (Optional)

### 1. Add Token Refresh Endpoint

Create `/api/auth/refresh` to explicitly refresh tokens when they expire.

### 2. Add Global Error Boundary

Catch authentication errors globally and redirect to login.

### 3. Add Metrics

Track token cache performance and authentication errors in your analytics.

### 4. Session Extension

Automatically extend sessions on user activity.

