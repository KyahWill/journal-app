'use client'

import { useState, useMemo } from 'react'
import { useRoutines } from '@/lib/contexts/routine-context'
import { useAuthReady } from '@/lib/hooks/useAuthReady'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Loader2, ListChecks } from 'lucide-react'
import { ErrorBoundary } from '@/components/error-boundary'
import { RoutineItem } from '@/components/routine-item'
import { RoutineCreationDialog } from '@/components/routine-creation-dialog'
import { cn } from '@/lib/utils'

export default function RoutinesPage() {
  const isAuthReady = useAuthReady()
  const { routines, loading, getGroups } = useRoutines()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const groups = useMemo(() => {
    const allGroups = getGroups()
    return allGroups
  }, [getGroups])

  const filteredRoutines = useMemo(() => {
    let filtered = [...routines]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
      )
    }

    // Filter by selected group
    if (selectedGroup !== null) {
      filtered = filtered.filter(r => r.group === selectedGroup)
    }

    return filtered
  }, [routines, searchQuery, selectedGroup])

  // Group routines by their group field
  const groupedRoutines = useMemo(() => {
    const grouped: Record<string, typeof routines> = {}
    
    if (selectedGroup !== null) {
      // If a group is selected, only show that group
      grouped[selectedGroup || 'ungrouped'] = filteredRoutines
    } else {
      // Group all routines
      filteredRoutines.forEach(routine => {
        const groupName = routine.group || 'ungrouped'
        if (!grouped[groupName]) {
          grouped[groupName] = []
        }
        grouped[groupName].push(routine)
      })
    }

    return grouped
  }, [filteredRoutines, selectedGroup])

  if (!isAuthReady || (loading && routines.length === 0)) {
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
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Routines</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {routines.length} {routines.length === 1 ? 'routine' : 'routines'}
              {groups.length > 0 && ` · ${groups.length} ${groups.length === 1 ? 'group' : 'groups'}`}
            </p>
          </div>
          <RoutineCreationDialog>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Routine
            </Button>
          </RoutineCreationDialog>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search routines..."
              className="pl-9"
            />
          </div>
          {groups.length > 0 && (
            <select
              value={selectedGroup === null ? 'all' : selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value === 'all' ? null : e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="all">All Groups</option>
              {groups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
              <option value="">Ungrouped</option>
            </select>
          )}
        </div>

        {/* Routines */}
        {routines.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <ListChecks className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-medium mb-2">No routines yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first routine to organize your daily tasks
            </p>
            <RoutineCreationDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Routine
              </Button>
            </RoutineCreationDialog>
          </div>
        ) : filteredRoutines.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <ListChecks className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">
              No routines match your search
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRoutines).map(([groupName, groupRoutines]) => (
              <div key={groupName} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {groupName === 'ungrouped' ? 'Ungrouped' : groupName}
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {groupRoutines.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {groupRoutines.map((routine) => (
                    <RoutineItem key={routine.id} routine={routine} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
