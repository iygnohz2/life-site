import type { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'
import PhotoWall from '@/components/PhotoWall'
import { getPhotosByRefs } from '@/lib/photos'
import { partsOf, type LifeEntry } from '@/lib/life'
import { allLives } from 'contentlayer/generated'

export const metadata: Metadata = {
  title: '相册',
}

export default function PhotosPage() {
  const refs = (allLives as unknown as LifeEntry[])
    .filter((p) => process.env.NODE_ENV !== 'production' || p.draft !== true)
    .flatMap((p) => p.photos ?? [])
  const photos = getPhotosByRefs(refs)
  const years = new Set(photos.map((p) => partsOf(p.date).year))

  return (
    <PageHeader
      eyebrow="GALLERY"
      title="相册"
      desc="从生活流里收集来的光。日记里附上的照片，都会自动汇聚到这里。"
    >
      <div className="hairline mb-6 flex items-baseline justify-between py-4">
        <p className="text-ink-3 text-[11.5px] tracking-[0.14em]">
          {photos.length} 张照片
          {years.size ? ` · ${[...years].sort((a, b) => b - a).join(' / ')}` : ''}
        </p>
        <p className="text-ink-3 hidden text-[11.5px] tracking-[0.06em] sm:block">
          点开可以放大 · 方向键翻看 · 可按年份或标签筛
        </p>
      </div>

      <PhotoWall photos={photos} />
    </PageHeader>
  )
}
