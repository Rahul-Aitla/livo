'use client'

import { useState, useRef, useEffect } from 'react'
import type { WordAnalysis } from '@/types/analysis'

interface HighlightWordProps {
  word: WordAnalysis
}

const statusStyles: Record<string, string> = {
  clean: 'text-zinc-800',
  low_confidence:
    'cursor-help border-b-2 border-dotted border-yellow-400 text-yellow-800 bg-yellow-50 rounded-sm px-0.5',
  unclear_segment:
    'cursor-help border-b-2 border-dotted border-red-400 text-red-800 bg-red-50 rounded-sm px-0.5',
}

export default function HighlightWord({ word }: HighlightWordProps) {
  const [showNote, setShowNote] = useState(false)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const wordRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!showNote || !tooltipRef.current || !wordRef.current) return
    const rect = wordRef.current.getBoundingClientRect()
    const tooltip = tooltipRef.current
    tooltip.style.left = '0'
    tooltip.style.right = 'auto'

    if (rect.left < 0) {
      tooltip.style.left = `${Math.abs(rect.left) + 4}px`
    }
    if (rect.right > window.innerWidth) {
      tooltip.style.left = `${window.innerWidth - rect.right - 4}px`
    }
  }, [showNote])

  const hasIssue = word.status !== 'clean'

  return (
    <span className="relative inline">
      <span
        ref={wordRef}
        className={statusStyles[word.status]}
        onMouseEnter={() => setShowNote(true)}
        onMouseLeave={() => setShowNote(false)}
        onClick={() => setShowNote(!showNote)}
        role={hasIssue ? 'button' : undefined}
        tabIndex={hasIssue ? 0 : undefined}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowNote(!showNote) }}
      >
        {word.word}
      </span>
      {hasIssue && showNote && word.explanation && (
        <span
          ref={tooltipRef}
          className="absolute z-10 mt-1 w-56 rounded-lg bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg"
          style={{ top: '100%', left: 0 }}
        >
          {word.explanation}
        </span>
      )}
    </span>
  )
}
