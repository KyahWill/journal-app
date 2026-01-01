'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRoutines } from '@/lib/contexts/routine-context'
import { Routine, RoutineFrequency } from '@/lib/api/client'
import { Loader2, Plus, X } from 'lucide-react'

interface RoutineEditDialogProps {
  routine: Routine
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoutineEditDialog({ routine, open, onOpenChange }: RoutineEditDialogProps) {
  const { updateRoutine, getGroups } = useRoutines()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [title, setTitle] = useState(routine.title)
  const [description, setDescription] = useState(routine.description)
  const [group, setGroup] = useState(routine.group || '')
  const [frequency, setFrequency] = useState<RoutineFrequency>(routine.frequency)
  const [steps, setSteps] = useState<Array<{ id?: string; title: string; order: number }>>([])

  const existingGroups = getGroups()

  // Reset form when routine changes or dialog opens
  useEffect(() => {
    if (open) {
      setTitle(routine.title)
      setDescription(routine.description)
      setGroup(routine.group || '')
      setFrequency(routine.frequency)
      setSteps(routine.steps.map(s => ({ id: s.id, title: s.title, order: s.order })))
    }
  }, [routine, open])

  const handleAddStep = () => {
    setSteps([...steps, { title: '', order: steps.length }])
  }

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], title: value, order: index }
    setSteps(newSteps)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    const validSteps = steps.filter(s => s.title.trim())
    if (validSteps.length === 0) {
      alert('Please add at least one step')
      return
    }

    setIsSubmitting(true)
    try {
      await updateRoutine(routine.id, {
        title: title.trim(),
        description: description.trim(),
        group: group.trim() || undefined,
        frequency,
        steps: validSteps.map((s, i) => ({ title: s.title.trim(), order: i })),
      })

      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to update routine:', error)
      alert(error.message || 'Failed to update routine')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>Edit Routine</DialogTitle>
        <DialogDescription>
          Update your routine details and steps
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning Routine"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="edit-frequency">Frequency *</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as RoutineFrequency)}>
              <SelectTrigger id="edit-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group */}
          <div className="space-y-2">
            <Label htmlFor="edit-group">Group</Label>
            {existingGroups.length > 0 ? (
              <div className="space-y-2">
                <Select 
                  value={group || '__none__'} 
                  onValueChange={(v) => setGroup(v === '__none__' ? '' : v)}
                >
                  <SelectTrigger id="edit-group">
                    <SelectValue placeholder="Select or create new..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {existingGroups.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="Or type a new group name..."
                />
              </div>
            ) : (
              <Input
                id="edit-group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="e.g., Morning, Evening, Work..."
              />
            )}
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <Label>Steps *</Label>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={step.title}
                    onChange={(e) => handleStepChange(index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                    className="flex-1"
                  />
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStep(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddStep}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
