'use client'

import { useRef, useState } from 'react'
import { validateAudioFile, validateDuration } from '@/lib/validation'

interface UploadProps {
  onAnalyze: (file: File) => void
  loading: boolean
}

export default function Upload({ onAnalyze, loading }: UploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!consent) {
      setError('Please consent to audio processing before uploading.')
      return
    }

    const validationError = validateAudioFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    const duration = await getAudioDuration(file)
    const durationError = validateDuration(duration)
    if (durationError) {
      setError(durationError)
      return
    }

    onAnalyze(file)
  }

  function getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src)
        resolve(audio.duration)
      }
      audio.onerror = reject
      audio.src = URL.createObjectURL(file)
    })
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <label
          htmlFor="audio-upload"
          className="cursor-pointer rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Choose audio file'}
        </label>
        <input
          ref={inputRef}
          id="audio-upload"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFile}
          disabled={loading}
        />
        <p className="text-xs text-zinc-500">
          .webm .wav .mp3 .m4a &middot; 30–45 seconds &middot; max 10 MB
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <label className="flex items-start gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Your audio is processed and deleted immediately. It is never stored.
        </span>
      </label>
    </div>
  )
}
