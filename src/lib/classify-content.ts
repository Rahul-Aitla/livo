import { getGroq } from '@/lib/groq-client'

const MODEL = 'llama-3.3-70b-versatile'

export interface ClassificationResult {
  valid: boolean
  type: string
  reason: string
}

function detectLyricPatterns(words: Array<{ word: string }>): ClassificationResult | null {
  for (let i = 0; i < words.length - 2; i++) {
    const w1 = words[i].word.toLowerCase()
    const w2 = words[i + 1].word.toLowerCase()
    const w3 = words[i + 2].word.toLowerCase()
    if (w1 === w2 && w2 === w3 && w1.length > 2) {
      return { valid: false, type: 'song_lyrics', reason: 'Repeated word pattern detected' }
    }
  }

  for (let i = 0; i < words.length - 3; i++) {
    const a1 = words[i].word.toLowerCase()
    const a2 = words[i + 1].word.toLowerCase()
    const b1 = words[i + 2].word.toLowerCase()
    const b2 = words[i + 3].word.toLowerCase()
    if (a1 === b1 && a2 === b2 && a1.length > 2) {
      return { valid: false, type: 'song_lyrics', reason: 'Repeated phrase pattern detected' }
    }
  }

  return null
}

function hasRepeatedLines(transcript: string): boolean {
  const lines = transcript
    .split(/[.!?\n]+/)
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l.split(/\s+/).length >= 3)

  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i] === lines[i + 1]) return true
  }
  return false
}

function buildClassificationPrompt(transcript: string): string {
  return `You are validating audio for an English pronunciation assessment.

Transcript:
"""
${transcript}
"""

Determine what this transcript represents. Choose exactly one category:
1. natural_speech — a person speaking naturally in English (conversation, monologue, presentation)
2. song_lyrics — singing, with or without music
3. rap — rhythmic spoken verse with musical backing
4. poem — structured verse read aloud
5. movie_dialogue — scripted lines from a film or TV show
6. noise_gibberish — mostly non-speech sounds, gibberish, or unintelligible content

Return valid JSON only (no markdown):
{
  "valid": true/false,
  "type": "natural_speech" | "song_lyrics" | "rap" | "poem" | "movie_dialogue" | "noise_gibberish",
  "reason": "Brief explanation if invalid, empty string if valid"
}

Set valid=true only for natural_speech. Reject all other categories.`
}

async function classifyViaLLM(transcript: string): Promise<ClassificationResult> {
  const prompt = buildClassificationPrompt(transcript)
  const completion = await getGroq().chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'You classify audio transcripts for a pronunciation assessment. Respond only with valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 200,
    response_format: { type: 'json_object' },
  })

  const content = completion.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty LLM response')

  const parsed = JSON.parse(content) as ClassificationResult
  return {
    valid: parsed.valid === true,
    type: parsed.type || 'unknown',
    reason: parsed.reason || '',
  }
}

export async function classifyAudioContent(
  transcript: string,
  words: Array<{ word: string }>,
  metadata?: { fileSize: number; duration: number }
): Promise<ClassificationResult> {
  if (words.length === 0) {
    if (!metadata || metadata.duration <= 0) {
      return { valid: false, type: 'no_speech', reason: 'No speech detected in the recording.' }
    }
    const estimatedBitrate = (metadata.fileSize * 8) / metadata.duration
    if (estimatedBitrate < 20_000) {
      return { valid: false, type: 'no_speech', reason: 'No speech detected in the recording.' }
    }
    if (estimatedBitrate < 80_000) {
      return { valid: false, type: 'non_speech_audio', reason: 'Audio has content but no speech was recognized.' }
    }
    return { valid: false, type: 'non_speech_audio', reason: 'Audio has content but no speech was recognized.' }
  }

  const lyricPattern = detectLyricPatterns(words)
  if (lyricPattern) return lyricPattern

  if (hasRepeatedLines(transcript)) {
    return { valid: false, type: 'song_lyrics', reason: 'Repeated lines detected — chorus pattern' }
  }

  try {
    return await classifyViaLLM(transcript)
  } catch (err) {
    console.error('[classify] LLM failed, falling through:', err)
    return { valid: true, type: 'natural_speech', reason: '' }
  }
}
