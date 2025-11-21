import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { GeminiService } from '@/gemini/gemini.service'
import { CreateThemeDto, UpdateThemeDto, RecommendThemeDto } from '@/common/dto/theme.dto'
import { UserTheme } from '@/common/types/journal.types'

@Injectable()
export class ThemeService {
  private readonly logger = new Logger(ThemeService.name)
  private readonly collectionName = 'user_themes'

  // Default light theme matching current styling
  private readonly DEFAULT_LIGHT_THEME = {
    name: 'Light',
    is_default: true,
    is_public: false,
    colors: {
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
    },
    typography: {
      fontFamily: 'var(--font-geist-sans)',
      baseFontSize: 16,
      headingScale: 1.5,
      lineHeight: 1.5,
    },
    spacing: {
      scale: 1,
    },
    borderRadius: 0.5,
    shadowIntensity: 'subtle' as const,
    animations: {
      duration: 200,
      easing: 'ease-in-out',
    },
    density: 'comfortable' as const,
  }

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly geminiService: GeminiService,
  ) {}

  async createTheme(userId: string, createThemeDto: CreateThemeDto): Promise<UserTheme> {
    try {
      const { is_default, is_public, ...themeData } = createThemeDto

      // If setting as default, unset all other defaults
      if (is_default) {
        await this.unsetAllDefaults(userId)
      }

      // Convert DTO to plain object for Firestore (removes class prototypes)
      const plainThemeData = JSON.parse(JSON.stringify(themeData))

      const themePayload = {
        user_id: userId,
        ...plainThemeData,
        is_default: is_default || false,
        is_public: is_public || false,
      }

      const result = await this.firebaseService.addDocument(this.collectionName, themePayload)

      this.logger.log(`Theme created: ${result.id} for user: ${userId}`)

      return {
        id: result.id,
        user_id: userId,
        ...plainThemeData,
        is_default: is_default || false,
        is_public: is_public || false,
        created_at: result.created_at.toDate(),
        updated_at: result.updated_at.toDate(),
      }
    } catch (error) {
      this.logger.error('Error creating theme', error)
      throw error
    }
  }

  async getTheme(themeId: string, userId: string): Promise<UserTheme> {
    try {
      const theme = await this.firebaseService.getDocument(this.collectionName, themeId)

      if (!theme) {
        throw new NotFoundException('Theme not found')
      }

      if (theme.user_id !== userId && !theme.is_public) {
        throw new NotFoundException('You do not have access to this theme')
      }

      return this.mapToUserTheme(theme)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error('Error fetching theme', error)
      throw error
    }
  }

  async getPublicTheme(themeId: string): Promise<UserTheme> {
    try {
      const theme = await this.firebaseService.getDocument(this.collectionName, themeId)

      if (!theme) {
        throw new NotFoundException('Theme not found')
      }

      if (!theme.is_public) {
        throw new NotFoundException('This theme is not public')
      }

      return this.mapToUserTheme(theme)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error('Error fetching public theme', error)
      throw error
    }
  }

  async getAllThemes(userId: string): Promise<UserTheme[]> {
    try {
      const themes = await this.firebaseService.getCollection(
        this.collectionName,
        [{ field: 'user_id', operator: '==', value: userId }],
        'created_at',
        'desc',
      )

      return themes.map((theme: any) => this.mapToUserTheme(theme))
    } catch (error) {
      this.logger.error('Error fetching themes', error)
      throw error
    }
  }

  async getDefaultTheme(userId: string): Promise<UserTheme> {
    try {
      const themes = await this.firebaseService.getCollection(
        this.collectionName,
        [
          { field: 'user_id', operator: '==', value: userId },
          { field: 'is_default', operator: '==', value: true },
        ],
      )

      if (themes.length > 0) {
        return this.mapToUserTheme(themes[0])
      }

      // If no default found, create one automatically
      return this.createDefaultTheme(userId)
    } catch (error) {
      this.logger.error('Error fetching default theme', error)
      throw error
    }
  }

  async updateTheme(
    themeId: string,
    userId: string,
    updateThemeDto: UpdateThemeDto,
  ): Promise<UserTheme> {
    try {
      // Verify theme belongs to user
      await this.getTheme(themeId, userId)

      // If setting as default, unset all other defaults
      if (updateThemeDto.is_default) {
        await this.unsetAllDefaults(userId)
      }

      // Convert DTO to plain object for Firestore (removes class prototypes)
      const plainUpdateData = JSON.parse(JSON.stringify(updateThemeDto))

      await this.firebaseService.updateDocument(this.collectionName, themeId, plainUpdateData)

      return this.getTheme(themeId, userId)
    } catch (error) {
      this.logger.error('Error updating theme', error)
      throw error
    }
  }

  async deleteTheme(themeId: string, userId: string): Promise<void> {
    try {
      const theme = await this.getTheme(themeId, userId)

      // Don't allow deleting the default theme if it's the only one
      if (theme.is_default) {
        const allThemes = await this.getAllThemes(userId)
        if (allThemes.length === 1) {
          throw new BadRequestException(
            'Cannot delete the default theme. Create another theme first or set another as default.',
          )
        }
      }

      await this.firebaseService.deleteDocument(this.collectionName, themeId)

      this.logger.log(`Theme deleted: ${themeId} for user: ${userId}`)
    } catch (error) {
      this.logger.error('Error deleting theme', error)
      throw error
    }
  }

  async setAsDefault(themeId: string, userId: string): Promise<UserTheme> {
    try {
      // Verify theme belongs to user
      await this.getTheme(themeId, userId)

      // Unset all other defaults
      await this.unsetAllDefaults(userId)

      // Set this one as default
      await this.firebaseService.updateDocument(this.collectionName, themeId, {
        is_default: true,
      })

      this.logger.log(`Theme set as default: ${themeId} for user: ${userId}`)

      return this.getTheme(themeId, userId)
    } catch (error) {
      this.logger.error('Error setting default theme', error)
      throw error
    }
  }

  async getRecommendations(
    userId: string,
    recommendThemeDto: RecommendThemeDto,
  ): Promise<{ suggestions: string }> {
    try {
      const { mood, preferences } = recommendThemeDto

      const prompt = `You are a UI/UX design expert specializing in color theory and theme design.

User context:
${mood ? `- Current mood/preference: ${mood}` : ''}
${preferences ? `- Additional preferences: ${preferences}` : ''}

Generate a color scheme recommendation for a journaling application theme. Provide:
1. A color palette with background, foreground, primary, secondary, accent, and muted colors
2. Explanation of the psychology behind your color choices
3. Suggestions for typography (font pairing, sizes)
4. Spacing and density recommendations

Format your response as JSON with this structure:
{
  "colors": {
    "background": "HSL value (e.g., '0 0% 100%')",
    "foreground": "HSL value",
    "primary": "HSL value",
    "secondary": "HSL value",
    "accent": "HSL value",
    "muted": "HSL value"
  },
  "explanation": "Brief explanation of color psychology",
  "typography": {
    "suggestion": "Font pairing suggestion",
    "baseFontSize": 16
  },
  "spacing": "Recommendation for density and spacing"
}`

      const result = await this.geminiService.analyzePrompt(prompt)

      return { suggestions: result.suggestions }
    } catch (error) {
      this.logger.error('Error generating theme recommendations', error)
      throw error
    }
  }

  private async unsetAllDefaults(userId: string): Promise<void> {
    try {
      const defaultThemes = await this.firebaseService.getCollection(
        this.collectionName,
        [
          { field: 'user_id', operator: '==', value: userId },
          { field: 'is_default', operator: '==', value: true },
        ],
      )

      for (const theme of defaultThemes) {
        await this.firebaseService.updateDocument(this.collectionName, theme.id, {
          is_default: false,
        })
      }
    } catch (error) {
      this.logger.error('Error unsetting defaults', error)
      throw error
    }
  }

  private async createDefaultTheme(userId: string): Promise<UserTheme> {
    this.logger.log(`Creating default theme for user: ${userId}`)
    return this.createTheme(userId, this.DEFAULT_LIGHT_THEME as CreateThemeDto)
  }

  private mapToUserTheme(theme: any): UserTheme {
    return {
      id: theme.id,
      user_id: theme.user_id,
      name: theme.name,
      is_default: theme.is_default || false,
      is_public: theme.is_public || false,
      colors: theme.colors,
      typography: theme.typography,
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
      shadowIntensity: theme.shadowIntensity,
      animations: theme.animations,
      density: theme.density,
      created_at: theme.created_at?.toDate() || new Date(),
      updated_at: theme.updated_at?.toDate() || new Date(),
    }
  }
}

