'use client'

import { useEffect } from 'react'
import { GoalDashboardWidget } from '@/components/goal-dashboard-widget'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, MessageSquare, Target, Mic } from 'lucide-react'
import Link from 'next/link'
import { VoiceCoachOnboarding } from '@/components/voice-coach-onboarding'
import { VoiceCoachBanner } from '@/components/voice-coach-banner'
import { useVoiceCoachOnboarding } from '@/lib/hooks/useVoiceCoachOnboarding'
import { isFeatureEnabled } from '@/lib/config/features'

export default function AppPage() {
  const {
    shouldShowOnboarding,
    shouldShowBanner,
    completeOnboarding,
    dismissBanner,
  } = useVoiceCoachOnboarding()

  const voiceCoachEnabled = isFeatureEnabled('voiceCoach')
  const onboardingEnabled = isFeatureEnabled('voiceCoachOnboarding')

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h2>
        <p className="text-gray-600">Welcome back! Here's your overview.</p>
      </div>

      {/* Voice Coach Promotional Banner */}
      {voiceCoachEnabled && onboardingEnabled && shouldShowBanner && (
        <div className="mb-6">
          <VoiceCoachBanner onDismiss={dismissBanner} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Goal Dashboard Widget */}
        <GoalDashboardWidget />

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump to your most used features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/app/journal/new">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                New Journal Entry
              </Button>
            </Link>
            <Link href="/app/goals">
              <Button variant="outline" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                View All Goals
              </Button>
            </Link>
            <Link href="/app/coach">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat with Coach
              </Button>
            </Link>
            {voiceCoachEnabled && (
              <Link href="/app/ai-agent">
                <Button variant="outline" className="w-full justify-start border-blue-200 hover:bg-blue-50">
                  <Mic className="h-4 w-4 mr-2" />
                  Voice Coach
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Voice Coach Onboarding Dialog */}
      {voiceCoachEnabled && onboardingEnabled && (
        <VoiceCoachOnboarding
          open={shouldShowOnboarding}
          onComplete={completeOnboarding}
        />
      )}
    </div>
  )
}
