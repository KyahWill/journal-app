'use client'

import { memo, useRef, useEffect, useState, useMemo } from 'react'
import { Goal } from '@/lib/api/client'
import { GoalCard } from './goal-card'
import { useMilestoneCounts } from '@/lib/hooks/useMilestoneCounts'

interface VirtualizedGoalListProps {
  goals: Goal[]
  viewMode: 'grid' | 'list'
}

// Simple virtualization for goal lists
// Only renders goals that are visible in the viewport
function VirtualizedGoalListComponent({ goals, viewMode }: VirtualizedGoalListProps) {
  // Fetch milestone counts for all goals
  const goalIds = useMemo(() => goals.map((g) => g.id), [goals])
  const { counts: milestoneCounts } = useMilestoneCounts(goalIds)
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })
  
  // Item height estimates
  const ITEM_HEIGHT = viewMode === 'grid' ? 300 : 200
  const BUFFER_SIZE = 5 // Number of items to render outside viewport

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const viewportHeight = window.innerHeight
      
      // Calculate which items should be visible
      const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE)
      const end = Math.min(
        goals.length,
        Math.ceil((scrollTop + viewportHeight) / ITEM_HEIGHT) + BUFFER_SIZE
      )
      
      setVisibleRange({ start, end })
    }

    // Initial calculation
    handleScroll()

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [goals.length, ITEM_HEIGHT])

  // For small lists, don't virtualize
  if (goals.length <= 20) {
    return (
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }
        role="list"
        aria-label={`${goals.length} goals`}
      >
        {goals.map((goal) => {
          const milestoneData = milestoneCounts[goal.id] || { total: 0, completed: 0 }
          return (
            <div key={goal.id} role="listitem">
              <GoalCard 
                goal={goal} 
                viewMode={viewMode}
                milestonesCompleted={milestoneData.completed}
                milestonesTotal={milestoneData.total}
              />
            </div>
          )
        })}
      </div>
    )
  }

  // For large lists, use virtualization
  const visibleGoals = goals.slice(visibleRange.start, visibleRange.end)
  const offsetTop = visibleRange.start * ITEM_HEIGHT
  const totalHeight = goals.length * ITEM_HEIGHT

  return (
    <div
      ref={containerRef}
      style={{ minHeight: totalHeight }}
      className="relative"
      role="list"
      aria-label={`${goals.length} goals`}
    >
      <div
        style={{
          transform: `translateY(${offsetTop}px)`,
        }}
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }
      >
        {visibleGoals.map((goal) => {
          const milestoneData = milestoneCounts[goal.id] || { total: 0, completed: 0 }
          return (
            <div key={goal.id} role="listitem">
              <GoalCard 
                goal={goal} 
                viewMode={viewMode}
                milestonesCompleted={milestoneData.completed}
                milestonesTotal={milestoneData.total}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const VirtualizedGoalList = memo(VirtualizedGoalListComponent, (prevProps, nextProps) => {
  // Only re-render if goals array reference changes or viewMode changes
  return prevProps.goals === nextProps.goals && prevProps.viewMode === nextProps.viewMode
})
