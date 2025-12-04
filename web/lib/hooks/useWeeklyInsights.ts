/**
 * Weekly Insights Hook
 * 
 * Manages fetching and streaming weekly insights from the backend API.
 * Insights are saved to the database on Saturday to Friday intervals.
 */

'use client'

import { useState, useCallback } from 'react'
import { apiClient, UsageInfo, WeeklyInsight } from '@/lib/api/client'

interface WeeklyInsightsState {
  currentInsight: WeeklyInsight | null
  insightHistory: WeeklyInsight[]
  weekStart: Date | null
  weekEnd: Date | null
  loading: boolean
  loadingHistory: boolean
  error: string | null
  usageWarning: string | null
  isExisting: boolean
}

export function useWeeklyInsights() {
  const [state, setState] = useState<WeeklyInsightsState>({
    currentInsight: null,
    insightHistory: [],
    weekStart: null,
    weekEnd: null,
    loading: false,
    loadingHistory: false,
    error: null,
    usageWarning: null,
    isExisting: false,
  })

  // Check if insights exist for current week
  const checkCurrentWeek = useCallback(async () => {
    console.log('[useWeeklyInsights] Checking current week insights')
    setState((prev) => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await apiClient.getCurrentWeekInsights()
      
      setState((prev) => ({
        ...prev,
        currentInsight: response.insight,
        weekStart: new Date(response.weekStart),
        weekEnd: new Date(response.weekEnd),
        isExisting: response.insight !== null,
        loading: false,
      }))
      
      return response
    } catch (error: any) {
      console.error('[useWeeklyInsights] Error checking current week:', error.message)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to check current week insights',
      }))
      throw error
    }
  }, [])

  // Fetch insights history
  const fetchHistory = useCallback(async () => {
    console.log('[useWeeklyInsights] Fetching insights history')
    setState((prev) => ({ ...prev, loadingHistory: true, error: null }))
    
    try {
      const history = await apiClient.getWeeklyInsightsHistory()
      
      setState((prev) => ({
        ...prev,
        insightHistory: history,
        loadingHistory: false,
      }))
      
      return history
    } catch (error: any) {
      console.error('[useWeeklyInsights] Error fetching history:', error.message)
      setState((prev) => ({
        ...prev,
        loadingHistory: false,
        error: error.message || 'Failed to fetch insights history',
      }))
      throw error
    }
  }, [])

  // Get a specific insight by ID
  const getInsightById = useCallback(async (id: string) => {
    console.log('[useWeeklyInsights] Fetching insight by ID:', id)
    
    try {
      const insight = await apiClient.getWeeklyInsightById(id)
      return insight
    } catch (error: any) {
      console.error('[useWeeklyInsights] Error fetching insight:', error.message)
      throw error
    }
  }, [])

  // Generate weekly insights with streaming
  const generateInsights = useCallback(async (
    forceRegenerate: boolean = false,
    onChunk?: (chunk: string) => void
  ) => {
    console.log('[useWeeklyInsights] Generating weekly insights:', { forceRegenerate })
    setState((prev) => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      usageWarning: null,
      currentInsight: forceRegenerate ? null : prev.currentInsight,
    }))
    
    try {
      let fullContent = ''
      let usageInfoFromStream: UsageInfo | null = null
      let savedInsight: WeeklyInsight | null = null
      let isExisting = false
      let weekStart: Date | null = null
      let weekEnd: Date | null = null
      
      for await (const event of apiClient.generateWeeklyInsightsStream(forceRegenerate, (c) => {
        if (onChunk) {
          onChunk(c)
        }
      })) {
        if (event.type === 'start') {
          usageInfoFromStream = event.usageInfo || null
          isExisting = event.isExisting || false
          weekStart = event.weekStart ? new Date(event.weekStart) : null
          weekEnd = event.weekEnd ? new Date(event.weekEnd) : null
          
          console.log('[useWeeklyInsights] Stream started:', { 
            usageRemaining: usageInfoFromStream?.remaining,
            usageLimit: usageInfoFromStream?.limit,
            entryCount: event.entryCount,
            isExisting,
          })
        } else if (event.type === 'chunk') {
          fullContent += event.content
        } else if (event.type === 'done') {
          savedInsight = event.insight || null
          console.log('[useWeeklyInsights] Stream completed:', { 
            contentLength: fullContent.length,
            insightId: savedInsight?.id,
          })
        }
      }
      
      // If we got a saved insight from the stream, use it
      const finalInsight = savedInsight || (fullContent ? {
        id: '',
        user_id: '',
        week_start: weekStart || new Date(),
        week_end: weekEnd || new Date(),
        content: fullContent,
        entry_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      } : null)
      
      setState((prev) => ({
        ...prev,
        currentInsight: finalInsight,
        weekStart,
        weekEnd,
        isExisting,
        loading: false,
        error: null,
        usageWarning: usageInfoFromStream?.warning || null,
      }))
      
      return { insight: finalInsight, isExisting }
    } catch (error: any) {
      console.error('[useWeeklyInsights] Error generating insights:', error.message)
      
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to generate weekly insights',
        usageWarning: error.usageInfo?.warning || null,
      }))
      throw error
    }
  }, [])

  // Delete an insight
  const deleteInsight = useCallback(async (id: string) => {
    console.log('[useWeeklyInsights] Deleting insight:', id)
    
    try {
      await apiClient.deleteWeeklyInsight(id)
      
      // Update state
      setState((prev) => ({
        ...prev,
        insightHistory: prev.insightHistory.filter((i) => i.id !== id),
        currentInsight: prev.currentInsight?.id === id ? null : prev.currentInsight,
        isExisting: prev.currentInsight?.id === id ? false : prev.isExisting,
      }))
      
      return { success: true }
    } catch (error: any) {
      console.error('[useWeeklyInsights] Error deleting insight:', error.message)
      throw error
    }
  }, [])

  // Clear current insight state
  const clearInsight = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentInsight: null,
      isExisting: false,
    }))
  }, [])

  // Set a specific insight as current (for viewing history)
  const setCurrentInsight = useCallback((insight: WeeklyInsight) => {
    setState((prev) => ({
      ...prev,
      currentInsight: insight,
      weekStart: new Date(insight.week_start),
      weekEnd: new Date(insight.week_end),
      isExisting: true,
    }))
  }, [])

  return {
    currentInsight: state.currentInsight,
    insightHistory: state.insightHistory,
    weekStart: state.weekStart,
    weekEnd: state.weekEnd,
    loading: state.loading,
    loadingHistory: state.loadingHistory,
    error: state.error,
    usageWarning: state.usageWarning,
    isExisting: state.isExisting,
    checkCurrentWeek,
    fetchHistory,
    getInsightById,
    generateInsights,
    deleteInsight,
    clearInsight,
    setCurrentInsight,
  }
}
