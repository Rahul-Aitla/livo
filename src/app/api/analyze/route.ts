import { NextRequest } from 'next/server'
import { transcribeAudio } from '@/lib/deepgram'
import { getAudioDuration } from '@/lib/duration'
import type { WordAnalysis, AnalysisResult } from '@/types/analysis'

const SUPPORTED_MIME_TYPES = [
  'audio/webm',
  'audio/wav',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
]

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const MIN_DURATION_S = 30
const MAX_DURATION_S = 45

const FILLER_WORDS = new Set([
  'uh', 'um', 'er', 'ah', 'like', 'well', 'so', 'actually',
  'basically', 'literally', 'you know', 'i mean', 'sort of',
  'kind of', 'right', 'okay',
])

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('audio') as File | null

    if (!file) {
      return Response.json({ error: 'No audio file provided.' }, { status: 400 })
    }

    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      return Response.json(
        { error: `Unsupported file type "${file.type}". Accepted: .webm, .wav, .mp3, .m4a` },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return Response.json({ error: 'File too large (max 10 MB).' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()

    let duration: number
    try {
      duration = await getAudioDuration(buffer)
    } catch {
      return Response.json({ error: 'Could not read audio file. Try a different format.' }, { status: 400 })
    }

    if (duration < MIN_DURATION_S) {
      return Response.json(
        { error: `Audio too short (${Math.round(duration)}s). Must be between 30 and 45 seconds.` },
        { status: 400 }
      )
    }
    if (duration > MAX_DURATION_S) {
      return Response.json(
        { error: `Audio too long (${Math.round(duration)}s). Must be between 30 and 45 seconds.` },
        { status: 400 }
      )
    }

    let deepgramResult: { words: { word: string; start: number; end: number; confidence: number }[]; transcript: string; duration: number }
    try {
      deepgramResult = await transcribeAudio(buffer, file.type)
    } catch {
      return Response.json(
        { error: 'Speech recognition failed. Try a clearer recording.' },
        { status: 502 }
      )
    }

    if (deepgramResult.words.length === 0) {
      return Response.json(
        { error: 'No speech detected. Ensure your audio contains English speech.' },
        { status: 400 }
      )
    }

    const result = buildResult(deepgramResult, duration)
    return Response.json(result)
  } catch (err) {
    console.error('Analyze error:', err)
    return Response.json({ error: 'Something went wrong processing your audio.' }, { status: 500 })
  }
}

function buildResult(
  deepgram: { words: { word: string; start: number; end: number; confidence: number }[]; transcript: string; duration: number },
  fileDuration: number
): AnalysisResult {
  const totalSpeechDuration = deepgram.duration > 0 ? deepgram.duration : fileDuration

  const words: WordAnalysis[] = deepgram.words.map((w) => {
    let status: 'clean' | 'low_confidence' | 'unclear_segment' = 'clean'
    let explanation: string | null = null

    if (w.confidence < 0.6) {
      status = 'low_confidence'
      explanation = 'May have been spoken unclearly'
    } else if (w.confidence < 0.75) {
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
  const speechRateWpm = totalSpeechDuration > 0
    ? Math.round((wordCount / totalSpeechDuration) * 60)
    : 0

  let gaps: number[] = []
  let fillerCount = 0
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end
    if (gap > 0) gaps.push(gap)
    if (FILLER_WORDS.has(words[i].word.toLowerCase())) {
      fillerCount++
    }
  }

  const avgGap = gaps.length > 0
    ? gaps.reduce((s, g) => s + g, 0) / gaps.length
    : 0
  const gapVariance = gaps.length > 0
    ? Math.sqrt(gaps.reduce((s, g) => s + (g - avgGap) ** 2, 0) / gaps.length)
    : 0
  const pauseConsistency = Math.max(0, Math.min(1, 1 - Math.min(gapVariance, 1)))

  const fillerWordRatio = wordCount > 0 ? fillerCount / wordCount : 0

  const overallScore = Math.round(
    averageConfidence * 65 +
    Math.min(speechRateWpm / 170, 1) * 15 +
    pauseConsistency * 10 +
    (1 - Math.min(fillerWordRatio, 0.3)) * 10
  )

  const topImprovements: string[] = []
  if (averageConfidence < 0.8) {
    topImprovements.push('Enunciate words more clearly')
  }
  if (speechRateWpm > 170) {
    topImprovements.push('Slow down your speaking pace')
  } else if (speechRateWpm < 120) {
    topImprovements.push('Speak at a slightly faster pace')
  }
  if (pauseConsistency < 0.7) {
    topImprovements.push('Maintain more consistent pauses between words')
  }
  if (fillerWordRatio > 0.03) {
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
