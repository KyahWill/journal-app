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

