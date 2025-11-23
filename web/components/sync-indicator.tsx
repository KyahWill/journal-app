'use client'

import { useGoals } from '@/lib/contexts/goal-context'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Real-time sync indicator component
 * Shows connection status for goal synchronization
 */
export function SyncIndicator({ className }: { className?: string }) {
  const { connected, loading } = useGoals()

  if (loading) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-xs text-gray-500',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        <span>Syncing...</span>
      </div>
    )
  }

  if (!connected) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-xs text-orange-600',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <WifiOff className="h-3 w-3" aria-hidden="true" />
        <span>Offline</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs text-green-600',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Wifi className="h-3 w-3" aria-hidden="true" />
      <span>Synced</span>
    </div>
  )
}

/**
 * Compact sync indicator badge
 */
export function SyncBadge({ className }: { className?: string }) {
  const { connected, loading } = useGoals()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        loading && 'bg-blue-50 text-blue-700',
        !loading && connected && 'bg-green-50 text-green-700',
        !loading && !connected && 'bg-orange-50 text-orange-700',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {loading ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          <span>Syncing</span>
        </>
      ) : connected ? (
        <>
          <div className="h-2 w-2 rounded-full bg-green-600" aria-hidden="true" />
          <span>Synced</span>
        </>
      ) : (
        <>
          <div className="h-2 w-2 rounded-full bg-orange-600" aria-hidden="true" />
          <span>Offline</span>
        </>
      )}
    </div>
  )
}
