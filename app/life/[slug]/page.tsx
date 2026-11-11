import 'css/prism.css'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from '@/components/Link'
import SectionContainer from '@/components/SectionContainer'
import LockGate from '@/components/LockGate'
import DreamNavTitle from '@/components/DreamNavTitle'
import Interactions from '@/components/Interactions'
import { components } from '@/components/MDXComponents'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { allLives } from 'contentlayer/generated'
import { sortByDateDesc, longDateTime, MOOD_TONE, KIND_LABEL, type LifeEntry } from '@/lib/life'

type LifeDoc = LifeEntry & { body: { code: string }; toc: unknown }

function getDoc(slug: string) {
  return (allLives as unknown as LifeDoc[]).find((p) => p.slug === slug)
}

export async function generateStaticParams() {
  return (allLives as unknown as LifeEntry[]).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata | undefined> {
  const { slug } = await props.params
  const post = getDoc(decodeURI(slug))
  if (!post) return
  const title = post.locked ? '朦胧的梦' : post.title
  const description = post.locked ? '一个被梦之钥守护的梦' : post.summary
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: new Date(post.date.replace(' ', 'T')).toISOString(),
    },
  }
}

const Meta = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null
  return (
    <span className="text-ink-3 inline-flex items-baseline gap-1.5 text-[12px] tracking-[0.04em]">
      <span className="text-[10.5px] tracking-[0.2em] opacity-70">{label}</span>
      <span className="text-ink-2">{value}</span>
    </span>
  )
}

export default async function LifePost(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const post = getDoc(decodeURI(slug))
  if (!post) return notFound()

  const sorted = sortByDateDesc(allLives as unknown as LifeEntry[])
  const idx = sorted.findIndex((p) => p.slug === post.slug)
  const prev = sorted[idx + 1]
  const next = sorted[idx - 1]
  const tone = (post.mood && MOOD_TONE[post.mood]) || 'var(--color-ink-3)'
  const locked = post.locked === true

  const content = (
    <>
      <h1 className="mt-6 text-[clamp(1.8rem,4.4vw,2.6rem)] leading-[1.35] font-normal tracking-[0.01em]">
        {post.title}
      </h1>

      <div className="hairline mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
        <Meta label="心情" value={post.mood} />
        <Meta label="天气" value={post.weather} />
        <Meta label="地点" value={post.place} />
      </div>

      <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none leading-[2.05]">
        <MDXLayoutRenderer code={(post as LifeDoc).body.code} components={components} />
      </div>

      {post.tags?.length ? (
        <div className="mt-12 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span
              key={t}
              className="border-line text-ink-3 rounded-full border px-3 py-1 text-[11.5px] tracking-[0.06em]"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </>
  )

  return (
    <SectionContainer>
      <article className="mx-auto max-w-2xl pt-12 sm:pt-16">
        <Link
          href="/life"
          className="text-ink-3 hover:text-ink mb-10 inline-flex items-center gap-2 text-[12px] tracking-[0.1em] transition-colors"
        >
          <span aria-hidden>←</span> 生活流
        </Link>

        <div className="text-ink-3 flex items-center gap-3 text-[11.5px] tracking-[0.14em]">
          <span className="font-mono">{longDateTime(post.date)}</span>
          {!locked ? (
            <span
              className="inline-block h-[5px] w-[5px] rounded-full"
              style={{ background: tone }}
            />
          ) : null}
          <span>{KIND_LABEL[post.kind ?? 'entry'] ?? '记录'}</span>
        </div>

        {locked ? <LockGate>{content}</LockGate> : content}

        <Interactions targetType="diary" targetId={post.slug} />

        <nav className="hairline mt-16 grid gap-px sm:grid-cols-2">
          {prev ? (
            <Link href={`/life/${prev.slug}`} className="group py-6">
              <div className="text-ink-3 text-[11px] tracking-[0.2em]">更早</div>
              <div className="group-hover:text-dream-500 mt-2 font-serif text-[15px] transition-colors">
                <DreamNavTitle title={prev.title} locked={prev.locked} />
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link href={`/life/${next.slug}`} className="group py-6 sm:text-right">
              <div className="text-ink-3 text-[11px] tracking-[0.2em]">更新</div>
              <div className="group-hover:text-dream-500 mt-2 font-serif text-[15px] transition-colors">
                <DreamNavTitle title={next.title} locked={next.locked} />
              </div>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </article>
    </SectionContainer>
  )
}
