'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, Goal } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Target, Loader2, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

interface LinkedGoalsDisplayProps {
  journalEntryId: string
}

export function LinkedGoalsDisplay({ journalEntryId }: LinkedGoalsDisplayProps) {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLinkedGoals()
  }, [journalEntryId])

  async function fetchLinkedGoals() {
    try {
      setLoading(true)
      setError(null)
      const linkedGoals = await apiClient.getLinkedGoalsForJournal(journalEntryId)
      setGoals(linkedGoals)
    } catch (err: any) {
      console.error('Error fetching linked goals:', err)
      setError(err.message || 'Failed to load linked goals')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: 'bg-gray-100 text-gray-800 border-gray-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      abandoned: 'bg-red-100 text-red-800 border-red-200',
    }
    return colors[status] || colors.not_started
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      career: 'bg-purple-100 text-purple-800 border-purple-200',
      health: 'bg-green-100 text-green-800 border-green-200',
      personal: 'bg-blue-100 text-blue-800 border-blue-200',
      financial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      relationships: 'bg-pink-100 text-pink-800 border-pink-200',
      learning: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return colors[category] || colors.other
  }

  const getUrgencyColor = (targetDate: string | Date) => {
    const daysRemaining = differenceInDays(new Date(targetDate), new Date())
    if (daysRemaining < 0) return 'text-red-600'
    if (daysRemaining < 7) return 'text-orange-600'
    if (daysRemaining < 30) return 'text-yellow-600'
    return 'text-green-600'
  }

  const formatTargetDate = (targetDate: string | Date) => {
    const daysRemaining = differenceInDays(new Date(targetDate), new Date())
    const dateStr = format(new Date(targetDate), 'MMM d, yyyy')
    
    if (daysRemaining < 0) {
      return `${dateStr} (${Math.abs(daysRemaining)} days overdue)`
    } else if (daysRemaining === 0) {
      return `${dateStr} (Due today)`
    } else if (daysRemaining === 1) {
      return `${dateStr} (Due tomorrow)`
    } else if (daysRemaining < 7) {
      return `${dateStr} (${daysRemaining} days left)`
    }
    return dateStr
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      completed: 'Completed',
      abandoned: 'Abandoned',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Linked Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-gray-600">Loading linked goals...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Linked Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Linked Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            No goals linked to this journal entry. Edit the entry to link goals.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Linked Goals ({goals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => router.push(`/app/goals/${goal.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-semibold text-base truncate">{goal.title}</h4>
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(goal.status)} text-xs`}
                    >
                      {goal.status === 'completed' && (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      {getStatusLabel(goal.status)}
                    </Badge>
                  </div>

                  {goal.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {goal.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={`${typeof goal.category == 'string'?  getCategoryColor(goal.category) : `bg-[${goal.category.color}]`} text-xs`}
                      >
                        {typeof goal.category == 'string'? goal.category : goal.category.name}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{Math.round(goal.progress_percentage)}% complete</span>
                    </div>

                    {goal.status !== 'completed' && goal.status !== 'abandoned' && (
                      <div
                        className={`flex items-center gap-1 ${getUrgencyColor(goal.target_date)}`}
                      >
                        <Calendar className="h-3 w-3" />
                        <span>{formatTargetDate(goal.target_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          goal.progress_percentage === 100
                            ? 'bg-green-500'
                            : goal.progress_percentage >= 75
                            ? 'bg-blue-500'
                            : goal.progress_percentage >= 50
                            ? 'bg-yellow-500'
                            : 'bg-orange-500'
                        }`}
                        style={{ width: `${goal.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={() => router.push('/app/goals')}
        >
          View All Goals
        </Button>
      </CardContent>
    </Card>
  )
}
