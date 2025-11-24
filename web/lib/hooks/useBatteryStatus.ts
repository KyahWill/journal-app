'use client'

import { useState, useEffect } from 'react'

interface BatteryStatus {
  level: number | null
  charging: boolean | null
  isLowBattery: boolean
  isSupported: boolean
}

// Extend Navigator interface for Battery API
interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>
}

interface BatteryManager extends EventTarget {
  level: number
  charging: boolean
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
}

export function useBatteryStatus(): BatteryStatus {
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus>({
    level: null,
    charging: null,
    isLowBattery: false,
    isSupported: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const nav = navigator as NavigatorWithBattery

    // Check if Battery API is supported
    if (!nav.getBattery) {
      setBatteryStatus({
        level: null,
        charging: null,
        isLowBattery: false,
        isSupported: false,
      })
      return
    }

    let battery: BatteryManager | null = null

    const updateBatteryStatus = (batteryManager: BatteryManager) => {
      const level = batteryManager.level
      const charging = batteryManager.charging
      const isLowBattery = level < 0.2 && !charging // Below 20% and not charging

      setBatteryStatus({
        level,
        charging,
        isLowBattery,
        isSupported: true,
      })
    }

    nav.getBattery().then((batteryManager) => {
      battery = batteryManager
      updateBatteryStatus(batteryManager)

      // Listen for battery changes
      const handleLevelChange = () => updateBatteryStatus(batteryManager)
      const handleChargingChange = () => updateBatteryStatus(batteryManager)

      batteryManager.addEventListener('levelchange', handleLevelChange)
      batteryManager.addEventListener('chargingchange', handleChargingChange)

      // Cleanup
      return () => {
        if (battery) {
          battery.removeEventListener('levelchange', handleLevelChange)
          battery.removeEventListener('chargingchange', handleChargingChange)
        }
      }
    }).catch((error) => {
      console.warn('[useBatteryStatus] Battery API error:', error)
      setBatteryStatus({
        level: null,
        charging: null,
        isLowBattery: false,
        isSupported: false,
      })
    })
  }, [])

  return batteryStatus
}
