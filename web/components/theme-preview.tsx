'use client'

import { UserTheme } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ThemePreviewProps {
  theme: UserTheme
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  const previewStyles = {
    '--preview-background': theme.colors.background,
    '--preview-foreground': theme.colors.foreground,
    '--preview-card': theme.colors.card,
    '--preview-card-foreground': theme.colors.cardForeground,
    '--preview-primary': theme.colors.primary,
    '--preview-primary-foreground': theme.colors.primaryForeground,
    '--preview-secondary': theme.colors.secondary,
    '--preview-secondary-foreground': theme.colors.secondaryForeground,
    '--preview-muted': theme.colors.muted,
    '--preview-muted-foreground': theme.colors.mutedForeground,
    '--preview-accent': theme.colors.accent,
    '--preview-accent-foreground': theme.colors.accentForeground,
    '--preview-destructive': theme.colors.destructive,
    '--preview-destructive-foreground': theme.colors.destructiveForeground,
    '--preview-border': theme.colors.border,
    '--preview-input': theme.colors.input,
    '--preview-ring': theme.colors.ring,
    '--preview-radius': `${theme.borderRadius}rem`,
    '--preview-font-size': `${theme.typography.baseFontSize}px`,
    '--preview-line-height': theme.typography.lineHeight,
    '--preview-spacing': `calc(1rem * ${theme.spacing.scale} * ${theme.density === 'compact' ? 0.75 : theme.density === 'spacious' ? 1.25 : 1})`,
  } as React.CSSProperties

  const shadowStyles = {
    none: 'shadow-none',
    subtle: 'shadow-sm',
    medium: 'shadow-md',
    strong: 'shadow-lg',
  }

  return (
    <div 
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: `hsl(${theme.colors.background})`,
        color: `hsl(${theme.colors.foreground})`,
        fontSize: `${theme.typography.baseFontSize}px`,
        lineHeight: theme.typography.lineHeight,
        ...previewStyles,
      }}
    >
      <div className="space-y-6">
        {/* Typography Preview */}
        <div>
          <h1 
            className="font-bold mb-2"
            style={{
              fontSize: `${theme.typography.baseFontSize * theme.typography.headingScale * theme.typography.headingScale}px`,
            }}
          >
            Heading 1
          </h1>
          <h2 
            className="font-semibold mb-2"
            style={{
              fontSize: `${theme.typography.baseFontSize * theme.typography.headingScale}px`,
            }}
          >
            Heading 2
          </h2>
          <p className="mb-2">
            This is regular body text. The quick brown fox jumps over the lazy dog.
          </p>
          <p 
            className="text-sm"
            style={{ color: `hsl(${theme.colors.mutedForeground})` }}
          >
            This is muted secondary text for less important information.
          </p>
        </div>

        {/* Buttons Preview */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Buttons</h3>
          <div 
            className="flex flex-wrap gap-2"
            style={{ gap: `calc(0.5rem * ${theme.spacing.scale})` }}
          >
            <button
              className={`px-4 py-2 rounded font-medium ${shadowStyles[theme.shadowIntensity]}`}
              style={{
                backgroundColor: `hsl(${theme.colors.primary})`,
                color: `hsl(${theme.colors.primaryForeground})`,
                borderRadius: `${theme.borderRadius}rem`,
                transition: `all ${theme.animations.duration}ms ${theme.animations.easing}`,
              }}
            >
              Primary Button
            </button>
            <button
              className={`px-4 py-2 rounded font-medium ${shadowStyles[theme.shadowIntensity]}`}
              style={{
                backgroundColor: `hsl(${theme.colors.secondary})`,
                color: `hsl(${theme.colors.secondaryForeground})`,
                borderRadius: `${theme.borderRadius}rem`,
                transition: `all ${theme.animations.duration}ms ${theme.animations.easing}`,
              }}
            >
              Secondary Button
            </button>
            <button
              className={`px-4 py-2 rounded font-medium border ${shadowStyles[theme.shadowIntensity]}`}
              style={{
                borderColor: `hsl(${theme.colors.border})`,
                backgroundColor: 'transparent',
                color: `hsl(${theme.colors.foreground})`,
                borderRadius: `${theme.borderRadius}rem`,
                transition: `all ${theme.animations.duration}ms ${theme.animations.easing}`,
              }}
            >
              Outline Button
            </button>
            <button
              className={`px-4 py-2 rounded font-medium ${shadowStyles[theme.shadowIntensity]}`}
              style={{
                backgroundColor: `hsl(${theme.colors.destructive})`,
                color: `hsl(${theme.colors.destructiveForeground})`,
                borderRadius: `${theme.borderRadius}rem`,
                transition: `all ${theme.animations.duration}ms ${theme.animations.easing}`,
              }}
            >
              Destructive
            </button>
          </div>
        </div>

        {/* Card Preview */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Cards</h3>
          <div 
            className={`border p-4 ${shadowStyles[theme.shadowIntensity]}`}
            style={{
              backgroundColor: `hsl(${theme.colors.card})`,
              color: `hsl(${theme.colors.cardForeground})`,
              borderColor: `hsl(${theme.colors.border})`,
              borderRadius: `${theme.borderRadius}rem`,
              padding: `calc(1rem * ${theme.spacing.scale})`,
            }}
          >
            <h4 className="font-semibold mb-2">Card Title</h4>
            <p 
              className="text-sm mb-3"
              style={{ color: `hsl(${theme.colors.mutedForeground})` }}
            >
              This is a card description with some sample text to show how content looks.
            </p>
            <button
              className="px-3 py-1 rounded text-sm"
              style={{
                backgroundColor: `hsl(${theme.colors.accent})`,
                color: `hsl(${theme.colors.accentForeground})`,
                borderRadius: `${theme.borderRadius}rem`,
              }}
            >
              Card Action
            </button>
          </div>
        </div>

        {/* Form Elements Preview */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Form Elements</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Text input"
              className={`w-full px-3 py-2 border ${shadowStyles[theme.shadowIntensity]}`}
              style={{
                backgroundColor: `hsl(${theme.colors.background})`,
                borderColor: `hsl(${theme.colors.input})`,
                color: `hsl(${theme.colors.foreground})`,
                borderRadius: `${theme.borderRadius}rem`,
              }}
              readOnly
            />
            <select
              className={`w-full px-3 py-2 border ${shadowStyles[theme.shadowIntensity]}`}
              style={{
                backgroundColor: `hsl(${theme.colors.background})`,
                borderColor: `hsl(${theme.colors.input})`,
                color: `hsl(${theme.colors.foreground})`,
                borderRadius: `${theme.borderRadius}rem`,
              }}
            >
              <option>Select an option</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </div>

        {/* Alert Preview */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Alerts</h3>
          <div 
            className={`border p-3 ${shadowStyles[theme.shadowIntensity]}`}
            style={{
              backgroundColor: `hsl(${theme.colors.muted})`,
              borderColor: `hsl(${theme.colors.border})`,
              borderRadius: `${theme.borderRadius}rem`,
              padding: `calc(0.75rem * ${theme.spacing.scale})`,
            }}
          >
            <p 
              className="text-sm"
              style={{ color: `hsl(${theme.colors.foreground})` }}
            >
              This is an informational alert message.
            </p>
          </div>
        </div>

        {/* Density Info */}
        <div 
          className="border-t pt-3 text-sm"
          style={{ 
            borderColor: `hsl(${theme.colors.border})`,
            paddingTop: `calc(0.75rem * ${theme.spacing.scale})`,
          }}
        >
          <p style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
            Density: <strong>{theme.density}</strong> • 
            Spacing: <strong>{theme.spacing.scale}x</strong> • 
            Animations: <strong>{theme.animations.duration}ms</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

