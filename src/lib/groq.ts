import type { WordAnalysis } from '@/types/analysis'
import { getGroq } from '@/lib/groq-client'

const MODEL = 'llama-3.3-70b-versatile'

interface FlaggedWordContext {
  word: string
  confidence: number
  status: string
  context: string
}

interface GroqResponse {
  explanations: Record<string, string>
  improvements: string[]
}

function extractFlaggedWords(
  allWords: WordAnalysis[],
  rawWords: Array<{ word: string; start: number; end: number; confidence: number }>
): FlaggedWordContext[] {
  const flagged: FlaggedWordContext[] = []

  for (let i = 0; i < allWords.length; i++) {
    if (allWords[i].status === 'clean') continue

    const start = Math.max(0, i - 2)
    const end = Math.min(rawWords.length, i + 3)
    const contextWords = rawWords.slice(start, end).map((w) => w.word)
    const context = contextWords.join(' ')

    flagged.push({
      word: allWords[i].word,
      confidence: allWords[i].confidence,
      status: allWords[i].status,
      context,
    })
  }

  return flagged
}

function buildPrompt(flaggedWords: FlaggedWordContext[]): string {
  const wordList = flaggedWords
    .map(
      (w) =>
        `- "${w.word}" (confidence: ${w.confidence.toFixed(2)}, issue: ${w.status})\n  Context: "...${w.context}..."`
    )
    .join('\n')

  return `You are analyzing a speech recording for clarity feedback. The following words were flagged during automatic speech recognition as potentially unclear:

${wordList}

For each flagged word, provide a short explanation (max 10 words) using hedged language like "may have been spoken too quickly" or "was less clearly recognized."
Do NOT mention tongue placement, specific phonemes, or speech disorders.
Do NOT claim certainty about speech errors — confidence reflects STT recognition certainty, not ground truth.

Also provide 3 specific, actionable improvement suggestions based on the patterns in the flagged words.

Return valid JSON only (no markdown):
{
  "explanations": { "word1": "explanation", "word2": "explanation" },
  "improvements": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`
}

export async function generateFeedback(
  scoredWords: WordAnalysis[],
  rawWords: Array<{ word: string; start: number; end: number; confidence: number }>
): Promise<{ explanations: Record<string, string>; improvements: string[] } | null> {
  const flaggedWords = extractFlaggedWords(scoredWords, rawWords)

  if (flaggedWords.length === 0) {
    return null
  }

  try {
    const prompt = buildPrompt(flaggedWords)
    const completion = await getGroq().chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a speech clarity analysis assistant. Respond only with valid JSON. Use hedged, non-certain language.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices?.[0]?.message?.content
    if (!content) return null

    const parsed: GroqResponse = JSON.parse(content)

    const cleanedExplanations: Record<string, string> = {}
    for (const [word, explanation] of Object.entries(parsed.explanations || {})) {
      const clean = explanation
        .replace(/^["']|["']$/g, '')
        .replace(/^explanation[:\s]+/i, '')
        .trim()
      if (clean) cleanedExplanations[word.toLowerCase()] = clean
    }

    const improvements = (parsed.improvements || []).slice(0, 3)

    return { explanations: cleanedExplanations, improvements }
  } catch {
    return null
  }
}
