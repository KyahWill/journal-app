export type RoutineFrequency = 'daily' | 'weekly' | 'monthly'

export interface RoutineStep {
  id: string
  title: string
  completed: boolean
  order: number
}

export interface Routine {
  id: string
  user_id: string
  title: string
  description: string
  group: string | null
  frequency: RoutineFrequency
  steps: RoutineStep[]
  completed_dates: string[] // ISO date strings (YYYY-MM-DD)
  streak: number
  last_completed_at: Date | null
  created_at: Date
  updated_at: Date
}
