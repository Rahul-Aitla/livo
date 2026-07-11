'use client'

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'

interface LoadingStepperProps {
  onCancel?: () => void
}

const STEPS = [
  { label: 'Uploading', duration: 600 },
  { label: 'Transcribing', duration: 3000 },
  { label: 'Analyzing', duration: 1500 },
  { label: 'Generating feedback', duration: 2500 },
]

export default function LoadingStepper({ onCancel }: LoadingStepperProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)

  useEffect(() => {
    if (currentStep >= STEPS.length) return

    const totalDuration = STEPS[currentStep].duration
    const interval = 50
    const increment = interval / totalDuration
    let progress = 0

    const timer = setInterval(() => {
      progress += increment
      setStepProgress(Math.min(progress, 1))
      if (progress >= 1) {
        clearInterval(timer)
        if (currentStep < STEPS.length - 1) {
          setTimeout(() => {
            setCurrentStep((s) => s + 1)
            setStepProgress(0)
          }, 250)
        }
      }
    }, interval)

    return () => clearInterval(timer)
  }, [currentStep])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-8">
      {STEPS.map((step, i) => {
        const isActive = i === currentStep
        const isDone = i < currentStep
        const progress = isActive ? stepProgress : isDone ? 1 : 0

        return (
          <div key={step.label} className="flex items-center gap-3">
            <div
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300 ${
                isDone
                  ? 'bg-primary text-white'
                  : isActive
                  ? 'border-2 border-primary text-primary'
                  : 'border-2 border-border text-[#CBD5E1]'
              }`}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : isActive ? (
                <span className="animate-pulse">{i + 1}</span>
              ) : (
                i + 1
              )}
            </div>

            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  isDone || isActive ? 'text-foreground' : 'text-[#CBD5E1]'
                }`}
              >
                {step.label}
                {isActive && (
                  <span className="ml-1.5 inline-flex gap-0.5">
                    <span className="h-1 w-1 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </p>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${progress * 100}%`, transition: 'width 0.2s ease' }}
                />
              </div>
            </div>
          </div>
        )
      })}

      <div className="mt-4 flex flex-col items-center gap-3">
        <p className="text-xs text-muted">Analyzing your speech... This may take a moment.</p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-xs font-medium text-[#475569] transition-all hover:border-danger hover:text-danger"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
