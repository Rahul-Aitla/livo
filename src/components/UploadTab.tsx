'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, FileAudio, AlertCircle, Clock } from 'lucide-react'
import { validateAudioFile, validateDuration } from '@/lib/validation'

interface UploadTabProps {
  onAnalyze: (file: File) => void
  loading: boolean
}

export default function UploadTab({ onAnalyze, loading }: UploadTabProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  async function processFile(file: File) {
    setError(null)

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

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.type.startsWith('audio/')) {
      setError('Please drop an audio file.')
      return
    }
    await processFile(file)
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex w-full max-w-md cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
          dragging
            ? 'border-[#0F766E] bg-[#F0FDFA]'
            : 'border-[#E2E8F0] bg-white hover:border-[#0F766E] hover:bg-[#F0FDFA] hover:shadow-md'
        }`}
        style={!dragging ? { boxShadow: '0 10px 30px rgba(15,23,42,0.08)' } : undefined}
      >
        <div className={`rounded-full p-4 transition-colors ${dragging ? 'bg-[#0F766E]' : 'bg-[#F1F5F9]'}`}>
          <Upload className={`h-7 w-7 ${dragging ? 'text-white' : 'text-[#64748B]'}`} />
        </div>
        <div>
          <p className="text-base font-semibold text-[#0F172A]">
            {loading ? 'Analyzing...' : 'Drag & drop or choose audio'}
          </p>
          <p className="mt-1 text-sm text-[#64748B]">
            WebM · WAV · MP3 · M4A
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-3 text-xs text-[#64748B]">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          30–45 seconds
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <FileAudio className="h-3 w-3" />
          English only
        </span>
        <span>·</span>
        <span>Max 10MB</span>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
