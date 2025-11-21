'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useJournal } from '@/lib/hooks/useJournal'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Search, Trash2, Loader2, Calendar, List } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { JournalEntry } from '@/lib/api/client'

export default function JournalListPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { 
    entries = [], 
    groupedEntries = {}, 
    loading, 
    error, 
    deleteEntry, 
    searchEntries, 
    fetchEntries,
    fetchGroupedEntries 
  } = useJournal()
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('list')

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  // Fetch data when view mode changes
  useEffect(() => {
    if (isAuthenticated) {
      if (viewMode === 'grouped') {
        fetchGroupedEntries()
      } else {
        // Only fetch if entries array is empty
        if (entries.length === 0) {
          fetchEntries()
        }
      }
    }
  }, [isAuthenticated, viewMode])

  // Filter entries based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = entries.filter(
        (entry) =>
          entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredEntries(filtered)
    } else {
      setFilteredEntries(entries)
    }
  }, [searchQuery, entries])

  async function handleDelete() {
    if (!deleteId) return

    try {
      setDeleting(true)
      await deleteEntry(deleteId)
      setDeleteId(null)
      // Refetch data after deletion
      if (viewMode === 'grouped') {
        fetchGroupedEntries()
      } else {
        fetchEntries()
      }
    } catch (err: any) {
      console.error('Failed to delete entry:', err)
    } finally {
      setDeleting(false)
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Checking authentication...</span>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  if (loading && entries.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading entries...</span>
        </div>
      </div>
    )
  }

  // Render entries grouped by date
  const renderGroupedView = () => {
    if (!groupedEntries || typeof groupedEntries !== 'object') {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading entries...</span>
        </div>
      )
    }

    // Filter grouped entries based on search query
    let filteredGroupedEntries = groupedEntries
    if (searchQuery) {
      filteredGroupedEntries = Object.keys(groupedEntries).reduce((acc, date) => {
        const filteredEntriesForDate = groupedEntries[date].filter(
          (entry) =>
            entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
        if (filteredEntriesForDate.length > 0) {
          acc[date] = filteredEntriesForDate
        }
        return acc
      }, {} as Record<string, JournalEntry[]>)
    }

    const dates = Object.keys(filteredGroupedEntries).sort((a, b) => b.localeCompare(a))
    
    if (dates.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              {searchQuery
                ? 'No entries found matching your search.'
                : 'No journal entries yet. Create your first entry!'}
            </p>
            {!searchQuery && (
              <Link href="/app/journal/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Entry
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-8">
        {dates.map((date) => (
          <div key={date}>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {format(new Date(date), 'MMMM d, yyyy')}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredGroupedEntries[date].length} {filteredGroupedEntries[date].length === 1 ? 'entry' : 'entries'})
              </span>
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroupedEntries[date].map((entry) => (
                <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="line-clamp-1">{entry.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <CardDescription>
                      {format(new Date(entry.created_at), 'h:mm a')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {entry.content}
                    </p>
                    <Link href={`/app/journal/${entry.id}`}>
                      <Button variant="link" className="mt-4 px-0">
                        Read more →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Render list view
  const renderListView = () => {
    if (filteredEntries.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              {searchQuery
                ? 'No entries found matching your search.'
                : 'No journal entries yet. Create your first entry!'}
            </p>
            {!searchQuery && (
              <Link href="/app/journal/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Entry
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEntries.map((entry) => (
          <Card key={entry.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="line-clamp-1">{entry.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(entry.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <CardDescription>
                {formatDistanceToNow(new Date(entry.created_at), {
                  addSuffix: true,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 line-clamp-3">
                {entry.content}
              </p>
              <Link href={`/app/journal/${entry.id}`}>
                <Button variant="link" className="mt-4 px-0">
                  Read more →
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">My Journal</h2>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'outline' : 'default'}
            size="sm"
            onClick={() => setViewMode('grouped')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            By Date
          </Button>
          <Button
            variant={viewMode === 'grouped' ? 'outline' : 'default'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" />
            List View
          </Button>
          <Link href="/app/journal/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {viewMode === 'grouped' ? renderGroupedView() : renderListView()}

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
