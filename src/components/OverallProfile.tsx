'use client'

import { CheckCircle2, ArrowUpRight, Sparkles } from 'lucide-react'

interface OverallProfileProps {
  overallScore: number
  averageConfidence: number
  speechRateWpm: number
  pauseConsistency: number
  fillerWordRatio: number
  topImprovements: string[]
}

const IDEAL_WPM_MIN = 120
const IDEAL_WPM_MAX = 170

function levelInfo(score: number): { label: string; stars: number; color: string } {
  if (score >= 95) return { label: 'Fluent', stars: 5, color: 'text-success' }
  if (score >= 80) return { label: 'Advanced', stars: 4, color: 'text-primary' }
  if (score >= 60) return { label: 'Intermediate', stars: 3, color: 'text-amber' }
  if (score >= 40) return { label: 'Basic', stars: 2, color: 'text-[#B45309]' }
  return { label: 'Beginner', stars: 1, color: 'text-[#B91C1C]' }
}

function deriveStrengths(
  avgConf: number,
  wpm: number,
  pause: number,
  filler: number
): string[] {
  const s: string[] = []
  if (avgConf >= 0.85) s.push('Clear pronunciation')
  if (wpm >= IDEAL_WPM_MIN && wpm <= IDEAL_WPM_MAX) s.push('Consistent speaking pace')
  if (pause >= 0.7) s.push('Natural speech rhythm')
  if (filler < 0.02) s.push('Minimal filler words')
  if (s.length === 0) s.push('Good effort — keep practising')
  return s.slice(0, 3)
}

function deriveWeaknesses(
  avgConf: number,
  wpm: number,
  pause: number,
  filler: number,
  improvements: string[]
): string[] {
  const w: string[] = []
  if (avgConf < 0.75) {
    const match = improvements.find((i) => i.toLowerCase().includes('enunciate'))
    w.push(match || 'Work on word clarity')
  }
  if (wpm < IDEAL_WPM_MIN) w.push('Speak at a faster pace')
  else if (wpm > IDEAL_WPM_MAX) w.push('Slow down your pace')
  if (pause < 0.7) w.push('Improve pause consistency')
  if (filler > 0.03) w.push('Reduce filler words')
  return w.slice(0, 3)
}

export default function OverallProfile(props: OverallProfileProps) {
  const level = levelInfo(props.overallScore)
  const strengths = deriveStrengths(
    props.averageConfidence,
    props.speechRateWpm,
    props.pauseConsistency,
    props.fillerWordRatio
  )
  const weaknesses = deriveWeaknesses(
    props.averageConfidence,
    props.speechRateWpm,
    props.pauseConsistency,
    props.fillerWordRatio,
    props.topImprovements
  )

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Overall Level */}
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md">
        <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Overall Level</p>
        <p className={`text-xl font-bold ${level.color}`}>{level.label}</p>
        <div className="flex gap-0.5" aria-label={`${level.stars} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, i) => (
            <svg
              key={i}
              className={`h-4 w-4 ${i < level.stars ? 'text-amber' : 'text-border'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-xs text-muted">{props.overallScore}/100 score</p>
      </div>

      {/* Top Strengths */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Top Strengths</p>
        <ul className="space-y-2">
          {strengths.map((s) => (
            <li key={s} className="flex items-start gap-2 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" aria-hidden="true" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Needs Improvement */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Needs Improvement</p>
        <ul className="space-y-2">
          {weaknesses.map((w) => (
            <li key={w} className="flex items-start gap-2 text-sm text-foreground">
              <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber" aria-hidden="true" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
