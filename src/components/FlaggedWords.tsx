import type { WordAnalysis } from '@/types/analysis'

interface FlaggedWordsProps {
  words: WordAnalysis[]
}

export default function FlaggedWords({ words }: FlaggedWordsProps) {
  const flagged = words.filter((w) => w.status !== 'clean')

  if (flagged.length === 0) return null

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 transition-all duration-200 hover:shadow-md" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#64748B]">Flagged Words</p>
      <div className="space-y-4">
        {flagged.slice(0, 6).map((w, i) => (
          <div key={i}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#0F172A]">{w.word}</span>
              <span className={`text-xs font-medium ${w.confidence < 0.6 ? 'text-[#DC2626]' : 'text-[#F59E0B]'}`}>
                {Math.round(w.confidence * 100)}%
              </span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
              <div
                className={`h-full rounded-full ${w.confidence < 0.6 ? 'bg-[#DC2626]' : 'bg-[#F59E0B]'}`}
                style={{ width: `${w.confidence * 100}%` }}
              />
            </div>
            {w.explanation && (
              <p className="mt-1 text-xs text-[#64748B]">{w.explanation}</p>
            )}
            {i < flagged.length - 1 && i < 5 && <div className="mt-3 border-t border-[#F1F5F9]" />}
          </div>
        ))}
      </div>
      {flagged.length > 6 && (
        <p className="mt-3 text-xs text-[#64748B]">+{flagged.length - 6} more</p>
      )}
    </div>
  )
}
