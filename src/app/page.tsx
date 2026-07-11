'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Upload, Shield, Zap, Clock, Trash2, RotateCcw } from 'lucide-react'
import { Check } from 'lucide-react'
import type { AnalysisResult } from '@/types/analysis'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RecordTab from '@/components/RecordTab'
import UploadTab from '@/components/UploadTab'
import LoadingStepper from '@/components/LoadingStepper'
import HowItWorks from '@/components/HowItWorks'
import OverallProfile from '@/components/OverallProfile'
import ScoreCard from '@/components/ScoreCard'
import Transcript from '@/components/Transcript'
import FlaggedWords from '@/components/FlaggedWords'
import StatsCards from '@/components/StatsCards'
import ImprovementSummary from '@/components/ImprovementSummary'
import AudioPlayer from '@/components/AudioPlayer'

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

const FETCH_TIMEOUT_MS = 25_000

export default function Home() {
  const [state, setState] = useState<AppState>({ phase: 'upload' })
  const [inputMode, setInputMode] = useState<InputMode>('record')
  const [consent, setConsent] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const isAnalyzingRef = useRef(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playUntilRef = useRef(0)

  // beforeunload during loading
  useEffect(() => {
    if (state.phase !== 'loading') return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [state.phase])

  async function handleAnalyze(file: File) {
    if (isAnalyzingRef.current) return
    if (!consent) {
      setState({ phase: 'error', message: 'Please consent to audio processing before uploading.' })
      return
    }

    // Store audio URL for playback
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    const url = URL.createObjectURL(file)
    setAudioUrl(url)

    isAnalyzingRef.current = true
    setIsLoading(true)

    const controller = new AbortController()
    abortRef.current = controller
    setState({ phase: 'loading' })

    // Timeout guard
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const formData = new FormData()
    formData.append('audio', file)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setState({ phase: 'error', message: body.error || 'Something went wrong.' })
        return
      }

      const data: AnalysisResult = await res.json()
      setHasAnalyzed(true)
      setState({ phase: 'result', data })
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setState({ phase: 'error', message: 'Request timed out. Please try a shorter audio file or check your connection.' })
        return
      }
      setState({ phase: 'error', message: 'Network error. Please check your connection and try again.' })
    } finally {
      isAnalyzingRef.current = false
      setIsLoading(false)
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
    abortRef.current = null
    isAnalyzingRef.current = false
    setIsLoading(false)
  }

  function goToUpload() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setState({ phase: 'upload' })
  }

  function handleWordPlay(start: number, end: number) {
    const el = audioRef.current
    if (!el) return
    playUntilRef.current = end
    el.currentTime = start
    el.play()
  }

  const wordCount = state.phase === 'result' ? state.data.words.length : 0
  const fillerCount = state.phase === 'result' ? Math.round(state.data.filler_word_ratio * wordCount) : 0

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1" style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 24px' }}>
        <AnimatePresence mode="wait">
        {state.phase === 'upload' && (
          <motion.section
            key="upload"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="pb-16 pt-8 sm:pb-20 sm:pt-12"
          >
            {hasAnalyzed && (
              <div className="mx-auto mb-8 text-center">
                <p className="text-sm text-muted">
                  Ready for another analysis? Record or upload a new audio file.
                </p>
              </div>
            )}

            {/* Hero */}
            <div className="mx-auto max-w-2xl text-center">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
              >
                Speak with
                <span className="relative ml-2 text-primary">
                  confidence
                  <svg className="absolute -bottom-1 left-0 h-2 w-full" viewBox="0 0 120 8" fill="none" aria-hidden="true">
                    <path d="M2 6C30 2 60 2 90 6C105 8 115 6 118 4" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
                  </svg>
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mx-auto mt-4 max-w-lg text-base text-muted sm:text-lg"
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
                  className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm text-[#475569] shadow-sm"
                >
                  <badge.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </motion.div>

            {/* How it Works */}
            {!hasAnalyzed && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <HowItWorks />
              </motion.div>
            )}

            {/* Input mode selector */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mx-auto mt-10 grid max-w-lg grid-cols-2 gap-4"
              role="radiogroup"
              aria-label="Input method"
            >
              <button
                onClick={() => setInputMode('record')}
                role="radio"
                aria-checked={inputMode === 'record'}
                aria-label="Record audio from microphone"
                className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all duration-300 ${
                  inputMode === 'record'
                    ? 'border-primary bg-[#F0FDFA] shadow-lg shadow-primary/10'
                    : 'border-border bg-white shadow-sm hover:-translate-y-1 hover:border-primary hover:shadow-xl hover:shadow-primary/5'
                }`}
              >
                {inputMode === 'record' && (
                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-md" aria-hidden="true">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={`rounded-full p-3 transition-colors ${inputMode === 'record' ? 'bg-primary' : 'bg-bg-secondary group-hover:bg-primary/10'}`}>
                  <Mic className={`h-6 w-6 ${inputMode === 'record' ? 'text-white' : 'text-muted group-hover:text-primary'}`} aria-hidden="true" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${inputMode === 'record' ? 'text-primary' : 'text-foreground'}`}>
                    Record Audio
                  </p>
                  <p className="text-xs text-muted">Speak directly</p>
                </div>
              </button>

              <button
                onClick={() => setInputMode('upload')}
                role="radio"
                aria-checked={inputMode === 'upload'}
                aria-label="Upload audio file"
                className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all duration-300 ${
                  inputMode === 'upload'
                    ? 'border-primary bg-[#F0FDFA] shadow-lg shadow-primary/10'
                    : 'border-border bg-white shadow-sm hover:-translate-y-1 hover:border-primary hover:shadow-xl hover:shadow-primary/5'
                }`}
              >
                {inputMode === 'upload' && (
                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-md" aria-hidden="true">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={`rounded-full p-3 transition-colors ${inputMode === 'upload' ? 'bg-primary' : 'bg-bg-secondary group-hover:bg-primary/10'}`}>
                  <Upload className={`h-6 w-6 ${inputMode === 'upload' ? 'text-white' : 'text-muted group-hover:text-primary'}`} aria-hidden="true" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${inputMode === 'upload' ? 'text-primary' : 'text-foreground'}`}>
                    Upload Audio
                  </p>
                  <p className="text-xs text-muted">Select a file</p>
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
                <RecordTab onAnalyze={handleAnalyze} loading={isLoading} />
              ) : (
                <UploadTab onAnalyze={handleAnalyze} loading={isLoading} />
              )}
            </motion.div>

            {/* Consent + Privacy */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mx-auto mt-6 flex max-w-md flex-col items-center"
            >
              <div className={`w-full rounded-xl border bg-white p-5 shadow-sm transition-all ${consent ? 'border-primary bg-[#F0FDFA]' : 'border-border'}`}>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                  <p className="text-sm font-semibold text-foreground">Privacy</p>
                </div>
                <label className="mt-3 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 h-5 w-5 accent-primary"
                    aria-label="I agree to process my recording solely for pronunciation analysis"
                  />
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-foreground">
                      I agree to process my recording solely for pronunciation analysis. Audio is processed in memory and deleted immediately.
                    </p>
                    <a href="#" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      Learn more about privacy
                      <span aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                </label>
              </div>
            </motion.div>
          </motion.section>
        )}

        {/* Loading */}
        {state.phase === 'loading' && (
          <motion.section
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="py-16"
            aria-label="Analyzing your audio"
            role="status"
          >
            <LoadingStepper onCancel={handleCancel} />
          </motion.section>
        )}

        {/* Error */}
        {state.phase === 'error' && (
          <motion.section
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="py-12"
            role="alert"
          >
            <div className="mx-auto max-w-md rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-6 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#FECACA]">
                <svg className="h-5 w-5 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-[#B91C1C]">Analysis failed</p>
              <p className="mt-1 text-xs text-[#991B1B]">{state.message}</p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={goToUpload}
                  className="flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-[#475569] transition-all hover:border-danger hover:text-danger"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Back
                </button>
                <button
                  onClick={goToUpload}
                  className="rounded-xl bg-danger px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#B91C1C]"
                >
                  Try again
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* Results */}
        {state.phase === 'result' && (
          <motion.section
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="py-8"
          >
            {audioUrl && (
              <audio ref={audioRef} src={audioUrl} preload="auto" />
            )}

            <OverallProfile
              overallScore={state.data.overall_score}
              averageConfidence={state.data.average_confidence}
              speechRateWpm={state.data.speech_rate_wpm}
              pauseConsistency={state.data.pause_consistency}
              fillerWordRatio={state.data.filler_word_ratio}
              topImprovements={state.data.top_improvements}
            />

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
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

                <Transcript words={state.data.words} onWordPlay={handleWordPlay} />

                <ImprovementSummary improvements={state.data.top_improvements} />
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {audioUrl && <AudioPlayer audioRef={audioRef} playUntilRef={playUntilRef} />}
                <FlaggedWords words={state.data.words} />

                <div className="text-center">
                  <button
                    onClick={goToUpload}
                    className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-[#475569] transition-all hover:border-primary hover:text-primary"
                  >
                    Analyze another recording
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  )
}
