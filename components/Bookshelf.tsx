'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  groupBooks,
  spineHeight,
  spineWidth,
  spineTone,
  STATUS_LABEL,
  type Book,
} from '@/lib/books'
import { partsOf } from '@/lib/life'

function Rating({ value, tone = 'ink' }: { value: number; tone?: 'ink' | 'light' }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`${value} 分`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="inline-block h-[3px] w-[3px] rounded-full"
          style={{
            background:
              i < value
                ? tone === 'light'
                  ? 'rgba(255,255,255,0.9)'
                  : 'var(--color-clay-500)'
                : tone === 'light'
                  ? 'rgba(255,255,255,0.25)'
                  : 'var(--color-line)',
          }}
        />
      ))}
    </span>
  )
}

export default function Bookshelf({ books }: { books: Book[] }) {
  const groups = useMemo(() => groupBooks(books), [books])
  const [selected, setSelected] = useState<{ book: Book; tone: string } | null>(null)

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelected(null)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [selected])

  if (!books.length) {
    return (
      <div className="hairline py-16 text-center">
        <p className="text-ink-3 text-[13px] tracking-[0.08em]">书架还空着</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-14">
        {groups.map((group) => (
          <section key={group.status}>
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-[15px] tracking-[0.18em]">{group.label}</h2>
              <span className="text-ink-3 font-mono text-[10.5px] tracking-[0.16em]">
                {String(group.books.length).padStart(2, '0')}
              </span>
            </div>

            <div className="border-line mt-5 flex w-fit max-w-full items-end gap-[6px] overflow-x-auto border-b px-4 pt-24">
              {group.books.map((book, i) => {
                const tone = spineTone(book, i)
                return (
                  <button
                    key={`${book.title}-${i}`}
                    type="button"
                    onClick={() => setSelected({ book, tone })}
                    aria-label={`${book.title}，${book.author}`}
                    className="group relative shrink-0 cursor-pointer rounded-t-[2px] border border-black/25 transition-transform duration-300 ease-out hover:-translate-y-2 focus-visible:-translate-y-2 focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      height: spineHeight(book, i),
                      width: spineWidth(book),
                      background: tone,
                    }}
                  >
                    <span
                      aria-hidden
                      className="absolute top-2 bottom-2 left-[5px] w-px bg-white/25"
                    />
                    <span
                      className="absolute top-2 right-[5px] bottom-2 w-px bg-black/20"
                      aria-hidden
                    />

                    <span className="absolute inset-0 flex items-center justify-center px-1">
                      <span className="font-serif text-[13.5px] leading-none tracking-[0.16em] whitespace-nowrap text-[#f3ece1] [writing-mode:vertical-rl]">
                        {book.title}
                      </span>
                    </span>

                    <span className="border-line bg-surface pointer-events-none absolute -top-1 left-1/2 z-10 hidden w-max max-w-[220px] -translate-x-1/2 -translate-y-full flex-col items-center gap-1 border px-3 py-2 text-center opacity-0 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 sm:flex">
                      <span className="font-serif text-[12px] leading-snug">{book.title}</span>
                      <span className="text-ink-3 text-[10.5px] tracking-[0.06em]">
                        {book.author}
                      </span>
                      {book.status === 'done' && book.rating ? (
                        <span className="mt-0.5">
                          <Rating value={book.rating} />
                        </span>
                      ) : null}
                      {book.status === 'reading' ? (
                        <span className="text-ink-3 text-[10.5px]">读到 {book.progress ?? 0}%</span>
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {selected ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selected.book.title}
          className="fixed inset-0 z-80 flex items-center justify-center px-5"
        >
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setSelected(null)}
            className="absolute inset-0 bg-[#080706]/72 backdrop-blur-[3px]"
            style={{ animation: 'fadeIn .22s ease both' }}
          />

          <div
            className="border-line bg-surface relative w-full max-w-md rounded-[4px] border px-8 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.04]"
            style={{ animation: 'zoomIn .38s cubic-bezier(.22,1,.36,1) both' }}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="eyebrow">
                  {selected.book.status === 'done'
                    ? 'FINISHED'
                    : selected.book.status === 'reading'
                      ? 'READING'
                      : 'WISHLIST'}
                </p>
                <h3 className="mt-3 font-serif text-[20px] leading-[1.4]">{selected.book.title}</h3>
                <p className="text-ink-3 mt-1.5 text-[12px] tracking-[0.04em]">
                  {selected.book.author}
                </p>
              </div>
              <span
                aria-hidden
                className="mt-1 h-12 w-[6px] shrink-0 rounded-[1px]"
                style={{ background: selected.tone }}
              />
            </div>

            <div className="hairline mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 py-3">
              <span className="text-ink-3 text-[11.5px] tracking-[0.08em]">
                {STATUS_LABEL[selected.book.status]}
              </span>
              {selected.book.status === 'done' && selected.book.rating ? (
                <span className="flex items-center gap-2">
                  <Rating value={selected.book.rating} />
                  <span className="text-ink-3 text-[11px]">{selected.book.rating}.0</span>
                </span>
              ) : null}
              {selected.book.status === 'reading' ? (
                <span className="text-ink-3 text-[11.5px]">
                  读到 {selected.book.progress ?? 0}%
                </span>
              ) : null}
              {selected.book.date ? (
                <span className="text-ink-3 text-[11.5px]">
                  {partsOf(selected.book.date).year} 年 {partsOf(selected.book.date).monthCn}
                </span>
              ) : null}
            </div>

            {selected.book.note ? (
              <p className="text-ink-2 mt-4 text-[13px] leading-[1.95]">{selected.book.note}</p>
            ) : null}

            {selected.book.tags?.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {selected.book.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border-line text-ink-3 rounded-full border px-3 py-1 text-[11px] tracking-[0.06em]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
