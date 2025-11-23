'use client'

import { useAuthReady } from '@/lib/hooks/useAuthReady'
import { CategoryManager } from '@/components/category-manager'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function GoalSettingsPage() {
  const isAuthReady = useAuthReady()

  if (!isAuthReady) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/app/goals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goals
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Goal Settings</h1>
          <p className="text-gray-500 mt-2">
            Manage your custom goal categories and preferences
          </p>
        </div>

        <CategoryManager />
      </div>
    </div>
  )
}
