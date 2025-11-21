/**
 * Prompts Hook
 * 
 * Manages user's custom prompts for AI chat
 */

'use client'

import { useState, useCallback } from 'react'
import { apiClient, UserPrompt } from '@/lib/api/client'

interface PromptsState {
  prompts: UserPrompt[]
  loading: boolean
  error: string | null
}

export function usePrompts() {
  const [state, setState] = useState<PromptsState>({
    prompts: [],
    loading: false,
    error: null,
  })

  // Fetch all prompts
  const fetchPrompts = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const prompts = await apiClient.getUserPrompts()
      setState({ prompts, loading: false, error: null })
      return prompts
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch prompts'
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Get a specific prompt
  const getPrompt = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const prompt = await apiClient.getPrompt(id)
      setState((prev) => ({ ...prev, loading: false, error: null }))
      return prompt
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch prompt'
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Get default prompt
  const getDefaultPrompt = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const prompt = await apiClient.getDefaultPrompt()
      setState((prev) => ({ ...prev, loading: false, error: null }))
      return prompt
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch default prompt'
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Create a new prompt
  const createPrompt = useCallback(
    async (data: { name: string; prompt_text: string; is_default?: boolean }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const newPrompt = await apiClient.createPrompt(data)
        setState((prev) => ({
          prompts: [...prev.prompts, newPrompt],
          loading: false,
          error: null,
        }))
        return newPrompt
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to create prompt'
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
        throw error
      }
    },
    []
  )

  // Update an existing prompt
  const updatePrompt = useCallback(
    async (
      id: string,
      data: { name?: string; prompt_text?: string; is_default?: boolean }
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const updatedPrompt = await apiClient.updatePrompt(id, data)
        setState((prev) => ({
          prompts: prev.prompts.map((p) => (p.id === id ? updatedPrompt : p)),
          loading: false,
          error: null,
        }))
        return updatedPrompt
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to update prompt'
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
        throw error
      }
    },
    []
  )

  // Delete a prompt
  const deletePrompt = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await apiClient.deletePrompt(id)
      setState((prev) => ({
        prompts: prev.prompts.filter((p) => p.id !== id),
        loading: false,
        error: null,
      }))
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete prompt'
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  // Set a prompt as default
  const setAsDefault = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const updatedPrompt = await apiClient.setDefaultPrompt(id)
        setState((prev) => ({
          prompts: prev.prompts.map((p) => ({
            ...p,
            is_default: p.id === id,
          })),
          loading: false,
          error: null,
        }))
        return updatedPrompt
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to set default prompt'
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
        throw error
      }
    },
    []
  )

  // Get AI suggestions for improving a prompt
  const getImprovements = useCallback(async (promptText: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await apiClient.getPromptImprovements(promptText)
      setState((prev) => ({ ...prev, loading: false, error: null }))
      return result.suggestions
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get improvements'
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  return {
    prompts: state.prompts,
    loading: state.loading,
    error: state.error,
    fetchPrompts,
    getPrompt,
    getDefaultPrompt,
    createPrompt,
    updatePrompt,
    deletePrompt,
    setAsDefault,
    getImprovements,
  }
}

