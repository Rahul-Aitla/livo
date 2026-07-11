'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Upload, Shield } from 'lucide-react'
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
        {/* Hero */}
        {state.phase === 'upload' && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="py-12 text-center sm:py-16"
          >
            <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl" style={{ fontWeight: 700 }}>
              Analyze Your English Pronunciation
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm text-[#64748B] sm:text-base">
              Upload a 30–45 second English recording and receive AI-generated pronunciation feedback, confidence analysis, and actionable suggestions.
            </p>

            {/* Input mode selector */}
            <div className="mx-auto mt-10 grid max-w-lg grid-cols-2 gap-4">
              <button
                onClick={() => setInputMode('record')}
                className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all duration-200 ${
                  inputMode === 'record'
                    ? 'border-[#0F766E] bg-[#F0FDFA]'
                    : 'border-[#E2E8F0] bg-white hover:border-[#0F766E] hover:shadow-md'
                }`}
                style={inputMode === 'record' ? { boxShadow: '0 10px 30px rgba(15,23,42,0.08)' } : undefined}
              >
                <Mic className={`h-6 w-6 ${inputMode === 'record' ? 'text-[#0F766E]' : 'text-[#64748B]'}`} />
                <div>
                  <p className={`text-sm font-semibold ${inputMode === 'record' ? 'text-[#0F766E]' : 'text-[#0F172A]'}`} style={{ fontWeight: 600 }}>
                    Record Audio
                  </p>
                  <p className="text-xs text-[#64748B]">Speak directly</p>
                </div>
              </button>

              <button
                onClick={() => setInputMode('upload')}
                className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all duration-200 ${
                  inputMode === 'upload'
                    ? 'border-[#0F766E] bg-[#F0FDFA]'
                    : 'border-[#E2E8F0] bg-white hover:border-[#0F766E] hover:shadow-md'
                }`}
                style={inputMode === 'upload' ? { boxShadow: '0 10px 30px rgba(15,23,42,0.08)' } : undefined}
              >
                <Upload className={`h-6 w-6 ${inputMode === 'upload' ? 'text-[#0F766E]' : 'text-[#64748B]'}`} />
                <div>
                  <p className={`text-sm font-semibold ${inputMode === 'upload' ? 'text-[#0F766E]' : 'text-[#0F172A]'}`} style={{ fontWeight: 600 }}>
                    Upload Audio
                  </p>
                  <p className="text-xs text-[#64748B]">Select a file</p>
                </div>
              </button>
            </div>

            {/* Input area */}
            <div className="mt-6">
              {inputMode === 'record' ? (
                <RecordTab onAnalyze={handleAnalyze} loading={false} />
              ) : (
                <UploadTab onAnalyze={handleAnalyze} loading={false} />
              )}
            </div>

            {/* Consent + Privacy */}
            <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3">
              <label className="flex items-start gap-2 text-sm text-[#64748B]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I consent to processing my audio solely for pronunciation analysis. The recording is deleted immediately after processing.
                </span>
              </label>
              <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                <Shield className="h-3 w-3" />
                Your privacy is protected
              </div>
            </div>
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
