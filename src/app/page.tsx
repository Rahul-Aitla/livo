'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Upload, Shield, Zap, Clock, Trash2 } from 'lucide-react'
import { Check } from 'lucide-react'
import type { AnalysisResult } from '@/types/analysis'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RecordTab from '@/components/RecordTab'
import UploadTab from '@/components/UploadTab'
import LoadingStepper from '@/components/LoadingStepper'
import ScoreCard from '@/components/ScoreCard'
import Transcript from '@/components/Transcript'
import FlaggedWords from '@/components/FlaggedWords'
import StatsCards from '@/components/StatsCards'
import ImprovementSummary from '@/components/ImprovementSummary'

type AppState =
  | { phase: 'upload' }
  | { phase: 'loading' }
  | { phase: 'result'; data: AnalysisResult }
  | { phase: 'error'; message: string }

type InputMode = 'record' | 'upload'

const trustBadges = [
  { icon: Clock, text: '30–45 second analysis' },
  { icon: Trash2, text: 'Audio deleted after processing' },
  { icon: Zap, text: 'AI-powered pronunciation feedback' },
]

const features = [
  { title: 'Word Accuracy', desc: 'Phoneme-level confidence scoring per word' },
  { title: 'Speech Rate', desc: 'Measure your pace against natural benchmarks' },
  { title: 'Filler Detection', desc: 'Identify ums, uhs, and verbal hesitations' },
  { title: 'AI Feedback', desc: 'Personalized improvement suggestions' },
]

export default function Home() {
  const [state, setState] = useState<AppState>({ phase: 'upload' })
  const [inputMode, setInputMode] = useState<InputMode>('record')
  const [consent, setConsent] = useState(false)

  async function handleAnalyze(file: File) {
    if (!consent) {
      setState({ phase: 'error', message: 'Please consent to audio processing before uploading.' })
      return
    }

    setState({ phase: 'loading' })

    const formData = new FormData()
    formData.append('audio', file)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json()
        setState({ phase: 'error', message: body.error || 'Something went wrong.' })
        return
      }

      const data: AnalysisResult = await res.json()
      setState({ phase: 'result', data })
    } catch {
      setState({ phase: 'error', message: 'Network error. Please check your connection and try again.' })
    }
  }

  const wordCount = state.phase === 'result' ? state.data.words.length : 0
  const fillerCount = state.phase === 'result' ? Math.round(state.data.filler_word_ratio * wordCount) : 0

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1" style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 24px' }}>
        {state.phase === 'upload' && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="pb-16 pt-8 sm:pb-20 sm:pt-12"
          >
            {/* Hero */}
            <div className="mx-auto max-w-2xl text-center">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="text-4xl font-bold tracking-tight text-[#0F172A] sm:text-5xl"
              >
                Speak with
                <span className="relative ml-2 text-[#0F766E]">
                  confidence
                  <svg className="absolute -bottom-1 left-0 h-2 w-full" viewBox="0 0 120 8" fill="none">
                    <path d="M2 6C30 2 60 2 90 6C105 8 115 6 118 4" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
                  </svg>
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mx-auto mt-4 max-w-lg text-base text-[#64748B] sm:text-lg"
              >
                Record or upload a short English audio clip and get AI-powered pronunciation analysis with word-level feedback.
              </motion.p>
            </div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mt-8 flex flex-wrap justify-center gap-3"
            >
              {trustBadges.map((badge) => (
                <div
                  key={badge.text}
                  className="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#64748B] shadow-sm"
                >
                  <badge.icon className="h-3.5 w-3.5 text-[#0F766E]" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </motion.div>

            {/* Feature chips */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-[#E2E8F0] bg-white p-3 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="text-xs font-semibold text-[#0F172A]">{f.title}</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-[#64748B]">{f.desc}</p>
                </div>
              ))}
            </motion.div>

            {/* Input mode selector */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mx-auto mt-10 grid max-w-lg grid-cols-2 gap-4"
            >
              <button
                onClick={() => setInputMode('record')}
                className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all duration-300 ${
                  inputMode === 'record'
                    ? 'border-[#0F766E] bg-[#F0FDFA] shadow-lg shadow-[#0F766E]/10'
                    : 'border-[#E2E8F0] bg-white shadow-sm hover:-translate-y-1 hover:border-[#0F766E] hover:shadow-xl hover:shadow-[#0F766E]/5'
                }`}
              >
                {inputMode === 'record' && (
                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0F766E] shadow-md">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={`rounded-full p-3 transition-colors ${inputMode === 'record' ? 'bg-[#0F766E]' : 'bg-[#F1F5F9] group-hover:bg-[#0F766E]/10'}`}>
                  <Mic className={`h-6 w-6 ${inputMode === 'record' ? 'text-white' : 'text-[#64748B] group-hover:text-[#0F766E]'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${inputMode === 'record' ? 'text-[#0F766E]' : 'text-[#0F172A]'}`}>
                    Record Audio
                  </p>
                  <p className="text-xs text-[#64748B]">Speak directly</p>
                </div>
              </button>

              <button
                onClick={() => setInputMode('upload')}
                className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all duration-300 ${
                  inputMode === 'upload'
                    ? 'border-[#0F766E] bg-[#F0FDFA] shadow-lg shadow-[#0F766E]/10'
                    : 'border-[#E2E8F0] bg-white shadow-sm hover:-translate-y-1 hover:border-[#0F766E] hover:shadow-xl hover:shadow-[#0F766E]/5'
                }`}
              >
                {inputMode === 'upload' && (
                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0F766E] shadow-md">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={`rounded-full p-3 transition-colors ${inputMode === 'upload' ? 'bg-[#0F766E]' : 'bg-[#F1F5F9] group-hover:bg-[#0F766E]/10'}`}>
                  <Upload className={`h-6 w-6 ${inputMode === 'upload' ? 'text-white' : 'text-[#64748B] group-hover:text-[#0F766E]'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${inputMode === 'upload' ? 'text-[#0F766E]' : 'text-[#0F172A]'}`}>
                    Upload Audio
                  </p>
                  <p className="text-xs text-[#64748B]">Select a file</p>
                </div>
              </button>
            </motion.div>

            {/* Input area */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6"
            >
              {inputMode === 'record' ? (
                <RecordTab onAnalyze={handleAnalyze} loading={false} />
              ) : (
                <UploadTab onAnalyze={handleAnalyze} loading={false} />
              )}
            </motion.div>

            {/* Consent + Privacy */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3"
            >
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#64748B] transition-colors hover:border-[#0F766E] hover:bg-[#F0FDFA]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-[#0F766E]"
                />
                <span>
                  I consent to processing my audio solely for pronunciation analysis. The recording is deleted immediately after processing.
                </span>
              </label>
              <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                <Shield className="h-3 w-3 text-[#0F766E]" />
                Your privacy is protected — no storage, no retention
              </div>
            </motion.div>
          </motion.section>
        )}

        {/* Loading */}
        {state.phase === 'loading' && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16"
          >
            <LoadingStepper />
          </motion.section>
        )}

        {/* Error */}
        {state.phase === 'error' && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-12"
          >
            <div className="mx-auto max-w-md rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-6 text-center">
              <p className="text-sm font-medium text-[#DC2626]">{state.message}</p>
              <button
                onClick={() => setState({ phase: 'upload' })}
                className="mt-4 rounded-xl bg-[#DC2626] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#B91C1C]"
              >
                Try again
              </button>
            </div>
          </motion.section>
        )}

        {/* Results */}
        {state.phase === 'result' && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="py-8"
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left column */}
              <div className="space-y-6 lg:col-span-2">
                <ScoreCard
                  overallScore={state.data.overall_score}
                  averageConfidence={state.data.average_confidence}
                  speechRateWpm={state.data.speech_rate_wpm}
                  pauseConsistency={state.data.pause_consistency}
                  fillerWordRatio={state.data.filler_word_ratio}
                />

                <StatsCards
                  wordCount={wordCount}
                  speechRateWpm={state.data.speech_rate_wpm}
                  fillerCount={fillerCount}
                  averageConfidence={state.data.average_confidence}
                />

                <Transcript words={state.data.words} />

                <ImprovementSummary improvements={state.data.top_improvements} />
              </div>

              {/* Right column */}
              <div className="space-y-6">
                <FlaggedWords words={state.data.words} />

                <div className="text-center">
                  <button
                    onClick={() => setState({ phase: 'upload' })}
                    className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-medium text-[#64748B] transition-all hover:border-[#0F766E] hover:text-[#0F766E]"
                  >
                    Analyze another recording
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </main>

      <Footer />
    </div>
  )
}
