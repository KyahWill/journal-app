'use client'

import { useState, useEffect } from 'react'
import { useGoals } from '@/lib/contexts/goal-context'
import { apiClient, Milestone } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Loader2,
  Calendar,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface MilestoneListProps {
  goalId: string
  onProgressUpdate?: () => void
}

export function MilestoneList({ goalId, onProgressUpdate }: MilestoneListProps) {
  const { addMilestone, toggleMilestone } = useGoals()
  
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Add milestone state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  
  // Edit milestone state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Delete milestone state
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch milestones
  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.getMilestones(goalId)
        setMilestones(data)
      } catch (err: any) {
        console.error('Failed to fetch milestones:', err)
        setError(err.message || 'Failed to load milestones')
      } finally {
        setLoading(false)
      }
    }

    fetchMilestones()
  }, [goalId])

  // Handle add milestone
  const handleAddMilestone = async () => {
    if (!newMilestoneTitle.trim()) return

    try {
      setIsAdding(true)
      setError(null)
      
      const milestone = await addMilestone(goalId, {
        title: newMilestoneTitle.trim(),
        due_date: newMilestoneDueDate || undefined,
      })
      
      setMilestones([...milestones, milestone])
      setNewMilestoneTitle('')
      setNewMilestoneDueDate('')
      setShowAddForm(false)
      
      if (onProgressUpdate) {
        onProgressUpdate()
      }
    } catch (err: any) {
      console.error('Failed to add milestone:', err)
      setError(err.message || 'Failed to add milestone')
    } finally {
      setIsAdding(false)
    }
  }

  // Handle toggle milestone
  const handleToggleMilestone = async (milestoneId: string) => {
    try {
      setError(null)
      
      const updatedMilestone = await toggleMilestone(goalId, milestoneId)
      
      setMilestones(milestones.map((m) =>
        m.id === milestoneId ? updatedMilestone : m
      ))
      
      if (onProgressUpdate) {
        onProgressUpdate()
      }
    } catch (err: any) {
      console.error('Failed to toggle milestone:', err)
      setError(err.message || 'Failed to update milestone')
    }
  }

  // Handle start edit
  const handleStartEdit = (milestone: Milestone) => {
    setEditingId(milestone.id)
    setEditTitle(milestone.title)
    setEditDueDate(milestone.due_date ? format(new Date(milestone.due_date), 'yyyy-MM-dd') : '')
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDueDate('')
  }

  // Handle save edit
  const handleSaveEdit = async (milestoneId: string) => {
    if (!editTitle.trim()) return

    try {
      setIsUpdating(true)
      setError(null)
      
      const updatedMilestone = await apiClient.updateMilestone(goalId, milestoneId, {
        title: editTitle.trim(),
        due_date: editDueDate || undefined,
      })
      
      setMilestones(milestones.map((m) =>
        m.id === milestoneId ? updatedMilestone : m
      ))
      
      setEditingId(null)
      setEditTitle('')
      setEditDueDate('')
    } catch (err: any) {
      console.error('Failed to update milestone:', err)
      setError(err.message || 'Failed to update milestone')
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle delete milestone
  const handleDeleteMilestone = async () => {
    if (!deletingId) return

    try {
      setIsDeleting(true)
      setError(null)
      
      await apiClient.deleteMilestone(goalId, deletingId)
      
      setMilestones(milestones.filter((m) => m.id !== deletingId))
      setShowDeleteDialog(false)
      setDeletingId(null)
      
      if (onProgressUpdate) {
        onProgressUpdate()
      }
    } catch (err: any) {
      console.error('Failed to delete milestone:', err)
      setError(err.message || 'Failed to delete milestone')
    } finally {
      setIsDeleting(false)
    }
  }

  // Get urgency color for due date
  const getDueDateColor = (dueDate: string | Date | null) => {
    if (!dueDate) return ''
    
    const date = new Date(dueDate)
    const today = new Date()
    const daysRemaining = differenceInDays(date, today)
    
    if (daysRemaining < 0) return 'text-red-600'
    if (daysRemaining < 3) return 'text-orange-600'
    if (daysRemaining < 7) return 'text-yellow-600'
    return 'text-green-600'
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading milestones...</span>
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

      {/* Milestones List */}
      {milestones.length === 0 && !showAddForm ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No milestones yet</p>
          <Button onClick={() => setShowAddForm(true)} size="sm" aria-label="Add first milestone">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add First Milestone
          </Button>
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="Milestones">
          {milestones.map((milestone) => (
            <Card key={milestone.id} className="transition-all hover:shadow-md" role="listitem">
              <CardContent className="p-4">
                {editingId === milestone.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Milestone title"
                      disabled={isUpdating}
                      aria-label="Edit milestone title"
                    />
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      <Input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        disabled={isUpdating}
                        className="flex-1"
                        aria-label="Edit milestone due date"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(milestone.id)}
                        disabled={isUpdating || !editTitle.trim()}
                        aria-label="Save milestone changes"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                        aria-label="Cancel editing"
                      >
                        <X className="h-4 w-4 mr-2" aria-hidden="true" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start gap-2 sm:gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleMilestone(milestone.id)}
                      className="mt-0.5 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                      aria-label={milestone.completed ? `Mark "${milestone.title}" as incomplete` : `Mark "${milestone.title}" as complete`}
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'font-medium text-sm sm:text-base break-words',
                          milestone.completed && 'line-through text-gray-500'
                        )}
                      >
                        {milestone.title}
                      </p>
                      {milestone.due_date && (
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span
                            className={cn(
                              'text-xs',
                              milestone.completed ? 'text-gray-400' : getDueDateColor(milestone.due_date)
                            )}
                          >
                            {format(new Date(milestone.due_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(milestone)}
                        aria-label={`Edit milestone "${milestone.title}"`}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setDeletingId(milestone.id)
                          setShowDeleteDialog(true)
                        }}
                        aria-label={`Delete milestone "${milestone.title}"`}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Milestone Form */}
      {showAddForm ? (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-3">
            <Input
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="Milestone title"
              disabled={isAdding}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newMilestoneTitle.trim()) {
                  handleAddMilestone()
                }
              }}
            />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={newMilestoneDueDate}
                onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                disabled={isAdding}
                placeholder="Due date (optional)"
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddMilestone}
                disabled={isAdding || !newMilestoneTitle.trim()}
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Milestone
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setNewMilestoneTitle('')
                  setNewMilestoneDueDate('')
                }}
                disabled={isAdding}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : milestones.length > 0 ? (
        <Button
          variant="outline"
          onClick={() => setShowAddForm(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      ) : null}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this milestone? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMilestone}
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
