import { useState } from 'react'
import { apiClient } from '@/lib/api/client'

export interface GoalSuggestion {
  title: string
  category: string
  description: string
  milestones: string[]
  reasoning: string
}

export function useGoalChat() {
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function getGoalSuggestions(): Promise<GoalSuggestion[]> {
    try {
      setLoadingSuggestions(true)
      setError(null)
      const response = await apiClient.suggestGoals()
      return response.suggestions || []
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get goal suggestions'
      setError(errorMessage)
      throw err
    } finally {
      setLoadingSuggestions(false)
    }
  }

  async function getGoalInsights(goalId: string): Promise<string> {
    try {
      setLoadingInsights(true)
      setError(null)
      const response = await apiClient.getGoalInsights(goalId)
      return response.insights
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get goal insights'
      setError(errorMessage)
      throw err
    } finally {
      setLoadingInsights(false)
    }
  }

  return {
    getGoalSuggestions,
    getGoalInsights,
    loadingSuggestions,
    loadingInsights,
    error,
  }
}
