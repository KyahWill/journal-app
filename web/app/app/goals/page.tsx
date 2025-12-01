'use client'

import { useState, useMemo } from 'react'
import { useGoals } from '@/lib/contexts/goal-context'
import { useAuthReady } from '@/lib/hooks/useAuthReady'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Plus, Search, Grid3x3, List, AlertCircle } from 'lucide-react'
import { GoalStats } from '@/components/goal-stats'
import { GoalForm } from '@/components/goal-form'
import { ErrorBoundary } from '@/components/error-boundary'
import { GoalListSkeleton } from '@/components/goal-skeleton'
import { SyncIndicator } from '@/components/sync-indicator'
import { VirtualizedGoalList } from '@/components/goal-list-virtualized'

type ViewMode = 'grid' | 'list'
type SortOption = 'target_date' | 'created_at' | 'progress' | 'title'

export default function GoalsPage() {
  const isAuthReady = useAuthReady()
  const { goals, loading, error, sortGoals, getOverdueGoals, getUrgentGoals, getNotificationCounts } = useGoals()
  
  // View and filter state
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('target_date')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Get notification counts (memoized)
  const notificationCounts = useMemo(() => getNotificationCounts(), [getNotificationCounts])

  // Filter and sort goals
  const filteredAndSortedGoals = useMemo(() => {
    let filtered = [...goals]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((goal) =>
        goal.title.toLowerCase().includes(query) ||
        goal.description.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((goal) => goal.category === selectedCategory)
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'active') {
        filtered = filtered.filter((goal) => 
          goal.status === 'not_started' || goal.status === 'in_progress'
        )
      } else {
        filtered = filtered.filter((goal) => goal.status === selectedStatus)
      }
    }

    // Apply sorting
    let sorted = sortGoals(filtered, sortBy)
    
    // Always sort overdue goals to the top
    const overdue = sorted.filter((goal) => {
      const targetDate = new Date(goal.target_date)
      const now = new Date()
      return targetDate < now && goal.status !== 'completed' && goal.status !== 'abandoned'
    })
    const notOverdue = sorted.filter((goal) => {
      const targetDate = new Date(goal.target_date)
      const now = new Date()
      return targetDate >= now || goal.status === 'completed' || goal.status === 'abandoned'
    })
    
    return [...overdue, ...notOverdue]
  }, [goals, searchQuery, selectedCategory, selectedStatus, sortBy, sortGoals])

  // Show loading state only on initial load
  if (!isAuthReady || (loading && goals.length === 0)) {
    return <GoalListSkeleton viewMode={viewMode} />
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Goals page error:', error, errorInfo)
      }}
    >
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">My Goals</h1>
            <SyncIndicator />
          </div>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Track and achieve your personal and professional objectives
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            className="flex-1 sm:flex-initial" 
            onClick={() => window.location.href = '/app/goals/settings'}
            aria-label="Goal settings"
          >
            Settings
          </Button>
          <Button 
            className="flex-1 sm:flex-initial" 
            onClick={() => setShowCreateDialog(true)}
            aria-label="Create new goal"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Stats */}
      <GoalStats goals={goals} className="mb-6" />

      {/* Notification Banner */}
      {notificationCounts.total > 0 && (
        <Alert className="mb-6 border-orange-200 bg-orange-50" role="alert" aria-live="polite">
          <AlertCircle className="h-4 w-4 text-orange-600" aria-hidden="true" />
          <AlertTitle className="text-orange-900">Goals Need Attention</AlertTitle>
          <AlertDescription className="text-orange-800">
            {notificationCounts.overdue > 0 && (
              <span className="font-medium">
                {notificationCounts.overdue} {notificationCounts.overdue === 1 ? 'goal is' : 'goals are'} overdue
              </span>
            )}
            {notificationCounts.overdue > 0 && notificationCounts.urgent > 0 && ' and '}
            {notificationCounts.urgent > 0 && (
              <span className="font-medium">
                {notificationCounts.urgent} {notificationCounts.urgent === 1 ? 'goal has a' : 'goals have'} deadline within 7 days
              </span>
            )}
            . Review and update your progress to stay on track.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  placeholder="Search goals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Search goals by title or description"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger aria-label="Filter by category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="career">Career</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="relationships">Relationships</SelectItem>
                <SelectItem value="learning">Learning</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger aria-label="Sort goals">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="target_date">Target Date</SelectItem>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-end mt-4 gap-2" role="group" aria-label="View mode">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid3x3 className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Goals List/Grid */}
      {filteredAndSortedGoals.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {goals.length === 0 ? 'No goals yet' : 'No goals match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {goals.length === 0
                  ? 'Start by creating your first goal to track your progress'
                  : 'Try adjusting your filters or search query'}
              </p>
              {goals.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)} aria-label="Create your first goal">
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Create Your First Goal
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <VirtualizedGoalList goals={filteredAndSortedGoals} viewMode={viewMode} />
      )}

      {/* Create Goal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogTitle>Create New Goal</DialogTitle>
          </VisuallyHidden>
          <GoalForm
            onSuccess={() => {
              setShowCreateDialog(false)
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
    </ErrorBoundary>
  )
}
