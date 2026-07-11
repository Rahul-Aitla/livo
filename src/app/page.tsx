'use client'

import { useState } from 'react'
import type { AnalysisResult } from '@/types/analysis'
import Upload from '@/components/Upload'
import ScoreCard from '@/components/ScoreCard'
import Transcript from '@/components/Transcript'

type AppState =
  | { phase: 'upload' }
  | { phase: 'loading' }
  | { phase: 'result'; data: AnalysisResult }
  | { phase: 'error'; message: string }

export default function Home() {
  const [state, setState] = useState<AppState>({ phase: 'upload' })

  async function handleAnalyze(file: File) {
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
      setState({ phase: 'error', message: 'Network error. Please try again.' })
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Speech Analysis</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload a 30–45 second English recording for pronunciation feedback
        </p>
      </header>

      <section className="mb-8">
        <Upload onAnalyze={handleAnalyze} loading={state.phase === 'loading'} />
      </section>

      {state.phase === 'loading' && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
        </div>
      )}

      {state.phase === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {state.phase === 'result' && (
        <div className="space-y-6">
          <ScoreCard
            overallScore={state.data.overall_score}
            averageConfidence={state.data.average_confidence}
            speechRateWpm={state.data.speech_rate_wpm}
            pauseConsistency={state.data.pause_consistency}
            fillerWordRatio={state.data.filler_word_ratio}
          />

          <Transcript words={state.data.words} />

          {state.data.top_improvements.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-medium text-zinc-500 uppercase tracking-wide">
                Top improvements
              </h3>
              <ul className="list-disc pl-5 text-sm text-zinc-700 space-y-1">
                {state.data.top_improvements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
