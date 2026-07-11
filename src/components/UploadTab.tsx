'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, FileAudio, AlertCircle, Clock, FileText, Music } from 'lucide-react'
import { validateAudioFile, validateDuration } from '@/lib/validation'

interface UploadTabProps {
  onAnalyze: (file: File) => void
  loading: boolean
}

const formats = [
  { label: 'WAV', icon: Music },
  { label: 'MP3', icon: FileAudio },
  { label: 'WebM', icon: FileText },
  { label: 'M4A', icon: FileAudio },
]

export default function UploadTab({ onAnalyze, loading }: UploadTabProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  async function processFile(file: File) {
    setError(null)

    const validationError = validateAudioFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      const duration = await getAudioDuration(file)
      const durationError = validateDuration(duration)
      if (durationError) {
        setError(durationError)
        return
      }
    } catch {
      setError('Could not read audio file. It may be corrupted.')
      return
    }

    setSelectedFile(file)
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
        className={`relative flex w-full max-w-lg cursor-default flex-col items-center rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
          dragging
            ? 'border-[#0F766E] bg-[#F0FDFA] shadow-lg shadow-[#0F766E]/10'
            : 'border-[#E2E8F0] bg-white hover:border-[#0F766E] hover:bg-[#F8FAFC]'
        }`}
        style={!dragging ? { boxShadow: '0 10px 30px rgba(15,23,42,0.06)' } : undefined}
      >
        <div className={`mb-5 rounded-full p-5 transition-all duration-300 ${
          dragging ? 'scale-110 bg-[#0F766E]' : 'bg-[#F1F5F9]'
        }`}>
          <Upload className={`h-8 w-8 ${dragging ? 'text-white' : 'text-[#64748B]'}`} />
        </div>

        <p className="text-base font-semibold text-[#0F172A]">
          Drop your audio here
        </p>

        <div className="my-4 flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-[#E2E8F0]" />
          <span className="text-xs font-medium uppercase tracking-wider text-[#94A3B8]">or</span>
          <div className="h-px flex-1 bg-[#E2E8F0]" />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            inputRef.current?.click()
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[#0F766E]/20 transition-all hover:bg-[#115E59] hover:shadow-xl hover:shadow-[#0F766E]/30 active:scale-[0.97] disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {loading ? 'Analyzing...' : 'Browse files'}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      {/* Format chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {formats.map((fmt) => (
          <div
            key={fmt.label}
            className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#64748B] shadow-sm"
          >
            <fmt.icon className="h-3 w-3 text-[#0F766E]" />
            {fmt.label}
          </div>
        ))}
      </div>

      {/* Constraints */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-[#94A3B8]">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          30–45 seconds optimal
        </span>
        <span className="flex items-center gap-1">
          <FileAudio className="h-3 w-3" />
          English only
        </span>
        <span>Max 10MB</span>
      </div>

      {error && (
        <div className="flex w-full max-w-lg items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
