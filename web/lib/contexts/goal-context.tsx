'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react'
import { apiClient, Goal, GoalStatus, CreateGoalData, UpdateGoalData, Milestone, ProgressUpdate, GoalFilters } from '@/lib/api/client'
import { getDbInstance } from '@/lib/firebase/config'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { useAuth } from './auth-context'

interface GoalState {
  goals: Goal[]
  loading: boolean
  error: string | null
  connected: boolean
}

export interface GoalContextValue extends GoalState {
  // Goal CRUD operations
  createGoal: (data: CreateGoalData) => Promise<Goal>
  updateGoal: (id: string, data: UpdateGoalData) => Promise<Goal>
  deleteGoal: (id: string) => Promise<void>
  updateStatus: (id: string, status: GoalStatus) => Promise<Goal>
  
  // Milestone operations
  addMilestone: (goalId: string, data: { title: string; due_date?: string }) => Promise<Milestone>
  toggleMilestone: (goalId: string, milestoneId: string) => Promise<Milestone>
  
  // Progress operations
  addProgress: (goalId: string, content: string) => Promise<ProgressUpdate>
  
  // Filtering and utility methods
  filterGoals: (filters: GoalFilters) => Goal[]
  getOverdueGoals: () => Goal[]
  getUrgentGoals: () => Goal[]
  sortGoals: (goals: Goal[], sortBy: 'target_date' | 'created_at' | 'progress' | 'title') => Goal[]
  
  // Notification methods
  getNotificationCounts: () => { urgent: number; overdue: number; total: number }
  
  // Real-time synchronization
  subscribeToGoals: () => void
  unsubscribeFromGoals: () => void
}

const GoalContext = createContext<GoalContextValue | undefined>(undefined)

export function GoalProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [goalState, setGoalState] = useState<GoalState>({
    goals: [],
    loading: true,
    error: null,
    connected: false,
  })

  // Store unsubscribe function for cleanup
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null)

  // ============================================================================
  // Goal CRUD Operations with Optimistic Updates
  // ============================================================================

  const createGoal = useCallback(async (data: CreateGoalData): Promise<Goal> => {
    try {
      setGoalState((prev) => ({ ...prev, error: null }))
      
      // Call API to create goal
      const newGoal = await apiClient.createGoal(data)
      
      // Optimistically add to state (real-time listener will update with server data)
      setGoalState((prev) => ({
        ...prev,
        goals: [newGoal, ...prev.goals],
      }))
      
      return newGoal
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create goal'
      setGoalState((prev) => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  const updateGoal = useCallback(async (id: string, data: UpdateGoalData): Promise<Goal> => {
    try {
      setGoalState((prev) => ({ ...prev, error: null }))
      
      // Store previous state for rollback
      const previousGoals = goalState.goals
      
      // Optimistic update
      setGoalState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === id ? { ...g, ...data, updated_at: new Date().toISOString() } : g
        ),
      }))
      
      try {
        // Call API to update goal
        const updatedGoal = await apiClient.updateGoal(id, data)
        
        // Update with server response
        setGoalState((prev) => ({
          ...prev,
          goals: prev.goals.map((g) => (g.id === id ? updatedGoal : g)),
        }))
        
        return updatedGoal
      } catch (error) {
        // Rollback on error
        setGoalState((prev) => ({ ...prev, goals: previousGoals }))
        throw error
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update goal'
      setGoalState((prev) => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [goalState.goals])

  const deleteGoal = useCallback(async (id: string): Promise<void> => {
    try {
      setGoalState((prev) => ({ ...prev, error: null }))
      
      // Store previous state for rollback
      const previousGoals = goalState.goals
      
      // Optimistic delete
      setGoalState((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== id),
      }))
      
      try {
        // Call API to delete goal (cascade deletion happens on backend)
        const result = await apiClient.deleteGoal(id)
        
        // Log success
        console.log('Goal deleted successfully:', result.message)
      } catch (error: any) {
        // Rollback on error
        setGoalState((prev) => ({ ...prev, goals: previousGoals }))
        
        // Provide detailed error message
        const errorMessage = error.message || 'Failed to delete goal. Please try again.'
        console.error('Delete goal error:', error)
        
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete goal'
      setGoalState((prev) => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [goalState.goals])

  const updateStatus = useCallback(async (id: string, status: GoalStatus): Promise<Goal> => {
    try {
      setGoalState((prev) => ({ ...prev, error: null }))
      
      // Store previous state for rollback
      const previousGoals = goalState.goals
      
      // Optimistic update
      setGoalState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === id
            ? {
                ...g,
                status,
                status_changed_at: new Date().toISOString(),
                completed_at: status === 'completed' ? new Date().toISOString() : g.completed_at,
              }
            : g
        ),
      }))
      
      try {
        // Call API to update status
        const updatedGoal = await apiClient.updateGoalStatus(id, status)
        
        // Update with server response
        setGoalState((prev) => ({
          ...prev,
          goals: prev.goals.map((g) => (g.id === id ? updatedGoal : g)),
        }))
        
        return updatedGoal
      } catch (error) {
        // Rollback on error
        setGoalState((prev) => ({ ...prev, goals: previousGoals }))
        throw error
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update goal status'
      setGoalState((prev) => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [goalState.goals])

  // ============================================================================
  // Milestone Operations
  // ============================================================================

  const addMilestone = useCallback(
    async (goalId: string, data: { title: string; due_date?: string }): Promise<Milestone> => {
      try {
        setGoalState((prev) => ({ ...prev, error: null }))
        
        // Call API to add milestone
        const newMilestone = await apiClient.addMilestone(goalId, data)
        
        // Update goal in state to reflect new milestone
        // Note: We don't store milestones in the goal state, but we update last_activity
        setGoalState((prev) => ({
          ...prev,
          goals: prev.goals.map((g) =>
            g.id === goalId
              ? { ...g, last_activity: new Date().toISOString() }
              : g
          ),
        }))
        
        return newMilestone
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to add milestone'
        setGoalState((prev) => ({ ...prev, error: errorMessage }))
        throw error
      }
    },
    []
  )

  const toggleMilestone = useCallback(
    async (goalId: string, milestoneId: string): Promise<Milestone> => {
      try {
        setGoalState((prev) => ({ ...prev, error: null }))
        
        // Call API to toggle milestone
        const updatedMilestone = await apiClient.toggleMilestone(goalId, milestoneId)
        
        // Update goal in state (progress will be recalculated by backend)
        setGoalState((prev) => ({
          ...prev,
          goals: prev.goals.map((g) =>
            g.id === goalId
              ? { ...g, last_activity: new Date().toISOString() }
              : g
          ),
        }))
        
        return updatedMilestone
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to toggle milestone'
        setGoalState((prev) => ({ ...prev, error: errorMessage }))
        throw error
      }
    },
    []
  )

  // ============================================================================
  // Progress Operations
  // ============================================================================

  const addProgress = useCallback(
    async (goalId: string, content: string): Promise<ProgressUpdate> => {
      try {
        setGoalState((prev) => ({ ...prev, error: null }))
        
        // Call API to add progress update
        const newProgress = await apiClient.addProgressUpdate(goalId, content)
        
        // Update goal last_activity in state
        setGoalState((prev) => ({
          ...prev,
          goals: prev.goals.map((g) =>
            g.id === goalId
              ? { ...g, last_activity: new Date().toISOString() }
              : g
          ),
        }))
        
        return newProgress
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to add progress update'
        setGoalState((prev) => ({ ...prev, error: errorMessage }))
        throw error
      }
    },
    []
  )

  // ============================================================================
  // Filtering and Utility Methods (Memoized for Performance)
  // ============================================================================

  const filterGoals = useCallback(
    (filters: GoalFilters): Goal[] => {
      let filtered = [...goalState.goals]
      
      if (filters.category) {
        filtered = filtered.filter((g) => g.category === filters.category)
      }
      
      if (filters.status) {
        filtered = filtered.filter((g) => g.status === filters.status)
      }
      
      return filtered
    },
    [goalState.goals]
  )

  // Memoize overdue goals calculation
  const getOverdueGoals = useMemo((): Goal[] => {
    const now = new Date()
    return goalState.goals.filter((g) => {
      if (g.status === 'completed' || g.status === 'abandoned') {
        return false
      }
      const targetDate = new Date(g.target_date)
      return targetDate < now
    })
  }, [goalState.goals])

  // Memoize urgent goals calculation
  const getUrgentGoals = useMemo((): Goal[] => {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return goalState.goals.filter((g) => {
      if (g.status === 'completed' || g.status === 'abandoned') {
        return false
      }
      const targetDate = new Date(g.target_date)
      return targetDate >= now && targetDate <= sevenDaysFromNow
    })
  }, [goalState.goals])
  
  // Return functions that return memoized values
  const getOverdueGoalsFn = useCallback(() => getOverdueGoals, [getOverdueGoals])
  const getUrgentGoalsFn = useCallback(() => getUrgentGoals, [getUrgentGoals])

  const sortGoals = useCallback(
    (goals: Goal[], sortBy: 'target_date' | 'created_at' | 'progress' | 'title'): Goal[] => {
      const sorted = [...goals]
      
      switch (sortBy) {
        case 'target_date':
          return sorted.sort((a, b) => 
            new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
          )
        case 'created_at':
          return sorted.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        case 'progress':
          return sorted.sort((a, b) => b.progress_percentage - a.progress_percentage)
        case 'title':
          return sorted.sort((a, b) => a.title.localeCompare(b.title))
        default:
          return sorted
      }
    },
    []
  )

  // ============================================================================
  // Notification Methods (Memoized)
  // ============================================================================

  const getNotificationCounts = useMemo((): { urgent: number; overdue: number; total: number } => {
    return {
      urgent: getUrgentGoals.length,
      overdue: getOverdueGoals.length,
      total: getUrgentGoals.length + getOverdueGoals.length,
    }
  }, [getUrgentGoals, getOverdueGoals])

  // ============================================================================
  // Real-time Synchronization
  // ============================================================================

  const subscribeToGoals = useCallback(() => {
    if (!user?.uid) {
      console.warn('Cannot subscribe to goals: user not authenticated')
      return
    }

    try {
      const db = getDbInstance()
      const goalsRef = collection(db, 'goals')
      const q = query(
        goalsRef,
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      )

      const unsubscribeFn = onSnapshot(
        q,
        (snapshot) => {
          const goals = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Goal[]

          setGoalState((prev) => ({
            ...prev,
            goals,
            loading: false,
            connected: true,
            error: null,
          }))
        },
        (error) => {
          console.error('Real-time goals error:', error)
          setGoalState((prev) => ({
            ...prev,
            loading: false,
            connected: false,
            error: 'Failed to sync goals in real-time',
          }))
        }
      )

      setUnsubscribe(() => unsubscribeFn)
    } catch (error: any) {
      console.error('Failed to subscribe to goals:', error)
      setGoalState((prev) => ({
        ...prev,
        loading: false,
        connected: false,
        error: 'Failed to set up real-time sync',
      }))
    }
  }, [user?.uid])

  const unsubscribeFromGoals = useCallback(() => {
    if (unsubscribe) {
      unsubscribe()
      setUnsubscribe(null)
      setGoalState((prev) => ({ ...prev, connected: false }))
    }
  }, [unsubscribe])

  // ============================================================================
  // Effects
  // ============================================================================

  // Subscribe to goals when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      subscribeToGoals()
    } else {
      unsubscribeFromGoals()
      setGoalState({
        goals: [],
        loading: false,
        error: null,
        connected: false,
      })
    }

    // Cleanup on unmount
    return () => {
      unsubscribeFromGoals()
    }
  }, [isAuthenticated, user?.uid])

  // Memoize the context value to prevent unnecessary re-renders
  const value: GoalContextValue = useMemo(() => ({
    goals: goalState.goals,
    loading: goalState.loading,
    error: goalState.error,
    connected: goalState.connected,
    createGoal,
    updateGoal,
    deleteGoal,
    updateStatus,
    addMilestone,
    toggleMilestone,
    addProgress,
    filterGoals,
    getOverdueGoals: getOverdueGoalsFn,
    getUrgentGoals: getUrgentGoalsFn,
    sortGoals,
    getNotificationCounts: () => getNotificationCounts,
    subscribeToGoals,
    unsubscribeFromGoals,
  }), [
    goalState.goals,
    goalState.loading,
    goalState.error,
    goalState.connected,
    createGoal,
    updateGoal,
    deleteGoal,
    updateStatus,
    addMilestone,
    toggleMilestone,
    addProgress,
    filterGoals,
    getOverdueGoalsFn,
    getUrgentGoalsFn,
    sortGoals,
    getNotificationCounts,
    subscribeToGoals,
    unsubscribeFromGoals,
  ])

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>
}

export function useGoals() {
  const context = useContext(GoalContext)
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider')
  }
  return context
}
