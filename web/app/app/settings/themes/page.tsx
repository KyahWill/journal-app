'use client'

import { useEffect, useState, useRef } from 'react'
import { useThemes } from '@/lib/hooks/useThemes'
import { UserTheme } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Star, Check, Upload, Download, Share2, Loader2 } from 'lucide-react'
import { ThemeEditor } from '@/components/theme-editor'
import { ThemePreview } from '@/components/theme-preview'

export default function ThemesPage() {
  const {
    themes,
    currentTheme,
    loading,
    error,
    fetchThemes,
    deleteTheme,
    setAsDefault,
    setActiveTheme,
    exportTheme,
    importTheme,
  } = useThemes()

  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTheme, setEditingTheme] = useState<UserTheme | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [shareDialogTheme, setShareDialogTheme] = useState<UserTheme | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchThemes()
  }, [fetchThemes])

  const handleOpenEditor = (theme?: UserTheme) => {
    setEditingTheme(theme || null)
    setIsEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setEditingTheme(null)
  }

  const handleSaveComplete = async () => {
    handleCloseEditor()
    await fetchThemes()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) {
      return
    }

    setIsDeletingId(id)
    try {
      await deleteTheme(id)
      await fetchThemes()
    } catch (err) {
      console.error('Failed to delete theme:', err)
    } finally {
      setIsDeletingId(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setAsDefault(id)
      await fetchThemes()
    } catch (err) {
      console.error('Failed to set default:', err)
    }
  }

  const handleApplyTheme = async (theme: UserTheme) => {
    await setActiveTheme(theme)
  }

  const handleExport = (theme: UserTheme) => {
    exportTheme(theme)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const themeData = await importTheme(file)
      // Open editor with imported theme data
      setEditingTheme(themeData as UserTheme)
      setIsEditorOpen(true)
    } catch (err) {
      console.error('Failed to import theme:', err)
      alert('Failed to import theme. Please check the file format.')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleShare = (theme: UserTheme) => {
    setShareDialogTheme(theme)
  }

  const handleCopyShareLink = () => {
    if (!shareDialogTheme) return
    const shareUrl = `${window.location.origin}/app/settings/themes/shared/${shareDialogTheme.id}`
    navigator.clipboard.writeText(shareUrl)
    alert('Share link copied to clipboard!')
  }

  const getColorPreview = (theme: UserTheme) => {
    return [
      theme.colors.background,
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.accent,
    ]
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Themes</h1>
          <p className="text-gray-600 mt-1">
            Customize your app appearance with custom themes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => handleOpenEditor()}>
            <Plus className="h-4 w-4 mr-2" />
            New Theme
          </Button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && themes.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <Card 
              key={theme.id} 
              className={`relative transition-all ${
                currentTheme?.id === theme.id 
                  ? 'ring-2 ring-primary' 
                  : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {theme.name}
                      {theme.is_default && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                      {currentTheme?.id === theme.id && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {theme.density} • {theme.shadowIntensity} shadows
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Color Preview */}
                  <div className="flex gap-2">
                    {getColorPreview(theme).map((color, idx) => (
                      <div
                        key={idx}
                        className="h-8 w-8 rounded border"
                        style={{ backgroundColor: `hsl(${color})` }}
                      />
                    ))}
                  </div>

                  {/* Typography Info */}
                  <div className="text-sm text-gray-600">
                    <p>Font: {theme.typography.baseFontSize}px</p>
                    <p>Spacing: {theme.spacing.scale}x</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyTheme(theme)}
                      className="flex-1"
                      disabled={currentTheme?.id === theme.id}
                    >
                      {currentTheme?.id === theme.id ? 'Active' : 'Apply'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditor(theme)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {!theme.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(theme.id)}
                        title="Set as default"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(theme)}
                      title="Export theme"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    {theme.is_public && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare(theme)}
                        title="Share theme"
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(theme.id)}
                      disabled={isDeletingId === theme.id}
                    >
                      {isDeletingId === theme.id ? (
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

      {themes.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-500 mb-4">No custom themes yet</p>
            <Button onClick={() => handleOpenEditor()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Theme
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Theme Editor Dialog */}
      {isEditorOpen && (
        <ThemeEditor
          theme={editingTheme}
          isOpen={isEditorOpen}
          onClose={handleCloseEditor}
          onSave={handleSaveComplete}
        />
      )}

      {/* Share Dialog */}
      <Dialog open={!!shareDialogTheme} onOpenChange={() => setShareDialogTheme(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Theme</DialogTitle>
            <DialogDescription>
              Share this theme with others via a public link
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-2">
              Anyone with this link can view and import this theme:
            </p>
            <code className="block p-3 bg-gray-100 rounded text-sm break-all">
              {shareDialogTheme && `${window.location.origin}/app/settings/themes/shared/${shareDialogTheme.id}`}
            </code>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogTheme(null)}>
              Close
            </Button>
            <Button onClick={handleCopyShareLink}>
              Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

