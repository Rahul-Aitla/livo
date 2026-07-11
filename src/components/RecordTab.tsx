'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause, RotateCcw, CircleCheck, Clock, AlertCircle } from 'lucide-react'

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
  const [isPaused, setIsPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playProgress, setPlayProgress] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startTimeRef = useRef(0)
  const pausedDurationRef = useRef(0)
  const pauseStartRef = useRef(0)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      audioRef.current?.pause()
    }
  }, [audioUrl])

  async function startRecording() {
    setError(null)
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPhase('permission')

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128
      source.connect(analyser)
      analyserRef.current = analyser

      drawWaveform()

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      isPausedRef.current = false
      pausedDurationRef.current = 0
      pauseStartRef.current = 0

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onpause = () => {
        pauseStartRef.current = Date.now()
      }

      mediaRecorder.onresume = () => {
        if (pauseStartRef.current > 0) {
          pausedDurationRef.current += Date.now() - pauseStartRef.current
          pauseStartRef.current = 0
        }
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        audioCtx.close()
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)

        const ext = mimeType === 'audio/mp4' ? 'mp4' : 'webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioUrl(url)
        setPhase('preview')
      }

      mediaRecorder.start()
      setPhase('recording')
      setDuration(0)
      setIsPaused(false)
      startTimeRef.current = Date.now()

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000
        setDuration(elapsed)
        if (elapsed >= MAX_DURATION && mediaRecorder.state === 'recording') {
          stopRecording()
        }
      }, 100)
    } catch {
      setError('Microphone permission denied. Enable microphone access in your browser settings, then try again.')
      setPhase('idle')
    }
  }

  const isPausedRef = useRef(false)

  function togglePause() {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    if (recorder.state === 'recording') {
      recorder.pause()
      setIsPaused(true)
      isPausedRef.current = true
    } else if (recorder.state === 'paused') {
      recorder.resume()
      setIsPaused(false)
      isPausedRef.current = false
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    mediaRecorderRef.current?.stop()
    setIsPaused(false)
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

  function retake() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    audioRef.current?.pause()
    setIsPlaying(false)
    setPlayProgress(0)
    setAudioUrl(null)
    setDuration(0)
    setPhase('idle')
  }

  function togglePlayback() {
    if (!audioUrl) return

    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      return
    }

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.onplay = () => setIsPlaying(true)
    audio.onpause = () => setIsPlaying(false)
    audio.onended = () => {
      setIsPlaying(false)
      setPlayProgress(0)
    }
    audio.ontimeupdate = () => {
      if (audio.duration) setPlayProgress(audio.currentTime / audio.duration)
    }

    audio.play().catch(() => setError('Could not play recording.'))
  }

  function analyze() {
    if (!audioUrl) return
    const recorder = mediaRecorderRef.current
    const mimeType = recorder ? (recorder as unknown as { mimeType: string }).mimeType || 'audio/webm' : 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
    const file = new File([blob], `recording.${ext}`, { type: mimeType })
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
          aria-label="Start recording from microphone"
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-white px-12 py-10 transition-all duration-200 hover:border-primary hover:bg-[#F0FDFA] hover:shadow-md disabled:opacity-50"
          style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Mic className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">Record Audio</p>
            <p className="mt-1 text-sm text-[#475569]">Speak directly into your microphone</p>
          </div>
        </button>
      )}

      {phase === 'recording' && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md" role="status" aria-live="polite" aria-label={`Recording in progress: ${Math.floor(duration)} seconds`}>
          <div className="relative flex items-center justify-center">
            <svg width="100" height="100" className="-rotate-90" role="progressbar" aria-valuenow={Math.floor(duration)} aria-valuemin={0} aria-valuemax={MAX_DURATION} aria-label="Recording progress">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke={isPaused ? '#F59E0B' : '#0F766E'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-[#475569]">seconds</span>
              <span className="text-lg font-bold text-foreground">{Math.floor(duration)}</span>
            </div>
          </div>

          <canvas ref={canvasRef} width={480} height={60} className="w-full h-15 rounded-lg" aria-hidden="true" />

          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-1.5 text-xs ${isPaused ? 'text-[#B45309]' : 'text-danger'}`}>
              <span className={`h-2 w-2 rounded-full ${isPaused ? 'bg-amber' : 'animate-pulse bg-danger'}`} aria-hidden="true" />
              {isPaused ? 'Paused' : 'Recording'}
            </span>
            <span className="text-xs text-[#475569]">English only</span>
            <span className="text-xs text-[#475569]">Target: 30–45s</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={togglePause}
              aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-white text-[#475569] transition-all hover:border-primary hover:text-primary active:scale-95"
            >
              {isPaused ? <Play className="h-5 w-5" fill="currentColor" aria-hidden="true" /> : <Pause className="h-5 w-5" fill="currentColor" aria-hidden="true" />}
            </button>
            <button
              onClick={stopRecording}
              aria-label="Stop recording"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-danger text-white transition-transform hover:scale-105 active:scale-95"
            >
              <Square className="h-5 w-5" fill="white" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {phase === 'preview' && audioUrl && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md rounded-2xl border border-border bg-white p-6" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CircleCheck className="h-4 w-4 text-success" aria-hidden="true" />
            Recording Ready
          </div>

          <div className="flex w-full items-center gap-3 rounded-xl bg-background p-3" role="group" aria-label="Audio playback controls">
            <button
              onClick={togglePlayback}
              aria-label={isPlaying ? 'Pause playback' : 'Play recording'}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition-all hover:bg-primary-hover active:scale-95"
            >
              {isPlaying ? <Pause className="h-4 w-4" fill="white" aria-hidden="true" /> : <Play className="h-4 w-4" fill="white" aria-hidden="true" />}
            </button>
            <div className="flex-1" role="progressbar" aria-label="Playback progress" aria-valuenow={Math.round(playProgress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-150"
                  style={{ width: `${playProgress * 100}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted">
                <span>{formatTime(playProgress * duration)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#475569]">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>{duration.toFixed(1)} seconds</span>
          </div>

          <audio ref={audioRef} src={audioUrl} className="hidden" />

          <div className="flex gap-3">
            <button
              onClick={retake}
              aria-label="Discard recording and start over"
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-[#475569] transition-colors hover:bg-bg-secondary"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retake
            </button>
            <button
              onClick={analyze}
              disabled={loading}
              aria-label="Analyze recording for pronunciation feedback"
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
