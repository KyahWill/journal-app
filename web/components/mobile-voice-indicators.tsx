'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Battery, BatteryCharging, BatteryLow, Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh, AlertTriangle } from 'lucide-react'
import { useBatteryStatus } from '@/lib/hooks/useBatteryStatus'
import { useNetworkQuality } from '@/lib/hooks/useNetworkQuality'
import { useMobileDetection } from '@/lib/hooks/useMobileDetection'

interface MobileVoiceIndicatorsProps {
  isConnected: boolean
  sessionDuration?: number // in seconds
}

export function MobileVoiceIndicators({
  isConnected,
  sessionDuration = 0,
}: MobileVoiceIndicatorsProps) {
  const { isMobile } = useMobileDetection()
  const battery = useBatteryStatus()
  const network = useNetworkQuality()

  // Don't show on desktop
  if (!isMobile) return null

  const showBatteryWarning = battery.isLowBattery && isConnected && sessionDuration > 300 // After 5 minutes
  const showNetworkWarning = network.quality === 'poor' || network.quality === 'offline'

  // Get network quality icon and color
  const getNetworkIcon = () => {
    switch (network.quality) {
      case 'excellent':
        return <SignalHigh className="h-4 w-4" />
      case 'good':
        return <Signal className="h-4 w-4" />
      case 'fair':
        return <SignalMedium className="h-4 w-4" />
      case 'poor':
        return <SignalLow className="h-4 w-4" />
      case 'offline':
        return <WifiOff className="h-4 w-4" />
      default:
        return <Wifi className="h-4 w-4" />
    }
  }

  const getNetworkColor = () => {
    switch (network.quality) {
      case 'excellent':
        return 'text-green-600'
      case 'good':
        return 'text-blue-600'
      case 'fair':
        return 'text-yellow-600'
      case 'poor':
        return 'text-orange-600'
      case 'offline':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getNetworkLabel = () => {
    switch (network.quality) {
      case 'excellent':
        return 'Excellent'
      case 'good':
        return 'Good'
      case 'fair':
        return 'Fair'
      case 'poor':
        return 'Poor'
      case 'offline':
        return 'Offline'
      default:
        return 'Unknown'
    }
  }

  // Get battery icon
  const getBatteryIcon = () => {
    if (battery.charging) {
      return <BatteryCharging className="h-4 w-4" />
    } else if (battery.isLowBattery) {
      return <BatteryLow className="h-4 w-4" />
    } else {
      return <Battery className="h-4 w-4" />
    }
  }

  const getBatteryColor = () => {
    if (battery.charging) {
      return 'text-green-600'
    } else if (battery.isLowBattery) {
      return 'text-red-600'
    } else if (battery.level !== null && battery.level < 0.5) {
      return 'text-yellow-600'
    } else {
      return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-3">
      {/* Status Indicators */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Network Quality Indicator */}
        {network.isOnline && (
          <Badge variant="outline" className="flex items-center gap-1.5">
            <span className={getNetworkColor()}>
              {getNetworkIcon()}
            </span>
            <span className="text-xs">{getNetworkLabel()}</span>
          </Badge>
        )}

        {/* Battery Indicator */}
        {battery.isSupported && battery.level !== null && (
          <Badge variant="outline" className="flex items-center gap-1.5">
            <span className={getBatteryColor()}>
              {getBatteryIcon()}
            </span>
            <span className="text-xs">
              {Math.round(battery.level * 100)}%
            </span>
          </Badge>
        )}
      </div>

      {/* Battery Warning */}
      {showBatteryWarning && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">Low Battery Warning</AlertTitle>
          <AlertDescription className="text-xs">
            Your battery is running low ({Math.round(battery.level! * 100)}%). 
            Voice conversations can drain battery quickly. Consider charging your device or ending the session soon.
          </AlertDescription>
        </Alert>
      )}

      {/* Network Warning */}
      {showNetworkWarning && isConnected && (
        <Alert variant="destructive" className="py-2">
          <WifiOff className="h-4 w-4" />
          <AlertTitle className="text-sm">
            {network.quality === 'offline' ? 'No Internet Connection' : 'Poor Network Quality'}
          </AlertTitle>
          <AlertDescription className="text-xs">
            {network.quality === 'offline' 
              ? 'Your internet connection was lost. The conversation will be interrupted.'
              : 'Your network connection is weak. You may experience audio delays or disconnections.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Network Quality Details (when connected and not poor) */}
      {isConnected && network.quality !== 'offline' && network.quality !== 'poor' && network.effectiveType && (
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>Network: {network.effectiveType.toUpperCase()}</span>
          {network.rtt !== null && (
            <span>• Latency: {network.rtt}ms</span>
          )}
        </div>
      )}
    </div>
  )
}
