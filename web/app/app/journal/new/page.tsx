'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useJournal } from '@/lib/hooks/useJournal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { GoalSelector } from '@/components/goal-selector'
import { apiClient } from '@/lib/api/client'

export default function NewEntryPage() {
  const router = useRouter()
  const { createEntry } = useJournal()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [linkedGoalIds, setLinkedGoalIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Create the journal entry
      const newEntry = await createEntry({
        title,
        content,
        mood: mood || undefined,
      })

      // Link goals if any are selected
      if (linkedGoalIds.length > 0) {
        await Promise.all(
          linkedGoalIds.map((goalId) =>
            apiClient.linkJournalEntry(goalId, newEntry.id)
          )
        )
      }

      router.push('/app/journal')
    } catch (err: any) {
      setError(err.message || 'Failed to create entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4 sm:mb-6"
        size="sm"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">New Journal Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="What's on your mind?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={loading}
                rows={10}
                className="resize-none text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">Mood (optional)</Label>
              <Input
                id="mood"
                placeholder="How are you feeling?"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                e.g., happy, reflective, anxious, grateful
              </p>
            </div>

            <GoalSelector
              selectedGoalIds={linkedGoalIds}
              onGoalsChange={setLinkedGoalIds}
              disabled={loading}
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Entry'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
