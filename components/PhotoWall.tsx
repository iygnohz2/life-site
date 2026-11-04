'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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

/**
 * CSS 多列布局按顺序填列，直接按日期排会出现某一列明显偏短、底部大片留白。
 * 这里先按"当前最矮的一列"贪心分配，再把列拼平，让三列高度尽量接近。
 */
function balanceForColumns(photos: Photo[], cols = 3) {
  const buckets: { photo: Photo; index: number }[][] = Array.from({ length: cols }, () => [])
  const heights = new Array(cols).fill(0)

  photos.forEach((photo, index) => {
    const shortest = heights.indexOf(Math.min(...heights))
    buckets[shortest].push({ photo, index })
    heights[shortest] += photo.height / photo.width
  })

  return buckets.flat()
}

type Filter = { type: 'all' } | { type: 'year'; value: number } | { type: 'tag'; value: string }

export default function PhotoWall({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState<number | null>(null)
  const [filter, setFilter] = useState<Filter>({ type: 'all' })
  const open = active !== null

  const years = useMemo(
    () => [...new Set(photos.map((p) => Number(p.date.slice(0, 4))))].sort((a, b) => b - a),
    [photos]
  )
  const tags = useMemo(() => [...new Set(photos.flatMap((p) => p.tags))], [photos])

  const list = useMemo(() => {
    if (filter.type === 'all') return photos
    if (filter.type === 'year') return photos.filter((p) => p.date.startsWith(String(filter.value)))
    return photos.filter((p) => p.tags.includes(filter.value))
  }, [photos, filter])

  const arranged = useMemo(() => balanceForColumns(list), [list])

  const close = useCallback(() => setActive(null), [])
  const step = useCallback(
    (delta: number) => setActive((i) => (i === null ? i : (i + delta + list.length) % list.length)),
    [list.length]
  )

  const applyFilter = (next: Filter) => {
    setFilter(next)
    setActive(null)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
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

  if (!photos.length) {
    return (
      <div className="hairline py-16 text-center">
        <p className="text-ink-3 text-[13px] tracking-[0.08em]">还没有照片</p>
      </div>
    )
  }

  const current = active === null ? null : list[active]

  const chipClass = (isActive: boolean) =>
    [
      'text-[11.5px] tracking-[0.08em] transition-colors duration-300',
      isActive ? 'text-clay-500' : 'text-ink-2 hover:text-ink',
    ].join(' ')

  return (
    <>
      {photos.length > 1 ? (
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => applyFilter({ type: 'all' })}
            className={chipClass(filter.type === 'all')}
          >
            全部
            <span className="text-ink-3 ml-1 font-mono text-[10px]">{photos.length}</span>
          </button>

          {years.length > 1 ? (
            <>
              <span className="text-ink-3/50 text-[11px]">/</span>
              {years.map((year) => {
                const count = photos.filter((p) => p.date.startsWith(String(year))).length
                const isActive = filter.type === 'year' && filter.value === year
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => applyFilter({ type: 'year', value: year })}
                    className={chipClass(isActive)}
                  >
                    {year}
                    <span className="text-ink-3 ml-1 font-mono text-[10px]">{count}</span>
                  </button>
                )
              })}
            </>
          ) : null}

          {tags.length ? (
            <>
              <span className="text-ink-3/50 text-[11px]">/</span>
              {tags.map((tag) => {
                const count = photos.filter((p) => p.tags.includes(tag)).length
                const isActive = filter.type === 'tag' && filter.value === tag
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => applyFilter({ type: 'tag', value: tag })}
                    className={chipClass(isActive)}
                  >
                    {tag}
                    <span className="text-ink-3 ml-1 font-mono text-[10px]">{count}</span>
                  </button>
                )
              })}
            </>
          ) : null}
        </div>
      ) : null}

      <div
        key={`${filter.type}-${'value' in filter ? filter.value : 'all'}`}
        className="columns-1 gap-3 sm:columns-2 sm:gap-4 lg:columns-3"
      >
        {arranged.map(({ photo, index }) => (
          <button
            key={photo.slug}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`查看照片：${photo.caption ?? photo.slug}`}
            className="group bg-surface focus-visible:outline-clay-500 relative mb-3 block w-full animate-[fadeIn_.45s_ease_both] cursor-zoom-in break-inside-avoid overflow-hidden rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 sm:mb-4"
          >
            <Image
              src={photo.src}
              alt={photo.caption ?? ''}
              width={photo.width}
              height={photo.height}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-auto w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 text-left opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
              <p className="font-serif text-[14px] leading-snug text-white/95">
                {photo.caption ?? '无题'}
              </p>
              <p className="mt-1 font-mono text-[10.5px] tracking-[0.14em] text-white/60">
                {photo.date}
                {photo.place ? ` · ${photo.place}` : ''}
              </p>
            </div>
          </button>
        ))}
      </div>

      {!list.length ? (
        <p className="text-ink-3 py-16 text-center text-[13px] tracking-[0.08em]">
          没有符合条件的照片
        </p>
      ) : null}

      {current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="照片查看"
          className="fixed inset-0 z-80 bg-[#0b0a09]/94 backdrop-blur-sm"
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
                {pad((active ?? 0) + 1)} / {pad(list.length)}
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

            <div className="px-6 pb-8 text-center sm:pb-10">
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
