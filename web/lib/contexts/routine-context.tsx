'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react'
import { apiClient, Routine, CreateRoutineData, UpdateRoutineData } from '@/lib/api/client'
import { useAuth } from './auth-context'

interface RoutineState {
  routines: Routine[]
  loading: boolean
  error: string | null
}

export interface RoutineContextValue extends RoutineState {
  // Routine CRUD operations
  createRoutine: (data: CreateRoutineData) => Promise<Routine>
  updateRoutine: (id: string, data: UpdateRoutineData) => Promise<Routine>
  deleteRoutine: (id: string) => Promise<void>
  
  // Step operations
  toggleStep: (routineId: string, stepId: string) => Promise<Routine>
  completeRoutine: (id: string) => Promise<Routine>
  resetSteps: (id: string) => Promise<Routine>
  
  // Filtering and utility methods
  getRoutinesByGroup: (group: string | null) => Routine[]
  getGroups: () => string[]
  getRoutinesByFrequency: (frequency: string) => Routine[]
  
  // Refresh data
  refreshRoutines: () => Promise<void>
}

const RoutineContext = createContext<RoutineContextValue | undefined>(undefined)

export function RoutineProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [routineState, setRoutineState] = useState<RoutineState>({
    routines: [],
    loading: true,
    error: null,
  })

  // ============================================================================
  // Routine CRUD Operations with Optimistic Updates
  // ============================================================================

  const createRoutine = useCallback(async (data: CreateRoutineData): Promise<Routine> => {
    try {
      setRoutineState((prev) => ({ ...prev, error: null }))
      
      const newRoutine = await apiClient.createRoutine(data)
      
      // Optimistically add to state
      setRoutineState((prev) => ({
        ...prev,
        routines: [newRoutine, ...prev.routines],
      }))
      
      return newRoutine
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create routine'
      setRoutineState((prev) => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  const updateRoutine = useCallback(async (id: string, data: UpdateRoutineData): Promise<Routine> => {
    try {
      setRoutineState((prev) => ({ ...prev, error: null }))
      
      // Store previous state for rollback
      const previousRoutines = routineState.routines
      
      // Optimistic update
      setRoutineState((prev) => ({
        ...prev,
        routines: prev.routines.map((r) => {
          if (r.id === id) {
            // Handle steps transformation if included in update
            const updatedSteps = data.steps
              ? data.steps.map((s, idx) => ({
                  id: `temp-${Date.now()}-${idx}`,
                  title: s.title,
                  order: s.order,
                  completed: false,
                }))
              : r.steps

            return {
              ...r,
              ...data,
              steps: updatedSteps,
              updated_at: new Date().toISOString(),
            }
          }
          return r
        }),
      }))
      
      try {
        const updatedRoutine = await apiClient.updateRoutine(id, data)
        
        // Update with server response
        setRoutineState((prev) => ({
          ...prev,
          routines: prev.routines.map((r) => (r.id === id ? updatedRoutine : r)),
        }))
        
        return updatedRoutine
      } catch (error) {
        // Rollback on error
        setRoutineState((prev) => ({ ...prev, routines: previousRoutines }))
        throw error
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update routine'
      setRoutineState((prev) => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [routineState.routines])

  const deleteRoutine = useCallback(async (id: string): Promise<void> => {
    try {
      setRoutineState((prev) => ({ ...prev, error: null }))
      
      // Store previous state for rollback
      const previousRoutines = routineState.routines
      
      // Optimistic update
      setRoutineState((prev) => ({
        ...prev,
        routines: prev.routines.filter((r) => r.id !== id),
      }))
      
      try {
        await apiClient.deleteRoutine(id)
      } catch (error) {
        // Rollback on error
        setRoutineState((prev) => ({ ...prev, routines: previousRoutines }))
        throw error
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete routine'
      setRoutineState((prev) => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [routineState.routines])

  // ============================================================================
  // Step Operations
  // ============================================================================

  const toggleStep = useCallback(async (routineId: string, stepId: string): Promise<Routine> => {
    try {
      setRoutineState((prev) => ({ ...prev, error: null }))
      
      // Store previous state for rollback
      const previousRoutines = routineState.routines
      
      // Optimistic update
      setRoutineState((prev) => ({
        ...prev,
        routines: prev.routines.map((r) => {
          if (r.id === routineId) {
            return {
              ...r,
              steps: r.steps.map((s) =>
                s.id === stepId ? { ...s, completed: !s.completed } : s
              ),
            }
          }
          return r
        }),
      }))
      
      try {
        const updatedRoutine = await apiClient.toggleRoutineStep(routineId, stepId)
        
        // Update with server response
        setRoutineState((prev) => ({
          ...prev,
          routines: prev.routines.map((r) => (r.id === routineId ? updatedRoutine : r)),
        }))
        
        return updatedRoutine
      } catch (error) {
        // Rollback on error
        setRoutineState((prev) => ({ ...prev, routines: previousRoutines }))
        throw error
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to toggle step'
      setRoutineState((prev) => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [routineState.routines])

  const completeRoutine = useCallback(async (id: string): Promise<Routine> => {
    try {
      setRoutineState((prev) => ({ ...prev, error: null }))
      
      const updatedRoutine = await apiClient.completeRoutine(id)
      
      setRoutineState((prev) => ({
        ...prev,
        routines: prev.routines.map((r) => (r.id === id ? updatedRoutine : r)),
      }))
      
      return updatedRoutine
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to complete routine'
      setRoutineState((prev) => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  const resetSteps = useCallback(async (id: string): Promise<Routine> => {
    try {
      setRoutineState((prev) => ({ ...prev, error: null }))
      
      const updatedRoutine = await apiClient.resetRoutineSteps(id)
      
      setRoutineState((prev) => ({
        ...prev,
        routines: prev.routines.map((r) => (r.id === id ? updatedRoutine : r)),
      }))
      
      return updatedRoutine
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reset steps'
      setRoutineState((prev) => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // ============================================================================
  // Filtering and Utility Methods
  // ============================================================================

  const getRoutinesByGroup = useCallback((group: string | null) => {
    return routineState.routines.filter((r) => r.group === group)
  }, [routineState.routines])

  const getGroups = useCallback(() => {
    const groups = new Set<string>()
    routineState.routines.forEach((r) => {
      if (r.group) {
        groups.add(r.group)
      }
    })
    return Array.from(groups).sort()
  }, [routineState.routines])

  const getRoutinesByFrequency = useCallback((frequency: string) => {
    return routineState.routines.filter((r) => r.frequency === frequency)
  }, [routineState.routines])

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const refreshRoutines = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setRoutineState((prev) => ({ ...prev, loading: true, error: null }))
      const routines = await apiClient.getRoutines()
      setRoutineState({
        routines,
        loading: false,
        error: null,
      })
    } catch (error: any) {
      console.error('Error fetching routines:', error)
      setRoutineState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch routines',
      }))
    }
  }, [isAuthenticated])

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      refreshRoutines()
    } else {
      setRoutineState({
        routines: [],
        loading: false,
        error: null,
      })
    }
  }, [isAuthenticated, refreshRoutines])

  const value: RoutineContextValue = {
    ...routineState,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    toggleStep,
    completeRoutine,
    resetSteps,
    getRoutinesByGroup,
    getGroups,
    getRoutinesByFrequency,
    refreshRoutines,
  }

  return <RoutineContext.Provider value={value}>{children}</RoutineContext.Provider>
}

export function useRoutines() {
  const context = useContext(RoutineContext)
  if (context === undefined) {
    throw new Error('useRoutines must be used within a RoutineProvider')
  }
  return context
}
