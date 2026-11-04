import type { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'
import PhotoWall from '@/components/PhotoWall'
import { getPhotos } from '@/lib/photos'
import { partsOf } from '@/lib/life'

export const metadata: Metadata = {
  title: '相册',
}

export default function PhotosPage() {
  const photos = getPhotos()
  const years = new Set(photos.map((p) => partsOf(p.date).year))

  return (
    <PageHeader
      eyebrow="GALLERY"
      title="相册"
      desc="被留下来的光。没有主题，只有当时想按快门的那一刻。"
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
