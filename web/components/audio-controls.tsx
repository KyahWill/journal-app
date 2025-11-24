'use client'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Volume2, VolumeX, Mic, MicOff, PhoneOff } from 'lucide-react'

interface AudioControlsProps {
  isMuted: boolean
  volume: number
  isConnected: boolean
  onMuteToggle: () => void
  onVolumeChange: (volume: number) => void
  onEndConversation: () => void
}

export function AudioControls({
  isMuted,
  volume,
  isConnected,
  onMuteToggle,
  onVolumeChange,
  onEndConversation,
}: AudioControlsProps) {
  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Mute Control */}
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="mute-toggle" className="text-xs sm:text-sm font-medium">
            Microphone
          </Label>
          <Button
            id="mute-toggle"
            variant={isMuted ? 'destructive' : 'outline'}
            size="sm"
            onClick={onMuteToggle}
            disabled={!isConnected}
            className="w-24 sm:w-28 min-h-[44px] touch-manipulation"
          >
            {isMuted ? (
              <>
                <MicOff className="h-4 w-4 mr-1 sm:mr-2" />
                Muted
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-1 sm:mr-2" />
                Active
              </>
            )}
          </Button>
        </div>

        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="volume-slider" className="text-xs sm:text-sm font-medium">
              Volume
            </Label>
            <span className="text-xs sm:text-sm text-gray-600 font-medium">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {volume === 0 ? (
              <VolumeX className="h-5 w-5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
            ) : (
              <Volume2 className="h-5 w-5 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
            )}
            <Slider
              id="volume-slider"
              min={0}
              max={1}
              step={0.1}
              value={[volume]}
              onValueChange={(values) => onVolumeChange(values[0])}
              disabled={!isConnected}
              className="flex-1 touch-manipulation"
            />
          </div>
        </div>

        {/* End Conversation Button */}
        <div className="pt-2 border-t border-gray-200">
          <Button
            variant="destructive"
            size="sm"
            onClick={onEndConversation}
            disabled={!isConnected}
            className="w-full min-h-[44px] touch-manipulation text-sm sm:text-base"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            End Conversation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
