import { Sparkles } from 'lucide-react'

interface ImprovementSummaryProps {
  improvements: string[]
}

export default function ImprovementSummary({ improvements }: ImprovementSummaryProps) {
  if (improvements.length === 0) return null

  return (
    <div className="rounded-2xl border border-[#CCFBF1] bg-white p-5 transition-all duration-200 hover:shadow-md" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#0F766E]" />
        <p className="text-xs font-medium uppercase tracking-wide text-[#0F766E]">Top Recommendations</p>
      </div>
      <ul className="mt-3 space-y-2">
        {improvements.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#334155]">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#CCFBF1] text-xs font-medium text-[#0F766E]">
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
