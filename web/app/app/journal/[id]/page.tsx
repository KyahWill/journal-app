'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useJournal } from '@/lib/hooks/useJournal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit2, Save, X, Loader2 } from 'lucide-react'
import { JournalEntry } from '@/lib/api/client'
import { format } from 'date-fns'

export default function EntryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { updateEntry, getEntry } = useJournal()

  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEntry()
  }, [id])

  async function fetchEntry() {
    try {
      setLoading(true)
      const data = await getEntry(id)
      setEntry(data)
      setTitle(data.title)
      setContent(data.content)
      setMood(data.mood || '')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch entry')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setError(null)
    setSaving(true)

    try {
      const updated = await updateEntry(id, { 
        title, 
        content,
        mood: mood || undefined 
      })
      setEntry(updated)
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update entry')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (entry) {
      setTitle(entry.title)
      setContent(entry.content)
      setMood(entry.mood || '')
    }
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading entry...</span>
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>Entry not found</AlertDescription>
        </Alert>
        <Button
          className="mt-4"
          onClick={() => router.push('/dashboard/journal')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Journal
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/journal')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Journal
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="text-2xl font-bold mb-2"
                  disabled={saving}
                />
              ) : (
                <CardTitle className="text-2xl mb-2">{entry.title}</CardTitle>
              )}
              <div className="flex gap-2 text-sm text-gray-600 flex-wrap">
                <Badge variant="outline">
                  Created: {format(new Date(entry.created_at), 'PPP')}
                </Badge>
                {entry.updated_at !== entry.created_at && (
                  <Badge variant="outline">
                    Updated: {format(new Date(entry.updated_at), 'PPP')}
                  </Badge>
                )}
                {entry.mood && (
                  <Badge variant="secondary">
                    Mood: {entry.mood}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={saving}
                  rows={15}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mood">Mood</Label>
                <Input
                  id="mood"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  disabled={saving}
                  placeholder="How are you feeling?"
                />
              </div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{entry.content}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
