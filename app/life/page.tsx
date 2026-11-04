import type { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'
import LifeTimeline from '@/components/LifeTimeline'
import { allLives } from 'contentlayer/generated'
import { sortByDateDesc, type LifeEntry } from '@/lib/life'

export const metadata: Metadata = {
  title: '生活流',
}

export default function LifePage() {
  const entries = sortByDateDesc(
    (allLives as unknown as LifeEntry[]).filter(
      (p) => process.env.NODE_ENV !== 'production' || p.draft !== true
    )
  )

  return (
    <PageHeader
      eyebrow="TIMELINE"
      title="生活流"
      desc="按时间倒着读。每条记录带一个心情、几个标签，偶尔还有一张照片。"
    >
      {entries.length ? (
        <LifeTimeline entries={entries} />
      ) : (
        <div className="hairline py-16 text-center">
          <p className="text-ink-3 text-[13px] tracking-[0.08em]">还没有记录</p>
        </div>
      )}
    </PageHeader>
  )
}
