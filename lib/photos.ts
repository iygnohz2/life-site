import fs from 'node:fs'
import path from 'node:path'
import { imageSize } from 'image-size'

export type Photo = {
  slug: string
  src: string
  width: number
  height: number
  date: string
  caption?: string
  place?: string
  tags: string[]
}

type Meta = { caption?: string; place?: string; tags?: string[] }

const PHOTO_DIR = path.join(process.cwd(), 'public', 'photos')
const META_FILE = path.join(process.cwd(), 'site-data', 'photos.meta.json')

function readMeta(): Record<string, Meta> {
  if (!fs.existsSync(META_FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(META_FILE, 'utf8'))
  } catch {
    return {}
  }
}

/**
 * 按日记里引用的文件名组装相册照片。
 * 相册不再单独扫描 public/photos 目录，而是把「所有日记 photos 字段里出现的照片」收进来，
 * 说明文字/地点从 photos.meta.json 按文件名取，尺寸在构建时读出来避免瀑布流跳动。
 */
export function getPhotosByRefs(refs: string[]): Photo[] {
  if (!fs.existsSync(PHOTO_DIR)) return []
  const meta = readMeta()
  const seen = new Set<string>()

  return refs
    .filter((ref) => typeof ref === 'string' && ref.trim())
    .map((ref) => ref.trim())
    .filter((ref) => {
      if (seen.has(ref)) return false // 多篇日记可能引用同一张照片，去重
      seen.add(ref)
      return true
    })
    .filter((ref) => /\.(jpe?g|png|webp|avif)$/i.test(ref))
    .flatMap((ref): Photo[] => {
      const file = path.join(PHOTO_DIR, ref)
      if (!fs.existsSync(file)) return []
      const slug = ref.replace(/\.[^.]+$/, '')
      let width = 1
      let height = 1
      try {
        const dim = imageSize(fs.readFileSync(file))
        width = dim.width || 1
        height = dim.height || 1
      } catch {
        // 读不到尺寸就保留 1:1，避免整页崩
      }
      // meta 以完整文件名作 key，slug 兜底
      const m = meta[ref] ?? meta[slug] ?? {}
      const dateMatch = slug.match(/^(\d{4}-\d{2}-\d{2})/)
      return [
        {
          slug,
          src: `/photos/${ref}`,
          width,
          height,
          date: dateMatch ? dateMatch[1] : '1970-01-01',
          caption: m.caption,
          place: m.place,
          tags: m.tags ?? [],
        },
      ]
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}
