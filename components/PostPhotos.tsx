'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import type { Photo } from '@/lib/photos'

const pad = (n: number) => String(n).padStart(2, '0')

const Arrow = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
    <path
      d={dir === 'left' ? 'M13.5 4.5L7 11l6.5 6.5' : 'M8.5 4.5L15 11l-6.5 6.5'}
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/** 日记详情页的照片图集：保持原比例的 2 列瀑布流 + 灯箱 + 照片互动 */
export default function PostPhotos({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState<number | null>(null)
  const open = active !== null

  const close = useCallback(() => setActive(null), [])
  const step = useCallback(
    (delta: number) =>
      setActive((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length]
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, close, step])

  if (!photos.length) return null

  const current = active === null ? null : photos[active]

  return (
    <>
      <section className="mt-12">
        <h2 className="text-ink-2 mb-4 text-[11.5px] tracking-[0.24em]">当时的光</h2>
        <div className="columns-2 gap-2 sm:gap-3">
          {photos.map((photo, i) => (
            <button
              key={photo.slug}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`查看照片：${photo.caption ?? photo.slug}`}
              className="group bg-surface focus-visible:outline-dream-500 relative mb-2 block w-full break-inside-avoid overflow-hidden rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 sm:mb-3"
            >
              <Image
                src={photo.src}
                alt={photo.caption ?? ''}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 640px) 50vw, 33vw"
                className="h-auto w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
              />
              {photo.caption ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent p-3 pt-8 text-left">
                  <p className="truncate font-serif text-[12px] text-white/95">{photo.caption}</p>
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="照片查看"
          className="fixed inset-0 z-80 bg-[#05070d]/94 backdrop-blur-sm"
          style={{ animation: 'fadeIn .22s ease both' }}
        >
          <button
            type="button"
            aria-label="关闭照片"
            onClick={close}
            className="absolute inset-0 cursor-zoom-out"
          />

          <div className="pointer-events-none relative flex h-full flex-col">
            <div className="pointer-events-auto flex items-center justify-between px-5 py-4 sm:px-8">
              <span className="font-mono text-[11px] tracking-[0.24em] text-white/45">
                {pad((active ?? 0) + 1)} / {pad(photos.length)}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="关闭"
                className="p-2 text-white/55 transition-colors hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path
                    d="M3.5 3.5l11 11M14.5 3.5l-11 11"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-12 sm:px-20">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="上一张"
                className="pointer-events-auto absolute left-1 p-3 text-white/40 transition-colors hover:text-white sm:left-6"
              >
                <Arrow dir="left" />
              </button>

              <Image
                key={current.slug}
                src={current.src}
                alt={current.caption ?? ''}
                width={current.width}
                height={current.height}
                sizes="90vw"
                priority
                className="max-h-[74vh] w-auto max-w-full rounded-[2px] object-contain"
                style={{ animation: 'zoomIn .32s cubic-bezier(.22,1,.36,1) both' }}
              />

              <button
                type="button"
                onClick={() => step(1)}
                aria-label="下一张"
                className="pointer-events-auto absolute right-1 p-3 text-white/40 transition-colors hover:text-white sm:right-6"
              >
                <Arrow dir="right" />
              </button>
            </div>

            <div className="pointer-events-auto max-h-[42vh] overflow-y-auto px-6 pb-8 text-center sm:pb-10">
              {current.caption ? (
                <p className="font-serif text-[15px] tracking-[0.04em] text-white/90">
                  {current.caption}
                </p>
              ) : null}
              <p className="mt-2 font-mono text-[10.5px] tracking-[0.18em] text-white/40">
                {current.date}
                {current.place ? ` · ${current.place}` : ''}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
