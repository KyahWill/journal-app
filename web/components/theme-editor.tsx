'use client'

import { useState, useEffect } from 'react'
import { useThemes } from '@/lib/hooks/useThemes'
import {
  UserTheme,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeAnimations,
  ThemeDensity,
  ThemeShadowIntensity,
} from '@/lib/api/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ThemePreview } from '@/components/theme-preview'
import { ColorPicker } from '@/components/ui/color-picker'

interface ThemeEditorProps {
  theme: UserTheme | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

type TabType = 'colors' | 'typography' | 'spacing' | 'visual' | 'animations' | 'preview'

export function ThemeEditor({ theme, isOpen, onClose, onSave }: ThemeEditorProps) {
  const { createTheme, updateTheme, getRecommendations } = useThemes()
  
  const [activeTab, setActiveTab] = useState<TabType>('colors')
  const [isSaving, setIsSaving] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string>('')

  // Form state
  const [name, setName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [colors, setColors] = useState<ThemeColors>({
    background: '0 0% 100%',
    foreground: '0 0% 3.9%',
    card: '0 0% 100%',
    cardForeground: '0 0% 3.9%',
    popover: '0 0% 100%',
    popoverForeground: '0 0% 3.9%',
    primary: '0 0% 9%',
    primaryForeground: '0 0% 98%',
    secondary: '0 0% 96.1%',
    secondaryForeground: '0 0% 9%',
    muted: '0 0% 96.1%',
    mutedForeground: '0 0% 45.1%',
    accent: '0 0% 96.1%',
    accentForeground: '0 0% 9%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 98%',
    border: '0 0% 89.8%',
    input: '0 0% 89.8%',
    ring: '0 0% 3.9%',
  })
  const [typography, setTypography] = useState<ThemeTypography>({
    fontFamily: 'var(--font-geist-sans)',
    baseFontSize: 16,
    headingScale: 1.5,
    lineHeight: 1.5,
  })
  const [spacing, setSpacing] = useState<ThemeSpacing>({ scale: 1 })
  const [borderRadius, setBorderRadius] = useState(0.5)
  const [shadowIntensity, setShadowIntensity] = useState<ThemeShadowIntensity>('subtle')
  const [animations, setAnimations] = useState<ThemeAnimations>({
    duration: 200,
    easing: 'ease-in-out',
  })
  const [density, setDensity] = useState<ThemeDensity>('comfortable')

  useEffect(() => {
    if (theme) {
      setName(theme.name)
      setIsDefault(theme.is_default)
      setIsPublic(theme.is_public)
      setColors(theme.colors)
      setTypography(theme.typography)
      setSpacing(theme.spacing)
      setBorderRadius(theme.borderRadius)
      setShadowIntensity(theme.shadowIntensity)
      setAnimations(theme.animations)
      setDensity(theme.density)
    } else {
      // Reset to defaults for new theme
      setName('')
      setIsDefault(false)
      setIsPublic(false)
    }
  }, [theme])

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a theme name')
      return
    }

    setIsSaving(true)
    try {
      const themeData = {
        name,
        is_default: isDefault,
        is_public: isPublic,
        colors,
        typography,
        spacing,
        borderRadius,
        shadowIntensity,
        animations,
        density,
      }

      // Only update if theme has a valid ID (not imported/new theme)
      if (theme && theme.id && theme.id !== 'preview') {
        await updateTheme(theme.id, themeData)
      } else {
        await createTheme(themeData)
      }

      onSave()
    } catch (err) {
      console.error('Failed to save theme:', err)
      alert('Failed to save theme. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGetAIRecommendations = async () => {
    setLoadingAI(true)
    try {
      const suggestions = await getRecommendations({
        mood: 'creative and professional',
        preferences: `Current theme: ${name || 'New Theme'}`,
      })
      setAiSuggestions(suggestions)
    } catch (err) {
      console.error('Failed to get AI recommendations:', err)
    } finally {
      setLoadingAI(false)
    }
  }

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setColors({ ...colors, [key]: value })
  }

  const previewTheme: UserTheme = {
    id: 'preview',
    user_id: 'preview',
    name,
    is_default: isDefault,
    is_public: isPublic,
    colors,
    typography,
    spacing,
    borderRadius,
    shadowIntensity,
    animations,
    density,
    created_at: new Date(),
    updated_at: new Date(),
  }

  const tabs = [
    { id: 'colors' as TabType, label: 'Colors' },
    { id: 'typography' as TabType, label: 'Typography' },
    { id: 'spacing' as TabType, label: 'Spacing' },
    { id: 'visual' as TabType, label: 'Visual' },
    { id: 'animations' as TabType, label: 'Animations' },
    { id: 'preview' as TabType, label: 'Preview' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {theme ? 'Edit Theme' : 'Create New Theme'}
          </DialogTitle>
          <DialogDescription>
            Customize every aspect of your app's appearance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="name">Theme Name</Label>
            <Input
              id="name"
              placeholder="e.g., Ocean Blue, Dark Mode"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Set as default</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Make public (shareable)</span>
            </label>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'colors' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Color Palette</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGetAIRecommendations}
                    disabled={loadingAI}
                  >
                    {loadingAI ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    AI Suggestions
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {Object.keys(colors).map((key) => (
                    <ColorPicker
                      key={key}
                      label={key}
                      value={colors[key as keyof ThemeColors]}
                      onChange={(value) => updateColor(key as keyof ThemeColors, value)}
                    />
                  ))}
                </div>

                {aiSuggestions && (
                  <Card className="mt-4 bg-purple-50">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-2">AI Suggestions</h4>
                      <pre className="text-sm whitespace-pre-wrap">{aiSuggestions}</pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'typography' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Typography Settings</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Input
                    id="fontFamily"
                    value={typography.fontFamily}
                    onChange={(e) => setTypography({ ...typography, fontFamily: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseFontSize">Base Font Size (px): {typography.baseFontSize}</Label>
                  <input
                    type="range"
                    id="baseFontSize"
                    min="10"
                    max="24"
                    value={typography.baseFontSize}
                    onChange={(e) => setTypography({ ...typography, baseFontSize: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headingScale">Heading Scale: {typography.headingScale}</Label>
                  <input
                    type="range"
                    id="headingScale"
                    min="1"
                    max="2"
                    step="0.1"
                    value={typography.headingScale}
                    onChange={(e) => setTypography({ ...typography, headingScale: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lineHeight">Line Height: {typography.lineHeight}</Label>
                  <input
                    type="range"
                    id="lineHeight"
                    min="1"
                    max="2.5"
                    step="0.1"
                    value={typography.lineHeight}
                    onChange={(e) => setTypography({ ...typography, lineHeight: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {activeTab === 'spacing' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Spacing & Density</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="spacingScale">Spacing Scale: {spacing.scale}x</Label>
                  <input
                    type="range"
                    id="spacingScale"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={spacing.scale}
                    onChange={(e) => setSpacing({ scale: Number(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">Adjusts padding and margins throughout the app</p>
                </div>

                <div className="space-y-2">
                  <Label>Layout Density</Label>
                  <div className="flex gap-2">
                    {(['compact', 'comfortable', 'spacious'] as ThemeDensity[]).map((d) => (
                      <Button
                        key={d}
                        variant={density === d ? 'default' : 'outline'}
                        onClick={() => setDensity(d)}
                        className="flex-1 capitalize"
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'visual' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Visual Effects</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Border Radius: {borderRadius}rem</Label>
                  <input
                    type="range"
                    id="borderRadius"
                    min="0"
                    max="2"
                    step="0.1"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Shadow Intensity</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['none', 'subtle', 'medium', 'strong'] as ThemeShadowIntensity[]).map((s) => (
                      <Button
                        key={s}
                        variant={shadowIntensity === s ? 'default' : 'outline'}
                        onClick={() => setShadowIntensity(s)}
                        className="capitalize"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'animations' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Animation Settings</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration: {animations.duration}ms</Label>
                  <input
                    type="range"
                    id="duration"
                    min="0"
                    max="1000"
                    step="50"
                    value={animations.duration}
                    onChange={(e) => setAnimations({ ...animations, duration: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="easing">Easing Function</Label>
                  <select
                    id="easing"
                    value={animations.easing}
                    onChange={(e) => setAnimations({ ...animations, easing: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="ease-in-out">Ease In Out</option>
                    <option value="ease-in">Ease In</option>
                    <option value="ease-out">Ease Out</option>
                    <option value="linear">Linear</option>
                    <option value="cubic-bezier(0.4, 0, 0.2, 1)">Custom Cubic</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Live Preview</h3>
                <ThemePreview theme={previewTheme} />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Theme'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

