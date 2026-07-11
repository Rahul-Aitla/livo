import { Sparkles } from 'lucide-react'

interface ImprovementSummaryProps {
  improvements: string[]
}

export default function ImprovementSummary({ improvements }: ImprovementSummaryProps) {
  if (improvements.length === 0) return null

  return (
    <div className="rounded-2xl border border-primary-light bg-white p-5 transition-all duration-200 hover:shadow-md" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Top Recommendations</p>
      </div>
      <ul className="mt-3 space-y-2">
        {improvements.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-body">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-medium text-primary">
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
