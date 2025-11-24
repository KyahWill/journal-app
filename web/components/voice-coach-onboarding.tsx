'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mic, MessageSquare, Brain, Sparkles } from 'lucide-react'

interface VoiceCoachOnboardingProps {
  open: boolean
  onComplete: () => void
}

export function VoiceCoachOnboarding({ open, onComplete }: VoiceCoachOnboardingProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const steps = [
    {
      title: 'Meet Your AI Voice Coach',
      description: 'Experience personalized coaching through natural voice conversations',
      icon: Mic,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Your AI Voice Coach uses advanced conversational AI to provide real-time coaching 
            based on your goals, journal entries, and progress.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>New Feature:</strong> Talk naturally with your coach using your voice, 
              just like having a conversation with a real person.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Context-Aware Coaching',
      description: 'Your coach knows your goals and journal history',
      icon: Brain,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            The AI Voice Coach has access to:
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Your active goals and milestones</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Recent journal entries and reflections</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Progress updates and achievements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Relevant past conversations</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'How It Works',
      description: 'Simple steps to start your coaching session',
      icon: MessageSquare,
      content: (
        <div className="space-y-4">
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Click the microphone button to start a conversation</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Speak naturally about your goals, challenges, or questions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Listen to personalized coaching advice and insights</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>View the conversation transcript in real-time</span>
            </li>
          </ol>
        </div>
      ),
    },
    {
      title: 'Ready to Start?',
      description: 'Try your first voice coaching session',
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You're all set! Click "Start Coaching" to begin your first voice coaching session.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              <strong>Tip:</strong> Make sure your microphone is enabled and you're in a quiet 
              environment for the best experience.
            </p>
          </div>
        </div>
      ),
    },
  ]

  const currentStep = steps[step]
  const Icon = currentStep.icon

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
      router.push('/app/ai-agent')
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <DialogTitle>{currentStep.title}</DialogTitle>
              <DialogDescription>{currentStep.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {currentStep.content}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 mr-auto">
            <span>Step {step + 1} of {steps.length}</span>
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-6 rounded-full transition-colors ${
                    i === step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <Button variant="outline" onClick={handleSkip}>
            Skip
          </Button>
          <Button onClick={handleNext}>
            {step < steps.length - 1 ? 'Next' : 'Start Coaching'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
