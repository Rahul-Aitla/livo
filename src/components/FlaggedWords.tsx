import type { WordAnalysis } from '@/types/analysis'

interface FlaggedWordsProps {
  words: WordAnalysis[]
}

const FLAG_THRESHOLD = 0.85
const RED_THRESHOLD = 0.7

function flagColor(confidence: number): { bg: string; text: string; bar: string; label: string } {
  if (confidence < RED_THRESHOLD) return { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', bar: 'bg-[#DC2626]', label: 'Low confidence' }
  return { bg: 'bg-[#FFFBEB]', text: 'text-[#B45309]', bar: 'bg-[#F59E0B]', label: 'Moderate confidence' }
}

export default function FlaggedWords({ words }: FlaggedWordsProps) {
  const flagged = words.filter((w) => w.confidence < FLAG_THRESHOLD)

  if (flagged.length === 0) return null

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 transition-all duration-200 hover:shadow-md" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Flagged Words</p>
        <span className="text-[10px] text-[#94A3B8]">{flagged.length} of {words.length}</span>
      </div>

      <div className="space-y-3">
        {flagged.slice(0, 8).map((w, i) => {
          const colors = flagColor(w.confidence)
          return (
            <div key={i} className={`rounded-xl ${colors.bg} p-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#0F172A]">{w.word}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase ${colors.text} ${colors.bg}`}>
                    {colors.label}
                  </span>
                </div>
                <span className={`text-xs font-medium ${colors.text}`}>
                  {Math.round(w.confidence * 100)}%
                </span>
              </div>

              <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${w.confidence * 100}%` }} />
              </div>

              {w.explanation && (
                <p className="mt-1.5 text-[11px] leading-tight text-[#64748B]">{w.explanation}</p>
              )}
            </div>
          )
        })}
      </div>

      {flagged.length > 8 && (
        <p className="mt-3 text-xs text-[#64748B]">+{flagged.length - 8} more flagged words</p>
      )}
    </div>
  )
}
