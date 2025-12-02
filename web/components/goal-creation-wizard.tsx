'use client'

import { useState, useEffect } from 'react'
import { useGoals } from '@/lib/contexts/goal-context'
import { apiClient, CategoryWithType, CreateGoalData, HabitFrequency } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, ChevronRight, ChevronLeft, Calendar, Plus, X, Target, Loader2, Flame } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface GoalCreationWizardProps {
  onSuccess?: () => void
  onCancel?: () => void
}

type Step = 'basics' | 'category' | 'timeline' | 'milestones' | 'review'

const GOAL_STEPS: { id: Step; title: string; description: string }[] = [
  { id: 'basics', title: 'Goal Basics', description: 'What do you want to achieve?' },
  { id: 'category', title: 'Category', description: 'How would you categorize this goal?' },
  { id: 'timeline', title: 'Timeline', description: 'When do you want to achieve this?' },
  { id: 'milestones', title: 'Milestones', description: 'Break it down into steps' },
  { id: 'review', title: 'Review', description: 'Review and launch your goal' },
]

const HABIT_STEPS: { id: Step; title: string; description: string }[] = [
  { id: 'basics', title: 'Habit Basics', description: 'What habit do you want to build?' },
  { id: 'category', title: 'Category', description: 'How would you categorize this habit?' },
  { id: 'review', title: 'Review', description: 'Review and start tracking' },
]

export function GoalCreationWizard({ onSuccess, onCancel }: GoalCreationWizardProps) {
  const { createGoal, addMilestone } = useGoals()
  
  const [currentStep, setCurrentStep] = useState<Step>('basics')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<CategoryWithType[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  // Form Data
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('personal')
  const [targetDate, setTargetDate] = useState('')
  const [milestones, setMilestones] = useState<{ id: string; title: string; due_date?: string }[]>([])
  const [newMilestone, setNewMilestone] = useState('')
  
  // Habit fields
  const [isHabit, setIsHabit] = useState(false)
  const [habitFrequency, setHabitFrequency] = useState<HabitFrequency>('daily')

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

  // Get the appropriate steps based on whether it's a habit or goal
  const steps = isHabit ? HABIT_STEPS : GOAL_STEPS

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id)
    }
  }

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  const handleAddMilestone = () => {
    if (newMilestone.trim()) {
      setMilestones([...milestones, { id: Date.now().toString(), title: newMilestone.trim() }])
      setNewMilestone('')
    }
  }

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id))
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // For habits, use a far-future date (habits are ongoing)
      const effectiveTargetDate = isHabit 
        ? format(addDays(new Date(), 365 * 10), 'yyyy-MM-dd') // 10 years from now
        : targetDate

      const goalData: CreateGoalData = {
        title,
        description,
        category,
        target_date: effectiveTargetDate,
        is_habit: isHabit,
        habit_frequency: isHabit ? habitFrequency : undefined,
      }

      const newGoal = await createGoal(goalData)

      // Only add milestones for regular goals (not habits)
      if (!isHabit && milestones.length > 0) {
        for (const m of milestones) {
           await addMilestone(newGoal.id, {
             title: m.title,
             due_date: m.due_date
           })
        }
      }

      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Failed to create goal:', error)
      // Handle error (show toast etc)
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const isStepValid = () => {
    switch (currentStep) {
      case 'basics': return title.trim().length >= 3
      case 'category': return !!category
      case 'timeline': return !!targetDate // Only shown for goals, not habits
      case 'milestones': return true // Optional
      case 'review': return true
      default: return false
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>{steps[currentStepIndex]?.title || 'Create'}</CardTitle>
          <span className="text-sm text-muted-foreground">Step {currentStepIndex + 1} of {steps.length}</span>
        </div>
        <CardDescription>{steps[currentStepIndex]?.description || ''}</CardDescription>
        <Progress value={progress} className="h-2 mt-4" />
      </CardHeader>

      <CardContent className="min-h-[300px] py-6">
        {/* Step 1: Basics */}
        {currentStep === 'basics' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title <span className="text-red-500">*</span></Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Run a Marathon" 
                autoFocus
              />
              <p className="text-xs text-muted-foreground">At least 3 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why do you want to achieve this? How will you do it?"
                className="h-24"
              />
            </div>

            {/* Habit Toggle */}
            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
              <div className="flex items-center gap-3">
                <Flame className="h-5 w-5 text-orange-500" />
                <div>
                  <Label htmlFor="is-habit" className="font-medium cursor-pointer">Make this a Habit</Label>
                  <p className="text-xs text-muted-foreground">Track daily/weekly/monthly and build streaks</p>
                </div>
              </div>
              <Switch
                id="is-habit"
                checked={isHabit}
                onCheckedChange={setIsHabit}
              />
            </div>

            {isHabit && (
              <div className="space-y-2 pl-4 border-l-2 border-orange-300">
                <Label>Frequency</Label>
                <Select value={habitFrequency} onValueChange={(v) => setHabitFrequency(v as HabitFrequency)}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Category */}
        {currentStep === 'category' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-primary/50 hover:bg-accent",
                  category === cat.id ? "border-primary bg-accent text-primary" : "border-transparent bg-secondary"
                )}
                type="button"
              >
                <span className="text-2xl mb-2">{cat.icon || '🎯'}</span>
                <span className="font-medium text-sm capitalize">{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Timeline */}
        {currentStep === 'timeline' && (
          <div className="space-y-6">
             <div className="space-y-2">
              <Label>Target Date <span className="text-red-500">*</span></Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <Input 
                  type="date" 
                  value={targetDate} 
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  className="max-w-xs"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Give yourself enough time to achieve this goal realistically.
              </p>
            </div>

            {/* Quick Select */}
            <div className="flex gap-2 flex-wrap">
               {[30, 90, 180, 365].map(days => (
                 <Button 
                   key={days} 
                   variant="outline" 
                   size="sm"
                   onClick={() => setTargetDate(format(addDays(new Date(), days), 'yyyy-MM-dd'))}
                 >
                   {days === 365 ? '1 Year' : `${days} Days`}
                 </Button>
               ))}
            </div>
          </div>
        )}

        {/* Step 4: Milestones */}
        {currentStep === 'milestones' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMilestone())}
                placeholder="Add a milestone..."
              />
              <Button onClick={handleAddMilestone} type="button" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {milestones.length === 0 && (
                 <div className="text-center py-8 text-muted-foreground">
                   <Target className="h-8 w-8 mx-auto mb-2 opacity-20" />
                   <p>No milestones yet. Adding small steps helps you succeed!</p>
                 </div>
              )}
              {milestones.map((m, idx) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-secondary rounded-md group">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-background text-xs font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <span className="font-medium">{m.title}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveMilestone(m.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Review */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <div className="bg-accent/30 p-6 rounded-lg border text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {isHabit && <Flame className="h-6 w-6 text-orange-500" />}
                <h3 className="text-2xl font-bold">{title}</h3>
              </div>
              <p className="text-muted-foreground">{description || 'No description provided.'}</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4 text-sm">
                {isHabit && (
                  <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-3 py-1 rounded-full font-medium capitalize flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    {habitFrequency} Habit
                  </span>
                )}
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium capitalize">
                  {categories.find(c => c.id === category)?.name || category}
                </span>
                {!isHabit && (
                  <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                    Target: {targetDate ? format(new Date(targetDate), 'MMM d, yyyy') : 'Not set'}
                  </span>
                )}
              </div>
            </div>

            {/* Only show milestones section for regular goals */}
            {!isHabit && (
              <div className="space-y-2">
                 <h4 className="font-semibold flex items-center gap-2">
                   <Target className="h-4 w-4" /> 
                   Milestones ({milestones.length})
                 </h4>
                 {milestones.length > 0 ? (
                   <ul className="space-y-2 pl-5 list-disc text-sm text-muted-foreground">
                     {milestones.map(m => (
                       <li key={m.id}>{m.title}</li>
                     ))}
                   </ul>
                 ) : (
                   <p className="text-sm text-muted-foreground italic">No milestones added.</p>
                 )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-6">
        <Button 
          variant="ghost" 
          onClick={currentStep === 'basics' ? onCancel : handleBack}
          disabled={isSubmitting}
        >
          {currentStep === 'basics' ? 'Cancel' : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </>
          )}
        </Button>

        <Button 
          onClick={currentStep === 'review' ? handleSubmit : handleNext}
          disabled={!isStepValid() || isSubmitting}
          className="min-w-[100px]"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : currentStep === 'review' ? (
            <>
              Create Goal <Check className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

