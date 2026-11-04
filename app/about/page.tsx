import type { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'
import siteMetadata from '@/data/siteMetadata'

export const metadata: Metadata = {
  title: '关于',
}

const facts = [
  { label: '现在', value: '在苏州生活和工作' },
  { label: '喜欢', value: '走路、拍照、把普通的一天记下来' },
  { label: '不擅长', value: '坚持写日记 —— 所以有了这个站点' },
]

export default function AboutPage() {
  return (
    <PageHeader
      eyebrow="ABOUT"
      title="关于这个站点"
      desc="不是作品集，不是简历。只是一块自己的地方，用来放那些不想忘掉的小事。"
    >
      <div className="hairline max-w-2xl">
        {facts.map((f) => (
          <div key={f.label} className="border-line/70 flex gap-6 border-b py-5">
            <span className="text-ink-3 w-16 shrink-0 text-[11px] tracking-[0.24em]">
              {f.label}
            </span>
            <span className="text-ink-2 text-[13.5px] leading-[1.9]">{f.value}</span>
          </div>
        ))}
      </div>

      <div className="prose prose-neutral dark:prose-invert mt-10 max-w-2xl leading-[2]">
        <p>
          这个站点是手写的，没有后台，没有算法推荐。每写一条记录，就是在
          <code>data/life</code> 里加一个 Markdown 文件。
        </p>
        <p>慢一点，少一点，但留下来的都是真的。</p>
      </div>

      {siteMetadata.email ? (
        <p className="text-ink-3 mt-8 text-[12.5px] tracking-[0.06em]">
          想聊天可以写信：{siteMetadata.email}
        </p>
      ) : null}
    </PageHeader>
  )
}
