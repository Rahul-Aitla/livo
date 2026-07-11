'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Square, Play, RotateCcw, CircleCheck, Clock, AlertCircle } from 'lucide-react'

interface RecordTabProps {
  onAnalyze: (file: File) => void
  loading: boolean
}

const MAX_DURATION = 45
const MIN_DURATION = 30

export default function RecordTab({ onAnalyze, loading }: RecordTabProps) {
  const [phase, setPhase] = useState<'idle' | 'permission' | 'recording' | 'preview'>('idle')
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPhase('permission')

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128
      source.connect(analyser)
      analyserRef.current = analyser

      drawWaveform()

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        audioCtx.close()
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioUrl(url)
        setPhase('preview')
      }

      mediaRecorder.start()
      setPhase('recording')
      setDuration(0)

      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        setDuration(elapsed)
        if (elapsed >= MAX_DURATION) {
          stopRecording()
        }
      }, 100)
    } catch {
      setError('Microphone access denied. Please allow microphone permissions or use the upload option.')
      setPhase('idle')
    }
  }

  function drawWaveform() {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const a = analyser
    const c = canvas
    const context = ctx

    function draw() {
      animFrameRef.current = requestAnimationFrame(draw)
      a.getByteTimeDomainData(dataArray)

      context.clearRect(0, 0, c.width, c.height)
      context.fillStyle = '#F8FAFC'
      context.fillRect(0, 0, c.width, c.height)

      const barCount = 48
      const barWidth = c.width / barCount
      const step = Math.floor(bufferLength / barCount)

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 128
        const height = Math.max(2, (value - 1) * 40)
        const x = i * barWidth + 1
        const w = barWidth - 2
        context.fillStyle = height > 6 ? '#0F766E' : '#CCFBF1'
        context.beginPath()

        if (typeof context.roundRect === 'function') {
          context.roundRect(x, c.height / 2 - height / 2, w, height, 2)
        } else {
          context.rect(x, c.height / 2 - height / 2, w, height)
        }

        context.fill()
      }
    }

    draw()
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    mediaRecorderRef.current?.stop()
  }

  function retake() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setDuration(0)
    setPhase('idle')
    setWaveformData([])
  }

  function analyze() {
    if (!audioUrl) return
    chunksRef.current[0] // ensure blob exists
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
    onAnalyze(file)
  }

  const progress = Math.min(duration / MAX_DURATION, 1)
  const circumference = 2 * Math.PI * 40
  const offset = circumference - progress * circumference

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === 'idle' && (
        <button
          onClick={startRecording}
          disabled={loading}
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#E2E8F0] bg-white px-12 py-10 transition-all duration-200 hover:border-[#0F766E] hover:bg-[#F0FDFA] hover:shadow-md disabled:opacity-50"
          style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0F766E]">
            <Mic className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-[#0F172A]">Record Audio</p>
            <p className="mt-1 text-sm text-[#64748B]">Speak directly into your microphone</p>
          </div>
        </button>
      )}

      {phase === 'recording' && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <div className="relative flex items-center justify-center">
            <svg width="100" height="100" className="-rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="#0F766E"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-[#64748B]">seconds</span>
              <span className="text-lg font-bold text-[#0F172A]">{Math.floor(duration)}</span>
            </div>
          </div>

          <canvas ref={canvasRef} width={480} height={60} className="w-full h-15 rounded-lg" />

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-[#DC2626]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#DC2626]" />
              Recording
            </span>
            <span className="text-xs text-[#64748B]">English only</span>
            <span className="text-xs text-[#64748B]">Target: 30–45s</span>
          </div>

          <button
            onClick={stopRecording}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DC2626] text-white transition-transform hover:scale-105 active:scale-95"
          >
            <Square className="h-5 w-5" fill="white" />
          </button>
        </div>
      )}

      {phase === 'preview' && audioUrl && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
          <div className="flex items-center gap-2 text-sm font-medium text-[#0F172A]">
            <CircleCheck className="h-4 w-4 text-[#16A34A]" />
            Recording Ready
          </div>

          <div className="flex items-center gap-4">
            <audio src={audioUrl} controls className="h-10 rounded-lg" />
          </div>

          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <Clock className="h-4 w-4" />
            <span>{duration.toFixed(1)} seconds</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={retake}
              className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] px-5 py-2.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F9]"
            >
              <RotateCcw className="h-4 w-4" />
              Retake
            </button>
            <button
              onClick={analyze}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-[#0F766E] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#115E59] disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
