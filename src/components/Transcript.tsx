'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import type { WordAnalysis } from '@/types/analysis'

interface TranscriptProps {
  words: WordAnalysis[]
}

const statusColors: Record<string, string> = {
  clean: 'text-[#334155]',
  low_confidence: 'text-[#B45309] bg-[#FFFBEB] border-b-2 border-dotted border-[#F59E0B]',
  unclear_segment: 'text-[#991B1B] bg-[#FEF2F2] border-b-2 border-dotted border-[#DC2626]',
}

export default function Transcript({ words }: TranscriptProps) {
  const [hoveredWord, setHoveredWord] = useState<WordAnalysis | null>(null)

  if (words.length === 0) {
    return (
      <p className="text-sm italic text-[#64748B]">No transcript available.</p>
    )
  }

  return (
    <div className="relative rounded-2xl border border-[#E2E8F0] bg-white p-5 transition-all duration-200 hover:shadow-md" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#64748B]">Transcript</p>
      <p className="text-base leading-relaxed">
        {words.map((w, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.015, duration: 0.2 }}
            className="relative inline"
          >
            <span
              className={`${statusColors[w.status]} rounded-sm px-0.5 cursor-pointer transition-colors`}
              onMouseEnter={() => setHoveredWord(w)}
              onMouseLeave={() => setHoveredWord(null)}
              onClick={() => setHoveredWord(hoveredWord?.word === w.word ? null : w)}
            >
              {w.word}
            </span>{' '}
          </motion.span>
        ))}
      </p>

      {hoveredWord && hoveredWord.status !== 'clean' && (
        <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm animate-fade-in">
          <p className="font-medium text-[#0F172A]">&ldquo;{hoveredWord.word}&rdquo;</p>
          <p className="mt-1 text-xs text-[#64748B]">
            Confidence: {Math.round(hoveredWord.confidence * 100)}%
          </p>
          {hoveredWord.explanation && (
            <p className="mt-1 text-xs text-[#64748B]">
              {hoveredWord.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
