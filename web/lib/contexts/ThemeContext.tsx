'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { UserTheme } from '@/lib/api/client'

interface ThemeContextType {
  currentTheme: UserTheme | null
  setCurrentTheme: (theme: UserTheme) => void
  applyTheme: (theme: UserTheme) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<UserTheme | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const applyTheme = useCallback((theme: UserTheme) => {
    if (typeof window === 'undefined') return

    const root = document.documentElement

    // Apply colors
    root.style.setProperty('--background', theme.colors.background)
    root.style.setProperty('--foreground', theme.colors.foreground)
    root.style.setProperty('--card', theme.colors.card)
    root.style.setProperty('--card-foreground', theme.colors.cardForeground)
    root.style.setProperty('--popover', theme.colors.popover)
    root.style.setProperty('--popover-foreground', theme.colors.popoverForeground)
    root.style.setProperty('--primary', theme.colors.primary)
    root.style.setProperty('--primary-foreground', theme.colors.primaryForeground)
    root.style.setProperty('--secondary', theme.colors.secondary)
    root.style.setProperty('--secondary-foreground', theme.colors.secondaryForeground)
    root.style.setProperty('--muted', theme.colors.muted)
    root.style.setProperty('--muted-foreground', theme.colors.mutedForeground)
    root.style.setProperty('--accent', theme.colors.accent)
    root.style.setProperty('--accent-foreground', theme.colors.accentForeground)
    root.style.setProperty('--destructive', theme.colors.destructive)
    root.style.setProperty('--destructive-foreground', theme.colors.destructiveForeground)
    root.style.setProperty('--border', theme.colors.border)
    root.style.setProperty('--input', theme.colors.input)
    root.style.setProperty('--ring', theme.colors.ring)

    // Apply typography
    root.style.setProperty('--font-family', theme.typography.fontFamily)
    root.style.setProperty('--base-font-size', `${theme.typography.baseFontSize}px`)
    root.style.setProperty('--heading-scale', theme.typography.headingScale.toString())
    root.style.setProperty('--line-height', theme.typography.lineHeight.toString())

    // Apply spacing
    root.style.setProperty('--spacing-scale', theme.spacing.scale.toString())

    // Apply border radius
    root.style.setProperty('--radius', `${theme.borderRadius}rem`)

    // Apply shadow intensity
    const shadowValues = {
      none: '0 0 0 0 transparent',
      subtle: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      medium: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      strong: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    }
    root.style.setProperty('--shadow', shadowValues[theme.shadowIntensity])

    // Apply animations
    root.style.setProperty('--animation-duration', `${theme.animations.duration}ms`)
    root.style.setProperty('--animation-easing', theme.animations.easing)

    // Apply density
    const densityValues = {
      compact: '0.75',
      comfortable: '1',
      spacious: '1.25',
    }
    root.style.setProperty('--density', densityValues[theme.density])

    // Store theme ID in localStorage
    localStorage.setItem('active-theme-id', theme.id)

    setCurrentTheme(theme)
  }, [])

  useEffect(() => {
    // Load theme from localStorage on mount
    const storedThemeId = localStorage.getItem('active-theme-id')
    if (storedThemeId) {
      // Theme will be loaded by the component that uses useTheme hook
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, applyTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}

