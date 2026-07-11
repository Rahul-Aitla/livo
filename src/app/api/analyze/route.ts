import { NextRequest } from 'next/server'
import { transcribeAudio } from '@/lib/deepgram'
import { getAudioDuration } from '@/lib/duration'
import { scoreRecording } from '@/lib/scoring'
import { generateFeedback } from '@/lib/groq'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 30

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

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateCheck = checkRateLimit(ip)
    if (!rateCheck.allowed) {
      return Response.json(
        { error: `Too many requests. Try again in ${rateCheck.resetIn} seconds.` },
        { status: 429, headers: { 'Retry-After': String(rateCheck.resetIn) } }
      )
    }

    const formData = await request.formData()
    const file = formData.get('audio') as File | null

    if (!file) {
      return Response.json({ error: 'No audio file provided.' }, { status: 400 })
    }

    const baseType = file.type.split(';')[0].trim()
    if (!SUPPORTED_MIME_TYPES.includes(baseType)) {
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

    const totalDuration = deepgramResult.duration > 0 ? deepgramResult.duration : duration
    const result = scoreRecording({
      words: deepgramResult.words,
      totalDuration,
    })

    const hasFlaggedWords = result.words.some((w) => w.status !== 'clean')
    if (hasFlaggedWords) {
      try {
        const feedback = await generateFeedback(result.words, deepgramResult.words)
        if (feedback) {
          for (const w of result.words) {
            const groqExplanation = feedback.explanations[w.word.toLowerCase()]
            if (groqExplanation) {
              w.explanation = groqExplanation
            }
          }
          if (feedback.improvements.length > 0) {
            result.top_improvements = feedback.improvements
          }
        }
      } catch {
        // Groq degraded gracefully — keep static explanations from scoring engine
      }
    }

    return Response.json(result)
  } catch (err) {
    console.error('Analyze error:', err)
    return Response.json({ error: 'Something went wrong processing your audio.' }, { status: 500 })
  }
}
