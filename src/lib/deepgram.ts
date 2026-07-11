import { Readable } from 'stream'
import { DeepgramClient } from '@deepgram/sdk'

const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY! })

export interface DeepgramWord {
  word: string
  start: number
  end: number
  confidence: number
}

export interface DeepgramResult {
  words: DeepgramWord[]
  transcript: string
  duration: number
}

interface DeepgramResponse {
  metadata?: { duration?: number }
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string
        words?: Array<{
          word?: string
          start?: number
          end?: number
          confidence?: number
        }>
      }>
    }>
  }
}

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function transcribeAudio(
  buffer: ArrayBuffer,
  mimeType: string
): Promise<DeepgramResult> {
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const stream = Readable.from(Buffer.from(buffer))

      const response = await deepgram.listen.v1.media.transcribeFile(
        stream,
        {
          model: 'nova-2',
          smart_format: true,
          punctuate: true,
          utterances: true,
          paragraphs: true,
          filler_words: true,
        }
      )

      const data = response as unknown as DeepgramResponse
      const channel = data?.results?.channels?.[0]
      const alternative = channel?.alternatives?.[0]
      const words: DeepgramWord[] = (alternative?.words || []).map((w) => ({
        word: w.word || '',
        start: w.start || 0,
        end: w.end || 0,
        confidence: w.confidence || 0,
      }))
      const transcript = alternative?.transcript || ''
      const duration = data?.metadata?.duration || 0

      return { words, transcript, duration }
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS)
      }
    }
  }

  throw lastError
}
