'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useGoals } from '@/lib/contexts/goal-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GoalProgressBar } from '@/components/goal-progress-bar'
import {
  Target,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Calendar,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { differenceInDays, format } from 'date-fns'
import { cn } from '@/lib/utils'

interface GoalDashboardWidgetProps {
  className?: string
  maxUrgentGoals?: number
  maxRecentUpdates?: number
}

export function GoalDashboardWidget({
  className,
  maxUrgentGoals = 3,
  maxRecentUpdates = 3,
}: GoalDashboardWidgetProps) {
  const { goals, loading, error } = useGoals()

  // Calculate statistics
  const stats = useMemo(() => {
    const activeGoals = goals.filter(
      (g) => g.status === 'in_progress' || g.status === 'not_started'
    )
    const completedGoals = goals.filter((g) => g.status === 'completed')

    // Calculate completion rate
    const totalGoals = goals.length
    const completionRate =
      totalGoals > 0 ? Math.round((completedGoals.length / totalGoals) * 100) : 0

    // Get urgent goals (within 7 days and not completed/abandoned)
    const today = new Date()
    const urgentGoals = goals
      .filter((g) => {
        if (g.status === 'completed' || g.status === 'abandoned') return false
        const targetDate = new Date(g.target_date)
        const daysRemaining = differenceInDays(targetDate, today)
        return daysRemaining >= 0 && daysRemaining < 7
      })
      .sort((a, b) => {
        const daysA = differenceInDays(new Date(a.target_date), today)
        const daysB = differenceInDays(new Date(b.target_date), today)
        return daysA - daysB
      })
      .slice(0, maxUrgentGoals)

    // Get overdue goals
    const overdueGoals = goals.filter((g) => {
      if (g.status === 'completed' || g.status === 'abandoned') return false
      const targetDate = new Date(g.target_date)
      return differenceInDays(targetDate, today) < 0
    })

    // Get recent progress updates (goals with recent activity)
    const recentlyUpdated = goals
      .filter((g) => g.status !== 'completed' && g.status !== 'abandoned')
      .sort((a, b) => {
        const dateA = new Date(a.last_activity || a.updated_at).getTime()
        const dateB = new Date(b.last_activity || b.updated_at).getTime()
        return dateB - dateA
      })
      .slice(0, maxRecentUpdates)

    return {
      activeCount: activeGoals.length,
      completedCount: completedGoals.length,
      completionRate,
      urgentGoals,
      overdueCount: overdueGoals.length,
      recentlyUpdated,
    }
  }, [goals, maxUrgentGoals, maxRecentUpdates])

  // Get urgency color for days remaining
  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'text-red-600'
    if (daysRemaining === 0) return 'text-red-600'
    if (daysRemaining === 1) return 'text-orange-600'
    if (daysRemaining < 3) return 'text-orange-500'
    if (daysRemaining < 7) return 'text-yellow-600'
    return 'text-green-600'
  }

  // Format days remaining text
  const formatDaysRemaining = (daysRemaining: number) => {
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)}d overdue`
    if (daysRemaining === 0) return 'Due today'
    if (daysRemaining === 1) return '1 day left'
    return `${daysRemaining} days left`
  }

  if (loading && goals.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Loading goals...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (goals.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            My Goals
          </CardTitle>
          <CardDescription>Track your progress and stay accountable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No goals yet. Start by creating your first goal!</p>
            <Link href="/app/goals">
              <Button>
                <Target className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              My Goals
            </CardTitle>
            <CardDescription>Track your progress and stay accountable</CardDescription>
          </div>
          <Link href="/app/goals">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4">
          {/* Active Goals */}
          <div className="text-center">
            <div className="flex items-center justify-center h-10 w-10 bg-blue-100 rounded-full mx-auto mb-2">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <div className="text-xs text-gray-600">Active</div>
          </div>

          {/* Completed Goals */}
          <div className="text-center">
            <div className="flex items-center justify-center h-10 w-10 bg-green-100 rounded-full mx-auto mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold">{stats.completedCount}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>

          {/* Completion Rate */}
          <div className="text-center">
            <div className="flex items-center justify-center h-10 w-10 bg-purple-100 rounded-full mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <div className="text-xs text-gray-600">Success</div>
          </div>
        </div>

        {/* Urgent Goals Section */}
        {stats.urgentGoals.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Urgent Goals
                  {stats.overdueCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.overdueCount} overdue
                    </Badge>
                  )}
                </h4>
              </div>
              <div className="space-y-3">
                {stats.urgentGoals.map((goal) => {
                  const today = new Date()
                  const targetDate = new Date(goal.target_date)
                  const daysRemaining = differenceInDays(targetDate, today)

                  return (
                    <Link key={goal.id} href={`/app/goals/${goal.id}`}>
                      <div className="p-3 rounded-lg border hover:border-primary hover:shadow-sm transition-all cursor-pointer">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h5 className="font-medium text-sm line-clamp-1 flex-1">
                            {goal.title}
                          </h5>
                          <span
                            className={cn(
                              'text-xs font-semibold whitespace-nowrap',
                              getUrgencyColor(daysRemaining)
                            )}
                          >
                            {formatDaysRemaining(daysRemaining)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <Calendar className="h-3 w-3" />
                          {format(targetDate, 'MMM d, yyyy')}
                        </div>
                        <GoalProgressBar
                          progress={goal.progress_percentage}
                          size="sm"
                          showPercentage={false}
                          showMilestones={false}
                        />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Recent Progress Updates Section */}
        {stats.recentlyUpdated.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-3">Recent Activity</h4>
              <div className="space-y-2">
                {stats.recentlyUpdated.map((goal) => (
                  <Link key={goal.id} href={`/app/goals/${goal.id}`}>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{goal.title}</p>
                        <p className="text-xs text-gray-500">
                          Updated {format(new Date(goal.last_activity || goal.updated_at), 'MMM d')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-xs font-semibold text-gray-600">
                          {goal.progress_percentage}%
                        </span>
                        <div className="w-16">
                          <GoalProgressBar
                            progress={goal.progress_percentage}
                            size="sm"
                            showPercentage={false}
                            showMilestones={false}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* View All Goals Link */}
        <Separator />
        <Link href="/app/goals">
          <Button variant="outline" className="w-full">
            View All Goals
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
