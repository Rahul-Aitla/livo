'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Upload, FileAudio, AlertCircle, Clock, FileText, Music, ArrowDownToLine } from 'lucide-react'
import { validateAudioFile, validateDuration } from '@/lib/validation'

interface UploadTabProps {
  onAnalyze: (file: File) => void
  loading: boolean
  savedFile?: File | null
  onClearSaved?: () => void
}

const formats = [
  { label: 'WAV', icon: Music },
  { label: 'MP3', icon: FileAudio },
  { label: 'WebM', icon: FileText },
  { label: 'M4A', icon: FileAudio },
]

export default function UploadTab({ onAnalyze, loading, savedFile, onClearSaved }: UploadTabProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Restore file after validation error (inline error recovery)
  useEffect(() => {
    if (savedFile && !selectedFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFile(savedFile)
    }
  }, [savedFile, selectedFile])

  function getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src)
        resolve(audio.duration)
      }
      audio.onerror = () => {
        URL.revokeObjectURL(audio.src)
        reject(new Error('Failed to load audio'))
      }
      audio.src = URL.createObjectURL(file)
    })
  }

  const processFile = useCallback(async (file: File) => {
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
    onClearSaved?.()
    onAnalyze(file)
  }, [onAnalyze, onClearSaved])

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
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
  }, [processFile])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      {selectedFile ? (
        <div className="flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-border bg-white p-4 sm:p-8 text-center" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
            <FileAudio className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
            <p className="mt-1 text-xs text-muted">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => {
                setSelectedFile(null)
                setError(null)
                onClearSaved?.()
              }}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-[#475569] transition-colors hover:bg-bg-secondary"
            >
              Choose different file
            </button>
            <button
              onClick={() => onAnalyze(selectedFile)}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white transition-all hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Retry analysis'}
            </button>
          </div>
        </div>
      ) : (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Drop audio file here or click to browse"
        className={`relative flex w-full max-w-lg cursor-default flex-col items-center rounded-2xl border-2 border-dashed p-6 sm:p-14 text-center transition-all duration-300 ${
          dragging
            ? 'scale-[1.02] border-primary bg-[#F0FDFA] shadow-2xl shadow-primary/20'
            : 'border-border bg-white hover:border-primary/60 hover:bg-background hover:shadow-xl hover:shadow-primary/5'
        }`}
        style={!dragging ? { boxShadow: '0 10px 30px rgba(15,23,42,0.06)' } : undefined}
      >
        {dragging && (
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-pulse" aria-hidden="true" />
        )}

        <div className={`mb-5 rounded-full p-5 transition-all duration-300 ${
          dragging ? 'scale-125 bg-primary' : 'bg-bg-secondary group-hover:scale-105'
        }`}>
          {dragging ? (
            <ArrowDownToLine className="h-10 w-10 text-white animate-bounce" aria-hidden="true" />
          ) : (
            <Upload className="h-10 w-10 text-muted" aria-hidden="true" />
          )}
        </div>

        <p className="text-base font-semibold text-foreground">
          {dragging ? 'Release to upload' : 'Drop your audio here'}
        </p>

        <div className="my-4 flex w-full items-center gap-3" aria-hidden="true">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            inputRef.current?.click()
          }}
          disabled={loading}
          aria-label="Browse files to upload audio"
          className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white shadow-lg transition-all active:scale-[0.97] disabled:opacity-50 ${
            dragging
              ? 'bg-primary-hover shadow-xl shadow-primary/30'
              : 'bg-primary shadow-primary/20 hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/30'
          }`}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {loading ? 'Analyzing...' : 'Browse files'}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="sr-only"
          onChange={handleChange}
          disabled={loading}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
      )}

      {/* Format chips */}
      <div className="flex flex-wrap justify-center gap-2" aria-label="Supported audio formats">
        {formats.map((fmt) => (
          <div
            key={fmt.label}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-2 text-xs font-medium text-[#475569] shadow-sm"
          >
            <fmt.icon className="h-3 w-3 text-primary" aria-hidden="true" />
            {fmt.label}
          </div>
        ))}
      </div>

      {/* Constraints */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          30–45 seconds optimal
        </span>
        <span className="flex items-center gap-1">
          <FileAudio className="h-3 w-3" aria-hidden="true" />
          English only
        </span>
        <span>Max 10MB</span>
      </div>

      {error && (
        <div className="flex w-full max-w-lg items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
