'use client'

import { Check, X } from 'lucide-react'

export interface StepState {
  key: string
  status: 'pending' | 'active' | 'complete'
}

interface LoadingStepperProps {
  steps: StepState[]
  onCancel?: () => void
}

const STEP_LABELS: Record<string, { active: string; complete: string }> = {
  uploading: { active: 'Uploading audio', complete: 'Upload complete' },
  transcribing: { active: 'Transcribing audio', complete: 'Audio transcribed' },
  evaluating: { active: 'Evaluating speech', complete: 'Speech evaluated' },
  feedback: { active: 'Generating feedback', complete: 'Feedback ready' },
}

export default function LoadingStepper({ steps, onCancel }: LoadingStepperProps) {
  const visible = steps.filter((s) => s.status !== 'pending')

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-8">
      {visible.map((step) => {
        const config = STEP_LABELS[step.key]
        if (!config) return null

        const isActive = step.status === 'active'
        const isComplete = step.status === 'complete'

        return (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300 ${
                isComplete
                  ? 'bg-primary text-white'
                  : 'border-2 border-primary text-primary'
              }`}
            >
              {isComplete ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="animate-pulse">
                  <span className="sr-only">In progress</span>
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-foreground">
              {isComplete ? config.complete : config.active}
              {isActive && (
                <span className="ml-1 inline-flex gap-0.5">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
                </span>
              )}
            </p>
          </div>
        )
      })}

      <div className="mt-4 flex flex-col items-center gap-3">
        <p className="text-xs text-muted">This usually takes 10–20 seconds. Please do not close this tab.</p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-3 text-xs font-medium text-[#475569] transition-all hover:border-danger hover:text-danger"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
