/**
 * Coach Personalities Hook
 * 
 * Manages user's coach personalities for both text and voice AI coaching.
 * This is the unified system that replaces the separate prompts and voice coach personalities.
 */

'use client'

import { useState, useCallback } from 'react'
import { 
  apiClient, 
  CoachPersonality, 
  CreateCoachPersonalityData, 
  UpdateCoachPersonalityData 
} from '@/lib/api/client'

interface CoachPersonalitiesState {
  personalities: CoachPersonality[]
  loading: boolean
  error: string | null
}

export function useCoachPersonalities() {
  const [state, setState] = useState<CoachPersonalitiesState>({
    personalities: [],
    loading: false,
    error: null,
  })

  // Fetch all personalities
  const fetchPersonalities = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const personalities = await apiClient.getCoachPersonalities()
      setState({ personalities, loading: false, error: null })
      return personalities
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch coach personalities'
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Get a specific personality
  const getPersonality = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const personality = await apiClient.getCoachPersonality(id)
      setState((prev) => ({ ...prev, loading: false, error: null }))
      return personality
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch coach personality'
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Get default personality
  const getDefaultPersonality = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const personality = await apiClient.getDefaultCoachPersonality()
      setState((prev) => ({ ...prev, loading: false, error: null }))
      return personality
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch default coach personality'
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Create a new personality
  const createPersonality = useCallback(async (data: CreateCoachPersonalityData) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const newPersonality = await apiClient.createCoachPersonality(data)
      setState((prev) => ({
        personalities: [...prev.personalities, newPersonality],
        loading: false,
        error: null,
      }))
      return newPersonality
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create coach personality'
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Update an existing personality
  const updatePersonality = useCallback(
    async (id: string, data: UpdateCoachPersonalityData) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const updatedPersonality = await apiClient.updateCoachPersonality(id, data)
        setState((prev) => ({
          personalities: prev.personalities.map((p) => 
            p.id === id ? updatedPersonality : p
          ),
          loading: false,
          error: null,
        }))
        return updatedPersonality
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to update coach personality'
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
        throw error
      }
    },
    []
  )

  // Delete a personality
  const deletePersonality = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await apiClient.deleteCoachPersonality(id)
      setState((prev) => ({
        personalities: prev.personalities.filter((p) => p.id !== id),
        loading: false,
        error: null,
      }))
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete coach personality'
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Set a personality as default
  const setAsDefault = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const updatedPersonality = await apiClient.updateCoachPersonality(id, { 
        isDefault: true 
      })
      setState((prev) => ({
        personalities: prev.personalities.map((p) => ({
          ...p,
          isDefault: p.id === id,
        })),
        loading: false,
        error: null,
      }))
      return updatedPersonality
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to set default coach personality'
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Initialize default personalities for new users
  const initializePersonalities = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const personalities = await apiClient.initializeCoachPersonalities()
      setState({ personalities, loading: false, error: null })
      return personalities
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to initialize coach personalities'
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Generate ElevenLabs agent for a personality (if not already created)
  const generateAgent = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const updatedPersonality = await apiClient.generateCoachPersonalityAgent(id)
      setState((prev) => ({
        personalities: prev.personalities.map((p) => 
          p.id === id ? updatedPersonality : p
        ),
        loading: false,
        error: null,
      }))
      return updatedPersonality
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to generate ElevenLabs agent'
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  return {
    personalities: state.personalities,
    loading: state.loading,
    error: state.error,
    fetchPersonalities,
    getPersonality,
    getDefaultPersonality,
    createPersonality,
    updatePersonality,
    deletePersonality,
    setAsDefault,
    initializePersonalities,
    generateAgent,
  }
}

