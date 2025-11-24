/**
 * Feature flags for gradual rollout and A/B testing
 */

export interface FeatureFlags {
  voiceCoach: boolean
  voiceCoachOnboarding: boolean
}

/**
 * Get feature flags from environment variables
 * Defaults to enabled for development
 */
export function getFeatureFlags(): FeatureFlags {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    voiceCoach: process.env.NEXT_PUBLIC_FEATURE_VOICE_COACH === 'true' || isDevelopment,
    voiceCoachOnboarding: process.env.NEXT_PUBLIC_FEATURE_VOICE_COACH_ONBOARDING === 'true' || isDevelopment,
  }
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags()
  return flags[feature]
}
