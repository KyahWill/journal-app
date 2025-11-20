/**
 * Authentication Hook
 * 
 * Manages Firebase authentication state and syncs with backend API
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { auth } from '@/lib/firebase/config'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth'
import { apiClient } from '@/lib/api/client'

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  emailVerified: boolean
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

  // Listen to Firebase auth state changes
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !auth) {
      setAuthState({ user: null, loading: false, error: null })
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Get Firebase ID token
          const token = await firebaseUser.getIdToken()

          // Set token in API client
          apiClient.setToken(token)

          // Create session cookie (required for middleware authentication)
          try {
            await fetch('/api/auth/session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ idToken: token }),
            })
          } catch (error) {
            console.error('Session cookie creation failed:', error)
          }

          // Verify token with backend (optional but recommended)
          try {
            await apiClient.verifyToken(token)
          } catch (error) {
            console.error('Token verification failed:', error)
          }

          // Set user state
          setAuthState({
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              emailVerified: firebaseUser.emailVerified,
            },
            loading: false,
            error: null,
          })
        } else {
          // No user signed in - clear session cookie
          try {
            await fetch('/api/auth/session', { method: 'DELETE' })
          } catch (error) {
            console.error('Failed to clear session:', error)
          }
          
          apiClient.setToken(null)
          setAuthState({
            user: null,
            loading: false,
            error: null,
          })
        }
      } catch (error: any) {
        console.error('Auth state change error:', error)
        setAuthState({
          user: null,
          loading: false,
          error: error.message || 'Authentication error',
        })
      }
    })

    return () => unsubscribe()
  }, [])

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized')
    }
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))
      await signInWithEmailAndPassword(auth, email, password)
      // Auth state will be updated by onAuthStateChanged
    } catch (error: any) {
      const errorMessage = error.message || 'Sign in failed'
      setAuthState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized')
    }
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))
      
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Optionally create user in backend
      // Note: Backend also has a signup endpoint if you want to use it instead
      
      return userCredential.user
    } catch (error: any) {
      const errorMessage = error.message || 'Sign up failed'
      setAuthState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized')
    }
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))
      
      // Delete session cookie
      try {
        await fetch('/api/auth/session', { method: 'DELETE' })
      } catch (error) {
        console.error('Failed to delete session cookie:', error)
      }
      
      await firebaseSignOut(auth)
      apiClient.setToken(null)
      // Auth state will be updated by onAuthStateChanged
    } catch (error: any) {
      const errorMessage = error.message || 'Sign out failed'
      setAuthState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Refresh token (useful when token expires)
  const refreshToken = useCallback(async () => {
    if (!auth) return null
    const currentUser = auth.currentUser
    if (currentUser) {
      const token = await currentUser.getIdToken(true) // Force refresh
      apiClient.setToken(token)
      return token
    }
    return null
  }, [])

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signUp,
    signOut,
    refreshToken,
    isAuthenticated: !!authState.user,
  }
}

