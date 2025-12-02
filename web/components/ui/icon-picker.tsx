'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'

const EMOJI_CATEGORIES = {
  'Activities': ['🎯', '🏆', '🎨', '🎬', '🎮', '🎪', '🎭', '🎸', '🎹', '🎺', '🎻', '🥁', '🎤', '🎧', '📸', '🎥', '🎬', '📚', '✏️', '📝'],
  'Travel': ['✈️', '🚀', '🚗', '🚌', '🚂', '🚢', '🏠', '🏢', '🏰', '🗼', '🗽', '🌍', '🌎', '🌏', '🗺️', '🏕️', '🏖️', '🏔️', '⛰️', '🌋'],
  'Nature': ['🌸', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🍀', '🍁', '🍂', '🍃', '🌾', '🌿', '☀️', '🌙', '⭐', '🌈'],
  'Food': ['🍎', '🍊', '🍋', '🍌', '🍇', '🍓', '🍒', '🍑', '🥝', '🍅', '🥑', '🥕', '🌽', '🍕', '🍔', '🍟', '🌮', '🍜', '🍣', '🍰'],
  'Objects': ['💼', '📁', '📂', '🗂️', '📅', '📆', '📌', '📍', '✂️', '📎', '🔗', '📐', '📏', '🔧', '🔨', '⚙️', '🔩', '💡', '🔋', '💻'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💯', '✅', '❌', '⭕', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪'],
  'People': ['👤', '👥', '👨‍💻', '👩‍💻', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚕️', '👩‍⚕️', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬'],
  'Fitness': ['💪', '🏃', '🚴', '🏊', '🧘', '🏋️', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '🥋', '⛳', '🏌️', '🎳', '🛹'],
}

interface IconPickerProps {
  value?: string
  onChange?: (icon: string) => void
  disabled?: boolean
}

export function IconPicker({ value, onChange, disabled }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('Activities')

  const allEmojis = Object.values(EMOJI_CATEGORIES).flat()
  
  const filteredEmojis = search
    ? allEmojis.filter(emoji => emoji.includes(search))
    : EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES] || []

  const handleSelect = (emoji: string) => {
    onChange?.(emoji)
    setOpen(false)
    setSearch('')
  }

  const handleClear = () => {
    onChange?.('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          {value ? (
            <span className="text-xl mr-2">{value}</span>
          ) : null}
          <span className={cn(value && "text-muted-foreground")}>
            {value ? 'Change icon' : 'Select an icon'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emojis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        
        {!search && (
          <div className="flex gap-1 p-2 border-b overflow-x-auto">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs px-2 py-1 h-7 flex-shrink-0"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        <div className="p-2 max-h-[200px] overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleSelect(emoji)}
                className={cn(
                  "h-8 w-8 flex items-center justify-center text-lg rounded hover:bg-accent transition-colors",
                  value === emoji && "bg-accent ring-2 ring-primary"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
          {filteredEmojis.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No emojis found
            </p>
          )}
        </div>

        {value && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={handleClear}
            >
              Clear selection
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

