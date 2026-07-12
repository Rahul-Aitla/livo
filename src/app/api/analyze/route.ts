import { NextRequest } from 'next/server'
import { transcribeAudio } from '@/lib/deepgram'
import { getAudioDuration } from '@/lib/duration'
import { scoreRecording } from '@/lib/scoring'
import { generateFeedback } from '@/lib/groq'
import { classifyAudioContent } from '@/lib/classify-content'
import { checkRateLimit } from '@/lib/rate-limit'
import { sniffAudioType } from '@/lib/content-type'
import { hashBuffer, getCached, setCached } from '@/lib/dedup'

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

const CONFIDENCE_LANGUAGE_THRESHOLD = 0.25
const CONFIDENCE_NOISE_THRESHOLD = 0.4
const MIN_WORDS_FOR_VALID_SPEECH = 5

const NO_CACHE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' }

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...NO_CACHE, ...extraHeaders } })
}

const encoder = new TextEncoder()

function emit(
  controller: ReadableStreamDefaultController,
  data: unknown
) {
  controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))
}

function streamResponse(
  run: (controller: ReadableStreamDefaultController) => Promise<void>
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await run(controller)
      } catch (err) {
        console.error('[stream] Unhandled:', err)
        emit(controller, { event: 'error', message: 'Something went wrong processing your audio.' })
      } finally {
        try { controller.close() } catch { /* already closed */ }
      }
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson', ...NO_CACHE } })
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID?.() || Date.now().toString(36)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  try {
    // Rate limit
    const rateCheck = checkRateLimit(ip)
    if (!rateCheck.allowed) {
      console.warn(`[${requestId}] Rate limited ip=${ip}`)
      return json(
        { error: `Too many requests. Try again in ${rateCheck.resetIn} seconds.` },
        429,
        { 'Retry-After': String(rateCheck.resetIn) }
      )
    }

    // Parse form
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return json({ error: 'No audio file provided. Send a multipart/form-data with an "audio" field.' }, 400)
    }
    const file = formData.get('audio') as File | null

    if (!file) {
      return json({ error: 'No audio file provided.' }, 400)
    }

    // Client-declared MIME (surface level) — lenient check; content sniffing is the authority
    const declaredType = file.type.split(';')[0].trim()
    if (declaredType && declaredType !== 'application/octet-stream' && !SUPPORTED_MIME_TYPES.includes(declaredType)) {
      return json(
        { error: `Unsupported file type "${file.type}". Accepted: .webm, .wav, .mp3, .m4a` },
        400
      )
    }

    // Size check
    if (file.size > MAX_SIZE_BYTES) {
      console.warn(`[${requestId}] File too large size=${file.size} name=${file.name}`)
      return json({ error: 'File too large (max 10 MB).' }, 400)
    }

    if (file.size === 0) {
      return json({ error: 'Empty file. Choose a valid audio file.' }, 400)
    }

    const buffer = await file.arrayBuffer()

    // Magic-byte content sniffing — catch renamed executables, corrupt data, etc.
    const sniff = await sniffAudioType(buffer)
    if (!sniff.valid) {
      console.warn(`[${requestId}] Content rejection: ${sniff.reason} declared=${declaredType} detected=${sniff.detectedMime} name=${file.name}`)
      return json({ error: sniff.reason || 'File content does not match an audio format.' }, 400)
    }

    // Same-file dedup (content hash)
    const hash = hashBuffer(buffer)
    const cached = getCached(hash)
    if (cached) {
      console.info(`[${requestId}] Cache hit hash=${hash.slice(0, 12)}`)
      return streamResponse(async (controller) => {
        emit(controller, { event: 'result', data: cached })
      })
    }

    // Duration
    let duration: number
    try {
      duration = await getAudioDuration(buffer)
    } catch (err) {
      console.error(`[${requestId}] Duration parse failed:`, err)
      return json({ error: 'Audio file appears corrupted. Try re-recording or exporting in a different format.' }, 400)
    }

    if (duration < MIN_DURATION_S) {
      return json(
        { error: `Audio too short (${Math.round(duration)}s). Must be between 30 and 45 seconds.` },
        400
      )
    }
    if (duration > MAX_DURATION_S) {
      return json(
        { error: `Audio too long (${Math.round(duration)}s). Must be between 30 and 45 seconds.` },
        400
      )
    }

    // Pipeline — stream real progress
    return streamResponse(async (controller) => {
      // Step: transcribing
      emit(controller, { event: 'step', step: 'transcribing', status: 'active' })

      let deepgramResult: { words: { word: string; start: number; end: number; confidence: number }[]; transcript: string; duration: number }
      try {
        deepgramResult = await transcribeAudio(buffer, sniff.detectedMime!)
      } catch {
        console.error(`[${requestId}] Deepgram failed`)
        emit(controller, { event: 'error', message: 'Speech recognition failed. Try a quieter environment or a different file format.' })
        return
      }

      emit(controller, { event: 'step', step: 'transcribing', status: 'complete' })

      // Step: evaluating (classification + scoring in parallel)
      emit(controller, { event: 'step', step: 'evaluating', status: 'active' })

      const classificationPromise = classifyAudioContent(
        deepgramResult.transcript,
        deepgramResult.words,
        { fileSize: file.size, duration }
      )

      const totalDuration = deepgramResult.duration > 0 ? deepgramResult.duration : duration
      const result = scoreRecording({
        words: deepgramResult.words,
        totalDuration,
      })

      const classification = await classificationPromise
      if (!classification.valid) {
        console.warn(`[${requestId}] Content rejected: ${classification.type} — ${classification.reason}`)

        if (classification.type === 'no_speech') {
          emit(controller, { event: 'error', message: 'No speech detected — it may be silent. Record again and make sure you speak clearly into the microphone.' })
        } else {
          const typeLabel = classification.type.replace(/_/g, ' ')
          emit(controller, { event: 'error', message: `Unsupported audio type. This appears to contain ${typeLabel}. Please upload a 30–45 second recording of one person speaking English naturally.` })
        }
        return
      }

      // Safety net checks
      if (deepgramResult.words.length < MIN_WORDS_FOR_VALID_SPEECH) {
        emit(controller, { event: 'error', message: 'Too faint to analyze — bring the microphone closer and speak louder, then try again.' })
        return
      }

      const avgConfidence =
        deepgramResult.words.reduce((s, w) => s + w.confidence, 0) / deepgramResult.words.length

      if (avgConfidence < CONFIDENCE_LANGUAGE_THRESHOLD) {
        emit(controller, { event: 'error', message: 'Not recognized as English — this tool only supports English speech. Try an English recording.' })
        return
      }

      if (avgConfidence < CONFIDENCE_NOISE_THRESHOLD) {
        emit(controller, { event: 'error', message: 'Too much background noise — move to a quiet space or turn off fans/music and record again.' })
        return
      }

      emit(controller, { event: 'step', step: 'evaluating', status: 'complete' })

      // Step: feedback (only if flagged words exist)
      const hasFlaggedWords = result.words.some((w) => w.status !== 'clean')
      if (hasFlaggedWords) {
        emit(controller, { event: 'step', step: 'feedback', status: 'active' })
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
        } catch (err) {
          console.warn(`[${requestId}] Groq degraded:`, err)
        }
        emit(controller, { event: 'step', step: 'feedback', status: 'complete' })
      }

      // Cache and return result
      setCached(hash, result)
      console.info(`[${requestId}] OK words=${deepgramResult.words.length} duration=${totalDuration}s score=${result.overall_score}`)
      emit(controller, { event: 'result', data: result })
    })
  } catch (err) {
    console.error(`[${requestId}] Unhandled:`, err)
    return json({ error: 'Something went wrong processing your audio.' }, 500)
  }
}
