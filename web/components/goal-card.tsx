'use client'

import { useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useGoals } from '@/lib/contexts/goal-context'
import { CustomCategory, Goal, GoalStatus } from '@/lib/api/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GoalProgressBar } from '@/components/goal-progress-bar'
import { GoalDeleteDialog } from '@/components/goal-delete-dialog'
import { CheckCircle2, Trash2, Calendar, Target, Loader2 } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface GoalCardProps {
  goal: Goal
  viewMode?: 'grid' | 'list'
  milestonesCompleted?: number
  milestonesTotal?: number
}

function GoalCardComponent({ goal, viewMode = 'grid', milestonesCompleted = 0, milestonesTotal = 0 }: GoalCardProps) {
  const router = useRouter()
  const { updateStatus, deleteGoal } = useGoals()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Calculate days remaining/overdue
  const targetDate = new Date(goal.target_date)
  const today = new Date()
  const daysRemaining = differenceInDays(targetDate, today)
  const isOverdue = daysRemaining < 0 && goal.status !== 'completed' && goal.status !== 'abandoned'
  const isUrgent = daysRemaining >= 0 && daysRemaining < 7 && goal.status !== 'completed' && goal.status !== 'abandoned'
  
  const nextMilestone = goal.milestones?.sort((a, b) => a.order - b.order).find(m => !m.completed)

  // Get urgency color
  const getUrgencyColor = () => {
    if (isOverdue) return 'text-red-600 bg-red-50 border-red-200'
    if (isUrgent) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (daysRemaining < 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  // Get status color
  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'abandoned':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get category color
  const getCategoryColor = (category: string | import('@/lib/api/client').CustomCategory) => {
    if (typeof category === 'string') {
      switch (category) {
        case 'career':
          return 'bg-purple-100 text-purple-800'
        case 'health':
          return 'bg-green-100 text-green-800'
        case 'personal':
          return 'bg-blue-100 text-blue-800'
        case 'financial':
          return 'bg-yellow-100 text-yellow-800'
        case 'relationships':
          return 'bg-pink-100 text-pink-800'
        case 'learning':
          return 'bg-indigo-100 text-indigo-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    } else {
      // Custom category with color
      const getDynamicColors = (hex: string) => {
        hex = hex.replace('#', '')
        if (hex.length === 3) {
          hex = hex.split('').map(char => char + char).join('')
        }
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
        return yiq >= 128 ? 'text-black' : 'text-white'
      }
      const textColor = getDynamicColors(category.color || 'ffffff')
      return `${textColor}`
    }
  }

  // Format status text
  const formatStatus = (status: GoalStatus) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  // Format category text
  const formatCategory = (category: string | CustomCategory) => {
    if (typeof category === 'string') {
      return category.charAt(0).toUpperCase() + category.slice(1)
    } else {
      return category.name
    }
  }

  // Handle complete goal
  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (goal.status === 'completed') return

    try {
      setIsUpdatingStatus(true)
      await updateStatus(goal.id, 'completed')
    } catch (error) {
      console.error('Failed to complete goal:', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle delete goal
  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setDeleteError(null)
      await deleteGoal(goal.id)
      setShowDeleteDialog(false)
      // Goal will be removed from UI via real-time sync or optimistic update
    } catch (error: any) {
      console.error('Failed to delete goal:', error)
      setDeleteError(error.message || 'Failed to delete goal. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle card click
  const handleCardClick = () => {
    router.push(`/app/goals/${goal.id}`)
  }

  const cardContent = (
    <>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg mb-2 break-words line-clamp-2">{goal.title}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge 
                className={getCategoryColor(goal.category)}
                style={typeof goal.category !== 'string' ? { backgroundColor: goal.category.color } : undefined}
              >
                {formatCategory(goal.category)}
              </Badge>
              <Badge className={getStatusColor(goal.status)}>
                {formatStatus(goal.status)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
        {/* Progress Bar */}
        <GoalProgressBar
          progress={goal.progress_percentage}
          milestonesCompleted={milestonesCompleted}
          milestonesTotal={milestonesTotal}
          size="md"
        />

        {/* Next Milestone */}
        {nextMilestone && (
          <div className="text-sm bg-secondary/50 p-2 rounded-md border border-border/50">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block mb-1 tracking-wider">Next Step</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="truncate font-medium text-foreground/90">{nextMilestone.title}</span>
            </div>
          </div>
        )}

        {/* Target Date */}
        <div className={cn('flex items-center gap-2 text-sm p-2 rounded-md border', getUrgencyColor())}>
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium">
              {format(targetDate, 'MMM d, yyyy')}
            </div>
            <div className="text-xs">
              {isOverdue
                ? `${Math.abs(daysRemaining)} days overdue`
                : daysRemaining === 0
                ? 'Due today'
                : daysRemaining === 1
                ? '1 day remaining'
                : `${daysRemaining} days remaining`}
            </div>
          </div>
        </div>

        {/* Milestone Count */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Target className="h-4 w-4" />
          <span>Milestones: {milestonesCompleted} / {milestonesTotal}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleComplete}
            disabled={isUpdatingStatus || goal.status === 'completed'}
            className="flex-1"
            aria-label={goal.status === 'completed' ? 'Goal completed' : `Mark goal "${goal.title}" as complete`}
          >
            {isUpdatingStatus ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">{goal.status === 'completed' ? 'Completed' : 'Complete'}</span>
            <span className="sm:hidden">{goal.status === 'completed' ? 'Done' : 'Done'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setShowDeleteDialog(true)
            }}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3"
            aria-label={`Delete goal "${goal.title}"`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </>
  )

  return (
    <>
      <Card
        className={cn(
          'cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary',
          viewMode === 'list' && 'flex flex-col sm:flex-row',
          isOverdue && 'border-red-300 bg-red-50/30'
        )}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCardClick()
          }
        }}
        tabIndex={0}
        role="article"
        aria-label={`Goal: ${goal.title}. Status: ${formatStatus(goal.status)}. Progress: ${goal.progress_percentage}%`}
      >
        {cardContent}
      </Card>

      {/* Delete Confirmation Dialog */}
      <GoalDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        goalId={goal.id}
        goalTitle={goal.title}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        deleteError={deleteError}
      />
    </>
  )
}

// Memoize the component to prevent unnecessary re-renders
// Only re-render if goal data or viewMode changes
export const GoalCard = memo(GoalCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.goal.id === nextProps.goal.id &&
    prevProps.goal.title === nextProps.goal.title &&
    prevProps.goal.status === nextProps.goal.status &&
    prevProps.goal.progress_percentage === nextProps.goal.progress_percentage &&
    prevProps.goal.target_date === nextProps.goal.target_date &&
    prevProps.goal.updated_at === nextProps.goal.updated_at &&
    JSON.stringify(prevProps.goal.milestones) === JSON.stringify(nextProps.goal.milestones) &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.milestonesCompleted === nextProps.milestonesCompleted &&
    prevProps.milestonesTotal === nextProps.milestonesTotal
  )
})
