import Link from '@/components/Link'
import { groupByYear, shortDate, MOOD_TONE, KIND_LABEL, type LifeEntry } from '@/lib/life'

export default function LifeTimeline({ entries }: { entries: LifeEntry[] }) {
  const groups = groupByYear(entries)

  return (
    <div>
      {groups.map((group) => (
        <section key={group.year} className="mb-10">
          <div className="bg-paper/85 sticky top-16 z-10 flex items-center gap-4 py-3 backdrop-blur">
            <span className="text-ink-3 font-mono text-[12px] tracking-[0.2em]">{group.year}</span>
            <span className="bg-line h-px flex-1" />
            <span className="text-ink-3 text-[11px]">{group.items.length} 篇</span>
          </div>

          <ul>
            {group.items.map((entry) => {
              const tone = (entry.mood && MOOD_TONE[entry.mood]) || 'var(--color-ink-3)'
              return (
                <li key={entry.slug} className="border-line/70 group border-b">
                  <Link href={`/life/${entry.slug}`} className="flex gap-5 py-7 sm:gap-8">
                    <div className="text-ink-3 w-12 shrink-0 pt-[6px] font-mono text-[11.5px] tracking-[0.08em] sm:w-14">
                      {shortDate(entry.date)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3">
                        <span
                          aria-hidden
                          className="inline-block h-[5px] w-[5px] shrink-0 translate-y-[-2px] rounded-full"
                          style={{ background: tone }}
                        />
                        <h3 className="group-hover:text-clay-500 font-serif text-[17px] leading-snug transition-colors duration-300">
                          {entry.title}
                        </h3>
                      </div>

                      {entry.summary ? (
                        <p className="text-ink-2 mt-2.5 line-clamp-2 text-[13px] leading-[1.95]">
                          {entry.summary}
                        </p>
                      ) : null}

                      <div className="text-ink-3 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] tracking-[0.04em]">
                        {entry.kind ? <span>{KIND_LABEL[entry.kind] ?? entry.kind}</span> : null}
                        {entry.mood ? (
                          <>
                            <span className="opacity-40">·</span>
                            <span>{entry.mood}</span>
                          </>
                        ) : null}
                        {entry.place ? (
                          <>
                            <span className="opacity-40">·</span>
                            <span>{entry.place}</span>
                          </>
                        ) : null}
                        {entry.weather ? (
                          <>
                            <span className="opacity-40">·</span>
                            <span>{entry.weather}</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-ink-3 hidden shrink-0 items-center pt-1 transition-transform duration-300 group-hover:translate-x-1 sm:flex">
                      <span aria-hidden>→</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
