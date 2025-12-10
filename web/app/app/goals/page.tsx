'use client'

import { useState, useMemo } from 'react'
import { useGoals } from '@/lib/contexts/goal-context'
import { useAuthReady } from '@/lib/hooks/useAuthReady'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus, Loader2, Target, Settings } from 'lucide-react'
import { GoalTodoItem } from '@/components/goal-todo-item'
import { GoalQuickAdd } from '@/components/goal-quick-add'
import { GoalCreationDialog } from '@/components/goal-creation-dialog'
import { ErrorBoundary } from '@/components/error-boundary'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type ViewFilter = 'all' | 'active' | 'completed'

export default function GoalsPage() {
  const isAuthReady = useAuthReady()
  const { goals, loading } = useGoals()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [viewFilter, setViewFilter] = useState<ViewFilter>('active')
  const [sortBy, setSortBy] = useState<'target_date' | 'created_at'>('target_date')

  // Filter and sort goals
  const filteredGoals = useMemo(() => {
    let filtered = [...goals]
    const now = new Date()

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(g =>
        g.title.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query)
      )
    }

    // Apply view filter
    switch (viewFilter) {
      case 'active':
        filtered = filtered.filter(g => g.status === 'in_progress' || g.status === 'not_started')
        break
      case 'completed':
        filtered = filtered.filter(g => g.status === 'completed')
        break
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'target_date') {
        return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Overdue first for active view
    if (viewFilter === 'active') {
      const overdue = filtered.filter(g => new Date(g.target_date) < now)
      const notOverdue = filtered.filter(g => new Date(g.target_date) >= now)
      return [...overdue, ...notOverdue]
    }

    return filtered
  }, [goals, searchQuery, viewFilter, sortBy])

  // Stats
  const stats = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'in_progress' || g.status === 'not_started').length
    const completedGoals = goals.filter(g => g.status === 'completed').length
    return { activeGoals, completedGoals }
  }, [goals])

  if (!isAuthReady || (loading && goals.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Goals</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {stats.activeGoals} active · {stats.completedGoals} completed
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/app/goals/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1">Settings</span>
              </Button>
            </Link>
            <GoalCreationDialog>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </GoalCreationDialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search goals..."
            className="pl-9"
          />
        </div>

        {/* ==================== GOALS SECTION ==================== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Goals</h2>
            </div>
            <div className="flex gap-2">
              <Select value={viewFilter} onValueChange={(v) => setViewFilter(v as ViewFilter)}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="target_date">Due</SelectItem>
                  <SelectItem value="created_at">Created</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Add for Goals */}
          <div className="mb-4">
            <GoalQuickAdd />
          </div>

          {filteredGoals.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {goals.length === 0 
                  ? "No goals yet" 
                  : "No goals match your filter"}
              </p>
              {goals.length === 0 && (
                <p className="text-xs mt-1">Add your first goal above to get started</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGoals.map((goal) => (
                <GoalTodoItem key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </section>
      </div>
    </ErrorBoundary>
  )
}
