export type DefaultGoalCategory = 'career' | 'health' | 'personal' | 'financial' | 'relationships' | 'learning' | 'other'

export interface CustomCategory {
  id: string
  user_id: string
  name: string
  color?: string // Optional hex color for UI
  icon?: string // Optional icon name
  created_at: Date
  updated_at: Date
}

export interface CategoryWithType extends CustomCategory {
  is_default: boolean
}
