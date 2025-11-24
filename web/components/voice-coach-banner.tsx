'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, X, Sparkles } from 'lucide-react'

interface VoiceCoachBannerProps {
  onDismiss: () => void
}

export function VoiceCoachBanner({ onDismiss }: VoiceCoachBannerProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      onDismiss()
    }, 300)
  }

  const handleTryNow = () => {
    onDismiss()
    router.push('/app/ai-agent')
  }

  if (!isVisible) return null

  return (
    <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-300">
      <CardContent className="p-4 sm:p-6">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/50 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center relative">
              <Mic className="h-6 w-6 text-white" />
              <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Try AI Voice Coach
              </h3>
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                NEW
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Experience personalized coaching through natural voice conversations. 
              Your AI coach has access to your goals and journal entries for context-aware guidance.
            </p>
          </div>

          <div className="flex-shrink-0 w-full sm:w-auto">
            <Button 
              onClick={handleTryNow}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              <Mic className="h-4 w-4 mr-2" />
              Try Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
