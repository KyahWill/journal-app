'use client'

import { useState, useEffect } from 'react'
import { useGoals } from '@/lib/contexts/goal-context'
import { Goal, CreateGoalData, UpdateGoalData, apiClient, CategoryWithType, CustomCategory } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, X, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface GoalFormProps {
  goal?: Goal
  onSuccess?: (goal: Goal) => void
  onCancel?: () => void
}

interface MilestoneInput {
  id: string
  title: string
  due_date: string
}

interface FormErrors {
  title?: string
  description?: string
  category?: string
  target_date?: string
  milestones?: { [key: string]: string }
}

export function GoalForm({ goal, onSuccess, onCancel }: GoalFormProps) {
  const { createGoal, updateGoal, addMilestone } = useGoals()
  
  // Form state
  const [title, setTitle] = useState(goal?.title || '')
  const [description, setDescription] = useState(goal?.description || '')
  const [category, setCategory] = useState<string | CustomCategory>(goal?.category || 'personal')
  const [targetDate, setTargetDate] = useState(
    goal?.target_date ? format(new Date(goal.target_date), 'yyyy-MM-dd') : ''
  )
  const [milestones, setMilestones] = useState<MilestoneInput[]>([])
  
  // Categories state
  const [categories, setCategories] = useState<CategoryWithType[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true)
      const data = await apiClient.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const isEditMode = !!goal

  // Validation functions
  const validateTitle = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Title is required'
    }
    if (value.length < 3) {
      return 'Title must be at least 3 characters'
    }
    if (value.length > 200) {
      return 'Title must not exceed 200 characters'
    }
    return undefined
  }

  const validateDescription = (value: string): string | undefined => {
    if (value.length > 2000) {
      return 'Description must not exceed 2000 characters'
    }
    return undefined
  }

  const validateTargetDate = (value: string): string | undefined => {
    if (!value) {
      return 'Target date is required'
    }
    const selectedDate = new Date(value)
    selectedDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      return 'Target date must be today or in the future'
    }
    return undefined
  }

  const validateMilestoneTitle = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Milestone title is required'
    }
    if (value.length > 200) {
      return 'Milestone title must not exceed 200 characters'
    }
    return undefined
  }

  // Handle field changes with validation
  const handleTitleChange = (value: string) => {
    setTitle(value)
    const error = validateTitle(value)
    setErrors((prev) => ({ ...prev, title: error }))
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    const error = validateDescription(value)
    setErrors((prev) => ({ ...prev, description: error }))
  }

  const handleTargetDateChange = (value: string) => {
    setTargetDate(value)
    const error = validateTargetDate(value)
    setErrors((prev) => ({ ...prev, target_date: error }))
  }

  // Milestone management
  const addMilestoneInput = () => {
    setMilestones([
      ...milestones,
      { id: `temp-${Date.now()}`, title: '', due_date: '' },
    ])
  }

  const removeMilestoneInput = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id))
    setErrors((prev) => {
      const newErrors = { ...prev }
      if (newErrors.milestones) {
        delete newErrors.milestones[id]
      }
      return newErrors
    })
  }

  const updateMilestoneInput = (id: string, field: 'title' | 'due_date', value: string) => {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    )
    
    // Validate milestone title
    if (field === 'title') {
      const error = validateMilestoneTitle(value)
      setErrors((prev) => ({
        ...prev,
        milestones: {
          ...prev.milestones,
          [id]: error || '',
        },
      }))
    }
  }

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    const titleError = validateTitle(title)
    if (titleError) newErrors.title = titleError
    
    const descriptionError = validateDescription(description)
    if (descriptionError) newErrors.description = descriptionError
    
    const targetDateError = validateTargetDate(targetDate)
    if (targetDateError) newErrors.target_date = targetDateError
    
    // Validate milestones
    const milestoneErrors: { [key: string]: string } = {}
    milestones.forEach((milestone) => {
      const error = validateMilestoneTitle(milestone.title)
      if (error) {
        milestoneErrors[milestone.id] = error
      }
    })
    if (Object.keys(milestoneErrors).length > 0) {
      newErrors.milestones = milestoneErrors
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous messages
    setSubmitError(null)
    setSuccessMessage(null)
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (isEditMode) {
        // Update existing goal
        const updateData: UpdateGoalData = {
          title,
          description,
          category,
          target_date: targetDate,
        }
        
        const updatedGoal = await updateGoal(goal.id, updateData)
        setSuccessMessage('Goal updated successfully!')
        
        if (onSuccess) {
          onSuccess(updatedGoal)
        }
      } else {
        // Create new goal
        const createData: CreateGoalData = {
          title,
          description,
          category,
          target_date: targetDate,
        }
        
        const newGoal = await createGoal(createData)
        
        // Add milestones if any
        if (milestones.length > 0) {
          for (const milestone of milestones) {
            if (milestone.title.trim()) {
              await addMilestone(newGoal.id, {
                title: milestone.title,
                due_date: milestone.due_date || undefined,
              })
            }
          }
        }
        
        setSuccessMessage('Goal created successfully!')
        
        // Reset form
        setTitle('')
        setDescription('')
        setCategory('personal')
        setTargetDate('')
        setMilestones([])
        setErrors({})
        
        if (onSuccess) {
          onSuccess(newGoal)
        }
      }
    } catch (error: any) {
      console.error('Failed to save goal:', error)
      setSubmitError(error.message || 'Failed to save goal. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get minimum date (today)
  const getMinDate = () => {
    return format(new Date(), 'yyyy-MM-dd')
  }

  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">{isEditMode ? 'Edit Goal' : 'Create New Goal'}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Success Message */}
          {successMessage && (
            <Alert className="bg-green-50 border-green-200" role="status" aria-live="polite">
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Error Message */}
          {submitError && (
            <Alert variant="destructive" role="alert" aria-live="assertive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500" aria-label="required">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter goal title (3-200 characters)"
              className={errors.title ? 'border-red-500' : ''}
              disabled={isSubmitting}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error title-hint' : 'title-hint'}
              required
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-red-500" role="alert">{errors.title}</p>
            )}
            <p id="title-hint" className="text-xs text-gray-500" aria-live="polite">
              {title.length}/200 characters
            </p>
          </div>
          
          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Describe your goal (optional, max 2000 characters)"
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
              disabled={isSubmitting}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error description-hint' : 'description-hint'}
            />
            {errors.description && (
              <p id="description-error" className="text-sm text-red-500" role="alert">{errors.description}</p>
            )}
            <p id="description-hint" className="text-xs text-gray-500" aria-live="polite">
              {description.length}/2000 characters
            </p>
          </div>
          
          {/* Category Field */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500" aria-label="required">*</span>
            </Label>
            <Select
              value={(typeof goal?.category == "string")? goal?.category : goal?.category.name}
              onValueChange={(value) => setCategory(value)}
              disabled={isSubmitting || isLoadingCategories}
              required
            >
              <SelectTrigger id="category" aria-label="Select goal category">
                <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select a category"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      {cat.color && !cat.is_default && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                      {cat.icon && <span>{cat.icon}</span>}
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Target Date Field */}
          <div className="space-y-2">
            <Label htmlFor="target_date">
              Target Date <span className="text-red-500" aria-label="required">*</span>
            </Label>
            <Input
              id="target_date"
              type="date"
              value={targetDate}
              onChange={(e) => handleTargetDateChange(e.target.value)}
              min={getMinDate()}
              className={errors.target_date ? 'border-red-500' : ''}
              disabled={isSubmitting}
              aria-invalid={!!errors.target_date}
              aria-describedby={errors.target_date ? 'target-date-error target-date-hint' : 'target-date-hint'}
              required
            />
            {errors.target_date && (
              <p id="target-date-error" className="text-sm text-red-500" role="alert">{errors.target_date}</p>
            )}
            <p id="target-date-hint" className="text-xs text-gray-500">
              Select today or a future date for your goal
            </p>
          </div>
          
          {/* Milestones Section (only for new goals) */}
          {!isEditMode && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Initial Milestones (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMilestoneInput}
                  disabled={isSubmitting || milestones.length >= 20}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </div>
              
              {milestones.length > 0 && (
                <div className="space-y-3">
                  {milestones.map((milestone, index) => (
                    <Card key={milestone.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <Label className="text-sm">
                            Milestone {index + 1}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMilestoneInput(milestone.id)}
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Input
                            value={milestone.title}
                            onChange={(e) =>
                              updateMilestoneInput(milestone.id, 'title', e.target.value)
                            }
                            placeholder="Milestone title"
                            className={
                              errors.milestones?.[milestone.id]
                                ? 'border-red-500'
                                : ''
                            }
                            disabled={isSubmitting}
                          />
                          {errors.milestones?.[milestone.id] && (
                            <p className="text-sm text-red-500">
                              {errors.milestones[milestone.id]}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">
                            Due Date (Optional)
                          </Label>
                          <Input
                            type="date"
                            value={milestone.due_date}
                            onChange={(e) =>
                              updateMilestoneInput(milestone.id, 'due_date', e.target.value)
                            }
                            min={getMinDate()}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {milestones.length === 0 && (
                <p className="text-sm text-gray-500">
                  Add milestones to break down your goal into smaller steps
                </p>
              )}
              
              {milestones.length >= 20 && (
                <p className="text-sm text-orange-600">
                  Maximum of 20 milestones reached
                </p>
              )}
            </div>
          )}
          
          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditMode ? 'Update Goal' : 'Create Goal'}</>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
