'use client'

import React, { useEffect, useState } from 'react'
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
        return React.createElement(LoadingComponent)
      }
      return React.createElement('div', null, 'Loading...')
    }

    return React.createElement(Component, props)
  }
}
