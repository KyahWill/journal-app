'use client'

import { useState } from 'react'
import { HslColorPicker } from 'react-colorful'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ColorPickerProps {
  label: string
  value: string // HSL format: "hue saturation% lightness%"
  onChange: (value: string) => void
}

// Convert HSL string "200 50% 50%" to { h, s, l }
function hslStringToObject(hsl: string): { h: number; s: number; l: number } {
  const parts = hsl.trim().split(/\s+/)
  if (parts.length !== 3) {
    return { h: 0, s: 0, l: 100 }
  }
  return {
    h: parseFloat(parts[0]),
    s: parseFloat(parts[1].replace('%', '')),
    l: parseFloat(parts[2].replace('%', '')),
  }
}

// Convert { h, s, l } to HSL string "200 50% 50%"
function hslObjectToString(hsl: { h: number; s: number; l: number }): string {
  return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`
}

// Convert HSL string to hex for display
function hslToHex(hsl: string): string {
  const { h, s, l } = hslStringToObject(hsl)
  const hDecimal = l / 100
  const a = (s * Math.min(hDecimal, 1 - hDecimal)) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = hDecimal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hslObject = hslStringToObject(value)

  const handleColorChange = (newColor: { h: number; s: number; l: number }) => {
    onChange(hslObjectToString(newColor))
  }

  const handleInputChange = (newValue: string) => {
    // Allow user to type HSL values directly
    onChange(newValue)
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm capitalize">
        {label.replace(/([A-Z])/g, ' $1').trim()}
      </Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="0 0% 100%"
          className="flex-1 font-mono text-sm"
        />
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-20 h-10 p-0 border-2"
              style={{ backgroundColor: `hsl(${value})` }}
              title="Open color picker"
            >
              <span className="sr-only">Pick color</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pick a Color</DialogTitle>
              <DialogDescription>
                Choose a color or enter HSL values manually
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center">
                <HslColorPicker
                  color={hslObject}
                  onChange={handleColorChange}
                  style={{ width: '100%', height: '200px' }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Hue</Label>
                  <Input
                    type="number"
                    min="0"
                    max="360"
                    value={Math.round(hslObject.h)}
                    onChange={(e) => handleColorChange({
                      ...hslObject,
                      h: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Saturation</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(hslObject.s)}
                    onChange={(e) => handleColorChange({
                      ...hslObject,
                      s: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Lightness</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(hslObject.l)}
                    onChange={(e) => handleColorChange({
                      ...hslObject,
                      l: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">HSL String</Label>
                <Input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Hex (for reference)</Label>
                <Input
                  value={hslToHex(value)}
                  readOnly
                  className="font-mono text-sm bg-gray-50"
                />
              </div>

              <div 
                className="w-full h-16 rounded border-2"
                style={{ backgroundColor: `hsl(${value})` }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

