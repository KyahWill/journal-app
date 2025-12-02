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
import { Search, Plus, Loader2, Target, Flame, Settings } from 'lucide-react'
import { GoalTodoItem } from '@/components/goal-todo-item'
import { HabitItem } from '@/components/habit-item'
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

  // Separate habits and regular goals
  const { habits, regularGoals } = useMemo(() => {
    const h = goals.filter(g => g.is_habit)
    const r = goals.filter(g => !g.is_habit)
    return { habits: h, regularGoals: r }
  }, [goals])

  // Filter and sort habits
  const filteredHabits = useMemo(() => {
    let filtered = [...habits]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(g => g.title.toLowerCase().includes(query))
    }

    // Sort by streak (highest first) then by title
    filtered.sort((a, b) => {
      const streakDiff = (b.habit_streak || 0) - (a.habit_streak || 0)
      if (streakDiff !== 0) return streakDiff
      return a.title.localeCompare(b.title)
    })

    return filtered
  }, [habits, searchQuery])

  // Filter and sort regular goals
  const filteredGoals = useMemo(() => {
    let filtered = [...regularGoals]
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
  }, [regularGoals, searchQuery, viewFilter, sortBy])

  // Stats
  const stats = useMemo(() => {
    const activeGoals = regularGoals.filter(g => g.status === 'in_progress' || g.status === 'not_started').length
    const completedGoals = regularGoals.filter(g => g.status === 'completed').length
    const totalStreak = habits.reduce((sum, h) => sum + (h.habit_streak || 0), 0)
    return { activeGoals, completedGoals, totalStreak, habitCount: habits.length }
  }, [regularGoals, habits])

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
            <h1 className="text-2xl font-bold">Goals & Habits</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {stats.habitCount} habits · {stats.activeGoals} active goals
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
            placeholder="Search habits & goals..."
            className="pl-9"
          />
        </div>

        {/* ==================== HABITS SECTION ==================== */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Habits</h2>
            {stats.totalStreak > 0 && (
              <span className="text-sm text-orange-500 font-medium">
                🔥 {stats.totalStreak} total streak
              </span>
            )}
          </div>

          {filteredHabits.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
              <Flame className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No habits yet</p>
              <p className="text-xs mt-1">Create a goal and mark it as a habit to track daily progress</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHabits.map((habit) => (
                <HabitItem key={habit.id} goal={habit} />
              ))}
            </div>
          )}
        </section>

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
                {regularGoals.length === 0 
                  ? "No goals yet" 
                  : "No goals match your filter"}
              </p>
              {regularGoals.length === 0 && (
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
