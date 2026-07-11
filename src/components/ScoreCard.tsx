'use client'

import { useEffect, useState } from 'react'

interface ScoreCardProps {
  overallScore: number
  averageConfidence: number
  speechRateWpm: number
  pauseConsistency: number
  fillerWordRatio: number
}

const IDEAL_WPM_MIN = 120
const IDEAL_WPM_MAX = 170

function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 55) return 'Fair'
  return 'Needs improvement'
}

function scoreDescription(score: number): string {
  if (score >= 90) return 'Outstanding clarity with natural pacing and minimal hesitations.'
  if (score >= 85) return 'Clear and well-paced speech with only minor improvements needed.'
  if (score >= 75) return 'Good overall clarity with some areas to work on.'
  if (score >= 70) return 'Decent pronunciation with noticeable areas for improvement.'
  if (score >= 55) return 'Several pronunciation patterns that could be refined.'
  return 'Significant opportunities to improve clarity and delivery.'
}

function percentileText(score: number): string {
  if (score >= 95) return 'Stronger than ~98% of recordings'
  if (score >= 90) return 'Stronger than ~90% of recordings'
  if (score >= 80) return 'Stronger than ~70% of recordings'
  if (score >= 70) return 'Stronger than ~50% of recordings'
  if (score >= 55) return 'Stronger than ~30% of recordings'
  return 'Stronger than ~10% of recordings'
}

function scoreRingColor(score: number): string {
  if (score >= 80) return 'stroke-success'
  if (score >= 60) return 'stroke-amber'
  return 'stroke-danger'
}

function paceLabel(wpm: number): { text: string; color: string } {
  if (wpm >= IDEAL_WPM_MIN && wpm <= IDEAL_WPM_MAX) return { text: 'Optimal pace', color: 'text-success' }
  if (wpm < IDEAL_WPM_MIN) return { text: 'Slower than ideal', color: 'text-[#B45309]' }
  return { text: 'Faster than ideal', color: 'text-[#B45309]' }
}

export default function ScoreCard({ overallScore, averageConfidence, speechRateWpm, pauseConsistency, fillerWordRatio }: ScoreCardProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (displayScore / 100) * circumference

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayScore((prev) => {
        if (prev >= overallScore) {
          clearInterval(timer)
          return overallScore
        }
        return prev + 1
      })
    }, 12)
    return () => clearInterval(timer)
  }, [overallScore])

  const fillerScore = Math.round((1 - Math.min(fillerWordRatio, 0.3)) * 100)

  return (
    <div className="rounded-2xl border border-border bg-white p-6 transition-all duration-200 hover:shadow-md" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
        <div className="relative flex-shrink-0">
          <svg
            width="128" height="128" className="-rotate-90"
            role="img"
            aria-label={`Pronunciation score: ${displayScore} out of 100, ${scoreLabel(overallScore)}`}
          >
            <circle cx="64" cy="64" r="54" fill="none" stroke="#F1F5F9" strokeWidth="8" aria-hidden="true" />
            <circle
              cx="64" cy="64" r="54"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={scoreRingColor(overallScore)}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              aria-hidden="true"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${overallScore >= 80 ? 'text-success' : overallScore >= 60 ? 'text-[#B45309]' : 'text-[#B91C1C]'}`}>
              {displayScore}
            </span>
            <span className="text-[10px] font-medium text-[#475569]">/ 100</span>
          </div>
        </div>

        <div className="text-center sm:text-left">
          <p className={`text-xl font-semibold ${overallScore >= 80 ? 'text-success' : overallScore >= 60 ? 'text-[#B45309]' : 'text-[#B91C1C]'}`}>
            {scoreLabel(overallScore)}
          </p>
          <p className="mt-1 max-w-xs text-sm leading-relaxed text-[#475569]">
            {scoreDescription(overallScore)}
          </p>
          <p className="mt-1 text-xs font-medium text-primary">
            {percentileText(overallScore)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricBox
          label="Speech Clarity"
          value={`${Math.round(averageConfidence * 100)}%`}
          score={averageConfidence * 100}
          context={averageConfidence >= 0.85 ? 'Excellent' : averageConfidence >= 0.7 ? 'Good' : 'Needs work'}
        />
        <MetricBox
          label="Pause Consistency"
          value={`${Math.round(pauseConsistency * 100)}%`}
          score={pauseConsistency * 100}
          context={pauseConsistency >= 0.7 ? 'Steady rhythm' : pauseConsistency >= 0.4 ? 'Moderate' : 'Irregular pauses'}
        />
        <PaceBox wpm={speechRateWpm} />
        <MetricBox
          label="Filler Words"
          value={`${Math.round(fillerWordRatio * 100)}%`}
          score={fillerScore}
          context={fillerWordRatio < 0.03 ? 'Minimal fillers' : fillerWordRatio < 0.08 ? 'Some fillers' : 'Frequent fillers'}
          invert
        />
      </div>
    </div>
  )
}

function MetricBox({ label, value, score, context, invert }: { label: string; value: string; score: number; context: string; invert?: boolean }) {
  const barScore = invert ? 100 - Math.min(score, 100) : Math.min(score, 100)
  const barColor = score >= 80 ? 'bg-success' : score >= 60 ? 'bg-amber' : 'bg-danger'
  const textColor = score >= 80 ? 'text-success' : score >= 60 ? 'text-[#B45309]' : 'text-[#B91C1C]'

  return (
    <div className="rounded-xl bg-background p-3">
      <p className="text-xs font-medium text-[#475569]">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-foreground">{value}</p>
      <p className={`text-[10px] font-medium ${textColor}`}>{context}</p>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={Math.round(barScore)} aria-valuemin={0} aria-valuemax={100} aria-label={`${label}: ${barScore}%`}>
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${barScore}%` }} />
      </div>
    </div>
  )
}

function PaceBox({ wpm }: { wpm: number }) {
  const pace = paceLabel(wpm)
  const paceScore = wpm >= IDEAL_WPM_MIN && wpm <= IDEAL_WPM_MAX ? 85 : wpm < IDEAL_WPM_MIN ? Math.round((wpm / IDEAL_WPM_MIN) * 60) : Math.round((IDEAL_WPM_MAX / wpm) * 60)

  return (
    <div className="rounded-xl bg-background p-3">
      <p className="text-xs font-medium text-[#475569]">Speaking Pace</p>
      <p className="mt-0.5 text-lg font-semibold text-foreground">{wpm} WPM</p>
      <p className={`text-[10px] font-medium ${pace.color}`}>{pace.text}</p>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={Math.min(paceScore, 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`Speaking pace: ${wpm} WPM`}>
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(paceScore, 100)}%` }}
        />
      </div>
      <p className="mt-1 text-[9px] text-muted">Target: {IDEAL_WPM_MIN}–{IDEAL_WPM_MAX} WPM</p>
    </div>
  )
}
