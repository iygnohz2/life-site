'use client'

import { useState } from 'react'
import Link from 'next/link'
import Overview from './Overview'
import Writer from './Writer'
import Photos from './Photos'
import Publish from './Publish'

const TABS = [
  { id: 'overview', zh: '概览', en: 'OVERVIEW' },
  { id: 'write', zh: '写日记', en: 'WRITE' },
  { id: 'photos', zh: '照片', en: 'PHOTOS' },
  { id: 'publish', zh: '发布', en: 'PUBLISH' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function Studio() {
  const [tab, setTab] = useState<TabId>('overview')

  return (
    <div className="bg-paper text-ink fixed inset-0 z-100 overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-6xl">
        <aside className="border-line/70 sticky top-0 flex h-screen w-[15rem] shrink-0 flex-col border-r px-5 py-8">
          <Link
            href="/"
            className="font-serif text-[13.5px] leading-none font-light tracking-[0.04em] whitespace-nowrap"
          >
            iygnohz&rsquo;s DreamLand
          </Link>
          <p className="eyebrow mt-2">STUDIO</p>

          <nav className="mt-10 flex flex-col gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`group flex items-baseline justify-between rounded-[3px] px-2 py-2 text-left transition-colors duration-300 ${
                  tab === t.id ? 'text-dream-300' : 'text-ink-2 hover:text-ink'
                }`}
              >
                <span className="text-[13px] tracking-[0.06em]">{t.zh}</span>
                <span className="font-mono text-[9px] tracking-[0.14em] opacity-50">{t.en}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-2">
            <Link
              href="/"
              className="text-ink-3 hover:text-ink text-[11.5px] tracking-[0.06em] transition-colors"
            >
              ← 回到网站
            </Link>
            <p className="text-ink-3 text-[10.5px] leading-[1.7]">
              只在本地运行。
              <br />
              线上访问会返回 404。
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-8 py-9 sm:px-10">
          {tab === 'overview' ? <Overview onGoWrite={() => setTab('write')} /> : null}
          {tab === 'write' ? <Writer /> : null}
          {tab === 'photos' ? <Photos /> : null}
          {tab === 'publish' ? <Publish /> : null}
        </main>
      </div>
    </div>
  )
}
