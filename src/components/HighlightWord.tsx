'use client'

import { useState } from 'react'
import type { WordAnalysis } from '@/types/analysis'

interface HighlightWordProps {
  word: WordAnalysis
}

const statusStyles: Record<string, string> = {
  clean: 'text-zinc-800',
  low_confidence: 'cursor-help border-b-2 border-yellow-400 text-yellow-800 bg-yellow-50 rounded px-0.5',
  unclear_segment: 'cursor-help border-b-2 border-red-400 text-red-800 bg-red-50 rounded px-0.5',
}

export default function HighlightWord({ word }: HighlightWordProps) {
  const [showNote, setShowNote] = useState(false)

  const hasIssue = word.status !== 'clean'

  return (
    <span className="relative inline">
      <span
        className={statusStyles[word.status]}
        onMouseEnter={() => setShowNote(true)}
        onMouseLeave={() => setShowNote(false)}
        onClick={() => setShowNote(!showNote)}
      >
        {word.word}
      </span>
      {hasIssue && showNote && word.explanation && (
        <span className="absolute -top-8 left-0 z-10 w-56 rounded bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg">
          {word.explanation}
        </span>
      )}
    </span>
  )
}
