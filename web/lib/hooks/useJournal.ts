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
  groupedEntries: Record<string, JournalEntry[]>
  loading: boolean
  error: string | null
}

export function useJournal() {
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState<JournalState>({
    entries: [],
    groupedEntries: {},
    loading: false,
    error: null,
  })

  // Fetch all journal entries
  const fetchEntries = useCallback(async () => {
    if (!isAuthenticated) return

    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const entries = await apiClient.getJournalEntries()
      setState((prev) => ({ ...prev, entries, loading: false, error: null }))
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
        setState((prev) => {
          // Add to entries array
          const updatedEntries = [newEntry, ...prev.entries]
          
          // Add to grouped entries
          const dateKey = new Date(newEntry.created_at).toISOString().split('T')[0]
          const updatedGroupedEntries = { ...prev.groupedEntries }
          
          if (!updatedGroupedEntries[dateKey]) {
            updatedGroupedEntries[dateKey] = []
          }
          updatedGroupedEntries[dateKey] = [newEntry, ...updatedGroupedEntries[dateKey]]
          
          return {
            entries: updatedEntries,
            groupedEntries: updatedGroupedEntries,
            loading: false,
            error: null,
          }
        })
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
        setState((prev) => {
          // Update in entries array
          const updatedEntries = prev.entries.map((entry) =>
            entry.id === id ? updatedEntry : entry
          )
          
          // Update in grouped entries
          const updatedGroupedEntries = { ...prev.groupedEntries }
          Object.keys(updatedGroupedEntries).forEach(date => {
            updatedGroupedEntries[date] = updatedGroupedEntries[date].map(entry =>
              entry.id === id ? updatedEntry : entry
            )
          })
          
          return {
            entries: updatedEntries,
            groupedEntries: updatedGroupedEntries,
            loading: false,
            error: null,
          }
        })
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
      setState((prev) => {
        // Remove from entries array
        const updatedEntries = prev.entries.filter((entry) => entry.id !== id)
        
        // Remove from grouped entries
        const updatedGroupedEntries = { ...prev.groupedEntries }
        Object.keys(updatedGroupedEntries).forEach(date => {
          updatedGroupedEntries[date] = updatedGroupedEntries[date].filter(entry => entry.id !== id)
          // Remove date group if empty
          if (updatedGroupedEntries[date].length === 0) {
            delete updatedGroupedEntries[date]
          }
        })
        
        return {
          entries: updatedEntries,
          groupedEntries: updatedGroupedEntries,
          loading: false,
          error: null,
        }
      })
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
      setState((prev) => ({ ...prev, entries: results, loading: false, error: null }))
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

  // Fetch grouped entries
  const fetchGroupedEntries = useCallback(async () => {
    if (!isAuthenticated) return

    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const groupedEntries = await apiClient.getGroupedJournalEntries()
      setState((prev) => ({ ...prev, groupedEntries, loading: false, error: null }))
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch grouped entries',
      }))
    }
  }, [isAuthenticated])

  return {
    entries: state.entries,
    groupedEntries: state.groupedEntries,
    loading: state.loading,
    error: state.error,
    fetchEntries,
    fetchGroupedEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    searchEntries,
    getEntry,
  }
}

