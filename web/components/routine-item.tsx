'use client'

import { useState } from 'react'
import { useRoutines } from '@/lib/contexts/routine-context'
import { Routine } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Flame, 
  Trash2, 
  Loader2, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  RotateCcw,
  Edit
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoutineItemProps {
  routine: Routine
  onEdit?: () => void
}

export function RoutineItem({ routine, onEdit }: RoutineItemProps) {
  const { toggleStep, completeRoutine, resetSteps, deleteRoutine } = useRoutines()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const completedSteps = routine.steps.filter(s => s.completed).length
  const totalSteps = routine.steps.length
  const allCompleted = completedSteps === totalSteps && totalSteps > 0
  const today = new Date().toISOString().split('T')[0]
  const isCompletedToday = routine.completed_dates.includes(today)

  const handleToggleStep = async (stepId: string) => {
    setIsToggling(true)
    try {
      await toggleStep(routine.id, stepId)
    } catch (error) {
      console.error('Failed to toggle step:', error)
    } finally {
      setIsToggling(false)
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await completeRoutine(routine.id)
    } catch (error) {
      console.error('Failed to complete routine:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await resetSteps(routine.id)
    } catch (error) {
      console.error('Failed to reset steps:', error)
    } finally {
      setIsResetting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${routine.title}"?`)) {
      return
    }
    
    setIsDeleting(true)
    try {
      await deleteRoutine(routine.id)
    } catch (error) {
      console.error('Failed to delete routine:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'monthly': return 'Monthly'
      default: return frequency
    }
  }

  return (
    <div
      className={cn(
        "border rounded-lg bg-card hover:shadow-md transition-all",
        isCompletedToday && "bg-green-50/50 border-green-200"
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 flex-1 text-left group"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-medium group-hover:text-primary transition-colors",
                isCompletedToday && "text-green-700"
              )}>
                {routine.title}
              </h3>
              {routine.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {routine.description}
                </p>
              )}
            </div>
          </button>

          {/* Badges and Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Frequency badge */}
            <span className="text-xs px-2 py-1 bg-muted rounded font-medium">
              {getFrequencyLabel(routine.frequency)}
            </span>

            {/* Streak */}
            {routine.streak > 0 && (
              <div className="flex items-center gap-1 text-orange-500 px-2 py-1 bg-orange-50 rounded">
                <Flame className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold tabular-nums">{routine.streak}</span>
              </div>
            )}

            {/* Edit button */}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onEdit}
              >
                <Edit className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Button>
            )}

            {/* Delete button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                isCompletedToday ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums font-medium">
            {completedSteps}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Expanded Steps */}
      {isExpanded && (
        <div className="border-t px-4 py-3 space-y-3">
          {/* Steps */}
          <div className="space-y-2">
            {routine.steps
              .sort((a, b) => a.order - b.order)
              .map((step) => (
                <div key={step.id} className="flex items-center gap-3 group">
                  {isToggling ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
                  ) : (
                    <Checkbox
                      checked={step.completed}
                      onCheckedChange={() => handleToggleStep(step.id)}
                      className="h-4 w-4"
                      id={`step-${step.id}`}
                    />
                  )}
                  <label
                    htmlFor={`step-${step.id}`}
                    className={cn(
                      "flex-1 text-sm cursor-pointer select-none",
                      step.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </label>
                </div>
              ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {!isCompletedToday && allCompleted && (
              <Button
                size="sm"
                onClick={handleComplete}
                disabled={isCompleting}
                className="flex-1"
              >
                {isCompleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                )}
                Mark Complete
              </Button>
            )}
            {completedSteps > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isResetting}
                className={cn(isCompletedToday || !allCompleted ? "flex-1" : "")}
              >
                {isResetting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5 mr-2" />
                )}
                Reset
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
