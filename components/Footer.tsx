import Link from './Link'
import FooterEgg, { type Memory } from './FooterEgg'
import StudioLink from './StudioLink'
import siteMetadata from '@/data/siteMetadata'
import { allLives } from 'contentlayer/generated'
import type { LifeEntry } from '@/lib/life'

export default function Footer() {
  const memories: Memory[] = (allLives as unknown as LifeEntry[]).map(
    ({ slug, title, date, summary, mood, place }) => ({ slug, title, date, summary, mood, place })
  )

  return (
    <footer className="mx-auto w-full max-w-5xl px-6">
      <div className="hairline mt-24 flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink-3 text-[12px] tracking-[0.06em]">
          {`© ${new Date().getFullYear()} ${siteMetadata.author}`}
          <span className="mx-2 opacity-40">/</span>
          {siteMetadata.tagline}
        </p>
        <div className="text-ink-3 flex items-center gap-4 text-[12px] tracking-[0.06em]">
          <StudioLink />
          <Link href="/about" className="hover:text-ink transition-colors">
            关于
          </Link>
          <span className="opacity-40">·</span>
          <FooterEgg memories={memories} />
        </div>
      </div>
    </footer>
  )
}
