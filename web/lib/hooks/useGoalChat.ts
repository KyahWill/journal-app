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
    console.log('[useGoalChat] Getting goal suggestions')
    
    try {
      setLoadingSuggestions(true)
      setError(null)
      
      const response = await apiClient.suggestGoals()
      console.log('[useGoalChat] Goal suggestions received:', {
        count: response.suggestions?.length || 0,
        usageRemaining: response.usageInfo?.remaining
      })
      
      return response.suggestions || []
    } catch (err: any) {
      console.error('[useGoalChat] Error getting goal suggestions:', err.message)
      
      const errorMessage = err.message || 'Failed to get goal suggestions'
      setError(errorMessage)
      throw err
    } finally {
      setLoadingSuggestions(false)
    }
  }

  async function getGoalInsights(goalId: string, useStreaming: boolean = true, onChunk?: (chunk: string) => void): Promise<string> {
    console.log('[useGoalChat] Getting goal insights:', { goalId, useStreaming })
    
    try {
      setLoadingInsights(true)
      setError(null)
      
      if (useStreaming) {
        let fullInsights = ''
        let usageInfoFromStream: any = null
        
        for await (const event of apiClient.getGoalInsightsStream(goalId, (c) => {
          if (onChunk) {
            onChunk(c)
          }
        })) {
          if (event.type === 'start') {
            usageInfoFromStream = event.usageInfo || null
            console.log('[useGoalChat] Goal insights stream started:', { 
              goalId: event.goalId,
              usageRemaining: usageInfoFromStream?.remaining,
              usageLimit: usageInfoFromStream?.limit
            })
          } else if (event.type === 'chunk') {
            fullInsights += event.content
          } else if (event.type === 'done') {
            console.log('[useGoalChat] Goal insights stream completed:', { 
              goalId,
              length: fullInsights.length 
            })
          }
        }
        
        return fullInsights
      } else {
        const response = await apiClient.getGoalInsights(goalId)
        console.log('[useGoalChat] Goal insights received:', {
          goalId,
          length: response.insights.length,
          usageRemaining: response.usageInfo?.remaining
        })
        
        return response.insights
      }
    } catch (err: any) {
      console.error('[useGoalChat] Error generating goal insights:', {
        goalId,
        error: err.message
      })
      
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
