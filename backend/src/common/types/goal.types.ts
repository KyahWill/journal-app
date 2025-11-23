export type GoalCategory = 'career' | 'health' | 'personal' | 'financial' | 'relationships' | 'learning' | 'other'

export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned'

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string
  category: string // Can be a default category or custom category ID
  status: GoalStatus
  target_date: Date
  created_at: Date
  updated_at: Date
  completed_at: Date | null
  status_changed_at: Date
  last_activity: Date
  progress_percentage: number
}

export interface Milestone {
  id: string
  goal_id: string
  title: string
  due_date: Date | null
  completed: boolean
  completed_at: Date | null
  order: number
  created_at: Date
}

export interface ProgressUpdate {
  id: string
  goal_id: string
  content: string
  created_at: Date
}

export interface GoalJournalLink {
  id: string
  goal_id: string
  journal_entry_id: string
  user_id: string
  created_at: Date
}
