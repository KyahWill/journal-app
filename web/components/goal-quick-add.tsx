'use client'

import { useState } from 'react'
import { useGoals } from '@/lib/contexts/goal-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { addDays, format } from 'date-fns'

interface GoalQuickAddProps {
  onSuccess?: () => void
}

export function GoalQuickAdd({ onSuccess }: GoalQuickAddProps) {
  const { createGoal } = useGoals()
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setIsSubmitting(true)
      await createGoal({
        title: title.trim(),
        description: '',
        category: 'personal',
        target_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      })
      setTitle('')
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create goal:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new goal..."
        className="flex-1 h-10"
        disabled={isSubmitting}
      />
      <Button 
        type="submit" 
        size="sm"
        disabled={!title.trim() || isSubmitting}
        className="h-10 px-4"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </>
        )}
      </Button>
    </form>
  )
}

