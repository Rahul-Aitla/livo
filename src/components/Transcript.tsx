import type { WordAnalysis } from '@/types/analysis'
import HighlightWord from './HighlightWord'

interface TranscriptProps {
  words: WordAnalysis[]
}

export default function Transcript({ words }: TranscriptProps) {
  if (words.length === 0) {
    return (
      <p className="text-sm text-zinc-400 italic">
        No transcript available.
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Transcript
      </h3>
      <p className="text-base leading-relaxed">
        {words.map((w, i) => (
          <span key={i}>
            <HighlightWord word={w} />
            {' '}
          </span>
        ))}
      </p>
    </div>
  )
}
