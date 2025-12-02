'use client'

import { useState } from 'react'
import { useGoals } from '@/lib/contexts/goal-context'
import { Goal, HabitFrequency } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Flame, Trash2, Loader2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface HabitItemProps {
  goal: Goal
}

export function HabitItem({ goal }: HabitItemProps) {
  const router = useRouter()
  const { toggleHabitCompletion, deleteGoal } = useGoals()
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const isCompletedToday = goal.habit_completed_dates?.includes(today) || false
  const streak = goal.habit_streak || 0

  const handleToggle = async () => {
    setIsToggling(true)
    try {
      await toggleHabitCompletion(goal.id)
    } catch (error) {
      console.error('Failed to toggle habit:', error)
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteGoal(goal.id)
    } catch (error) {
      console.error('Failed to delete habit:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getFrequencyLabel = (frequency?: HabitFrequency) => {
    switch (frequency) {
      case 'daily': return 'D'
      case 'weekly': return 'W'
      case 'monthly': return 'M'
      default: return 'D'
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card shadow-sm hover:shadow-md transition-all group",
        isCompletedToday && "bg-green-50/50 border-green-200"
      )}
    >
      {/* Checkbox */}
      <div className="flex items-center justify-center">
        {isToggling ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Checkbox
            checked={isCompletedToday}
            onCheckedChange={handleToggle}
            className="h-5 w-5 rounded-full"
            id={`habit-${goal.id}`}
          />
        )}
      </div>

      {/* Title */}
      <label
        htmlFor={`habit-${goal.id}`}
        className={cn(
          "flex-1 min-w-0 cursor-pointer select-none font-medium",
          isCompletedToday && "text-green-700"
        )}
      >
        {goal.title}
      </label>

      {/* Frequency badge */}
      <div className="text-xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
        {getFrequencyLabel(goal.habit_frequency)}
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-1 text-orange-500">
          <Flame className="h-4 w-4" />
          <span className="text-sm font-semibold tabular-nums">{streak}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          <span className="sr-only">Delete</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={() => router.push(`/app/goals/${goal.id}`)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="sr-only">View Details</span>
        </Button>
      </div>
    </div>
  )
}

