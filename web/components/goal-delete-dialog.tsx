'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, Info } from 'lucide-react'

interface GoalDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goalId: string
  goalTitle: string
  onConfirm: () => Promise<void>
  isDeleting?: boolean
  deleteError?: string | null
}

export function GoalDeleteDialog({
  open,
  onOpenChange,
  goalId,
  goalTitle,
  onConfirm,
  isDeleting = false,
  deleteError = null,
}: GoalDeleteDialogProps) {
  const [deletionInfo, setDeletionInfo] = useState<{
    milestonesCount: number
    progressUpdatesCount: number
    linkedJournalEntriesCount: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch deletion info when dialog opens
  useEffect(() => {
    if (open && goalId) {
      const fetchDeletionInfo = async () => {
        try {
          setLoading(true)
          setError(null)
          const info = await apiClient.getGoalDeletionInfo(goalId)
          setDeletionInfo(info)
        } catch (err: any) {
          console.error('Failed to fetch deletion info:', err)
          setError(err.message || 'Failed to load deletion information')
        } finally {
          setLoading(false)
        }
      }

      fetchDeletionInfo()
    } else {
      // Reset state when dialog closes
      setDeletionInfo(null)
      setError(null)
    }
  }, [open, goalId])

  const hasLinkedJournalEntries = deletionInfo && deletionInfo.linkedJournalEntriesCount > 0
  const hasData = deletionInfo && (
    deletionInfo.milestonesCount > 0 ||
    deletionInfo.progressUpdatesCount > 0 ||
    deletionInfo.linkedJournalEntriesCount > 0
  )

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
            Delete Goal
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete <span className="font-semibold">"{goalTitle}"</span>?
              </p>

              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {deleteError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
              )}

              {!loading && !error && deletionInfo && (
                <>
                  {hasData && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-2">This will permanently delete:</div>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {deletionInfo.milestonesCount > 0 && (
                            <li>
                              {deletionInfo.milestonesCount} milestone{deletionInfo.milestonesCount !== 1 ? 's' : ''}
                            </li>
                          )}
                          {deletionInfo.progressUpdatesCount > 0 && (
                            <li>
                              {deletionInfo.progressUpdatesCount} progress update{deletionInfo.progressUpdatesCount !== 1 ? 's' : ''}
                            </li>
                          )}
                          {deletionInfo.linkedJournalEntriesCount > 0 && (
                            <li>
                              {deletionInfo.linkedJournalEntriesCount} journal entry link{deletionInfo.linkedJournalEntriesCount !== 1 ? 's' : ''}
                            </li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {hasLinkedJournalEntries && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-1">Warning: Linked Journal Entries</div>
                        <p className="text-sm">
                          This goal is linked to {deletionInfo.linkedJournalEntriesCount} journal {deletionInfo.linkedJournalEntriesCount === 1 ? 'entry' : 'entries'}.
                          The links will be removed, but the journal entries themselves will not be deleted.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  <p className="text-sm text-gray-600">
                    This action cannot be undone.
                  </p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting || loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isDeleting || loading || !!error}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Goal'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
