'use client'

import { Mic, Cpu, Target } from 'lucide-react'

const steps = [
  {
    icon: Mic,
    title: 'Upload',
    description: 'Record with your microphone or upload an audio file (30–45 seconds).',
  },
  {
    icon: Cpu,
    title: 'AI Analysis',
    description: 'Deepgram transcribes your speech, Groq evaluates pronunciation and fluency.',
  },
  {
    icon: Target,
    title: 'Improve Pronunciation',
    description: 'Get word-level feedback, flagged errors, and personalised recommendations.',
  },
]

export default function HowItWorks() {
  return (
    <section className="mx-auto mt-14 max-w-2xl">
      <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted">
        How it Works
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <span className="text-sm font-semibold text-foreground">{step.title}</span>
            </div>
            <p className="text-xs leading-relaxed text-[#475569]">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
