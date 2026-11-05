'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from './Link'
import { longDate, shortDate } from '@/lib/life'

export type Memory = {
  slug: string
  title: string
  date: string
  summary?: string
  mood?: string
  place?: string
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 优先找"去年今天"的同月同日记录，没有就随便翻一页 */
function pickMemory(memories: Memory[]) {
  const now = new Date()
  const mmdd = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const sameDay = memories.filter(
    (m) => m.date.slice(5, 10) === mmdd && Number(m.date.slice(0, 4)) < now.getFullYear()
  )

  if (sameDay.length) {
    return { memory: sameDay[Math.floor(Math.random() * sameDay.length)], onThisDay: true }
  }
  return { memory: memories[Math.floor(Math.random() * memories.length)], onThisDay: false }
}

/**
 * 页脚彩蛋：连点 5 下"写于每一个普通的日子"，翻出一页旧记录。
 * 平时完全看不出可点，点了也没有反馈，第 5 下才揭晓。
 */
export default function FooterEgg({ memories }: { memories: Memory[] }) {
  const [hits, setHits] = useState(0)
  const [opened, setOpened] = useState(false)
  const [result, setResult] = useState<{ memory: Memory; onThisDay: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const roll = useCallback(() => {
    if (!memories.length) return
    setResult(pickMemory(memories))
    setOpened(true)
  }, [memories])

  const onClick = () => {
    if (!memories.length) return
    const next = hits + 1
    if (next >= 5) {
      setHits(0)
      roll()
      return
    }
    setHits(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setHits(0), 2200)
  }

  useEffect(() => {
    if (!opened) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpened(false)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [opened])

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="写于每一个普通的日子"
        className="transition-opacity duration-300 select-none hover:opacity-70"
      >
        写于每一个普通的日子
      </button>

      {opened && result ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="翻到的一页"
          className="fixed inset-0 z-80 flex items-center justify-center px-5"
        >
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setOpened(false)}
            className="absolute inset-0 bg-[#080706]/72 backdrop-blur-[3px]"
            style={{ animation: 'fadeIn .25s ease both' }}
          />

          <div
            className="border-line bg-surface relative w-full max-w-md rounded-[4px] border px-8 py-9 shadow-[0_30px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.04]"
            style={{ animation: 'zoomIn .42s cubic-bezier(.22,1,.36,1) both' }}
          >
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">{result.onThisDay ? 'ON THIS DAY' : 'A RANDOM PAGE'}</p>
              <p className="text-ink-3 font-mono text-[10.5px] tracking-[0.18em]">
                {shortDate(result.memory.date)}
              </p>
            </div>

            <h3 className="mt-5 font-serif text-[21px] leading-[1.45] tracking-[0.01em]">
              {result.memory.title}
            </h3>

            {result.memory.summary ? (
              <p className="text-ink-2 mt-4 text-[13px] leading-[1.95]">{result.memory.summary}</p>
            ) : null}

            <div className="text-ink-3 mt-4 flex flex-wrap items-center gap-x-3 text-[11.5px] tracking-[0.04em]">
              <span>{longDate(result.memory.date)}</span>
              {result.memory.mood ? (
                <>
                  <span className="opacity-40">·</span>
                  <span>{result.memory.mood}</span>
                </>
              ) : null}
              {result.memory.place ? (
                <>
                  <span className="opacity-40">·</span>
                  <span>{result.memory.place}</span>
                </>
              ) : null}
            </div>

            <div className="hairline mt-7 flex items-center justify-between pt-5">
              <Link
                href={`/life/${result.memory.slug}`}
                onClick={() => setOpened(false)}
                className="text-dream-500 hover:text-dream-600 group flex items-center gap-2 text-[12.5px] tracking-[0.08em] transition-colors"
              >
                去读这一页
                <span
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                >
                  →
                </span>
              </Link>
              <button
                type="button"
                onClick={roll}
                className="text-ink-3 hover:text-ink text-[12px] tracking-[0.08em] transition-colors"
              >
                再翻一页
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
