'use client'

import { useEffect, useState } from 'react'

interface ScoreCardProps {
  overallScore: number
  averageConfidence: number
  speechRateWpm: number
  pauseConsistency: number
  fillerWordRatio: number
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 55) return 'Fair'
  return 'Needs improvement'
}

function scoreRingColor(score: number): string {
  if (score >= 80) return 'stroke-[#16A34A]'
  if (score >= 60) return 'stroke-[#F59E0B]'
  return 'stroke-[#DC2626]'
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

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 transition-all duration-200 hover:shadow-md" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" className="-rotate-90">
            <circle cx="64" cy="64" r="54" fill="none" stroke="#F1F5F9" strokeWidth="8" />
            <circle
              cx="64" cy="64" r="54"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={scoreRingColor(overallScore)}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${overallScore >= 80 ? 'text-[#16A34A]' : overallScore >= 60 ? 'text-[#F59E0B]' : 'text-[#DC2626]'}`} style={{ fontWeight: 700 }}>
              {displayScore}
            </span>
            <span className="text-[10px] font-medium text-[#64748B]">/ 100</span>
          </div>
        </div>

        <div className="text-center sm:text-left">
          <p className={`text-xl font-semibold ${overallScore >= 80 ? 'text-[#16A34A]' : overallScore >= 60 ? 'text-[#F59E0B]' : 'text-[#DC2626]'}`} style={{ fontWeight: 600 }}>
            {scoreLabel(overallScore)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <MetricBox label="Speech Clarity" value={`${Math.round(averageConfidence * 100)}%`} score={averageConfidence * 100} />
        <MetricBox label="Fluency" value={`${Math.round(pauseConsistency * 100)}%`} score={pauseConsistency * 100} />
        <MetricBox label="Confidence" value={`${Math.round(averageConfidence * 100)}%`} score={averageConfidence * 100} />
        <MetricBox label="Pace" value={`${Math.round(speechRateWpm)} WPM`} score={speechRateWpm >= 120 && speechRateWpm <= 170 ? 85 : speechRateWpm < 120 ? 60 : 70} />
      </div>
    </div>
  )
}

function MetricBox({ label, value, score }: { label: string; value: string; score: number }) {
  const color = score >= 80 ? 'bg-[#16A34A]' : score >= 60 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]'
  return (
    <div className="rounded-xl bg-[#F8FAFC] p-3">
      <p className="text-xs font-medium text-[#64748B]">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-[#0F172A]" style={{ fontWeight: 600 }}>{value}</p>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
    </div>
  )
}
