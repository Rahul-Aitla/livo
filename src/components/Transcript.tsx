'use client'

import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import type { WordAnalysis } from '@/types/analysis'

interface TranscriptProps {
  words: WordAnalysis[]
}

const SENTENCE_GAP_THRESHOLD = 0.5
const FLAG_THRESHOLD = 0.85
const AMBER_THRESHOLD = 0.7

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function confidenceLabel(conf: number): { text: string; color: string } {
  if (conf >= AMBER_THRESHOLD) return { text: 'High', color: 'text-[#16A34A]' }
  if (conf >= 0.5) return { text: 'Moderate', color: 'text-[#B45309]' }
  return { text: 'Low', color: 'text-[#B91C1C]' }
}

function wordStyle(conf: number): string {
  const base = 'relative inline rounded-sm px-0.5 py-0.5 cursor-pointer transition-all duration-150 break-words'
  if (conf < AMBER_THRESHOLD) return `${base} text-[#991B1B] bg-[#FEF2F2] border-b-2 border-dotted border-[#DC2626]`
  if (conf < FLAG_THRESHOLD) return `${base} text-[#92400E] bg-[#FFFBEB] border-b-2 border-dotted border-[#F59E0B]`
  return `${base} text-[#334155] hover:bg-[#F1F5F9]`
}

interface SentenceGroup {
  startTime: number
  words: WordAnalysis[]
}

export default function Transcript({ words }: TranscriptProps) {
  const [selectedWord, setSelectedWord] = useState<WordAnalysis | null>(null)

  const sentences = useMemo(() => {
    if (words.length === 0) return []
    const groups: SentenceGroup[] = []
    let current: WordAnalysis[] = [words[0]]
    for (let i = 1; i < words.length; i++) {
      const gap = words[i].start - words[i - 1].end
      if (gap > SENTENCE_GAP_THRESHOLD) {
        groups.push({ startTime: current[0].start, words: current })
        current = [words[i]]
      } else {
        current.push(words[i])
      }
    }
    if (current.length > 0) groups.push({ startTime: current[0].start, words: current })
    return groups
  }, [words])

  if (words.length === 0) {
    return (
      <p className="text-sm italic text-[#475569]">No transcript available.</p>
    )
  }

  const flaggedCount = words.filter((w) => w.confidence < FLAG_THRESHOLD).length

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 transition-all duration-200 hover:shadow-md" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-[#475569]">Transcript</p>
        <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
          <span>{words.length} words</span>
          {flaggedCount > 0 && (
            <>
              <span className="text-[#E2E8F0]">|</span>
              <span className="text-[#B45309]">{flaggedCount} flagged</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3 break-words">
        {sentences.map((sentence, si) => (
          <motion.div
            key={si}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: si * 0.03, duration: 0.2 }}
            className="leading-relaxed"
          >
            <span className="mr-1.5 text-[10px] font-medium text-[#64748B] select-none" aria-hidden="true">
              {formatTime(sentence.startTime)}
            </span>
            {sentence.words.map((w, wi) => (
              <span key={`${si}-${wi}`} className="relative inline">
                <button
                  type="button"
                  className={wordStyle(w.confidence)}
                  onClick={() => setSelectedWord(selectedWord?.word === w.word && selectedWord?.start === w.start ? null : w)}
                  aria-label={`Word: ${w.word}, confidence: ${Math.round(w.confidence * 100)}%`}
                >
                  {w.confidence < FLAG_THRESHOLD && (
                    <AlertTriangle className="mr-0.5 inline h-2.5 w-2.5 -translate-y-[0.5px]" aria-hidden="true" />
                  )}
                  <span className="break-all sm:break-normal">{w.word}</span>
                </button>{' '}
              </span>
            ))}
          </motion.div>
        ))}
      </div>

      {selectedWord && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
          role="region"
          aria-label={`Word details for "${selectedWord.word}"`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#0F172A] break-all">&ldquo;{selectedWord.word}&rdquo;</span>
                <Info className="h-3 w-3 flex-shrink-0 text-[#64748B]" aria-hidden="true" />
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[#64748B]">Confidence</p>
                  <p className="font-medium text-[#0F172A]">{Math.round(selectedWord.confidence * 100)}%</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Quality</p>
                  <p className={`font-medium ${confidenceLabel(selectedWord.confidence).color}`}>
                    {confidenceLabel(selectedWord.confidence).text}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748B]">Timestamp</p>
                  <p className="font-medium text-[#0F172A]">
                    {formatTime(selectedWord.start)} – {formatTime(selectedWord.end)}
                  </p>
                </div>
              </div>

              {selectedWord.explanation && (
                <p className="mt-2 text-xs text-[#64748B]">{selectedWord.explanation}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedWord(null)}
              className="flex-shrink-0 rounded-md p-1 text-[#64748B] transition-colors hover:bg-[#E2E8F0] hover:text-[#475569]"
              aria-label="Close word details"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
