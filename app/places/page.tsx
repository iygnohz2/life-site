import type { Metadata } from 'next'
import Link from '@/components/Link'
import PageHeader from '@/components/PageHeader'
import FootprintMap from '@/components/FootprintMap'
import PlaceEntryTitle from '@/components/PlaceEntryTitle'
import Interactions from '@/components/Interactions'
import { allLives } from 'contentlayer/generated'
import type { LifeEntry } from '@/lib/life'
import { getPlaces, type LifeLike } from '@/lib/places'
import { longDate, shortDate } from '@/lib/life'

export const metadata: Metadata = {
  title: '足迹',
}

export default function PlacesPage() {
  const lives = allLives as unknown as LifeEntry[]
  const { points, unknown } = getPlaces(lives as LifeLike[])

  const totalVisits = points.reduce((n, p) => n + p.visits, 0)
  const latest = points.reduce((d, p) => (p.latest > d ? p.latest : d), '')

  const groups = new Map<string, typeof points>()
  for (const point of points) {
    const key = point.region ?? '未分类'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(point)
  }

  return (
    <PageHeader
      eyebrow="PLACES"
      title="足迹"
      desc="去过的地方，和在那里发生的小事。写日记时填上地点，这里就会自动更新。"
    >
      <div className="hairline mb-6 flex items-baseline justify-between py-4">
        <p className="text-ink-3 text-[11.5px] tracking-[0.14em]">
          {points.length} 个地方 · {totalVisits} 条记录
          {latest ? ` · 最近 ${longDate(latest)}` : ''}
        </p>
        <p className="text-ink-3 hidden text-[11.5px] tracking-[0.06em] sm:block">按记录条数排序</p>
      </div>

      <FootprintMap points={points} />

      {unknown.length ? (
        <p className="text-ink-3 mt-4 text-[11.5px] leading-relaxed">
          还有 {unknown.join('、')} 没有坐标，在 <code>site-data/places.json</code>{' '}
          里补上经纬度就会出现在图上。
        </p>
      ) : null}

      <div className="mt-14 space-y-12">
        {[...groups.entries()].map(([region, list]) => (
          <section key={region}>
            <div className="flex items-center gap-4">
              <h2 className="font-serif text-[15px] tracking-[0.18em]">{region}</h2>
              <span className="bg-line h-px flex-1" />
              <span className="text-ink-3 font-mono text-[10.5px] tracking-[0.16em]">
                {String(list.length).padStart(2, '0')}
              </span>
            </div>

            <ul className="mt-2">
              {list.map((point) => (
                <li key={point.city} className="border-line/70 border-b py-6">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-serif text-[17px] tracking-[0.02em]">{point.city}</span>
                    <span className="text-ink-3 text-[11.5px] tracking-[0.08em]">
                      {point.visits} 条记录 · 最近 {shortDate(point.latest)}
                    </span>
                  </div>

                  {point.notes.map((note) => (
                    <p
                      key={note}
                      className="text-ink-2 mt-3 text-[13px] leading-[1.95] whitespace-pre-line"
                    >
                      {note}
                    </p>
                  ))}

                  {point.entries.length ? (
                    <ul className="mt-4 space-y-2">
                      {point.entries.map((entry) => (
                        <li key={entry.slug}>
                          <Link
                            href={`/life/${entry.slug}`}
                            className="group text-ink-2 hover:text-dream-500 flex items-baseline gap-3 text-[13px] transition-colors"
                          >
                            <span className="text-ink-3 font-mono text-[10.5px] tracking-[0.08em]">
                              {shortDate(entry.date)}
                            </span>
                            <PlaceEntryTitle title={entry.title} locked={entry.locked} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <Interactions
                    targetType="place"
                    targetId={point.city}
                    className="hairline mt-6 pt-6"
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageHeader>
  )
}
