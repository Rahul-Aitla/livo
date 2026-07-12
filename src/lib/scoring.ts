import type { WordAnalysis, AnalysisResult } from '@/types/analysis'

export interface ScoringInput {
  words: Array<{ word: string; start: number; end: number; confidence: number }>
  totalDuration: number
}

const CONFIDENCE_LOW = 0.6
const CONFIDENCE_MEDIUM = 0.75
const GAP_THRESHOLD_MULTIPLIER = 2.5
const MIN_GAP_SECONDS = 0.5
const IDEAL_WPM_MIN = 120
const IDEAL_WPM_MAX = 170
const PAUSE_CONSISTENCY_THRESHOLD = 0.7
const FILLER_RATIO_THRESHOLD = 0.03

const FILLER_WORDS = new Set([
  'uh', 'um', 'er', 'ah', 'like', 'well', 'so', 'actually',
  'basically', 'literally', 'you know', 'i mean', 'sort of',
  'kind of', 'right', 'okay',
])

export function scoreRecording(input: ScoringInput): AnalysisResult {
  const { words: rawWords, totalDuration } = input

  const gaps: number[] = []
  for (let i = 1; i < rawWords.length; i++) {
    const gap = rawWords[i].start - rawWords[i - 1].end
    if (gap > 0) gaps.push(gap)
  }

  const avgGap = gaps.length > 0
    ? gaps.reduce((s, g) => s + g, 0) / gaps.length
    : 0

  const gapThreshold = Math.max(avgGap * GAP_THRESHOLD_MULTIPLIER, MIN_GAP_SECONDS)

  const words: WordAnalysis[] = rawWords.map((w, i) => {
    let status: 'clean' | 'low_confidence' | 'unclear_segment' = 'clean'
    let explanation: string | null = null

    const gapBefore = i > 0 ? w.start - rawWords[i - 1].end : 0
    const gapAfter = i < rawWords.length - 1 ? rawWords[i + 1].start - w.end : 0
    const longGap = gapBefore > gapThreshold || gapAfter > gapThreshold

    if (longGap) {
      status = 'unclear_segment'
      explanation = 'Notable pause around this word — may indicate hesitation or unclear segment'
    }

    if (w.confidence < CONFIDENCE_LOW) {
      status = 'low_confidence'
      explanation = 'Possible clarity issue — was not clearly recognized'
    } else if (w.confidence < CONFIDENCE_MEDIUM && !longGap) {
      status = 'low_confidence'
      explanation = 'Was less clearly recognized'
    }

    return {
      word: w.word,
      start: w.start,
      end: w.end,
      confidence: w.confidence,
      status,
      explanation,
    }
  })

  const averageConfidence =
    words.reduce((sum, w) => sum + w.confidence, 0) / words.length

  const wordCount = words.length
  const speechRateWpm = totalDuration > 0
    ? Math.round((wordCount / totalDuration) * 60)
    : 0

  const gapVariance = gaps.length > 0
    ? Math.sqrt(gaps.reduce((s, g) => s + (g - avgGap) ** 2, 0) / gaps.length)
    : 0
  const pauseConsistency = Math.max(0, Math.min(1, 1 - Math.min(gapVariance, 1)))

  let fillerCount = 0
  for (const w of rawWords) {
    if (FILLER_WORDS.has(w.word.toLowerCase())) {
      fillerCount++
    }
  }
  const fillerWordRatio = wordCount > 0 ? fillerCount / wordCount : 0

  // NOTE: these weights (65/15/10/10) are a reasoned design choice,
  // not empirically tuned. They should be validated against real user
  // data before production use. See ARCHITECTURE.md §3 for rationale.
  const overallScore = Math.round(
    averageConfidence * 65 +
    Math.min(speechRateWpm / IDEAL_WPM_MAX, 1) * 15 +
    pauseConsistency * 10 +
    (1 - Math.min(fillerWordRatio, 0.3)) * 10
  )

  const topImprovements: string[] = []
  if (averageConfidence < 0.8) {
    topImprovements.push('Enunciate words more clearly')
  }
  if (speechRateWpm > IDEAL_WPM_MAX) {
    topImprovements.push('Slow down your speaking pace')
  } else if (speechRateWpm < IDEAL_WPM_MIN) {
    topImprovements.push('Speak at a slightly faster pace')
  }
  if (pauseConsistency < PAUSE_CONSISTENCY_THRESHOLD) {
    topImprovements.push('Maintain more consistent pauses between words')
  }
  if (fillerWordRatio > FILLER_RATIO_THRESHOLD) {
    topImprovements.push('Reduce filler words (um, uh, like)')
  }
  if (topImprovements.length === 0) {
    topImprovements.push('Keep up the good speaking habits')
  }

  return {
    overall_score: overallScore,
    average_confidence: averageConfidence,
    speech_rate_wpm: speechRateWpm,
    pause_consistency: pauseConsistency,
    filler_word_ratio: fillerWordRatio,
    words,
    top_improvements: topImprovements.slice(0, 3),
  }
}
