'use client'

import { useEffect } from 'react'
import { useThemes } from '@/lib/hooks/useThemes'

export function ThemeLoader() {
  const { fetchDefaultTheme, setActiveTheme } = useThemes()

  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Check if there's a stored theme ID
        const storedThemeId = localStorage.getItem('active-theme-id')
        
        if (storedThemeId && storedThemeId !== 'preview') {
          // Try to load the stored theme
          const { apiClient } = await import('@/lib/api/client')
          const theme = await apiClient.getTheme(storedThemeId)
          await setActiveTheme(theme)
        } else {
          // Load default theme
          const defaultTheme = await fetchDefaultTheme()
          await setActiveTheme(defaultTheme)
        }
      } catch (error) {
        console.error('Failed to load theme:', error)
        // If loading fails, try to load default theme
        try {
          const defaultTheme = await fetchDefaultTheme()
          await setActiveTheme(defaultTheme)
        } catch (err) {
          console.error('Failed to load default theme:', err)
        }
      }
    }

    loadTheme()
  }, [fetchDefaultTheme, setActiveTheme])

  return null
}

