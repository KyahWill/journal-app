export interface JournalEntry {
  id: string
  user_id: string
  title: string
  content: string
  mood?: string
  tags?: string[]
  created_at: Date
  updated_at: Date
}

export interface JournalEntryWithGoals extends JournalEntry {
  linked_goal_ids?: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  user_id: string
  title?: string
  messages: ChatMessage[]
  personality_id?: string
  created_at: Date
  updated_at: Date
}

export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
}

export interface ThemeTypography {
  fontFamily: string
  baseFontSize: number
  headingScale: number
  lineHeight: number
}

export interface ThemeSpacing {
  scale: number
}

export interface ThemeAnimations {
  duration: number
  easing: string
}

export type ThemeDensity = 'comfortable' | 'compact' | 'spacious'
export type ThemeShadowIntensity = 'none' | 'subtle' | 'medium' | 'strong'

export interface UserTheme {
  id: string
  user_id: string
  name: string
  is_default: boolean
  is_public: boolean
  colors: ThemeColors
  typography: ThemeTypography
  spacing: ThemeSpacing
  borderRadius: number
  shadowIntensity: ThemeShadowIntensity
  animations: ThemeAnimations
  density: ThemeDensity
  created_at: Date
  updated_at: Date
}

export interface WeeklyInsight {
  id: string
  user_id: string
  week_start: Date  // Saturday start of the week
  week_end: Date    // Friday end of the week
  content: string   // The generated insights markdown
  entry_count: number
  created_at: Date
  updated_at: Date
}

