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
 * 把 public/photos 里的图片当作相册内容源：
 * 文件名以 YYYY-MM-DD 开头即视为拍摄日期，说明文字从 data/photos.json 里按文件名取。
 * 尺寸在构建时读出来，避免瀑布流图片加载时跳动。
 */
export function getPhotos(): Photo[] {
  if (!fs.existsSync(PHOTO_DIR)) return []
  const meta = readMeta()

  return fs
    .readdirSync(PHOTO_DIR)
    .filter((file) => /\.(jpe?g|png|webp|avif)$/i.test(file))
    .map((file) => {
      const slug = file.replace(/\.[^.]+$/, '')
      const dim = imageSize(fs.readFileSync(path.join(PHOTO_DIR, file)))
      // 工作台以完整文件名（含扩展名）作 key 存 meta，这里优先按文件名取，slug 兜底
      const m = meta[file] ?? meta[slug] ?? {}
      const dateMatch = slug.match(/^(\d{4}-\d{2}-\d{2})/)
      return {
        slug,
        src: `/photos/${file}`,
        width: dim.width || 1,
        height: dim.height || 1,
        date: dateMatch ? dateMatch[1] : '1970-01-01',
        caption: m.caption,
        place: m.place,
        tags: m.tags ?? [],
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}
