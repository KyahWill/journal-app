/**
 * Journal Hook
 * 
 * Manages journal entries with the backend API and supports pagination.
 * Data is fetched once and can be displayed in different views (list or grouped).
 */

'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { apiClient, JournalEntry } from '@/lib/api/client'
import { useAuth } from './useAuth'

const DEFAULT_PAGE_SIZE = 10

interface JournalState {
  entries: JournalEntry[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  nextCursor: string | null
  hasMore: boolean
}

export function useJournal() {
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState<JournalState>({
    entries: [],
    loading: false,
    loadingMore: false,
    error: null,
    nextCursor: null,
    hasMore: true,
  })

  // Compute grouped entries from the flat entries list
  const groupedEntries = useMemo(() => {
    const grouped: Record<string, JournalEntry[]> = {}
    
    state.entries.forEach((entry) => {
      const dateKey = new Date(entry.created_at).toISOString().split('T')[0]
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(entry)
    })

    // Sort entries within each date group by created_at (most recent first)
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    })

    return grouped
  }, [state.entries])

  // Fetch journal entries - can be initial or load more based on cursor param
  const fetchEntries = useCallback(async (cursor?: string | null, pageSize: number = DEFAULT_PAGE_SIZE) => {
    if (!isAuthenticated) return

    // Set appropriate loading state
    if (cursor) {
      setState((prev) => ({ ...prev, loadingMore: true, error: null }))
    } else {
      setState((prev) => ({ ...prev, loading: true, error: null }))
    }

    try {
      const response = await apiClient.getJournalEntries(pageSize, cursor || undefined)
      
      setState((prev) => {
        // If cursor was provided, append entries; otherwise replace
        const newEntries = cursor 
          ? [...prev.entries, ...response.entries]
          : response.entries
        
        return {
          ...prev,
          entries: newEntries,
          nextCursor: response.nextCursor,
          hasMore: response.nextCursor !== null,
          loading: false,
          loadingMore: false,
          error: null,
        }
      })
      
      return response.nextCursor
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: error.message || 'Failed to fetch entries',
      }))
      return null
    }
  }, [isAuthenticated])

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
          ...prev,
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
          ...prev,
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
        ...prev,
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

  // Search entries (resets pagination, shows all matching results)
  const searchEntries = useCallback(async (query: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const results = await apiClient.searchJournalEntries(query)
      setState((prev) => ({
        ...prev,
        entries: results,
        hasMore: false,
        nextCursor: null,
        loading: false,
        error: null,
      }))
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
    // Data
    entries: state.entries,
    groupedEntries,
    
    // Loading states
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    
    // Pagination
    hasMore: state.hasMore,
    nextCursor: state.nextCursor,
    
    // Actions
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    searchEntries,
    getEntry,
  }
}
