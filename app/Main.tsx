import Link from '@/components/Link'
import SectionContainer from '@/components/SectionContainer'
import TiltCard from '@/components/TiltCard'
import TodayLine from '@/components/TodayLine'
import siteMetadata from '@/data/siteMetadata'
import { shortDate, type LifeEntry } from '@/lib/life'

const entries = [
  {
    no: '01',
    href: '/life',
    title: '生活流',
    desc: '按时间读的日子，好天气和坏心情都算数。',
  },
  {
    no: '02',
    href: '/photos',
    title: '相册',
    desc: '被留下来的光。没有主题，只有当时想按快门。',
  },
  {
    no: '03',
    href: '/places',
    title: '足迹',
    desc: '去过的地方，和在那里发生的小事。',
  },
  {
    no: '04',
    href: '/books',
    title: '书架',
    desc: '读过的和正在读的，都立在架子上。',
  },
]

export default function Home({ latest = [] }: { latest?: LifeEntry[] }) {
  return (
    <SectionContainer>
      <section className="pt-16 pb-14 sm:pt-24 sm:pb-20">
        <TodayLine />
        <h1
          className="rise mt-7 text-[clamp(2.1rem,5.6vw,3.4rem)] leading-[1.32] font-normal tracking-[0.02em]"
          style={{ animationDelay: '90ms' }}
        >
          把日子过成
          <br />
          <span className="text-clay-500">值得记下</span>的样子
        </h1>
        <p
          className="text-ink-2 rise mt-8 max-w-lg text-[15px] leading-[2]"
          style={{ animationDelay: '180ms' }}
        >
          {siteMetadata.description}
          <br />
          这里没有算法，也不追热点 —— 只是把想留住的东西，一件一件放进来。
        </p>
      </section>

      <section
        className="rise grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        style={{ animationDelay: '300ms' }}
        aria-label="站点入口"
      >
        {entries.map((e) => (
          <TiltCard key={e.href} className="h-full">
            <Link
              href={e.href}
              className="border-line bg-surface/70 hover:border-clay-300 group flex h-full flex-col justify-between rounded-[4px] border p-6 transition-colors duration-300"
            >
              <div className="text-ink-3 font-mono text-[11px] tracking-[0.2em]">{e.no}</div>
              <div className="mt-14">
                <div className="font-serif text-[19px] tracking-[0.06em]">{e.title}</div>
                <p className="text-ink-3 mt-3 text-[12.5px] leading-[1.9]">{e.desc}</p>
                <div className="text-clay-500 mt-6 flex items-center gap-2 text-[12px] tracking-[0.1em] transition-transform duration-300 group-hover:translate-x-1">
                  <span>进去看看</span>
                  <span aria-hidden>→</span>
                </div>
              </div>
            </Link>
          </TiltCard>
        ))}
      </section>

      <section className="mt-20" aria-label="最近的记录">
        <div className="hairline flex items-baseline justify-between py-5">
          <p className="eyebrow">最近记下</p>
          <Link
            href="/life"
            className="text-ink-3 hover:text-clay-500 text-[12px] tracking-[0.08em] transition-colors"
          >
            全部 →
          </Link>
        </div>

        {latest.length ? (
          <ul>
            {latest.map((item) => (
              <li key={item.slug} className="border-line/70 border-b">
                <Link href={`/life/${item.slug}`} className="group flex items-baseline gap-5 py-5">
                  <span className="text-ink-3 w-11 shrink-0 font-mono text-[11px] tracking-[0.08em]">
                    {shortDate(item.date)}
                  </span>
                  <span className="group-hover:text-clay-500 min-w-0 flex-1 truncate font-serif text-[15.5px] transition-colors duration-300">
                    {item.title}
                  </span>
                  {item.mood ? (
                    <span className="text-ink-3 shrink-0 text-[11px] tracking-[0.06em]">
                      {item.mood}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-3 py-8 text-[12px] tracking-[0.08em]">还没有记录 —— 从今天开始</p>
        )}
      </section>
    </SectionContainer>
  )
}
