'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, JournalEntry } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Plus, Trash2, Loader2, BookOpen, Calendar, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

interface LinkedJournalEntriesProps {
  goalId: string
}

export function LinkedJournalEntries({ goalId }: LinkedJournalEntriesProps) {
  const router = useRouter()
  
  const [linkedEntries, setLinkedEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Link journal entry state
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [availableEntries, setAvailableEntries] = useState<JournalEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [isLinking, setIsLinking] = useState(false)
  
  // Unlink journal entry state
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)

  // Fetch linked journal entries
  useEffect(() => {
    const fetchLinkedEntries = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.getLinkedJournalEntries(goalId)
        setLinkedEntries(data)
      } catch (err: any) {
        console.error('Failed to fetch linked journal entries:', err)
        setError(err.message || 'Failed to load linked journal entries')
      } finally {
        setLoading(false)
      }
    }

    fetchLinkedEntries()
  }, [goalId])

  // Fetch available journal entries when dialog opens
  const handleOpenLinkDialog = async () => {
    setShowLinkDialog(true)
    setLoadingEntries(true)
    
    try {
      const response = await apiClient.getJournalEntries()
      // Filter out already linked entries
      const linkedIds = new Set(linkedEntries.map((e) => e.id))
      const available = response.entries.filter((e) => !linkedIds.has(e.id))
      setAvailableEntries(available)
    } catch (err: any) {
      console.error('Failed to fetch journal entries:', err)
      setError(err.message || 'Failed to load journal entries')
    } finally {
      setLoadingEntries(false)
    }
  }

  // Handle link journal entry
  const handleLinkEntry = async () => {
    if (!selectedEntryId) return

    try {
      setIsLinking(true)
      setError(null)
      
      await apiClient.linkJournalEntry(goalId, selectedEntryId)
      
      // Add the linked entry to the list
      const linkedEntry = availableEntries.find((e) => e.id === selectedEntryId)
      if (linkedEntry) {
        setLinkedEntries([...linkedEntries, linkedEntry])
      }
      
      setShowLinkDialog(false)
      setSelectedEntryId(null)
    } catch (err: any) {
      console.error('Failed to link journal entry:', err)
      setError(err.message || 'Failed to link journal entry')
    } finally {
      setIsLinking(false)
    }
  }

  // Handle unlink journal entry
  const handleUnlinkEntry = async () => {
    if (!unlinkingId) return

    try {
      setIsUnlinking(true)
      setError(null)
      
      await apiClient.unlinkJournalEntry(goalId, unlinkingId)
      
      setLinkedEntries(linkedEntries.filter((e) => e.id !== unlinkingId))
      setShowUnlinkDialog(false)
      setUnlinkingId(null)
    } catch (err: any) {
      console.error('Failed to unlink journal entry:', err)
      setError(err.message || 'Failed to unlink journal entry')
    } finally {
      setIsUnlinking(false)
    }
  }

  // Handle navigate to journal entry
  const handleNavigateToEntry = (entryId: string) => {
    router.push(`/app/journal/${entryId}`)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading linked entries...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Link Journal Entry Button */}
      <Button
        onClick={handleOpenLinkDialog}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Link Journal Entry
      </Button>

      {/* Linked Entries List */}
      {linkedEntries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No linked journal entries yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Connect your journal reflections to this goal
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {linkedEntries.map((entry) => (
            <Card
              key={entry.id}
              className="transition-all hover:shadow-md cursor-pointer"
              onClick={() => handleNavigateToEntry(entry.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium mb-1 truncate">{entry.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(entry.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    {entry.content && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {entry.content}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNavigateToEntry(entry.id)
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setUnlinkingId(entry.id)
                        setShowUnlinkDialog(true)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Link Journal Entry Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Link Journal Entry</DialogTitle>
            <DialogDescription>
              Select a journal entry to link to this goal
            </DialogDescription>
          </DialogHeader>

          {loadingEntries ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading journal entries...</span>
            </div>
          ) : availableEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No available journal entries to link</p>
              <p className="text-sm text-gray-400 mt-1">
                All your journal entries are already linked to this goal
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className={`cursor-pointer transition-all ${
                    selectedEntryId === entry.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedEntryId(entry.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`h-4 w-4 rounded-full border-2 ${
                            selectedEntryId === entry.id
                              ? 'border-primary bg-primary'
                              : 'border-gray-300'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1 truncate">{entry.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(entry.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {entry.content && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {entry.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLinkDialog(false)
                setSelectedEntryId(null)
              }}
              disabled={isLinking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkEntry}
              disabled={isLinking || !selectedEntryId}
            >
              {isLinking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                'Link Entry'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this journal entry from the goal?
              The journal entry itself will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnlinking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkEntry}
              disabled={isUnlinking}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUnlinking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unlinking...
                </>
              ) : (
                'Unlink'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
