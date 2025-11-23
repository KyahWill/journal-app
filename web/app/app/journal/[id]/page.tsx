'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useJournal } from '@/lib/hooks/useJournal'
import { useSpeechToText } from '@/lib/hooks/useSpeechToText'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit2, Save, X, Loader2, Mic, Square } from 'lucide-react'
import { JournalEntry, apiClient } from '@/lib/api/client'
import { format } from 'date-fns'
import { GoalSelector } from '@/components/goal-selector'
import { LinkedGoalsDisplay } from '@/components/linked-goals-display'

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
  const [linkedGoalIds, setLinkedGoalIds] = useState<string[]>([])
  const [originalLinkedGoalIds, setOriginalLinkedGoalIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recordingField, setRecordingField] = useState<'title' | 'content' | 'mood' | null>(null)
  
  // Speech-to-text hook
  const { 
    startRecording, 
    stopRecording, 
    transcription, 
    isRecording, 
    isProcessing, 
    error: sttError,
    clearTranscription 
  } = useSpeechToText()

  useEffect(() => {
    fetchEntry()
  }, [id])

  // Handle transcription result
  useEffect(() => {
    if (transcription && recordingField && isEditing) {
      if (recordingField === 'title') {
        setTitle((prev) => (prev ? `${prev} ${transcription}` : transcription))
      } else if (recordingField === 'content') {
        setContent((prev) => (prev ? `${prev} ${transcription}` : transcription))
      } else if (recordingField === 'mood') {
        setMood((prev) => (prev ? `${prev} ${transcription}` : transcription))
      }
      clearTranscription()
      setRecordingField(null)
    }
  }, [transcription, recordingField, isEditing, clearTranscription])

  async function fetchEntry() {
    try {
      setLoading(true)
      const data = await getEntry(id)
      setEntry(data)
      setTitle(data.title)
      setContent(data.content)
      setMood(data.mood || '')
      
      // Fetch linked goals
      const linkedGoals = await apiClient.getLinkedGoalsForJournal(id).catch(() => [])
      const goalIds = linkedGoals.map((g: any) => g.id)
      setLinkedGoalIds(goalIds)
      setOriginalLinkedGoalIds(goalIds)
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

      // Handle goal linking changes
      const goalsToAdd = linkedGoalIds.filter((gId) => !originalLinkedGoalIds.includes(gId))
      const goalsToRemove = originalLinkedGoalIds.filter((gId) => !linkedGoalIds.includes(gId))

      // Add new links
      await Promise.all(
        goalsToAdd.map((goalId) => apiClient.linkJournalEntry(goalId, id))
      )

      // Remove old links
      await Promise.all(
        goalsToRemove.map((goalId) => apiClient.unlinkJournalEntry(goalId, id))
      )

      // Update original linked goals
      setOriginalLinkedGoalIds(linkedGoalIds)
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
      setLinkedGoalIds(originalLinkedGoalIds)
    }
    setIsEditing(false)
    setRecordingField(null)
  }

  async function handleMicrophoneToggle(field: 'title' | 'content' | 'mood') {
    if (isRecording && recordingField === field) {
      await stopRecording()
    } else if (!isRecording) {
      setRecordingField(field)
      await startRecording()
    }
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
          onClick={() => router.push('/app/journal')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Journal
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/app/journal')}
        className="mb-4 sm:mb-6"
        size="sm"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Journal
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1 w-full">
              {isEditing ? (
                <div className="flex gap-2 mb-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="text-lg sm:text-2xl font-bold flex-1"
                    disabled={saving || isRecording || isProcessing}
                  />
                  <Button
                    type="button"
                    onClick={() => handleMicrophoneToggle('title')}
                    disabled={saving || isProcessing || (isRecording && recordingField !== 'title')}
                    variant={isRecording && recordingField === 'title' ? 'destructive' : 'outline'}
                    className={isRecording && recordingField === 'title' ? 'animate-pulse' : ''}
                    size="icon"
                  >
                    {isProcessing && recordingField === 'title' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isRecording && recordingField === 'title' ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <CardTitle className="text-xl sm:text-2xl mb-2">{entry.title}</CardTitle>
              )}
              <div className="flex gap-2 text-xs sm:text-sm text-gray-600 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  Created: {format(new Date(entry.created_at), 'PP')}
                </Badge>
                {entry.updated_at !== entry.created_at && (
                  <Badge variant="outline" className="text-xs">
                    Updated: {format(new Date(entry.updated_at), 'PP')}
                  </Badge>
                )}
                {entry.mood && (
                  <Badge variant="secondary" className="text-xs">
                    Mood: {entry.mood}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 sm:flex-none"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                        <span className="hidden sm:inline">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Save</span>
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex-1 sm:flex-none"
                  >
                    <X className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto"
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

          {sttError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{sttError}</AlertDescription>
            </Alert>
          )}

          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="content">Content</Label>
                  <Button
                    type="button"
                    onClick={() => handleMicrophoneToggle('content')}
                    disabled={saving || isProcessing || (isRecording && recordingField !== 'content')}
                    variant={isRecording && recordingField === 'content' ? 'destructive' : 'outline'}
                    size="sm"
                    className={isRecording && recordingField === 'content' ? 'animate-pulse' : ''}
                  >
                    {isProcessing && recordingField === 'content' ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                        <span className="hidden sm:inline">Processing...</span>
                      </>
                    ) : isRecording && recordingField === 'content' ? (
                      <>
                        <Square className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Stop Recording</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Record</span>
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={saving || isRecording || isProcessing}
                  rows={12}
                  className="resize-none text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mood">Mood</Label>
                <div className="flex gap-2">
                  <Input
                    id="mood"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    disabled={saving || isRecording || isProcessing}
                    placeholder="How are you feeling?"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleMicrophoneToggle('mood')}
                    disabled={saving || isProcessing || (isRecording && recordingField !== 'mood')}
                    variant={isRecording && recordingField === 'mood' ? 'destructive' : 'outline'}
                    className={isRecording && recordingField === 'mood' ? 'animate-pulse' : ''}
                  >
                    {isProcessing && recordingField === 'mood' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isRecording && recordingField === 'mood' ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <GoalSelector
                selectedGoalIds={linkedGoalIds}
                onGoalsChange={setLinkedGoalIds}
                disabled={saving || isRecording || isProcessing}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{entry.content}</p>
              </div>
              <LinkedGoalsDisplay journalEntryId={id} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
