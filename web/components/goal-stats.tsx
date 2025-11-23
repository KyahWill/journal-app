'use client'

import { useMemo, memo } from 'react'
import { Goal } from '@/lib/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface GoalStatsProps {
  goals: Goal[]
  className?: string
}

function GoalStatsComponent({ goals, className }: GoalStatsProps) {
  const stats = useMemo(() => {
    const activeGoals = goals.filter(
      (g) => g.status === 'in_progress' || g.status === 'not_started'
    )
    const completedGoals = goals.filter((g) => g.status === 'completed')
    
    // Calculate completion rate
    const totalGoals = goals.length
    const completionRate = totalGoals > 0
      ? Math.round((completedGoals.length / totalGoals) * 100)
      : 0

    // Calculate urgent goals (within 7 days and not completed/abandoned)
    const today = new Date()
    const urgentGoals = goals.filter((g) => {
      if (g.status === 'completed' || g.status === 'abandoned') return false
      const targetDate = new Date(g.target_date)
      const daysRemaining = differenceInDays(targetDate, today)
      return daysRemaining >= 0 && daysRemaining < 7
    })

    // Calculate overdue goals
    const overdueGoals = goals.filter((g) => {
      if (g.status === 'completed' || g.status === 'abandoned') return false
      const targetDate = new Date(g.target_date)
      const daysRemaining = differenceInDays(targetDate, today)
      return daysRemaining < 0
    })

    return {
      activeCount: activeGoals.length,
      completedCount: completedGoals.length,
      completionRate,
      urgentCount: urgentGoals.length,
      overdueCount: overdueGoals.length,
    }
  }, [goals])

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)} role="region" aria-label="Goal statistics">
      {/* Active Goals */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600" id="active-goals-label">Active Goals</p>
              <p className="text-2xl font-bold mt-1" aria-labelledby="active-goals-label">{stats.activeCount}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center" aria-hidden="true">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Goals */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600" id="completed-goals-label">Completed</p>
              <p className="text-2xl font-bold mt-1" aria-labelledby="completed-goals-label">{stats.completedCount}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center" aria-hidden="true">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600" id="success-rate-label">Success Rate</p>
              <p className="text-2xl font-bold mt-1" aria-labelledby="success-rate-label">{stats.completionRate}%</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center" aria-hidden="true">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Urgent Goals */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600" id="urgent-goals-label">Urgent</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold" aria-labelledby="urgent-goals-label">{stats.urgentCount}</p>
                {stats.overdueCount > 0 && (
                  <Badge variant="destructive" className="text-xs" aria-label={`${stats.overdueCount} goals overdue`}>
                    {stats.overdueCount} overdue
                  </Badge>
                )}
              </div>
            </div>
            <div
              className={cn(
                'h-12 w-12 rounded-full flex items-center justify-center',
                stats.urgentCount > 0 || stats.overdueCount > 0
                  ? 'bg-orange-100'
                  : 'bg-gray-100'
              )}
              aria-hidden="true"
            >
              <AlertCircle
                className={cn(
                  'h-6 w-6',
                  stats.urgentCount > 0 || stats.overdueCount > 0
                    ? 'text-orange-600'
                    : 'text-gray-400'
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Memoize to prevent re-renders when goals array reference doesn't change
export const GoalStats = memo(GoalStatsComponent, (prevProps, nextProps) => {
  // Only re-render if goals array actually changed (deep comparison of length and IDs)
  if (prevProps.goals.length !== nextProps.goals.length) return false
  if (prevProps.className !== nextProps.className) return false
  
  // Check if any goal IDs or statuses changed
  for (let i = 0; i < prevProps.goals.length; i++) {
    if (
      prevProps.goals[i].id !== nextProps.goals[i].id ||
      prevProps.goals[i].status !== nextProps.goals[i].status ||
      prevProps.goals[i].target_date !== nextProps.goals[i].target_date
    ) {
      return false
    }
  }
  
  return true
})
