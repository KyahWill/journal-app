/**
 * Firestore Goal Collections Setup
 * 
 * This script documents and initializes the goal-related collections structure.
 * Firestore collections are created automatically when documents are added,
 * but this provides schema documentation and validation.
 */

import * as admin from 'firebase-admin'

/**
 * Goal Collection Schema
 * Collection: goals
 */
export interface GoalSchema {
  id: string
  user_id: string
  title: string // 3-200 characters
  description: string // max 2000 characters
  category: 'career' | 'health' | 'personal' | 'financial' | 'relationships' | 'learning' | 'other'
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
  target_date: admin.firestore.Timestamp
  created_at: admin.firestore.Timestamp
  updated_at: admin.firestore.Timestamp
  completed_at: admin.firestore.Timestamp | null
  status_changed_at: admin.firestore.Timestamp
  last_activity: admin.firestore.Timestamp
  progress_percentage: number // 0-100
}

/**
 * Milestone Subcollection Schema
 * Subcollection: goals/{goalId}/milestones
 */
export interface MilestoneSchema {
  id: string
  goal_id: string
  title: string // max 200 characters
  due_date: admin.firestore.Timestamp | null
  completed: boolean
  completed_at: admin.firestore.Timestamp | null
  order: number
  created_at: admin.firestore.Timestamp
}

/**
 * Progress Update Subcollection Schema
 * Subcollection: goals/{goalId}/progress_updates
 */
export interface ProgressUpdateSchema {
  id: string
  goal_id: string
  content: string // max 2000 characters
  created_at: admin.firestore.Timestamp
}

/**
 * Goal-Journal Link Collection Schema
 * Collection: goal_journal_links
 */
export interface GoalJournalLinkSchema {
  id: string
  goal_id: string
  journal_entry_id: string
  user_id: string
  created_at: admin.firestore.Timestamp
}

/**
 * Initialize goal collections with sample structure
 * This creates the collections if they don't exist
 */
export async function setupGoalCollections(firestore: admin.firestore.Firestore): Promise<void> {
  console.log('Setting up goal collections...')
  
  // Note: Firestore collections are created automatically when documents are added
  // This function documents the schema and can be used to validate structure
  
  const collections = [
    {
      name: 'goals',
      description: 'Main collection for user goals',
      schema: 'GoalSchema',
      subcollections: ['milestones', 'progress_updates']
    },
    {
      name: 'goal_journal_links',
      description: 'Links between goals and journal entries',
      schema: 'GoalJournalLinkSchema',
      subcollections: []
    }
  ]
  
  console.log('Goal collections structure:')
  collections.forEach(col => {
    console.log(`  - ${col.name}: ${col.description}`)
    if (col.subcollections.length > 0) {
      col.subcollections.forEach(sub => {
        console.log(`    └─ ${sub} (subcollection)`)
      })
    }
  })
  
  console.log('\nCollections will be created automatically when first document is added.')
  console.log('Schema validation is enforced through DTOs in the application layer.')
}

/**
 * Validate goal document structure
 */
export function validateGoalDocument(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Required fields
  if (!data.user_id) errors.push('user_id is required')
  if (!data.title) errors.push('title is required')
  if (!data.category) errors.push('category is required')
  if (!data.status) errors.push('status is required')
  if (!data.target_date) errors.push('target_date is required')
  
  // Field validations
  if (data.title && (data.title.length < 3 || data.title.length > 200)) {
    errors.push('title must be between 3 and 200 characters')
  }
  
  if (data.description && data.description.length > 2000) {
    errors.push('description must not exceed 2000 characters')
  }
  
  const validCategories = ['career', 'health', 'personal', 'financial', 'relationships', 'learning', 'other']
  if (data.category && !validCategories.includes(data.category)) {
    errors.push(`category must be one of: ${validCategories.join(', ')}`)
  }
  
  const validStatuses = ['not_started', 'in_progress', 'completed', 'abandoned']
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`)
  }
  
  if (data.progress_percentage !== undefined && (data.progress_percentage < 0 || data.progress_percentage > 100)) {
    errors.push('progress_percentage must be between 0 and 100')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate milestone document structure
 */
export function validateMilestoneDocument(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Required fields
  if (!data.goal_id) errors.push('goal_id is required')
  if (!data.title) errors.push('title is required')
  if (data.completed === undefined) errors.push('completed is required')
  if (data.order === undefined) errors.push('order is required')
  
  // Field validations
  if (data.title && data.title.length > 200) {
    errors.push('title must not exceed 200 characters')
  }
  
  if (typeof data.completed !== 'boolean') {
    errors.push('completed must be a boolean')
  }
  
  if (typeof data.order !== 'number') {
    errors.push('order must be a number')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate progress update document structure
 */
export function validateProgressUpdateDocument(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Required fields
  if (!data.goal_id) errors.push('goal_id is required')
  if (!data.content) errors.push('content is required')
  
  // Field validations
  if (data.content && data.content.length > 2000) {
    errors.push('content must not exceed 2000 characters')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate goal-journal link document structure
 */
export function validateGoalJournalLinkDocument(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Required fields
  if (!data.goal_id) errors.push('goal_id is required')
  if (!data.journal_entry_id) errors.push('journal_entry_id is required')
  if (!data.user_id) errors.push('user_id is required')
  
  return {
    valid: errors.length === 0,
    errors
  }
}
