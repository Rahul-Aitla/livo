import { MessageSquareText, Gauge, Regex, Brain } from 'lucide-react'

interface StatsCardsProps {
  wordCount: number
  speechRateWpm: number
  fillerCount: number
  averageConfidence: number
}

const IDEAL_WPM_MIN = 120
const IDEAL_WPM_MAX = 170

interface StatConfig {
  label: string
  icon: typeof MessageSquareText
  getValue: (p: StatsCardsProps) => number
  format: (v: number) => string
  context: (v: number) => { text: string; color: string }
}

const stats: StatConfig[] = [
  {
    label: 'Words',
    icon: MessageSquareText,
    getValue: (p) => p.wordCount,
    format: (v) => v.toString(),
    context: (v) => {
      if (v >= 50) return { text: 'Good sample size', color: 'text-success' }
      if (v >= 30) return { text: 'Adequate sample', color: 'text-[#B45309]' }
      return { text: 'Short sample', color: 'text-[#B91C1C]' }
    },
  },
  {
    label: 'Speaking Rate',
    icon: Gauge,
    getValue: (p) => p.speechRateWpm,
    format: (v) => `${v} WPM`,
    context: (v) => {
      if (v >= IDEAL_WPM_MIN && v <= IDEAL_WPM_MAX) return { text: 'Optimal pace', color: 'text-success' }
      if (v < IDEAL_WPM_MIN) return { text: `Slow (ideal ${IDEAL_WPM_MIN}–${IDEAL_WPM_MAX})`, color: 'text-[#B45309]' }
      return { text: `Fast (ideal ${IDEAL_WPM_MIN}–${IDEAL_WPM_MAX})`, color: 'text-[#B45309]' }
    },
  },
  {
    label: 'Fillers',
    icon: Regex,
    getValue: (p) => p.fillerCount,
    format: (v) => v.toString(),
    context: (v) => {
      if (v === 0) return { text: 'None detected', color: 'text-success' }
      if (v <= 3) return { text: 'Minimal fillers', color: 'text-success' }
      if (v <= 8) return { text: 'Moderate fillers', color: 'text-[#B45309]' }
      return { text: 'Frequent fillers', color: 'text-[#B91C1C]' }
    },
  },
  {
    label: 'Avg Confidence',
    icon: Brain,
    getValue: (p) => Math.round(p.averageConfidence * 100),
    format: (v) => `${v}%`,
    context: (v) => {
      if (v >= 85) return { text: 'Excellent clarity', color: 'text-success' }
      if (v >= 70) return { text: 'Good clarity', color: 'text-success' }
      if (v >= 55) return { text: 'Moderate clarity', color: 'text-[#B45309]' }
      return { text: 'Needs improvement', color: 'text-[#B91C1C]' }
    },
  },
]

export default function StatsCards(props: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon
        const value = stat.getValue(props)
        const ctx = stat.context(value)
        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-white p-4 transition-all duration-200 hover:shadow-md"
            style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}
          >
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="mt-2 text-base sm:text-lg font-semibold text-foreground">
              {stat.format(value)}
            </p>
            <p className="text-xs text-[#475569]">{stat.label}</p>
            <p className={`mt-0.5 text-[10px] font-medium ${ctx.color}`}>
              {ctx.text}
            </p>
          </div>
        )
      })}
    </div>
  )
}
