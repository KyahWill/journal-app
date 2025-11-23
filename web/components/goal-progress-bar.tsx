'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface GoalProgressBarProps {
  progress: number
  milestonesCompleted?: number
  milestonesTotal?: number
  className?: string
  showPercentage?: boolean
  showMilestones?: boolean
  size?: 'sm' | 'md' | 'lg'
}

function GoalProgressBarComponent({
  progress,
  milestonesCompleted = 0,
  milestonesTotal = 0,
  className,
  showPercentage = true,
  showMilestones = true,
  size = 'md',
}: GoalProgressBarProps) {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100)

  // Get color based on progress level
  const getProgressColor = () => {
    if (normalizedProgress === 0) return 'bg-gray-300'
    if (normalizedProgress < 25) return 'bg-red-500'
    if (normalizedProgress < 50) return 'bg-orange-500'
    if (normalizedProgress < 75) return 'bg-yellow-500'
    if (normalizedProgress < 100) return 'bg-blue-500'
    return 'bg-green-500'
  }

  // Get height based on size
  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 'h-1.5'
      case 'md':
        return 'h-2.5'
      case 'lg':
        return 'h-4'
      default:
        return 'h-2.5'
    }
  }

  // Build tooltip content
  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-semibold">{normalizedProgress}% Complete</div>
      {showMilestones && milestonesTotal > 0 && (
        <div className="text-xs">
          {milestonesCompleted} of {milestonesTotal} milestones completed
        </div>
      )}
      {normalizedProgress === 0 && <div className="text-xs">Not started yet</div>}
      {normalizedProgress > 0 && normalizedProgress < 100 && (
        <div className="text-xs">Keep going!</div>
      )}
      {normalizedProgress === 100 && <div className="text-xs">Goal completed! 🎉</div>}
    </div>
  )

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header with percentage and milestone count */}
      {(showPercentage || showMilestones) && (
        <div className="flex justify-between items-center text-sm">
          {showPercentage && (
            <span className="text-gray-600 font-medium">Progress</span>
          )}
          <div className="flex items-center gap-3">
            {showPercentage && (
              <span className="font-semibold">{normalizedProgress}%</span>
            )}
            {showMilestones && milestonesTotal > 0 && (
              <span className="text-xs text-gray-500">
                {milestonesCompleted}/{milestonesTotal} milestones
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress bar with tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'relative w-full overflow-hidden rounded-full bg-gray-200 cursor-pointer transition-all hover:bg-gray-300',
                getHeight()
              )}
            >
              <div
                className={cn(
                  'h-full transition-all duration-500 ease-out rounded-full',
                  getProgressColor()
                )}
                style={{ width: `${normalizedProgress}%` }}
                role="progressbar"
                aria-valuenow={normalizedProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Goal progress: ${normalizedProgress}%`}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

// Memoize to prevent unnecessary re-renders
export const GoalProgressBar = memo(GoalProgressBarComponent, (prevProps, nextProps) => {
  return (
    prevProps.progress === nextProps.progress &&
    prevProps.milestonesCompleted === nextProps.milestonesCompleted &&
    prevProps.milestonesTotal === nextProps.milestonesTotal &&
    prevProps.className === nextProps.className &&
    prevProps.showPercentage === nextProps.showPercentage &&
    prevProps.showMilestones === nextProps.showMilestones &&
    prevProps.size === nextProps.size
  )
})
