import { useState, useEffect } from 'react'

const ONBOARDING_KEY = 'voice_coach_onboarding_completed'
const BANNER_DISMISSED_KEY = 'voice_coach_banner_dismissed'

export function useVoiceCoachOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true)
  const [hasDismissedBanner, setHasDismissedBanner] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for onboarding status
    const onboardingCompleted = localStorage.getItem(ONBOARDING_KEY) === 'true'
    const bannerDismissed = localStorage.getItem(BANNER_DISMISSED_KEY) === 'true'
    
    setHasCompletedOnboarding(onboardingCompleted)
    setHasDismissedBanner(bannerDismissed)
    setIsLoading(false)
  }, [])

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setHasCompletedOnboarding(true)
  }

  const dismissBanner = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true')
    setHasDismissedBanner(true)
  }

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY)
    localStorage.removeItem(BANNER_DISMISSED_KEY)
    setHasCompletedOnboarding(false)
    setHasDismissedBanner(false)
  }

  return {
    hasCompletedOnboarding,
    hasDismissedBanner,
    isLoading,
    completeOnboarding,
    dismissBanner,
    resetOnboarding,
    shouldShowOnboarding: !isLoading && !hasCompletedOnboarding,
    shouldShowBanner: !isLoading && hasCompletedOnboarding && !hasDismissedBanner,
  }
}
