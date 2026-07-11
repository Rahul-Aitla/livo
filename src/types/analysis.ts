export interface WordAnalysis {
  word: string
  start: number
  end: number
  confidence: number
  status: 'clean' | 'low_confidence' | 'unclear_segment'
  explanation: string | null
}

export interface AnalysisResult {
  overall_score: number
  average_confidence: number
  speech_rate_wpm: number
  pause_consistency: number
  filler_word_ratio: number
  words: WordAnalysis[]
  top_improvements: string[]
}
