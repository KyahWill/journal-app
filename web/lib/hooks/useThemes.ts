import { useState, useCallback, useEffect } from 'react'
import { apiClient, UserTheme, ThemeColors, ThemeTypography, ThemeSpacing, ThemeAnimations, ThemeDensity, ThemeShadowIntensity } from '@/lib/api/client'
import { useThemeContext } from '@/lib/contexts/ThemeContext'

export function useThemes() {
  const [themes, setThemes] = useState<UserTheme[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { applyTheme, currentTheme } = useThemeContext()

  const fetchThemes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getUserThemes()
      setThemes(data)
      return data
    } catch (err: any) {
      setError(err.message || 'Failed to fetch themes')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDefaultTheme = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const theme = await apiClient.getDefaultTheme()
      return theme
    } catch (err: any) {
      setError(err.message || 'Failed to fetch default theme')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createTheme = useCallback(async (data: {
    name: string
    is_default?: boolean
    is_public?: boolean
    colors: ThemeColors
    typography: ThemeTypography
    spacing: ThemeSpacing
    borderRadius: number
    shadowIntensity: ThemeShadowIntensity
    animations: ThemeAnimations
    density: ThemeDensity
  }) => {
    setLoading(true)
    setError(null)
    try {
      const theme = await apiClient.createTheme(data)
      return theme
    } catch (err: any) {
      setError(err.message || 'Failed to create theme')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTheme = useCallback(async (id: string, data: {
    name?: string
    is_default?: boolean
    is_public?: boolean
    colors?: ThemeColors
    typography?: ThemeTypography
    spacing?: ThemeSpacing
    borderRadius?: number
    shadowIntensity?: ThemeShadowIntensity
    animations?: ThemeAnimations
    density?: ThemeDensity
  }) => {
    setLoading(true)
    setError(null)
    try {
      const theme = await apiClient.updateTheme(id, data)
      return theme
    } catch (err: any) {
      setError(err.message || 'Failed to update theme')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTheme = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.deleteTheme(id)
    } catch (err: any) {
      setError(err.message || 'Failed to delete theme')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const setAsDefault = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const theme = await apiClient.setDefaultTheme(id)
      return theme
    } catch (err: any) {
      setError(err.message || 'Failed to set default theme')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const setActiveTheme = useCallback(async (theme: UserTheme) => {
    applyTheme(theme)
  }, [applyTheme])

  const getRecommendations = useCallback(async (data: {
    mood?: string
    preferences?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getThemeRecommendations(data)
      return response.suggestions
    } catch (err: any) {
      setError(err.message || 'Failed to get recommendations')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getPublicTheme = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const theme = await apiClient.getPublicTheme(id)
      return theme
    } catch (err: any) {
      setError(err.message || 'Failed to fetch public theme')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const exportTheme = useCallback((theme: UserTheme) => {
    const themeData = JSON.stringify(theme, null, 2)
    const blob = new Blob([themeData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${theme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const importTheme = useCallback((file: File): Promise<Partial<UserTheme>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const theme = JSON.parse(e.target?.result as string)
          // Remove id, user_id, created_at, updated_at for importing
          const { id, user_id, created_at, updated_at, ...themeData } = theme
          resolve(themeData)
        } catch (err) {
          reject(new Error('Invalid theme file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  // Theme loading is handled by ThemeLoader component in the root layout

  return {
    themes,
    currentTheme,
    loading,
    error,
    fetchThemes,
    fetchDefaultTheme,
    createTheme,
    updateTheme,
    deleteTheme,
    setAsDefault,
    setActiveTheme,
    getRecommendations,
    getPublicTheme,
    exportTheme,
    importTheme,
  }
}

