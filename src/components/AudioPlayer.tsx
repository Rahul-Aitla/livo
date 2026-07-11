'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'

interface AudioPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>
  playUntilRef?: React.RefObject<number>
}

export default function AudioPlayer({ audioRef, playUntilRef }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const seekingRef = useRef(false)

  const togglePlay = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      el.play()
    } else {
      el.pause()
    }
  }, [audioRef])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    if (!el || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = (e.clientX - rect.left) / rect.width
    const time = frac * duration
    el.currentTime = time
    setCurrentTime(time)
  }, [duration, audioRef])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const onTimeUpdate = () => {
      if (!seekingRef.current) {
        setCurrentTime(el.currentTime)
      }
      // Auto-stop when reaching the target word's end
      if (playUntilRef?.current && playUntilRef.current > 0 && el.currentTime >= playUntilRef.current) {
        el.pause()
        playUntilRef.current = 0
        setPlaying(false)
      }
    }

    const onLoaded = () => {
      setDuration(el.duration || 0)
    }

    const onEnded = () => {
      setPlaying(false)
      setCurrentTime(0)
    }

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)

    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('ended', onEnded)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)

    return () => {
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
    }
  }, [audioRef, playUntilRef])

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
            onMouseDown={() => { seekingRef.current = true }}
            onMouseUp={() => { seekingRef.current = false }}
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
