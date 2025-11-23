'use client'

import { useState, useEffect } from 'react'
import { useGoals } from '@/lib/contexts/goal-context'
import { apiClient, ProgressUpdate } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Trash2, Loader2, Clock } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface ProgressUpdatesProps {
  goalId: string
}

export function ProgressUpdates({ goalId }: ProgressUpdatesProps) {
  const { addProgress } = useGoals()
  
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Add progress state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProgressContent, setNewProgressContent] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  
  // Delete progress state
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch progress updates
  useEffect(() => {
    const fetchProgressUpdates = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.getProgressUpdates(goalId)
        setProgressUpdates(data)
      } catch (err: any) {
        console.error('Failed to fetch progress updates:', err)
        setError(err.message || 'Failed to load progress updates')
      } finally {
        setLoading(false)
      }
    }

    fetchProgressUpdates()
  }, [goalId])

  // Handle add progress update
  const handleAddProgress = async () => {
    if (!newProgressContent.trim()) return

    try {
      setIsAdding(true)
      setError(null)
      
      const progressUpdate = await addProgress(goalId, newProgressContent.trim())
      
      // Add to beginning of list (reverse chronological)
      setProgressUpdates([progressUpdate, ...progressUpdates])
      setNewProgressContent('')
      setShowAddForm(false)
    } catch (err: any) {
      console.error('Failed to add progress update:', err)
      setError(err.message || 'Failed to add progress update')
    } finally {
      setIsAdding(false)
    }
  }

  // Handle delete progress update
  const handleDeleteProgress = async () => {
    if (!deletingId) return

    try {
      setIsDeleting(true)
      setError(null)
      
      await apiClient.deleteProgressUpdate(goalId, deletingId)
      
      setProgressUpdates(progressUpdates.filter((p) => p.id !== deletingId))
      setShowDeleteDialog(false)
      setDeletingId(null)
    } catch (err: any) {
      console.error('Failed to delete progress update:', err)
      setError(err.message || 'Failed to delete progress update')
    } finally {
      setIsDeleting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading progress updates...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add Progress Button */}
      {!showAddForm && (
        <Button
          onClick={() => setShowAddForm(true)}
          className="w-full"
          aria-label="Add progress update"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Progress Update
        </Button>
      )}

      {/* Add Progress Form */}
      {showAddForm && (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-3">
            <Textarea
              value={newProgressContent}
              onChange={(e) => setNewProgressContent(e.target.value)}
              placeholder="What progress have you made? Share your achievements, challenges, or insights..."
              disabled={isAdding}
              rows={4}
              className="resize-none"
              aria-label="Progress update content"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddProgress}
                disabled={isAdding || !newProgressContent.trim()}
                aria-label="Add progress update"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                )}
                Add Update
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setNewProgressContent('')
                }}
                disabled={isAdding}
                aria-label="Cancel adding progress update"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Updates List */}
      {progressUpdates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No progress updates yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Start tracking your journey by adding your first update
          </p>
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Progress updates">
          {progressUpdates.map((update) => (
            <Card key={update.id} className="transition-all hover:shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        ({format(new Date(update.created_at), 'MMM d, yyyy h:mm a')})
                      </span>
                      <span className="text-xs text-gray-400 sm:hidden">
                        {format(new Date(update.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{update.content}</p>
                  </div>

                  {/* Delete button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDeletingId(update.id)
                      setShowDeleteDialog(true)
                    }}
                    aria-label="Delete progress update"
                    className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 sm:h-9 sm:w-9"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Progress Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this progress update? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProgress}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
