'use client'

import { useState, useEffect } from 'react'

type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline' | 'unknown'

interface NetworkQualityResult {
  quality: NetworkQuality
  effectiveType: string | null
  downlink: number | null
  rtt: number | null
  isOnline: boolean
}

// Extend Navigator interface for Network Information API
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation
  mozConnection?: NetworkInformation
  webkitConnection?: NetworkInformation
}

interface NetworkInformation extends EventTarget {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g'
  downlink?: number
  rtt?: number
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
}

export function useNetworkQuality(): NetworkQualityResult {
  const [networkQuality, setNetworkQuality] = useState<NetworkQualityResult>({
    quality: 'unknown',
    effectiveType: null,
    downlink: null,
    rtt: null,
    isOnline: true,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const nav = navigator as NavigatorWithConnection
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection

    const updateNetworkQuality = () => {
      const isOnline = navigator.onLine

      if (!isOnline) {
        setNetworkQuality({
          quality: 'offline',
          effectiveType: null,
          downlink: null,
          rtt: null,
          isOnline: false,
        })
        return
      }

      if (!connection) {
        setNetworkQuality({
          quality: 'unknown',
          effectiveType: null,
          downlink: null,
          rtt: null,
          isOnline: true,
        })
        return
      }

      const effectiveType = connection.effectiveType || null
      const downlink = connection.downlink || null
      const rtt = connection.rtt || null

      // Determine quality based on effective type and metrics
      let quality: NetworkQuality = 'unknown'

      if (effectiveType === '4g' && (!rtt || rtt < 100)) {
        quality = 'excellent'
      } else if (effectiveType === '4g' || (effectiveType === '3g' && (!rtt || rtt < 200))) {
        quality = 'good'
      } else if (effectiveType === '3g' || effectiveType === '2g') {
        quality = 'fair'
      } else if (effectiveType === 'slow-2g' || (rtt && rtt > 500)) {
        quality = 'poor'
      } else if (effectiveType) {
        quality = 'good' // Default for known types
      }

      setNetworkQuality({
        quality,
        effectiveType,
        downlink,
        rtt,
        isOnline: true,
      })
    }

    // Initial update
    updateNetworkQuality()

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkQuality)
    window.addEventListener('offline', updateNetworkQuality)

    // Listen for connection changes if supported
    if (connection) {
      connection.addEventListener('change', updateNetworkQuality)
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', updateNetworkQuality)
      window.removeEventListener('offline', updateNetworkQuality)
      if (connection) {
        connection.removeEventListener('change', updateNetworkQuality)
      }
    }
  }, [])

  return networkQuality
}
