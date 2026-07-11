import { MessageSquareText, Gauge, Regex, Brain } from 'lucide-react'

interface StatsCardsProps {
  wordCount: number
  speechRateWpm: number
  fillerCount: number
  averageConfidence: number
}

const stats = [
  { label: 'Words', icon: MessageSquareText, getValue: (p: StatsCardsProps) => p.wordCount, format: (v: number) => v.toString() },
  { label: 'Speaking Rate', icon: Gauge, getValue: (p: StatsCardsProps) => p.speechRateWpm, format: (v: number) => `${v} WPM` },
  { label: 'Fillers', icon: Regex, getValue: (p: StatsCardsProps) => p.fillerCount, format: (v: number) => v.toString() },
  { label: 'Avg Confidence', icon: Brain, getValue: (p: StatsCardsProps) => Math.round(p.averageConfidence * 100), format: (v: number) => `${v}%` },
]

export default function StatsCards(props: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const value = stat.getValue(props)
        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#E2E8F0] bg-white p-4 transition-all duration-200 hover:shadow-md"
            style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}
          >
            <Icon className="h-4 w-4 text-[#0F766E]" />
            <p className="mt-2 text-lg font-semibold text-[#0F172A]" style={{ fontWeight: 600 }}>
              {stat.format(value)}
            </p>
            <p className="text-xs text-[#64748B]">{stat.label}</p>
          </div>
        )
      })}
    </div>
  )
}
