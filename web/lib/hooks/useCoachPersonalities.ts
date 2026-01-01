import { useState, useCallback } from 'react'
import { apiClient, CoachPersonality, CreateCoachPersonalityData, UpdateCoachPersonalityData } from '@/lib/api/client'

export function useCoachPersonalities() {
  const [personalities, setPersonalities] = useState<CoachPersonality[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPersonalities = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getCoachPersonalities()
      setPersonalities(data)
    } catch (err: any) {
      console.error('Failed to fetch coach personalities:', err)
      setError(err.message || 'Failed to load coach personalities')
    } finally {
      setLoading(false)
    }
  }, [])

  const createPersonality = useCallback(async (data: CreateCoachPersonalityData) => {
    setError(null)
    try {
      const newPersonality = await apiClient.createCoachPersonality(data)
      setPersonalities((prev) => [...prev, newPersonality])
      return newPersonality
    } catch (err: any) {
      console.error('Failed to create coach personality:', err)
      setError(err.message || 'Failed to create coach personality')
      throw err
    }
  }, [])

  const updatePersonality = useCallback(async (id: string, data: UpdateCoachPersonalityData) => {
    setError(null)
    try {
      const updatedPersonality = await apiClient.updateCoachPersonality(id, data)
      setPersonalities((prev) =>
        prev.map((p) => (p.id === id ? updatedPersonality : p))
      )
      return updatedPersonality
    } catch (err: any) {
      console.error('Failed to update coach personality:', err)
      setError(err.message || 'Failed to update coach personality')
      throw err
    }
  }, [])

  const deletePersonality = useCallback(async (id: string) => {
    setError(null)
    try {
      await apiClient.deleteCoachPersonality(id)
      setPersonalities((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      console.error('Failed to delete coach personality:', err)
      setError(err.message || 'Failed to delete coach personality')
      throw err
    }
  }, [])

  const setAsDefault = useCallback(async (id: string) => {
    setError(null)
    try {
      const updatedPersonality = await apiClient.setDefaultCoachPersonality(id)
      setPersonalities((prev) =>
        prev.map((p) => ({
          ...p,
          isDefault: p.id === id,
        }))
      )
      return updatedPersonality
    } catch (err: any) {
      console.error('Failed to set default coach personality:', err)
      setError(err.message || 'Failed to set default coach personality')
      throw err
    }
  }, [])

  return {
    personalities,
    loading,
    error,
    fetchPersonalities,
    createPersonality,
    updatePersonality,
    deletePersonality,
    setAsDefault,
  }
}

