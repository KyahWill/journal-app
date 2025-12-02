'use client'

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { GoalCreationWizard } from './goal-creation-wizard'
import { useState } from 'react'
import { VisuallyHidden } from '@/components/ui/visually-hidden'

interface GoalCreationDialogProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

export function GoalCreationDialog({ children, defaultOpen = false }: GoalCreationDialogProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0 border-0 bg-transparent shadow-none sm:max-w-2xl">
        <VisuallyHidden>
            <DialogTitle>Create New Goal</DialogTitle>
        </VisuallyHidden>
        <GoalCreationWizard onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

