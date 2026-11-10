/**
 * DreamLand 工作台 —— 独立 Node 服务，跑在 127.0.0.1:4000
 * 与网站（Next）完全解耦：可以单独启动，也能在这里开关网站服务。
 *
 * 启动：npm run studio
 */
import express from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import net from 'node:net'
import { spawn, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import matter from 'gray-matter'

const run = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const LIFE_DIR = path.join(ROOT, 'data', 'life')
const PHOTO_DIR = path.join(ROOT, 'public', 'photos')
const SITE_DATA = path.join(ROOT, 'site-data')
const BACKUP_DIR = path.join(ROOT, '.studio-backup')

const PORT = Number(process.env.STUDIO_PORT || 4000)
const SITE_PORT = Number(process.env.SITE_PORT || 3000)

const app = express()
app.use(express.json({ limit: '2mb' }))
app.use(express.static(path.join(__dirname, 'public')))

// ---------- 通用 ----------

const WRITABLE = [LIFE_DIR, PHOTO_DIR, SITE_DATA]

function assertWritable(target) {
  const resolved = path.resolve(target)
  const ok = WRITABLE.some((dir) => resolved.startsWith(dir + path.sep) || resolved === dir)
  if (!ok) throw new Error(`拒绝写入：${resolved} 不在允许范围内`)
  return resolved
}

function backup(file) {
  if (!fs.existsSync(file)) return
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  const dest = path.join(BACKUP_DIR, stamp, path.relative(ROOT, file))
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(file, dest)
}

function writeSafe(file, content) {
  const target = assertWritable(file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  backup(target)
  fs.writeFileSync(target, content)
  return target
}

const wrap = (fn) => (req, res) => {
  Promise.resolve(fn(req, res))
    .then((data) => res.json({ ok: true, data }))
    .catch((e) => res.status(400).json({ ok: false, error: e?.message || String(e) }))
}

// ---------- 日记 ----------

function toDateString(value) {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function listPosts() {
  if (!fs.existsSync(LIFE_DIR)) return []
  return fs
    .readdirSync(LIFE_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const { data } = matter(fs.readFileSync(path.join(LIFE_DIR, f), 'utf8'))
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
        locked: data.locked === true,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

function readPost(slug) {
  if (!/^[\w-]+$/.test(slug)) throw new Error('slug 不合法')
  const file = path.join(LIFE_DIR, `${slug}.mdx`)
  if (!fs.existsSync(file)) throw new Error(`找不到 ${slug}`)
  const { data, content } = matter(fs.readFileSync(file, 'utf8'))
  return {
    slug,
    frontmatter: { ...data, date: toDateString(data.date), tags: data.tags ?? [] },
    body: content.trim(),
  }
}

function slugify(input) {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s && /[a-z0-9]/.test(s) ? s.slice(0, 40) : 'entry'
}

function uniqueSlug(base) {
  let candidate = base
  let n = 2
  while (fs.existsSync(path.join(LIFE_DIR, `${candidate}.mdx`))) {
    candidate = `${base}-${n}`
    n += 1
  }
  return candidate
}

function savePost(input) {
  const title = (input.title || '').trim()
  if (!title) throw new Error('标题不能为空')
  const date = input.date || new Date().toISOString().slice(0, 10)
  const slug = input.slug || uniqueSlug(`${date}-${slugify(title)}`)

  const data = {
    title,
    date,
    ...(input.mood ? { mood: input.mood } : {}),
    ...(input.weather ? { weather: input.weather } : {}),
    ...(input.place ? { place: input.place } : {}),
    ...(input.summary ? { summary: input.summary } : {}),
    ...(input.tags?.length ? { tags: input.tags } : {}),
    ...(input.draft ? { draft: true } : {}),
    ...(input.locked ? { locked: true } : {}),
  }

  const out = matter
    .stringify(`\n${input.body || ''}\n`, data)
    .replace(/^date: '(\d{4}-\d{2}-\d{2})'$/m, 'date: $1')

  const file = writeSafe(path.join(LIFE_DIR, `${slug}.mdx`), out)
  return { slug, file: path.relative(ROOT, file) }
}

// ---------- 照片 ----------

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 40 * 1024 * 1024 } })

function listPhotos() {
  const metaFile = path.join(SITE_DATA, 'photos.meta.json')
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {}
  if (!fs.existsSync(PHOTO_DIR)) return []
  return fs
    .readdirSync(PHOTO_DIR)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .map((f) => ({ name: f, meta: meta[f] ?? {} }))
    .sort((a, b) => b.name.localeCompare(a.name))
}

/** 生成安全的文件名：保留中英文数字，全中文原名时补日期前缀，避免一堆横线 */
function safePhotoName(original, ext) {
  const raw = String(original).replace(/\.\w+$/, '')
  let base = raw
    .replace(/[^\w\u4e00-\u9fa5.-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')

  const date = new Date().toISOString().slice(0, 10)
  if (!base || base.replace(/-/g, '').length < 2) {
    const stamp = new Date().toTimeString().slice(0, 8).replace(/:/g, '')
    base = `${date}-${stamp}`
  } else if (!/^\d{4}-\d{2}-\d{2}/.test(base)) {
    base = `${date}-${base}`
  }
  return `${base}.${ext}`
}

async function savePhoto(fileName, buffer) {
  const { default: sharp } = await import('sharp')
  const img = sharp(buffer).rotate()
  const info = await img.metadata()
  const resized = img.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
  const out = info.hasAlpha
    ? await resized.png({ quality: 82 }).toBuffer()
    : await resized.jpeg({ quality: 82 }).toBuffer()
  const ext = info.hasAlpha ? 'png' : 'jpg'
  const finalName = safePhotoName(fileName, ext)

  writeSafe(path.join(PHOTO_DIR, finalName), out)
  const meta = await sharp(out).metadata()
  return {
    name: finalName,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    bytes: out.length,
    original: buffer.length,
  }
}

/** 删除照片：同时清理对应的 meta 记录 */
function deletePhoto(name) {
  if (!/^[\w\u4e00-\u9fa5.-]+$/.test(name) || name.includes('..')) {
    throw new Error('文件名不合法')
  }
  const file = path.join(PHOTO_DIR, name)
  if (!fs.existsSync(file)) throw new Error('文件不存在')

  // 移到回收站目录，而不是直接删，给你留个反悔余地
  const trashDir = path.join(ROOT, '.studio-backup', 'trash')
  fs.mkdirSync(trashDir, { recursive: true })
  fs.renameSync(file, path.join(trashDir, name))

  // 同步删除 meta 里的记录
  const metaFile = path.join(SITE_DATA, 'photos.meta.json')
  if (fs.existsSync(metaFile)) {
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'))
    if (meta[name]) {
      delete meta[name]
      writeSafe(metaFile, JSON.stringify(meta, null, 2))
    }
  }
  return { name }
}

function savePhotoMeta(name, patch) {
  const metaFile = path.join(SITE_DATA, 'photos.meta.json')
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {}
  meta[name] = { ...(meta[name] ?? {}), ...patch }
  writeSafe(metaFile, JSON.stringify(meta, null, 2))
  return meta[name]
}

// ---------- 书架 / 行程 ----------

const BOOK_STATUS = ['reading', 'done', 'wish']

function readBooks() {
  const data = readJsonRaw('books.json')
  return Array.isArray(data?.books) ? data.books : []
}

function writeBooks(books) {
  const clean = books
    .filter((b) => (b.title || '').trim())
    .map((b) => ({
      title: String(b.title).trim(),
      author: String(b.author || '').trim(),
      status: BOOK_STATUS.includes(b.status) ? b.status : 'wish',
      ...(b.rating ? { rating: Number(b.rating) } : {}),
      ...(b.progress !== undefined && b.progress !== '' && b.status === 'reading'
        ? { progress: Number(b.progress) }
        : {}),
      ...(b.date ? { date: String(b.date) } : {}),
      ...((b.note || '').trim() ? { note: String(b.note).trim() } : {}),
      ...(Array.isArray(b.tags) && b.tags.length ? { tags: b.tags } : {}),
    }))
  writeSafe(path.join(SITE_DATA, 'books.json'), JSON.stringify({ books: clean }, null, 2))
  return clean
}

function readPlaces() {
  const data = readJsonRaw('places.json') ?? {}
  return { cities: data.cities ?? {}, trips: Array.isArray(data.trips) ? data.trips : [] }
}

function writeTrips(trips) {
  const data = readJsonRaw('places.json') ?? {}
  const clean = trips
    .filter((t) => t.city && t.date)
    .map((t) => ({
      city: String(t.city),
      date: String(t.date),
      ...(t.note ? { note: String(t.note) } : {}),
    }))
  data.trips = clean
  writeSafe(path.join(SITE_DATA, 'places.json'), JSON.stringify(data, null, 2))
  return clean
}

// ---------- 统计 ----------

function readJsonRaw(name) {
  const file = path.join(SITE_DATA, name)
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

// ---------- 梦之钥 ----------

function readDreamKey() {
  const data = readJsonRaw('dream-key.json') ?? {}
  return typeof data.hash === 'string' ? data.hash : ''
}

function setDreamKey(password) {
  const pwd = String(password || '').trim()
  if (!pwd) throw new Error('梦之钥不能为空')
  if (pwd.length < 4) throw new Error('梦之钥至少 4 位')
  const hash = createHash('sha256').update(pwd, 'utf8').digest('hex')
  writeSafe(path.join(SITE_DATA, 'dream-key.json'), JSON.stringify({ hash }, null, 2) + '\n')
  return { changed: true }
}

function readJson(name) {
  const file = path.join(SITE_DATA, name)
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function overview() {
  const posts = listPosts()
  const photos = listPhotos()
  const books = readJson('books.json')?.books ?? []
  const places = readJson('places.json')
  return {
    posts: posts.length,
    drafts: posts.filter((p) => p.draft).length,
    photos: photos.length,
    books: books.length,
    trips: places?.trips?.length ?? 0,
    cities: new Set(posts.map((p) => (p.place || '').split('·')[0].trim()).filter(Boolean)).size,
    recent: posts.slice(0, 6),
  }
}

// ---------- git ----------

async function gitStatus() {
  const { stdout } = await run('git', ['status', '--porcelain=v1', '-uno'], { cwd: ROOT })
  const files = stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => ({ status: line.slice(0, 2).trim(), path: line.slice(3) }))

  let ahead = 0
  try {
    const { stdout: n } = await run('git', ['rev-list', '--count', '@{u}..HEAD'], { cwd: ROOT })
    ahead = Number(n.trim()) || 0
  } catch {
    /* 没有上游分支 */
  }

  let branch = 'main'
  try {
    const { stdout: b } = await run('git', ['branch', '--show-current'], { cwd: ROOT })
    branch = b.trim() || 'main'
  } catch {
    /* ignore */
  }

  return { files, ahead, branch }
}

const errorText = (e) => {
  if (e && typeof e === 'object' && typeof e.stderr === 'string' && e.stderr.trim()) {
    return e.stderr.trim()
  }
  return e instanceof Error ? e.message : String(e)
}

// 判断是否“连不上 GitHub”这类网络错误（区别于真正的代码冲突 / 权限问题）
const NETWORK_ERROR_RE =
  /(unable to access|Connection was reset|Connection reset|Recv failure|tunnel failed|schannel|close_notify|Could not resolve host|Failed to connect|timed out|timeout|Operation timed out|early EOF|RPC failed|502 Bad Gateway|Empty reply)/i

function isNetworkError(e) {
  return NETWORK_ERROR_RE.test(errorText(e))
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 网络抖动很常见（尤其国内访问 GitHub），对 pull / push 各自自动重试 3 次
async function gitWithRetry(args, tries = 3) {
  let lastErr
  for (let i = 0; i < tries; i++) {
    try {
      await run('git', args, { cwd: ROOT })
      return
    } catch (e) {
      lastErr = e
      if (!isNetworkError(e)) throw e // 真冲突 / 权限问题，不重试
      if (i < tries - 1) await sleep(1200 * (i + 1))
    }
  }
  throw lastErr
}

async function publish(message) {
  const status = await gitStatus()
  if (!status.files.length && !status.ahead) {
    return { message: '没有需要发布的内容', files: [], pushed: false }
  }
  const msg = (message || '').trim() || `内容更新 ${new Date().toISOString().slice(0, 10)}`

  // 只有存在文件改动时才提交；若只是“有未推送的提交”，直接进入 pull + push
  if (status.files.length) {
    await run('git', ['add', '-A'], { cwd: ROOT })
    try {
      await run('git', ['commit', '-m', msg], { cwd: ROOT })
    } catch (e) {
      if (/nothing to commit/i.test(errorText(e))) {
        // 状态检查与提交之间的竞态：没有可提交内容，忽略即可
      } else {
        throw new Error(`提交失败：${errorText(e)}`)
      }
    }
  }
  try {
    await gitWithRetry(['pull', '--rebase', '--autostash'])
  } catch (e) {
    if (isNetworkError(e)) {
      throw new Error(
        `连不上 GitHub（网络被重置或超时），改动已安全保存在本机、不会丢失。\n请稍后重试“发布”，或换网络 / 挂代理后再试。\n\n原始信息：${errorText(e)}`
      )
    }
    throw new Error(`拉取远端失败（代码有冲突，请手动处理）：${errorText(e)}`)
  }
  try {
    await gitWithRetry(['push'])
  } catch (e) {
    if (isNetworkError(e)) {
      throw new Error(
        `推送失败：连不上 GitHub（网络被重置或超时）。改动已保存在本机，请稍后重试“发布”。\n\n原始信息：${errorText(e)}`
      )
    }
    throw new Error(`推送失败：${errorText(e)}`)
  }
  return { message: '已发布，Vercel 会自动开始构建', files: status.files, pushed: true }
}

// ---------- 网站进程 ----------

let site = { child: null, mode: null, startedAt: null, logTail: [] }

function pushLog(chunk) {
  const text = String(chunk)
  site.logTail.push(text)
  if (site.logTail.length > 60) site.logTail.shift()
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port }, () => {
      socket.destroy()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
    socket.setTimeout(800, () => {
      socket.destroy()
      resolve(false)
    })
  })
}

async function pidOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await run('netstat', ['-ano'])
      const line = stdout
        .split('\n')
        .find((l) => l.includes(`:${port} `) && l.includes('LISTENING'))
      if (!line) return null
      const pid = Number(line.trim().split(/\s+/).pop())
      return Number.isFinite(pid) ? pid : null
    }
    const { stdout } = await run('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'])
    const pid = Number(stdout.trim().split('\n')[0])
    return Number.isFinite(pid) ? pid : null
  } catch {
    return null
  }
}

async function siteState() {
  const isRunning = site.child !== null
  const portBusy = await portOpen(SITE_PORT)
  return {
    running: isRunning || portBusy,
    managed: isRunning,
    external: !isRunning && portBusy,
    mode: site.mode,
    port: SITE_PORT,
    url: `http://localhost:${SITE_PORT}`,
    pid: site.child?.pid ?? (await pidOnPort(SITE_PORT)),
    startedAt: site.startedAt,
    log: site.logTail.join('').split('\n').filter(Boolean).slice(-14),
  }
}

async function startSite() {
  if (site.child) throw new Error('网站已经在运行了')
  const busy = await pidOnPort(SITE_PORT)
  if (busy) throw new Error(`端口 ${SITE_PORT} 已被进程 ${busy} 占用，请先结束它`)

  const child = spawn(
    process.execPath,
    [path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', '-p', String(SITE_PORT)],
    { cwd: ROOT, env: { ...process.env, NODE_NO_WARNINGS: '1' }, windowsHide: true }
  )

  site = { child, mode: 'dev', startedAt: new Date().toISOString(), logTail: [] }
  child.stdout.on('data', pushLog)
  child.stderr.on('data', pushLog)
  child.on('exit', () => {
    site.child = null
    site.mode = null
  })

  return siteState()
}

async function stopSite(force = false) {
  if (!site.child) {
    const busy = await pidOnPort(SITE_PORT)
    if (!busy) return siteState()
    if (!force) {
      throw new Error(`端口 ${SITE_PORT} 被进程 ${busy} 占用（不是工作台启动的），可点「强制结束」`)
    }
    if (process.platform === 'win32') {
      await run('taskkill', ['/PID', String(busy), '/T', '/F']).catch(() => {})
    } else {
      await run('kill', ['-9', String(busy)]).catch(() => {})
    }
    await new Promise((r) => setTimeout(r, 600))
    return siteState()
  }

  const pid = site.child.pid
  if (process.platform === 'win32') {
    await run('taskkill', ['/PID', String(pid), '/T', '/F']).catch(() => {})
  } else {
    site.child.kill('SIGTERM')
  }
  site.child = null
  site.mode = null
  await new Promise((r) => setTimeout(r, 600))
  return siteState()
}

// ---------- 路由 ----------

app.get('/api/state', wrap(async () => ({ site: await siteState(), overview: overview() })))
app.get('/api/overview', wrap(() => overview()))

app.get('/api/posts', (req, res, next) => {
  const slug = req.query.slug
  wrap(() => (slug ? readPost(String(slug)) : listPosts()))(req, res, next)
})

app.post('/api/posts', wrap((req) => savePost(req.body)))

app.delete('/api/posts', (req, res, next) => {
  const slug = String(req.query.slug || '')
  wrap(() => {
    if (!/^[\w-]+$/.test(slug)) throw new Error('slug 不合法')
    const file = path.join(LIFE_DIR, `${slug}.mdx`)
    if (!fs.existsSync(file)) throw new Error('找不到这条记录')
    backup(file)
    fs.unlinkSync(file)
    return { slug }
  })(req, res, next)
})

app.get('/api/photos', wrap(() => listPhotos()))

app.post('/api/photos', upload.single('file'), (req, res, next) => {
  wrap(async () => {
    if (!req.file) throw new Error('没有收到文件')
    return savePhoto(req.file.originalname, req.file.buffer)
  })(req, res, next)
})

app.patch('/api/photos', wrap((req) => savePhotoMeta(req.body.name, {
  caption: req.body.caption,
  place: req.body.place,
})))

app.delete('/api/photos', (req, res, next) => {
  const name = String(req.query.name || '')
  wrap(() => deletePhoto(name))(req, res, next)
})

app.get('/api/books', wrap(() => readBooks()))
app.post('/api/books', wrap((req) => writeBooks(req.body?.books ?? [])))

app.get('/api/places', wrap(() => readPlaces()))
app.post('/api/places', wrap((req) => writeTrips(req.body?.trips ?? [])))

app.get('/api/dream-key', wrap(() => ({ configured: Boolean(readDreamKey()) })))
app.post('/api/dream-key', wrap((req) => setDreamKey(req.body?.password)))

app.get('/api/git', wrap(() => gitStatus()))
app.post('/api/git', wrap((req) => publish(req.body?.message)))

app.get('/api/site', wrap(() => siteState()))
app.post('/api/site/start', wrap(() => startSite()))
app.post('/api/site/stop', wrap((req) => stopSite(req.body?.force === true)))

// 只监听本机，局域网也访问不到
app.listen(PORT, '127.0.0.1', () => {
  console.log('')
  console.log('  工作台已启动  →  http://localhost:' + PORT)
  console.log('  网站端口      →  ' + SITE_PORT + '（在上方面板里开关）')
  console.log('')
})
