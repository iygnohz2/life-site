import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

export const ROOT = process.cwd()
const LIFE_DIR = path.join(ROOT, 'data', 'life')
const PHOTO_DIR = path.join(ROOT, 'public', 'photos')
const SITE_DATA = path.join(ROOT, 'site-data')
const BACKUP_DIR = path.join(ROOT, '.studio-backup')

/** 只允许这三个目录被写，防止手滑改到源码 */
const WRITABLE = [LIFE_DIR, PHOTO_DIR, SITE_DATA]

export class StudioError extends Error {}

function assertWritable(target: string) {
  const resolved = path.resolve(target)
  const ok = WRITABLE.some((dir) => resolved.startsWith(dir + path.sep) || resolved === dir)
  if (!ok) throw new StudioError(`拒绝写入：${resolved} 不在允许范围内`)
  return resolved
}

/** 写入前把原文件快照一份，按时间戳分目录 */
function backup(file: string) {
  if (!fs.existsSync(file)) return
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  const rel = path.relative(ROOT, file)
  const dest = path.join(BACKUP_DIR, stamp, rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(file, dest)
}

function writeSafe(file: string, content: string | Buffer) {
  const target = assertWritable(file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  backup(target)
  fs.writeFileSync(target, content)
  return target
}

// ---------- 日记 ----------

export type Post = {
  slug: string
  title: string
  date: string
  summary?: string
  mood?: string
  weather?: string
  place?: string
  tags: string[]
  draft?: boolean
  kind?: string
}

export function listPosts(): Post[] {
  if (!fs.existsSync(LIFE_DIR)) return []
  return fs
    .readdirSync(LIFE_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(LIFE_DIR, f), 'utf8')
      const { data } = matter(raw)
      return {
        slug: f.replace(/\.mdx$/, ''),
        title: data.title ?? '(无标题)',
        date: toDateString(data.date),
        summary: data.summary ?? '',
        mood: data.mood ?? '',
        weather: data.weather ?? '',
        place: data.place ?? '',
        tags: data.tags ?? [],
        draft: data.draft === true,
        kind: data.kind ?? '',
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function readPost(slug: string) {
  const file = path.join(LIFE_DIR, `${safeSlug(slug)}.mdx`)
  if (!fs.existsSync(file)) throw new StudioError(`找不到 ${slug}`)
  const { data, content } = matter(fs.readFileSync(file, 'utf8'))
  return {
    slug,
    frontmatter: { ...data, date: toDateString(data.date), tags: data.tags ?? [] },
    body: content.trim(),
  }
}

export function savePost(input: {
  slug?: string
  title: string
  date: string
  summary?: string
  mood?: string
  weather?: string
  place?: string
  tags?: string[]
  draft?: boolean
  body: string
}) {
  const title = (input.title || '').trim()
  if (!title) throw new StudioError('标题不能为空')
  const date = input.date || new Date().toISOString().slice(0, 10)

  const slug = input.slug || uniqueSlug(`${date}-${slugify(title)}`)
  const data: Record<string, unknown> = {
    title,
    date,
    ...(input.mood ? { mood: input.mood } : {}),
    ...(input.weather ? { weather: input.weather } : {}),
    ...(input.place ? { place: input.place } : {}),
    ...(input.summary ? { summary: input.summary } : {}),
    ...(input.tags?.length ? { tags: input.tags } : {}),
    ...(input.draft ? { draft: true } : {}),
  }
  // gray-matter 会把日期写成字符串，去掉引号以与手写文件保持一致
  const out = matter
    .stringify(`\n${input.body || ''}\n`, data)
    .replace(/^date: '(\d{4}-\d{2}-\d{2})'$/m, 'date: $1')
  const file = writeSafe(path.join(LIFE_DIR, `${safeSlug(slug)}.mdx`), out)
  return { slug, file: path.relative(ROOT, file) }
}

export function deletePost(slug: string) {
  const file = path.join(LIFE_DIR, `${safeSlug(slug)}.mdx`)
  if (!fs.existsSync(file)) throw new StudioError(`找不到 ${slug}`)
  backup(file)
  fs.unlinkSync(file)
  return { slug }
}

// ---------- 照片 ----------

export function listPhotos() {
  const metaFile = path.join(SITE_DATA, 'photos.meta.json')
  const meta: Record<string, { caption?: string; place?: string; tags?: string[] }> = fs.existsSync(
    metaFile
  )
    ? JSON.parse(fs.readFileSync(metaFile, 'utf8'))
    : {}

  if (!fs.existsSync(PHOTO_DIR)) return []
  return fs
    .readdirSync(PHOTO_DIR)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .map((f) => {
      const m = f.match(/^(\d{4}-\d{2}-\d{2})/)
      return {
        name: f,
        date: m ? m[1] : '',
        meta: meta[f] ?? {},
      }
    })
    .sort((a, b) => b.name.localeCompare(a.name))
}

export async function savePhoto(fileName: string, buffer: Buffer) {
  const sharp = (await import('sharp')).default
  const clean = fileName.replace(/[^\w.-]/g, '-')
  const target = path.join(PHOTO_DIR, clean)

  // 长边压到 1600，质量 82，保留原扩展名语义（统一转 jpeg，png 保留透明）
  const img = sharp(buffer).rotate()
  const info = await img.metadata()
  const resized = img.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
  const out = info.hasAlpha
    ? await resized.png({ quality: 82 }).toBuffer()
    : await resized.jpeg({ quality: 82 }).toBuffer()
  const finalName = info.hasAlpha
    ? clean.replace(/\.\w+$/, '.png')
    : clean.replace(/\.\w+$/, '.jpg')

  writeSafe(path.join(PHOTO_DIR, finalName), out)
  const meta = await sharp(out).metadata()
  return {
    name: finalName,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    bytes: out.length,
    original: buffer.length,
    replaced: finalName !== clean,
  }
}

export function savePhotoMeta(name: string, patch: { caption?: string; place?: string }) {
  const metaFile = path.join(SITE_DATA, 'photos.meta.json')
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {}
  meta[name] = { ...(meta[name] ?? {}), ...patch }
  writeSafe(metaFile, JSON.stringify(meta, null, 2))
  return meta[name]
}

// ---------- 统计 ----------

export function overview() {
  const posts = listPosts()
  const photos = listPhotos()
  const books = readJson('books.json')?.books ?? []
  const places = readJson('places.json')
  const trips = places?.trips ?? []
  const cities = new Set(posts.map((p) => (p.place || '').split('·')[0].trim()).filter(Boolean))

  return {
    posts: posts.length,
    drafts: posts.filter((p) => p.draft).length,
    photos: photos.length,
    books: books.length,
    trips: trips.length,
    cities: cities.size,
    recent: posts.slice(0, 6),
  }
}

function readJson(name: string) {
  const file = path.join(SITE_DATA, name)
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

// ---------- git ----------

export async function gitStatus() {
  const { stdout } = await run('git', ['status', '--porcelain=v1', '-uno'], { cwd: ROOT })
  const files = stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => ({ status: line.slice(0, 2).trim(), path: line.slice(3) }))

  let ahead = 0
  try {
    const { stdout: ab } = await run('git', ['rev-list', '--count', '@{u}..HEAD'], { cwd: ROOT })
    ahead = Number(ab.trim()) || 0
  } catch {
    ahead = 0
  }

  let branch = 'main'
  try {
    const { stdout: b } = await run('git', ['branch', '--show-current'], { cwd: ROOT })
    branch = b.trim() || 'main'
  } catch {
    // 没有上游分支时忽略
  }

  return { files, ahead, branch }
}

export async function publish(message: string) {
  const status = await gitStatus()
  if (!status.files.length && !status.ahead) {
    return { ok: true, message: '没有需要发布的内容', files: [], pushed: false }
  }

  const msg = (message || '').trim() || `内容更新 ${new Date().toISOString().slice(0, 10)}`

  await run('git', ['add', '-A'], { cwd: ROOT })
  const committed = await run('git', ['commit', '-m', msg], { cwd: ROOT }).catch((e) => {
    throw new StudioError(`提交失败：${errText(e)}`)
  })

  // 先同步远端，避免 push 被拒；冲突就停下来交给人处理
  try {
    await run('git', ['pull', '--rebase', '--autostash'], { cwd: ROOT })
  } catch (e) {
    throw new StudioError(`拉取远端失败（可能有冲突，请手动处理）：${errText(e)}`)
  }

  try {
    await run('git', ['push'], { cwd: ROOT })
  } catch (e) {
    throw new StudioError(`推送失败：${errText(e)}`)
  }

  return {
    ok: true,
    message: '已发布',
    files: status.files,
    pushed: true,
    commit: committed.stdout.split('\n')[0],
  }
}

// ---------- 工具 ----------

function errText(e: unknown) {
  if (e && typeof e === 'object' && 'stderr' in e) {
    const s = (e as { stderr?: unknown }).stderr
    if (typeof s === 'string' && s.trim()) return s.trim()
  }
  return e instanceof Error ? e.message : String(e)
}

function safeSlug(slug: string) {
  if (!/^[\w-]+$/.test(slug)) throw new StudioError('slug 只能包含字母、数字、连字符')
  return slug
}

/** 同一天写多篇时避免互相覆盖 */
function uniqueSlug(base: string) {
  let candidate = base
  let n = 2
  while (fs.existsSync(path.join(LIFE_DIR, `${candidate}.mdx`))) {
    candidate = `${base}-${n}`
    n += 1
  }
  return candidate
}

function slugify(input: string) {
  const map = input
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  // 中文标题无法直接做文件名时，用日期+序号兜底
  return map && /[a-z0-9]/.test(map) ? map.slice(0, 40) : 'entry'
}

function toDateString(value: unknown) {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}
