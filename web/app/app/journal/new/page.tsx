'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useJournal } from '@/lib/hooks/useJournal'
import { useSpeechToText } from '@/lib/hooks/useSpeechToText'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2, Mic, Square } from 'lucide-react'

export default function NewEntryPage() {
  const router = useRouter()
  const { createEntry } = useJournal()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [loading, setLoading] = useState(false)
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

  // Handle transcription result
  useEffect(() => {
    if (transcription && recordingField) {
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
  }, [transcription, recordingField, clearTranscription])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await createEntry({
        title,
        content,
        mood: mood || undefined,
      })
      router.push('/app/journal')
    } catch (err: any) {
      setError(err.message || 'Failed to create entry')
    } finally {
      setLoading(false)
    }
  }

  async function handleMicrophoneToggle(field: 'title' | 'content' | 'mood') {
    if (isRecording && recordingField === field) {
      await stopRecording()
    } else if (!isRecording) {
      setRecordingField(field)
      await startRecording()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New Journal Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {sttError && (
              <Alert variant="destructive">
                <AlertDescription>{sttError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <div className="flex gap-2">
                <Input
                  id="title"
                  placeholder="What's on your mind?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={loading || isRecording || isProcessing}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => handleMicrophoneToggle('title')}
                  disabled={loading || isProcessing || (isRecording && recordingField !== 'title')}
                  variant={isRecording && recordingField === 'title' ? 'destructive' : 'outline'}
                  className={isRecording && recordingField === 'title' ? 'animate-pulse' : ''}
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
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="content">Content</Label>
                <Button
                  type="button"
                  onClick={() => handleMicrophoneToggle('content')}
                  disabled={loading || isProcessing || (isRecording && recordingField !== 'content')}
                  variant={isRecording && recordingField === 'content' ? 'destructive' : 'outline'}
                  size="sm"
                  className={isRecording && recordingField === 'content' ? 'animate-pulse' : ''}
                >
                  {isProcessing && recordingField === 'content' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isRecording && recordingField === 'content' ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Record
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="content"
                placeholder="Write your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={loading || isRecording || isProcessing}
                rows={12}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">Mood (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="mood"
                  placeholder="How are you feeling?"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  disabled={loading || isRecording || isProcessing}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => handleMicrophoneToggle('mood')}
                  disabled={loading || isProcessing || (isRecording && recordingField !== 'mood')}
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
              <p className="text-sm text-gray-500">
                e.g., happy, reflective, anxious, grateful
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
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
