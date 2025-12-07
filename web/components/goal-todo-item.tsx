'use client'

import { useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useGoals } from '@/lib/contexts/goal-context'
import { Goal, GoalStatus, CustomCategory } from '@/lib/api/client'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Trash2, Loader2, Calendar } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface GoalTodoItemProps {
  goal: Goal
  onDelete?: () => void
}

function GoalTodoItemComponent({ goal, onDelete }: GoalTodoItemProps) {
  const router = useRouter()
  const { updateStatus, deleteGoal } = useGoals()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const targetDate = new Date(goal.target_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)
  const daysRemaining = differenceInDays(targetDate, today)
  const isOverdue = daysRemaining < 0 && goal.status !== 'completed' && goal.status !== 'abandoned'
  const isCompleted = goal.status === 'completed'

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setIsUpdating(true)
      if (isCompleted) {
        await updateStatus(goal.id, 'in_progress')
      } else {
        await updateStatus(goal.id, 'completed')
      }
    } catch (error) {
      console.error('Failed to update goal status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setIsDeleting(true)
      await deleteGoal(goal.id)
      onDelete?.()
    } catch (error) {
      console.error('Failed to delete goal:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClick = () => {
    router.push(`/app/goals/${goal.id}`)
  }

  const getCategoryName = (category: string | CustomCategory) => {
    if (typeof category === 'string') {
      return category.charAt(0).toUpperCase() + category.slice(1)
    }
    return category.name
  }

  const getDateLabel = () => {
    
    if (isCompleted) return null
    if (isOverdue) return `${Math.abs(daysRemaining)} days overdue`
    if (daysRemaining === 0) return 'Today'
    if (daysRemaining === 1) return 'Tomorrow'
    if (daysRemaining < 7) return `${daysRemaining}d`
    return format(targetDate, 'MMM d')
  }

  const dateLabel = getDateLabel()

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg border bg-card cursor-pointer transition-all duration-200",
        "hover:bg-accent/50 hover:border-primary/20",
        isOverdue && "border-red-200 bg-red-50/50",
        isCompleted && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <div 
        onClick={handleToggleComplete}
        className="flex-shrink-0"
      >
        {isUpdating ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Checkbox
            checked={isCompleted}
            className={cn(
              "h-5 w-5 rounded-full border-2",
              isCompleted && "bg-green-500 border-green-500"
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium text-sm truncate",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {goal.title}
          </span>
        </div>
        
        {/* Progress bar */}
        {goal.progress_percentage > 0 && !isCompleted && (
          <div className="mt-1.5 h-1 w-full max-w-[120px] bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${goal.progress_percentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {dateLabel && (
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded",
            isOverdue ? "text-red-600 bg-red-100" : "text-muted-foreground"
          )}>
            {dateLabel}
          </span>
        )}
        
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 hidden sm:flex">
          {getCategoryName(goal.category)}
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>

        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

export const GoalTodoItem = memo(GoalTodoItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.goal.id === nextProps.goal.id &&
    prevProps.goal.title === nextProps.goal.title &&
    prevProps.goal.status === nextProps.goal.status &&
    prevProps.goal.progress_percentage === nextProps.goal.progress_percentage &&
    prevProps.goal.target_date === nextProps.goal.target_date
  )
})

