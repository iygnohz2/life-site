'use client'

import { useEffect, useState } from 'react'
import { api, type Overview as OverviewData } from './client'

export default function Overview({ onGoWrite }: { onGoWrite: () => void }) {
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .overview()
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  return (
    <section>
      <header className="flex items-end justify-between">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1 className="mt-3 font-serif text-[26px] font-light tracking-[0.04em]">概览</h1>
        </div>
        <button
          type="button"
          onClick={onGoWrite}
          className="border-line hover:border-dream-400/60 hover:text-dream-300 rounded-[3px] border px-4 py-2 text-[12px] tracking-[0.08em] transition-colors"
        >
          写一篇
        </button>
      </header>

      {error ? <p className="mt-8 text-[12px] text-red-400">{error}</p> : null}

      <div className="mt-10 grid grid-cols-2 gap-px sm:grid-cols-3">
        {[
          ['日记', data?.posts ?? '—', data?.drafts ? `含 ${data.drafts} 篇草稿` : ''],
          ['照片', data?.photos ?? '—', ''],
          ['书', data?.books ?? '—', ''],
          ['行程', data?.trips ?? '—', ''],
          ['到过的地方', data?.cities ?? '—', ''],
        ].map(([label, value, note]) => (
          <div key={label as string} className="border-line/60 border-t px-1 py-6">
            <p className="text-ink-3 text-[11px] tracking-[0.1em]">{label}</p>
            <p className="mt-2 font-serif text-[30px] leading-none font-light">{value}</p>
            {note ? <p className="text-ink-3 mt-2 text-[10.5px]">{note}</p> : null}
          </div>
        ))}
      </div>

      <h2 className="mt-16 font-serif text-[15px] tracking-[0.1em]">最近改过</h2>
      <ul className="mt-4">
        {(data?.recent ?? []).map((p) => (
          <li key={p.slug} className="border-line/50 flex items-baseline gap-4 border-b py-3">
            <span className="text-ink-3 w-[4.7rem] shrink-0 font-mono text-[10.5px] tracking-[0.06em] whitespace-nowrap">
              {p.date}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px]">{p.title}</span>
            {p.draft ? (
              <span className="text-dream-400 shrink-0 text-[10px] tracking-[0.1em]">草稿</span>
            ) : null}
            {p.mood ? <span className="text-ink-3 shrink-0 text-[10.5px]">{p.mood}</span> : null}
          </li>
        ))}
        {data && !data.recent.length ? (
          <li className="text-ink-3 py-6 text-[12px]">还没有日记，去写第一篇。</li>
        ) : null}
      </ul>
    </section>
  )
}
