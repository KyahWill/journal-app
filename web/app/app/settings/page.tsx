'use client'

import { useEffect, useState } from 'react'
import { usePrompts } from '@/lib/hooks/usePrompts'
import { UserPrompt } from '@/lib/api/client'
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
import { Plus, Edit, Trash2, Star, Sparkles, Loader2, Palette } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const {
    prompts,
    loading,
    error,
    fetchPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    setAsDefault,
    getImprovements,
  } = usePrompts()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<UserPrompt | null>(null)
  const [promptName, setPromptName] = useState('')
  const [promptText, setPromptText] = useState('')
  const [isDefaultPrompt, setIsDefaultPrompt] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string | null>(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  const handleOpenDialog = (prompt?: UserPrompt) => {
    if (prompt) {
      setEditingPrompt(prompt)
      setPromptName(prompt.name)
      setPromptText(prompt.prompt_text)
      setIsDefaultPrompt(prompt.is_default)
    } else {
      setEditingPrompt(null)
      setPromptName('')
      setPromptText('')
      setIsDefaultPrompt(false)
    }
    setSuggestions(null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingPrompt(null)
    setPromptName('')
    setPromptText('')
    setIsDefaultPrompt(false)
    setSuggestions(null)
  }

  const handleSave = async () => {
    if (!promptName.trim() || !promptText.trim()) {
      return
    }

    setIsSaving(true)
    try {
      if (editingPrompt) {
        await updatePrompt(editingPrompt.id, {
          name: promptName,
          prompt_text: promptText,
          is_default: isDefaultPrompt,
        })
      } else {
        await createPrompt({
          name: promptName,
          prompt_text: promptText,
          is_default: isDefaultPrompt,
        })
      }
      handleCloseDialog()
      await fetchPrompts()
    } catch (err) {
      console.error('Failed to save prompt:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) {
      return
    }

    setIsDeletingId(id)
    try {
      await deletePrompt(id)
      await fetchPrompts()
    } catch (err) {
      console.error('Failed to delete prompt:', err)
    } finally {
      setIsDeletingId(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setAsDefault(id)
      await fetchPrompts()
    } catch (err) {
      console.error('Failed to set default:', err)
    }
  }

  const handleGetSuggestions = async () => {
    if (!promptText.trim()) {
      return
    }

    setLoadingSuggestions(true)
    try {
      const result = await getImprovements(promptText)
      setSuggestions(result)
    } catch (err) {
      console.error('Failed to get suggestions:', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Settings</h1>
        <div className="flex gap-2">
          <Link href="/app/settings/themes">
            <Button variant="outline" size="sm">
              <Palette className="h-4 w-4 mr-2" />
              Themes
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">AI Prompts</h2>
          <p className="text-gray-600 mt-1">
            Customize your AI chat experience with custom prompts
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New Prompt
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && prompts.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {prompt.name}
                      {prompt.is_default && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {prompt.prompt_text}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(prompt)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {!prompt.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(prompt.id)}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(prompt.id)}
                      disabled={isDeletingId === prompt.id}
                    >
                      {isDeletingId === prompt.id ? (
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

      {prompts.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-500 mb-4">No custom prompts yet</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Prompt
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
            </DialogTitle>
            <DialogDescription>
              Customize the personality and behavior of your AI assistant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Prompt Name</Label>
              <Input
                id="name"
                placeholder="e.g., Executive Coach, Journaling Companion"
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="prompt">System Prompt</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGetSuggestions}
                  disabled={loadingSuggestions || !promptText.trim()}
                >
                  {loadingSuggestions ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Get AI Suggestions
                </Button>
              </div>
              <Textarea
                id="prompt"
                placeholder="Enter your system prompt here... Define the personality, expertise, and behavior of your AI assistant."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                maxLength={10000}
              />
              <p className="text-xs text-gray-500">
                {promptText.length} / 10,000 characters
              </p>
            </div>

            {suggestions && (
              <div className="space-y-2">
                <Label>AI Suggestions</Label>
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm font-sans">
                        {suggestions}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="default"
                checked={isDefaultPrompt}
                onChange={(e) => setIsDefaultPrompt(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="default" className="cursor-pointer">
                Set as default prompt
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !promptName.trim() || !promptText.trim()}
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

