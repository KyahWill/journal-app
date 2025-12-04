'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { useCoachPersonalities } from '@/lib/hooks/useCoachPersonalities'
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'
import { CoachPersonality, CoachingStyle } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Edit, Trash2, Star, Loader2, Palette, Mic, Bot, Volume2, Calendar, CheckCircle2, XCircle, Link2 } from 'lucide-react'
import Link from 'next/link'

const COACHING_STYLES: { value: CoachingStyle; label: string; description: string }[] = [
  { value: 'supportive', label: 'Supportive', description: 'Warm, encouraging, and nurturing approach' },
  { value: 'direct', label: 'Direct', description: 'Straightforward, honest, and to-the-point' },
  { value: 'motivational', label: 'Motivational', description: 'Energizing, inspiring, and action-oriented' },
  { value: 'analytical', label: 'Analytical', description: 'Logical, detailed, and systematic' },
  { value: 'empathetic', label: 'Empathetic', description: 'Understanding, compassionate, and validating' },
]

// Popular ElevenLabs voices - these are pre-made voices available to all users
const ELEVENLABS_VOICES: { id: string; name: string; description: string; gender: string }[] = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Deep, clear, professional', gender: 'Male' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'Warm, friendly, conversational', gender: 'Female' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Calm, soothing, empathetic', gender: 'Female' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Energetic, enthusiastic', gender: 'Female' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', description: 'Young, bright, cheerful', gender: 'Female' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', description: 'Casual, friendly, approachable', gender: 'Male' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', description: 'Deep, authoritative, confident', gender: 'Male' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', description: 'Trustworthy, wise, mature', gender: 'Male' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Articulate, professional', gender: 'Male' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', description: 'Intense, dramatic', gender: 'Male' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Natural, conversational', gender: 'Male' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', description: 'Warm, nurturing', gender: 'Female' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Authoritative, British', gender: 'Male' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', description: 'Friendly, American', gender: 'Male' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', description: 'Expressive, American', gender: 'Female' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', description: 'Upbeat, American', gender: 'Female' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Articulate, American', gender: 'Male' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Lily', description: 'Warm, British', gender: 'Female' },
  { id: 'bIHbv24MWmeRgasZH58o', name: 'Will', description: 'Friendly, American', gender: 'Male' },
  { id: 'EkK5I93ZUQCD4DQCPO0C', name: 'Sarah', description: 'Soft, gentle', gender: 'Female' },
]

function SettingsContent() {
  const { user, ready: authReady } = useAuth()
  const searchParams = useSearchParams()
  const {
    personalities,
    loading,
    error,
    fetchPersonalities,
    createPersonality,
    updatePersonality,
    deletePersonality,
    setAsDefault,
  } = useCoachPersonalities()
  
  const {
    isConnected: calendarConnected,
    loading: calendarLoading,
    error: calendarError,
    connect: connectCalendar,
    disconnect: disconnectCalendar,
    checkStatus: checkCalendarStatus,
  } = useGoogleCalendar()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPersonality, setEditingPersonality] = useState<CoachPersonality | null>(null)
  const [calendarMessage, setCalendarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [style, setStyle] = useState<CoachingStyle>('supportive')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [firstMessage, setFirstMessage] = useState('')
  const [voiceId, setVoiceId] = useState('pNInz6obpgDQGcFmaJgB') // Default to Adam voice
  const [voiceStability, setVoiceStability] = useState(0.5)
  const [voiceSimilarityBoost, setVoiceSimilarityBoost] = useState(0.75)
  const [language, setLanguage] = useState('en')
  const [isDefault, setIsDefault] = useState(false)
  
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

  // Handle calendar OAuth callback messages
  useEffect(() => {
    const calendarConnectedParam = searchParams.get('calendar_connected')
    const calendarErrorParam = searchParams.get('calendar_error')
    
    if (calendarConnectedParam === 'true') {
      setCalendarMessage({ type: 'success', text: 'Google Calendar connected successfully!' })
      checkCalendarStatus()
      // Clear the URL params
      window.history.replaceState({}, '', '/app/settings')
    } else if (calendarErrorParam) {
      const errorMessages: Record<string, string> = {
        'missing_params': 'Missing parameters in OAuth callback',
        'connection_failed': 'Failed to connect to Google Calendar',
      }
      setCalendarMessage({ 
        type: 'error', 
        text: errorMessages[calendarErrorParam] || `Error: ${calendarErrorParam}` 
      })
      // Clear the URL params
      window.history.replaceState({}, '', '/app/settings')
    }
  }, [searchParams, checkCalendarStatus])

  // Wait for auth to be ready before fetching personalities
  useEffect(() => {
    if (authReady && user) {
      fetchPersonalities()
    }
  }, [authReady, user, fetchPersonalities])

  const handleOpenDialog = (personality?: CoachPersonality) => {
    if (personality) {
      setEditingPersonality(personality)
      setName(personality.name)
      setDescription(personality.description)
      setStyle(personality.style)
      setSystemPrompt(personality.systemPrompt)
      setFirstMessage(personality.firstMessage || '')
      setVoiceId(personality.voiceId || 'pNInz6obpgDQGcFmaJgB')
      setVoiceStability(personality.voiceStability ?? 0.5)
      setVoiceSimilarityBoost(personality.voiceSimilarityBoost ?? 0.75)
      setLanguage(personality.language || 'en')
      setIsDefault(personality.isDefault)
    } else {
      setEditingPersonality(null)
      setName('')
      setDescription('')
      setStyle('supportive')
      setSystemPrompt('')
      setFirstMessage('')
      setVoiceId('pNInz6obpgDQGcFmaJgB') // Default to Adam voice
      setVoiceStability(0.5)
      setVoiceSimilarityBoost(0.75)
      setLanguage('en')
      setIsDefault(false)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingPersonality(null)
  }

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !systemPrompt.trim()) {
      return
    }

    setIsSaving(true)
    try {
      const data = {
        name,
        description,
        style,
        systemPrompt,
        firstMessage: firstMessage || undefined,
        voiceId: voiceId || undefined,
        voiceStability,
        voiceSimilarityBoost,
        language,
        isDefault,
      }

      if (editingPersonality) {
        await updatePersonality(editingPersonality.id, data)
      } else {
        await createPersonality(data)
      }
      handleCloseDialog()
      await fetchPersonalities()
    } catch (err) {
      console.error('Failed to save personality:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coach personality?')) {
      return
    }

    setIsDeletingId(id)
    try {
      await deletePersonality(id)
      await fetchPersonalities()
    } catch (err) {
      console.error('Failed to delete personality:', err)
    } finally {
      setIsDeletingId(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setAsDefault(id)
      await fetchPersonalities()
    } catch (err) {
      console.error('Failed to set default:', err)
    }
  }

  const getStyleLabel = (styleValue: CoachingStyle) => {
    return COACHING_STYLES.find((s) => s.value === styleValue)?.label || styleValue
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Settings</h1>
        <div className="flex gap-2">
          <Link href="/app/settings/themes">
            <Button variant="outline" size="sm">
              <Palette className="h-4 w-4 mr-2" />
              Themes
            </Button>
          </Link>
        </div>
      </div>

      {/* Google Calendar Integration Section */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Link2 className="h-6 w-6" />
            Integrations
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Connect external services to enhance your journal experience
          </p>
        </div>

        {calendarMessage && (
          <Alert 
            variant={calendarMessage.type === 'error' ? 'destructive' : 'default'} 
            className={`mb-4 ${calendarMessage.type === 'success' ? 'border-green-500 bg-green-50 text-green-700' : ''}`}
          >
            <AlertDescription className="flex items-center gap-2">
              {calendarMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {calendarMessage.text}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Google Calendar</CardTitle>
                  <CardDescription>
                    Sync your goals and habits with Google Calendar
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {calendarLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                ) : calendarConnected ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <XCircle className="h-4 w-4" />
                    Not connected
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {calendarConnected 
                  ? 'Your goals and habits are automatically synced to Google Calendar. New goals create events on their target date, and habits create recurring reminders.'
                  : 'Connect Google Calendar to automatically create events for your goals and recurring reminders for habits.'
                }
              </p>
              
              {calendarError && (
                <Alert variant="destructive">
                  <AlertDescription>{calendarError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                {calendarConnected ? (
                  <Button 
                    variant="outline" 
                    onClick={disconnectCalendar}
                    disabled={calendarLoading}
                  >
                    {calendarLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    onClick={connectCalendar}
                    disabled={calendarLoading}
                  >
                    {calendarLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Calendar className="h-4 w-4 mr-2" />
                    )}
                    Connect Google Calendar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Coach Personalities
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Customize your AI coach for both text chat and voice conversations
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Personality
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && personalities.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personalities.map((personality) => (
            <Card key={personality.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {personality.name}
                      {personality.isDefault && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {getStyleLabel(personality.style)} Coach
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {personality.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {personality.elevenLabsAgentId && (
                      <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        <Mic className="h-3 w-3" />
                        Voice Ready
                      </span>
                    )}
                    {personality.voiceId && (
                      <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        <Volume2 className="h-3 w-3" />
                        Custom Voice
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(personality)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {!personality.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(personality.id)}
                        title="Set as default"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(personality.id)}
                      disabled={isDeletingId === personality.id}
                    >
                      {isDeletingId === personality.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {personalities.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No coach personalities yet</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Coach
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPersonality ? 'Edit Coach Personality' : 'Create New Coach Personality'}
            </DialogTitle>
            <DialogDescription>
              Define your AI coach&apos;s personality for both text chat and voice conversations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Executive Coach, Wellness Guide"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Coaching Style *</Label>
                  <Select value={style} onValueChange={(v) => setStyle(v as CoachingStyle)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COACHING_STYLES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="font-medium">{s.label}</span>
                          <span className="text-gray-500 text-xs ml-2">- {s.description}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="A brief description of what this coach personality specializes in..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  maxLength={500}
                />
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">AI Behavior</h3>
              
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt *</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="Define the personality, expertise, and behavior of your AI coach..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  maxLength={10000}
                />
                <p className="text-xs text-gray-500">
                  {systemPrompt.length} / 10,000 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstMessage">First Message (Voice)</Label>
                <Textarea
                  id="firstMessage"
                  placeholder="The greeting message when starting a voice conversation..."
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  rows={2}
                  maxLength={500}
                />
              </div>
            </div>

            {/* Voice Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice Settings (ElevenLabs)
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="voiceId">Voice</Label>
                <Select value={voiceId || 'pNInz6obpgDQGcFmaJgB'} onValueChange={setVoiceId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a voice..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ELEVENLABS_VOICES.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{voice.name}</span>
                          <span className="text-xs text-gray-500">
                            ({voice.gender}) - {voice.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Choose a voice for your AI coach
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voiceStability">
                    Voice Stability: {voiceStability.toFixed(2)}
                  </Label>
                  <input
                    type="range"
                    id="voiceStability"
                    min="0"
                    max="1"
                    step="0.05"
                    value={voiceStability}
                    onChange={(e) => setVoiceStability(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Higher = more consistent, Lower = more expressive
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voiceSimilarityBoost">
                    Similarity Boost: {voiceSimilarityBoost.toFixed(2)}
                  </Label>
                  <input
                    type="range"
                    id="voiceSimilarityBoost"
                    min="0"
                    max="1"
                    step="0.05"
                    value={voiceSimilarityBoost}
                    onChange={(e) => setVoiceSimilarityBoost(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Higher = closer to original voice
                  </p>
                </div>
              </div>
            </div>

            {/* Default Setting */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="default"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="default" className="cursor-pointer">
                Set as default coach personality
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !name.trim() || !description.trim() || !systemPrompt.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
