import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'

interface MilestoneCount {
  total: number
  completed: number
}

interface MilestoneCounts {
  [goalId: string]: MilestoneCount
}

/**
 * Hook to fetch and cache milestone counts for multiple goals
 * Returns a map of goalId -> { total, completed }
 */
export function useMilestoneCounts(goalIds: string[]) {
  const [counts, setCounts] = useState<MilestoneCounts>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (goalIds.length === 0) {
      setCounts({})
      return
    }

    let isMounted = true
    const fetchCounts = async () => {
      setLoading(true)
      const newCounts: MilestoneCounts = {}

      // Fetch milestones for each goal in parallel
      const promises = goalIds.map(async (goalId) => {
        try {
          const milestones = await apiClient.getMilestones(goalId)
          const completed = milestones.filter((m) => m.completed).length
          return { goalId, total: milestones.length, completed }
        } catch (error) {
          console.error(`Failed to fetch milestones for goal ${goalId}:`, error)
          return { goalId, total: 0, completed: 0 }
        }
      })

      const results = await Promise.all(promises)
      
      if (isMounted) {
        results.forEach(({ goalId, total, completed }) => {
          newCounts[goalId] = { total, completed }
        })
        setCounts(newCounts)
        setLoading(false)
      }
    }

    fetchCounts()

    return () => {
      isMounted = false
    }
  }, [goalIds.join(',')])

  return { counts, loading }
}
