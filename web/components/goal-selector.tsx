'use client'

import { useState, useEffect } from 'react'
import { useGoals } from '@/lib/contexts/goal-context'
import { CustomCategory, Goal } from '@/lib/api/client'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Target } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface GoalSelectorProps {
  selectedGoalIds: string[]
  onGoalsChange: (goalIds: string[]) => void
  disabled?: boolean
}

export function GoalSelector({ selectedGoalIds, onGoalsChange, disabled }: GoalSelectorProps) {
  const { goals, loading } = useGoals()
  const [open, setOpen] = useState(false)
  const [activeGoals, setActiveGoals] = useState<Goal[]>([])

  useEffect(() => {
    // Filter to only show active goals (not completed or abandoned)
    const filtered = goals.filter(
      (g) => g.status === 'not_started' || g.status === 'in_progress'
    )
    setActiveGoals(filtered)
  }, [goals])

  const selectedGoals = activeGoals.filter((g) => selectedGoalIds.includes(g.id))

  const handleSelectGoal = (goalId: string) => {
    if (selectedGoalIds.includes(goalId)) {
      // Remove goal
      onGoalsChange(selectedGoalIds.filter((id) => id !== goalId))
    } else {
      // Add goal
      onGoalsChange([...selectedGoalIds, goalId])
    }
  }

  const handleRemoveGoal = (goalId: string) => {
    onGoalsChange(selectedGoalIds.filter((id) => id !== goalId))
  }
  /**
   * Calculates appropriate text and border colors based on a background hex.
   * @param {string} hex - The background color (e.g. "#ffffff", "000")
   * @param {number} borderContrast - Percent to darken/lighten border (default 20%)
   */
  function getDynamicColors(hex:string, borderContrast = 20) {
      // 1. Normalize Hex (remove hash, handle 3-digit codes)
      hex = hex.replace('#', '');
      if (hex.length === 3) {
          hex = hex.split('').map(char => char + char).join('');
      }

      // 2. Convert to RGB
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      // 3. Calculate Brightness (YIQ formula)
      // Formula: ((R*299) + (G*587) + (B*114)) / 1000
      // If yiq >= 128, the background is "light".
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      const isLight = yiq >= 128;

      // 4. Determine Text Color (Black or White)
      const textColor = isLight ? '#000000' : '#ffffff';

      // 5. Generate Border Color
      // If background is light, we darken the border.
      // If background is dark, we lighten the border.
      const borderHex = shadeColor(hex, isLight ? -borderContrast : borderContrast);

      return {
          background: `#${hex}`,
          text: textColor,
          border: borderHex,
          isLight: isLight
      };
  }

  /**
   * Helper: Lightens or Darkens a hex color by a percentage
   * @param {string} color - The hex color
   * @param {number} percent - Positive to lighten, negative to darken
   */
  function shadeColor(color:string, percent:number) {
      let R: number = parseInt(color.substring(0, 2), 16);
      let G = parseInt(color.substring(2, 4), 16);
      let B = parseInt(color.substring(4, 6), 16);

      R = (R * (100 + percent) / 100);
      G = (G * (100 + percent) / 100);
      B = (B * (100 + percent) / 100);

      // Ensure values stay within 0-255 range
      R = (R < 255) ? R : 255;
      G = (G < 255) ? G : 255;
      B = (B < 255) ? B : 255;

      R = Math.round(R);
      G = Math.round(G);
      B = Math.round(B);

      // Convert back to Hex
      const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
      const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
      const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

      return `#${RR}${GG}${BB}`;
  }
      
  const getCategoryColor = (category: string | CustomCategory) => {
    if (typeof (category) == "string") {
      const colors: Record<string, string> = {
        career: 'bg-purple-100 text-purple-800 border-purple-200',
        health: 'bg-green-100 text-green-800 border-green-200',
        personal: 'bg-blue-100 text-blue-800 border-blue-200',
        financial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        relationships: 'bg-pink-100 text-pink-800 border-pink-200',
        learning: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        other: 'bg-gray-100 text-gray-800 border-gray-200',
      }
      return colors[category] || colors.other
    } else {
      const dynamicColors = getDynamicColors(category.color || "ffffff");
      return `bg-[${category.color}] text-[${dynamicColors.text}] border-[${dynamicColors.border}]
      `
    }
  }

  return (
    <div className="space-y-2">
      <Label>Link to Goals (optional)</Label>
      
      {/* Selected Goals Display */}
      {selectedGoals.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedGoals.map((goal) => (
            <Badge
              key={goal.id}
              variant="outline"
              className={`${getCategoryColor(goal.category)} flex items-center gap-1 pr-1`}
            >
              <Target className="h-3 w-3" />
              <span className="max-w-[150px] truncate">{goal.title}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveGoal(goal.id)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Goal Selector Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || loading}
            className="w-full justify-start text-left font-normal"
          >
            <Target className="mr-2 h-4 w-4" />
            {selectedGoals.length > 0
              ? `${selectedGoals.length} goal${selectedGoals.length > 1 ? 's' : ''} linked`
              : 'Link to goals'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search goals..." />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Loading goals...' : 'No active goals found.'}
              </CommandEmpty>
              <CommandGroup>
                {activeGoals.map((goal) => {
                  const isSelected = selectedGoalIds.includes(goal.id)
                  return (
                    <CommandItem
                      key={goal.id}
                      onSelect={() => handleSelectGoal(goal.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div
                        className={`h-4 w-4 border rounded flex items-center justify-center ${
                          isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{goal.title}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={`${getCategoryColor(goal.category)} text-xs px-1 py-0`}
                          >
                            {typeof (goal.category) == "string"? goal.category: goal.category.name}
                          </Badge>
                          <span>{Math.round(goal.progress_percentage)}% complete</span>
                        </div>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <p className="text-xs text-gray-500">
        Connect this journal entry to your goals for better tracking and AI insights
      </p>
    </div>
  )
}
