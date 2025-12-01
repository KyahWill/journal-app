import { useState, useEffect } from 'react'
import { apiClient, Goal } from '@/lib/api/client'

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
export function useMilestoneCounts(goals: Goal[]) {
  const [counts, setCounts] = useState<MilestoneCounts>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (goals.length === 0) {
      setCounts({})
      return
    }

    let isMounted = true
    const fetchCounts = async () => {
      setLoading(true)
      const newCounts: MilestoneCounts = {}


      // Fetch Milestones
      const results = goals.map((goal) => {
        const milestones = goal.milestones || [] 
        const completed = milestones.filter((m) => m.completed).length
        return { goalId: goal.id, total: milestones.length, completed }
      })

      
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
  }, [goals])

  return { counts, loading }
}
