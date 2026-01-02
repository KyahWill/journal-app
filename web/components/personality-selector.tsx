'use client'

import { useState, useEffect } from 'react'
import { useCoachPersonalities } from '@/lib/hooks/useCoachPersonalities'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles } from 'lucide-react'
import { CoachPersonality } from '@/lib/api/client'

interface PersonalitySelectorProps {
  selectedPersonalityId?: string
  onPersonalityChange: (personalityId: string | undefined) => void
  disabled?: boolean
  className?: string
}

export function PersonalitySelector({
  selectedPersonalityId,
  onPersonalityChange,
  disabled = false,
  className = '',
}: PersonalitySelectorProps) {
  const { personalities, loading, error, fetchPersonalities } = useCoachPersonalities()
  const [defaultPersonality, setDefaultPersonality] = useState<CoachPersonality | null>(null)

  useEffect(() => {
    fetchPersonalities()
  }, [fetchPersonalities])

  useEffect(() => {
    // Find and set the default personality
    const defaultP = personalities.find((p) => p.isDefault)
    if (defaultP) {
      setDefaultPersonality(defaultP)
      // If no personality is selected, use the default
      if (!selectedPersonalityId) {
        onPersonalityChange(defaultP.id)
      }
    }
  }, [personalities, selectedPersonalityId])

  const getStyleColor = (style: string) => {
    switch (style.toLowerCase()) {
      case 'supportive':
        return 'bg-green-100 text-green-800'
      case 'direct':
        return 'bg-blue-100 text-blue-800'
      case 'motivational':
        return 'bg-orange-100 text-orange-800'
      case 'analytical':
        return 'bg-purple-100 text-purple-800'
      case 'empathetic':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading personalities...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-sm text-red-500 ${className}`}>
        Failed to load coach personalities
      </div>
    )
  }

  if (personalities.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No coach personalities available
      </div>
    )
  }

  const selectedPersonality = personalities.find((p) => p.id === selectedPersonalityId)

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <label className="text-sm font-medium text-gray-700">Coach Personality</label>
      </div>
      
      <Select
        value={selectedPersonalityId || ''}
        onValueChange={(value) => onPersonalityChange(value || undefined)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a personality">
            {selectedPersonality && (
              <div className="flex items-center gap-2">
                <span>{selectedPersonality.name}</span>
                <Badge variant="secondary" className={`text-xs ${getStyleColor(selectedPersonality.style)}`}>
                  {selectedPersonality.style}
                </Badge>
                {selectedPersonality.isDefault && (
                  <Badge variant="outline" className="text-xs">
                    Default
                  </Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {personalities.map((personality) => (
            <SelectItem key={personality.id} value={personality.id}>
              <div className="flex flex-col gap-1 py-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{personality.name}</span>
                  <Badge variant="secondary" className={`text-xs ${getStyleColor(personality.style)}`}>
                    {personality.style}
                  </Badge>
                  {personality.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 max-w-xs">{personality.description}</p>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedPersonality && selectedPersonality.description && (
        <p className="text-xs text-gray-600 italic">
          {selectedPersonality.description}
        </p>
      )}
    </div>
  )
}

