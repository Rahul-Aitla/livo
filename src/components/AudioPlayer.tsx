'use client'

import { useState, useCallback, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

interface AudioPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>
}

export default function AudioPlayer({ audioRef }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [seeking, setSeeking] = useState(false)

  const togglePlay = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      el.play()
    } else {
      el.pause()
    }
  }, [audioRef])

  const handleTimeUpdate = useCallback(() => {
    if (!seeking && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [seeking, audioRef])

  const handleLoaded = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0)
    }
  }, [audioRef])

  const handleEnded = useCallback(() => {
    setPlaying(false)
    setCurrentTime(0)
  }, [])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    if (!el || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = (e.clientX - rect.left) / rect.width
    const time = frac * duration
    el.currentTime = time
    setCurrentTime(time)
  }, [duration, audioRef])

  const handleSeekStart = useCallback(() => setSeeking(true), [])
  const handleSeekEnd = useCallback(() => setSeeking(false), [])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
    }
  }, [audioRef])

  function fmt(t: number) {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Recording Playback</p>

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition-all hover:bg-primary-hover active:scale-95"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <div className="flex-1">
          <div
            role="slider"
            aria-label="Audio progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(duration > 0 ? (currentTime / duration) * 100 : 0)}
            tabIndex={0}
            className="relative h-2 w-full cursor-pointer rounded-full bg-border"
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onClick={handleSeek}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' && audioRef.current) {
                audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 2, duration)
              }
              if (e.key === 'ArrowLeft' && audioRef.current) {
                audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 2, 0)
              }
            }}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-100"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          <div className="mt-1 flex justify-between text-[10px] text-muted">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
