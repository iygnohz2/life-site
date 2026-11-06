import Link from '@/components/Link'
import SectionContainer from '@/components/SectionContainer'
import TodayLine from '@/components/TodayLine'
import Drift from '@/components/Drift'
import ScatterText from '@/components/ScatterText'
import siteMetadata from '@/data/siteMetadata'
import { shortDate, type LifeEntry } from '@/lib/life'

const entries = [
  {
    href: '/life',
    speed: 0.05,
    title: '生活流',
    desc: '按时间读的日子，好天气和坏心情都算数。',
    pad: 'sm:pl-0',
    gap: 'pt-2',
    size: 'text-[clamp(1.6rem,3.6vw,2.05rem)]',
  },
  {
    href: '/photos',
    speed: 0.14,
    title: '相册',
    desc: '被留下来的光。没有主题，只有当时想按快门。',
    pad: 'sm:pl-20',
    gap: 'pt-10',
    size: 'text-[clamp(1.15rem,2.3vw,1.35rem)]',
  },
  {
    href: '/places',
    speed: 0.08,
    title: '足迹',
    desc: '去过的地方，和在那里发生的小事。',
    pad: 'sm:pl-8',
    gap: 'pt-3',
    size: 'text-[clamp(1.8rem,4.2vw,2.35rem)]',
  },
  {
    href: '/books',
    speed: 0.18,
    title: '书架',
    desc: '读过的和正在读的，都立在架子上。',
    pad: 'sm:pl-28',
    gap: 'pt-12',
    size: 'text-[clamp(1.3rem,2.6vw,1.5rem)]',
  },
]

export default function Home({ latest = [] }: { latest?: LifeEntry[] }) {
  const { text, emphasis, author } = siteMetadata.quote
  const [quoteBefore, quoteAfter] = text.split(emphasis)

  return (
    <SectionContainer>
      <section className="relative pt-20 pb-12 sm:pt-28 sm:pb-16">
        {/* 呼吸：全页唯一在动的东西 */}
        <div
          aria-hidden
          className="breath pointer-events-none absolute -top-16 left-[18%] h-64 w-64 rounded-full blur-[90px]"
          style={{
            background:
              'radial-gradient(circle at center, var(--color-dream-400) 0%, transparent 70%)',
          }}
        />

        <div className="sm:flex sm:items-stretch sm:justify-between sm:gap-14">
          {/* 右栏：桌面端标题散成一团字云，同句重影压在身后 */}
          <div className="relative sm:order-2 sm:shrink-0">
            <h1 className="develop relative z-10 text-[clamp(2rem,5vw,3.2rem)] font-light sm:text-[1.6rem]">
              <ScatterText
                text="把日子过成值得记下的样子"
                emphasis="值得记下"
                direction="cloud"
                seed={3}
                intensity={1.4}
                className="font-serif"
              />
            </h1>

            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden translate-x-[5px] -translate-y-[4px] font-serif text-[1.6rem] select-none sm:block"
            >
              <ScatterText
                text="把日子过成值得记下的样子"
                direction="cloud"
                seed={9}
                hoverable={false}
                intensity={1.5}
                className="text-dream-200/[0.16]"
              />
            </span>
          </div>

          {/* 左栏 */}
          <div className="sm:order-1 sm:flex sm:flex-1 sm:flex-col sm:justify-center sm:pt-1">
            <TodayLine />

            <figure
              className="dream-quote develop mt-10 w-fit max-w-[34rem]"
              style={{ animationDelay: '320ms' }}
            >
              <blockquote className="text-ink-2 font-serif text-[clamp(1.02rem,2.2vw,1.32rem)] leading-[2] text-balance">
                {quoteBefore}
                <span className="text-dream-300">{emphasis}</span>
                {quoteAfter}
              </blockquote>
              <figcaption
                className="ghost text-ink-3 mt-4 block w-full text-right font-mono text-[10.5px] tracking-[0.16em]"
                data-ghost={`—— ${author}`}
              >
                —— {author}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* 入口：四行参差的碎片，指到哪一行，其余就退开 */}
      {/* 入口：四行参差的碎片，滚动时各走各的速度 */}
      <nav className="entries -mt-2" aria-label="站点入口">
        {entries.map((e) => (
          <Drift key={e.href} speed={e.speed} className="will-change-transform">
            <Link href={e.href} className={`entry block pb-5 ${e.pad} ${e.gap}`}>
              <span
                className={`ghost inline-block font-serif tracking-[0.14em] ${e.size}`}
                data-ghost={e.title}
              >
                {e.title}
              </span>
              <span className="text-ink-2 mt-1.5 block max-w-[26rem] text-[12.5px] leading-[1.95] tracking-[0.02em]">
                {e.desc}
              </span>
            </Link>
          </Drift>
        ))}
      </nav>

      <section className="mt-16" aria-label="最近的记录">
        <div className="flex items-baseline justify-between py-4">
          <p className="eyebrow">最近记下</p>
          <Link
            href="/life"
            className="text-ink-3 hover:text-dream-300 text-[12px] tracking-[0.08em] transition-colors duration-500"
          >
            全部 →
          </Link>
        </div>

        {latest.length ? (
          <ul>
            {latest.map((item) => (
              <li key={item.slug}>
                <Link href={`/life/${item.slug}`} className="group flex items-baseline gap-5 py-5">
                  <span className="text-ink-3 w-11 shrink-0 font-mono text-[11px] tracking-[0.08em]">
                    {shortDate(item.date)}
                  </span>
                  <span className="group-hover:text-dream-300 min-w-0 flex-1 truncate font-serif text-[15.5px] transition-colors duration-500">
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
          <p className="text-ink-3 py-10 text-[12px] tracking-[0.08em]">还没有记录 —— 从今天开始</p>
        )}
      </section>
    </SectionContainer>
  )
}
