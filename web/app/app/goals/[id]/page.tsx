'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGoals } from '@/lib/contexts/goal-context'
import { useAuthReady } from '@/lib/hooks/useAuthReady'
import { apiClient, Goal } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  Target,
  TrendingUp,
  BookOpen,
  RefreshCw,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { ErrorBoundary } from '@/components/error-boundary'
import { GoalDetailSkeleton } from '@/components/goal-skeleton'

// Lazy load heavy components for better initial page load
const MilestoneList = lazy(() => import('@/components/milestone-list').then(mod => ({ default: mod.MilestoneList })))
const ProgressUpdates = lazy(() => import('@/components/progress-updates').then(mod => ({ default: mod.ProgressUpdates })))
const LinkedJournalEntries = lazy(() => import('@/components/linked-journal-entries').then(mod => ({ default: mod.LinkedJournalEntries })))
const GoalForm = lazy(() => import('@/components/goal-form').then(mod => ({ default: mod.GoalForm })))
const GoalDeleteDialog = lazy(() => import('@/components/goal-delete-dialog').then(mod => ({ default: mod.GoalDeleteDialog })))

export default function GoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const isAuthReady = useAuthReady()
  const { goals, deleteGoal } = useGoals()
  
  const goalId = params.id as string
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Fetch goal data
  useEffect(() => {
    if (!isAuthReady) return

    // First try to find goal in context
    const contextGoal = goals.find((g) => g.id === goalId)
    if (contextGoal) {
      setGoal(contextGoal)
      setLoading(false)
      return
    }

    // If not in context, fetch from API
    const fetchGoal = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedGoal = await apiClient.getGoal(goalId)
        setGoal(fetchedGoal)
      } catch (err: any) {
        console.error('Failed to fetch goal:', err)
        setError(err.message || 'Failed to load goal')
      } finally {
        setLoading(false)
      }
    }

    fetchGoal()
  }, [goalId, goals, isAuthReady])

  // Update goal when context changes
  useEffect(() => {
    const contextGoal = goals.find((g) => g.id === goalId)
    if (contextGoal) {
      setGoal(contextGoal)
    }
  }, [goals, goalId])

  // Handle delete
  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setDeleteError(null)
      await deleteGoal(goalId)
      setShowDeleteDialog(false)
      // Navigate to goals list after successful deletion
      router.push('/app/goals')
    } catch (err: any) {
      console.error('Failed to delete goal:', err)
      setDeleteError(err.message || 'Failed to delete goal. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle edit
  const handleEdit = () => {
    setShowEditDialog(true)
  }

  // Retry function for error state
  const handleRetry = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedGoal = await apiClient.getGoal(goalId)
      setGoal(fetchedGoal)
    } catch (err: any) {
      console.error('Failed to fetch goal:', err)
      setError(err.message || 'Failed to load goal')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (!isAuthReady || loading) {
    return <GoalDetailSkeleton />
  }

  // Error state
  if (error || !goal) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertDescription className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-red-900">Failed to Load Goal</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                {error || 'Goal not found'}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleRetry}
                className="flex-1"
                aria-label="Retry loading goal"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/app/goals')}
                className="flex-1"
                aria-label="Back to goals list"
              >
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Back to Goals
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate days remaining/overdue
  const targetDate = new Date(goal.target_date)
  const today = new Date()
  const daysRemaining = differenceInDays(targetDate, today)
  const isOverdue = daysRemaining < 0 && goal.status !== 'completed' && goal.status !== 'abandoned'
  const isUrgent = daysRemaining >= 0 && daysRemaining < 7 && goal.status !== 'completed' && goal.status !== 'abandoned'

  // Get urgency color
  const getUrgencyColor = () => {
    if (isOverdue) return 'text-red-600 bg-red-50 border-red-200'
    if (isUrgent) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (daysRemaining < 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  // Get status color
  const getStatusColor = () => {
    switch (goal.status) {
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
  const getCategoryColor = () => {
    switch (goal.category) {
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
  }

  // Format status text
  const formatStatus = () => {
    return goal.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  // Format category text
  const formatCategory = () => {
    if (typeof goal.category === 'string') {
      return goal.category.charAt(0).toUpperCase() + goal.category.slice(1)
    } else {
      return goal.category.name
    }
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Goal detail page error:', error, errorInfo)
      }}
    >
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/app/goals')}
        className="mb-4"
        aria-label="Back to goals list"
      >
        <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
        Back to Goals
      </Button>

      {/* Goal Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3">{goal.title}</h1>
              <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Goal metadata">
                <Badge className={getCategoryColor()} aria-label={`Category: ${formatCategory()}`}>
                  {formatCategory()}
                </Badge>
                <Badge className={getStatusColor()} aria-label={`Status: ${formatStatus()}`}>
                  {formatStatus()}
                </Badge>
              </div>
              {goal.description && (
                <p className="text-gray-600 whitespace-pre-wrap">{goal.description}</p>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleEdit}
                className="flex-1 sm:flex-none"
                aria-label={`Edit goal "${goal.title}"`}
              >
                <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                aria-label={`Delete goal "${goal.title}"`}
              >
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium" aria-label={`${goal.progress_percentage} percent complete`}>{goal.progress_percentage}%</span>
              </div>
              <Progress 
                value={goal.progress_percentage} 
                className="h-2" 
                aria-label={`Goal progress: ${goal.progress_percentage}%`}
              />
            </div>

            {/* Target Date */}
            <div 
              className={cn('flex items-center gap-2 text-sm p-3 rounded-md border', getUrgencyColor())}
              role="status"
              aria-label={`Target date: ${format(targetDate, 'MMMM d, yyyy')}. ${
                isOverdue
                  ? `${Math.abs(daysRemaining)} days overdue`
                  : daysRemaining === 0
                  ? 'Due today'
                  : daysRemaining === 1
                  ? '1 day remaining'
                  : `${daysRemaining} days remaining`
              }`}
            >
              <Calendar className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">
                  {format(targetDate, 'MMMM d, yyyy')}
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
          </div>
        </CardContent>
      </Card>

      {/* Content Sections */}
      <div className="grid grid-cols-1 gap-6">
        {/* Milestones Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-xl font-semibold">Milestones</h2>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            }>
              <MilestoneList
                goalId={goalId}
                onProgressUpdate={() => {
                  // Refetch goal to update progress percentage
                  const fetchGoal = async () => {
                    try {
                      const updatedGoal = await apiClient.getGoal(goalId)
                      setGoal(updatedGoal)
                    } catch (err) {
                      console.error('Failed to refresh goal:', err)
                    }
                  }
                  fetchGoal()
                }}
              />
            </Suspense>
          </CardContent>
        </Card>

        {/* Progress Updates Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-xl font-semibold">Progress Updates</h2>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            }>
              <ProgressUpdates goalId={goalId} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Linked Journal Entries Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-xl font-semibold">Linked Journal Entries</h2>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            }>
              <LinkedJournalEntries goalId={goalId} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Suspense fallback={null}>
        <GoalDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          goalId={goalId}
          goalTitle={goal.title}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          deleteError={deleteError}
        />
      </Suspense>

      {/* Edit Goal Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          }>
            <GoalForm
              goal={goal}
              onSuccess={async (updatedGoal) => {
                setGoal(updatedGoal)
                setShowEditDialog(false)
              }}
              onCancel={() => setShowEditDialog(false)}
            />
          </Suspense>
        </DialogContent>
      </Dialog>
    </div>
    </ErrorBoundary>
  )
}
