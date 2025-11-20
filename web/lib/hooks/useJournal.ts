/**
 * Journal Hook
 * 
 * Manages journal entries with the backend API
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { apiClient, JournalEntry } from '@/lib/api/client'
import { useAuth } from './useAuth'

interface JournalState {
  entries: JournalEntry[]
  loading: boolean
  error: string | null
}

export function useJournal() {
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState<JournalState>({
    entries: [],
    loading: false,
    error: null,
  })

  // Fetch all journal entries
  const fetchEntries = useCallback(async () => {
    if (!isAuthenticated) return

    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const entries = await apiClient.getJournalEntries()
      setState({ entries, loading: false, error: null })
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch entries',
      }))
    }
  }, [isAuthenticated])

  // Fetch entries on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchEntries()
    }
  }, [isAuthenticated, fetchEntries])

  // Create a new entry
  const createEntry = useCallback(
    async (data: {
      title: string
      content: string
      mood?: string
      tags?: string[]
    }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const newEntry = await apiClient.createJournalEntry(data)
        setState((prev) => ({
          entries: [newEntry, ...prev.entries],
          loading: false,
          error: null,
        }))
        return newEntry
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to create entry',
        }))
        throw error
      }
    },
    []
  )

  // Update an entry
  const updateEntry = useCallback(
    async (
      id: string,
      data: {
        title?: string
        content?: string
        mood?: string
        tags?: string[]
      }
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const updatedEntry = await apiClient.updateJournalEntry(id, data)
        setState((prev) => ({
          entries: prev.entries.map((entry) =>
            entry.id === id ? updatedEntry : entry
          ),
          loading: false,
          error: null,
        }))
        return updatedEntry
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to update entry',
        }))
        throw error
      }
    },
    []
  )

  // Delete an entry
  const deleteEntry = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await apiClient.deleteJournalEntry(id)
      setState((prev) => ({
        entries: prev.entries.filter((entry) => entry.id !== id),
        loading: false,
        error: null,
      }))
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to delete entry',
      }))
      throw error
    }
  }, [])

  // Search entries
  const searchEntries = useCallback(async (query: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const results = await apiClient.searchJournalEntries(query)
      setState({ entries: results, loading: false, error: null })
      return results
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to search entries',
      }))
      throw error
    }
  }, [])

  // Get a single entry
  const getEntry = useCallback(async (id: string) => {
    try {
      return await apiClient.getJournalEntry(id)
    } catch (error: any) {
      throw error
    }
  }, [])

  return {
    entries: state.entries,
    loading: state.loading,
    error: state.error,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    searchEntries,
    getEntry,
  }
}

