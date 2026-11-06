'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import type { Track } from '@/lib/music'

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-[15px] w-[15px]" aria-hidden>
    <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l11.07-6.86c.66-.41.66-1.35 0-1.76L9.56 4.26C8.87 3.84 8 4.34 8 5.14z" />
  </svg>
)
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-[15px] w-[15px]" aria-hidden>
    <rect x="6.5" y="5" width="4" height="14" rx="1" />
    <rect x="13.5" y="5" width="4" height="14" rx="1" />
  </svg>
)
const PrevIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-[14px] w-[14px]" aria-hidden>
    <path d="M6 6h2v12H6zM20 6l-10 6 10 6z" />
  </svg>
)
const NextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-[14px] w-[14px]" aria-hidden>
    <path d="M16 6h2v12h-2zM4 6l10 6-10 6z" />
  </svg>
)

/** 悬浮按钮上的「呼吸音柱」，播放时会动 */
function EqBars({ active }: { active: boolean }) {
  return (
    <span className="flex h-[13px] items-end gap-[2.5px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[2.5px] rounded-full bg-current"
          style={{
            height: '100%',
            transformOrigin: 'bottom',
            animation: active ? `eq 1.1s ease-in-out ${i * 0.16}s infinite` : 'none',
            transform: active ? undefined : `scaleY(${0.35 + i * 0.22})`,
          }}
        />
      ))}
    </span>
  )
}

export default function MusicPlayer({ tracks }: { tracks: Track[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playingRef = useRef(false)

  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)

  const count = tracks.length
  const track = count ? tracks[Math.min(index, count - 1)] : null

  // 音量
  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = muted ? 0 : volume
  }, [volume, muted])

  // 音频事件：播放状态、进度、时长、切下一首
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrent(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || 0)
    const onPlay = () => {
      setPlaying(true)
      playingRef.current = true
    }
    const onPause = () => {
      setPlaying(false)
      playingRef.current = false
    }
    const onEnded = () => setIndex((i) => (count ? (i + 1) % count : 0))
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [count])

  // 切歌：换 src，若之前在播则继续
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    audio.src = track.src
    audio.load()
    setCurrent(0)
    setDuration(0)
    if (playingRef.current) audio.play().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  if (!count) return null

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }

  const step = (dir: 1 | -1) => {
    if (count <= 1) return
    setIndex((i) => (i + dir + count) % count)
  }

  const seek = (e: MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * duration
  }

  const seekBy = (delta: number) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    audio.currentTime = Math.min(duration, Math.max(0, audio.currentTime + delta))
  }

  const onSeekKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      seekBy(5)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      seekBy(-5)
    }
  }

  const progress = duration ? Math.min(1, current / duration) : 0

  return (
    <>
      <audio ref={audioRef} preload="none">
        <track kind="captions" />
      </audio>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open music player"
          className="group fixed right-3 bottom-20 z-60 sm:top-[58%] sm:bottom-auto sm:-translate-y-1/2"
        >
          {/* 月光柔光：偏心的一团，会呼吸、会漂移 */}
          <span
            aria-hidden
            className="moon-pulse pointer-events-none absolute -inset-7 blur-2xl"
            style={{
              background:
                'radial-gradient(55% 50% at 42% 38%, color-mix(in oklab, var(--color-dream-400) 52%, transparent) 0%, color-mix(in oklab, var(--color-mist-500) 30%, transparent) 46%, transparent 70%)',
            }}
          />
          <span
            className={`border-line bg-surface/70 relative flex h-12 w-12 items-center justify-center border backdrop-blur transition-all duration-300 sm:h-auto sm:w-auto sm:flex-col sm:gap-4 sm:px-[10px] sm:py-7 ${
              playing
                ? 'border-dream-500/45 text-dream-400 bg-surface/85'
                : 'text-ink-2 hover:border-dream-500/35 hover:text-ink hover:bg-surface/90'
            }`}
            style={{ borderRadius: '58% 42% 50% 48% / 55% 45% 58% 42%' }}
          >
            <span className="hidden flex-col items-center gap-[3px] sm:flex">
              <span className="music-letter text-[12px] leading-none">M</span>
              <span className="music-letter text-[12px] leading-none">U</span>
              <span className="music-letter text-[12px] leading-none">S</span>
              <span className="music-letter text-[12px] leading-none">I</span>
              <span className="music-letter text-[12px] leading-none">C</span>
            </span>
            <EqBars active={playing} />
          </span>
        </button>
      ) : (
        <div
          className="fixed right-3 bottom-20 z-60 w-[276px] max-w-[calc(100vw-32px)] sm:top-[58%] sm:bottom-auto sm:-translate-y-1/2"
          style={{ animation: 'zoomIn .32s cubic-bezier(.22,1,.36,1) both' }}
        >
          <div className="border-line bg-surface rounded-[6px] border px-5 py-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.04]">
            {/* 顶栏 */}
            <div className="flex items-center justify-between">
              <span className="eyebrow">MUSIC</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="收起播放器"
                className="text-ink-3 hover:text-ink transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-[15px] w-[15px]"
                  aria-hidden
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* 曲目信息 */}
            <div className="mt-3 min-h-[42px]">
              <p className="truncate font-serif text-[15px] leading-[1.5]">{track?.title}</p>
              {track?.artist ? (
                <p className="text-ink-3 mt-0.5 truncate text-[11px] tracking-[0.04em]">
                  {track.artist}
                </p>
              ) : null}
            </div>

            {/* 进度条 */}
            <div className="mt-3">
              <div
                role="slider"
                tabIndex={0}
                aria-label="播放进度"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                onClick={seek}
                onKeyDown={onSeekKey}
                className="group h-4 cursor-pointer"
              >
                <div className="bg-line relative top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full">
                  <div
                    className="bg-dream-500 absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-ink-3 mt-1 flex justify-between font-mono text-[10px] tracking-[0.06em]">
                <span>{formatTime(current)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* 控制区 */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  disabled={count <= 1}
                  aria-label="上一首"
                  className="text-ink-2 hover:text-ink flex h-9 w-9 items-center justify-center transition-colors disabled:opacity-30"
                >
                  <PrevIcon />
                </button>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={playing ? '暂停' : '播放'}
                  className="text-ink bg-dream-500/15 hover:bg-dream-500/25 flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                >
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  disabled={count <= 1}
                  aria-label="下一首"
                  className="text-ink-2 hover:text-ink flex h-9 w-9 items-center justify-center transition-colors disabled:opacity-30"
                >
                  <NextIcon />
                </button>
              </div>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value))
                  setMuted(false)
                }}
                aria-label="音量"
                className="h-1 w-[72px] cursor-pointer"
                style={{ accentColor: 'var(--color-dream-500)' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
