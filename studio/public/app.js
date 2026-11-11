const $ = (id) => document.getElementById(id)

async function api(url, init) {
  const res = await fetch(url, { cache: 'no-store', ...init })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || `请求失败 ${res.status}`)
  return json.data
}

/* ---------- tab ---------- */

const panels = ['overview', 'write', 'photos', 'books', 'places', 'publish']

$('nav').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]')
  if (!btn) return
  const tab = btn.dataset.tab
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('active', b === btn))
  panels.forEach((p) => $(`panel-${p}`).classList.toggle('active', p === tab))
  if (tab === 'overview') loadOverview()
  if (tab === 'write') loadPosts()
  if (tab === 'photos') loadPhotos()
  if (tab === 'books') loadBooks()
  if (tab === 'places') loadPlaces()
  if (tab === 'publish') loadGit()
})

/* ---------- 网站开关 ---------- */

let siteBusy = false

async function loadSite() {
  try {
    const s = await api('/api/site')
    renderSite(s)
    return s
  } catch (e) {
    $('site-text').textContent = '状态读取失败：' + e.message
    return null
  }
}

function renderSite(s) {
  const dot = $('site-dot')
  const text = $('site-text')
  const toggle = $('site-toggle')
  const open = $('site-open')

  dot.classList.toggle('on', s.running)

  if (s.running) {
    text.textContent = s.managed
      ? `网站运行中 · localhost:${s.port}`
      : `端口 ${s.port} 被进程 ${s.pid ?? '未知'} 占用（不是工作台启动的）`
    toggle.textContent = s.managed ? '停止网站' : '强制结束占用'
    toggle.disabled = siteBusy
    open.style.display = ''
    $('site-link-wrap').innerHTML = `<a href="${s.url}" target="_blank" style="color: var(--dream); text-decoration: none">打开网站 ↗</a>`
  } else {
    text.textContent = '网站已停止'
    toggle.textContent = siteBusy ? '启动中…' : '启动网站'
    toggle.disabled = siteBusy
    open.style.display = 'none'
    $('site-link-wrap').textContent = '网站未运行'
  }

  if (s.log && s.log.length) {
    $('site-log').textContent = s.log.join('\n')
  }
}

$('site-toggle').addEventListener('click', async () => {
  if (siteBusy) return
  siteBusy = true
  try {
    const s = await api('/api/site')
    const next = s.running
      ? api('/api/site/stop', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ force: !s.managed }),
        })
      : api('/api/site/start', { method: 'POST' })
    renderSite(await next)
  } catch (e) {
    $('site-text').textContent = e.message
  } finally {
    siteBusy = false
    setTimeout(loadSite, 1200)
  }
})

$('site-open').addEventListener('click', () => window.open(`http://localhost:${window.__sitePort || 3000}`, '_blank'))

/* ---------- 概览 ---------- */

async function loadOverview() {
  try {
    const d = await api('/api/overview')
    $('stats').innerHTML = [
      ['日记', d.posts, d.drafts ? `含 ${d.drafts} 篇草稿` : ''],
      ['照片', d.photos, ''],
      ['书', d.books, ''],
      ['行程', d.trips, ''],
      ['到过的地方', d.cities, ''],
    ]
      .map(
        ([label, value, note]) =>
          `<div class="stat"><b>${value}</b><span>${label}${
            note ? ' · ' + note : ''
          }</span></div>`
      )
      .join('')

    $('recent').innerHTML = d.recent.length
      ? d.recent
          .map(
            (p) =>
              `<div class="row"><span class="date">${p.date}</span><span class="title">${esc(
                p.title
              )}</span>${p.draft ? '<span class="tag">草稿</span>' : ''}${
                p.mood ? `<span class="date">${esc(p.mood)}</span>` : ''
              }</div>`
          )
          .join('')
      : '<div class="row"><span class="title" style="color: var(--ink-3)">还没有日记</span></div>'
  } catch (e) {
    $('stats').innerHTML = `<div class="hint err">${e.message}</div>`
  }
}

/* ---------- 梦之钥 ---------- */

$('dk-save').addEventListener('click', async () => {
  const hint = $('dk-hint')
  hint.className = 'hint'
  hint.textContent = '更新中…'
  try {
    await api('/api/dream-key', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: $('dk-password').value }),
    })
    $('dk-password').value = ''
    hint.textContent = '梦之钥已更新，记得去「发布」重新上线'
  } catch (e) {
    hint.className = 'hint err'
    hint.textContent = e.message
  }
})

/* ---------- 写日记 ---------- */

let currentSlug = ''

async function loadPosts() {
  const posts = await api('/api/posts')
  const picker = $('post-picker')
  picker.innerHTML =
    '<option value="">＋ 新建</option>' +
    posts
      .map((p) => `<option value="${p.slug}">${p.date} ${esc(p.title)}</option>`)
      .join('')
  picker.value = currentSlug
}

$('post-picker').addEventListener('change', async (e) => {
  const slug = e.target.value
  currentSlug = slug
  if (!slug) {
    $('f-title').value = ''
    $('f-date').value = new Date().toISOString().slice(0, 10)
    $('f-time').value = nowTime()
    $('f-body').value = ''
    $('f-mood').value = ''
    $('f-weather').value = ''
    $('f-place').value = ''
    $('f-tags').value = ''
    $('f-summary').value = ''
    $('f-lock').value = ''
    renderPreview()
    return
  }
  const post = await api('/api/posts?slug=' + encodeURIComponent(slug))
  const fm = post.frontmatter
  const dt = splitDateTime(fm.date)
  $('f-title').value = fm.title || ''
  $('f-date').value = dt.date
  $('f-time').value = dt.time
  $('f-mood').value = fm.mood || ''
  $('f-weather').value = fm.weather || ''
  $('f-place').value = fm.place || ''
  $('f-tags').value = (fm.tags || []).join(', ')
  $('f-summary').value = fm.summary || ''
  $('f-lock').value = fm.locked ? 'locked' : ''
  $('f-body').value = post.body || ''
  renderPreview()
})

async function savePost(draft) {
  const hint = $('write-hint')
  hint.className = 'hint'
  hint.textContent = '保存中…'
  try {
    const body = $('f-body').value
    const r = await api('/api/posts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: currentSlug || undefined,
        title: $('f-title').value,
        date: $('f-date').value,
        time: $('f-time').value,
        mood: $('f-mood').value,
        weather: $('f-weather').value,
        place: $('f-place').value,
        summary: $('f-summary').value,
        draft,
        locked: $('f-lock').value === 'locked',
        tags: $('f-tags')
          .value.split(/[,，\s]+/)
          .map((t) => t.trim())
          .filter(Boolean),
        body,
      }),
    })
    currentSlug = r.slug
    hint.textContent = `已保存 → ${r.file}`
    loadPosts()
  } catch (e) {
    hint.className = 'hint err'
    hint.textContent = e.message
  }
}

$('save').addEventListener('click', () => savePost(false))
$('save-draft').addEventListener('click', () => savePost(true))

$('f-body').addEventListener('input', renderPreview)

function renderPreview() {
  $('preview').innerHTML =
    markdown($('f-body').value) || '<span style="color: var(--ink-3)">预览会显示在这里</span>'
}

function markdown(src) {
  const inline = (s) =>
    s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')

  return src
    .split(/\n{2,}/)
    .map((block) => {
      const t = block.trim()
      if (!t) return ''
      if (t.startsWith('### ')) return `<h3>${inline(esc(t.slice(4)))}</h3>`
      if (t.startsWith('## ')) return `<h2>${inline(esc(t.slice(3)))}</h2>`
      if (t.startsWith('# ')) return `<h1>${inline(esc(t.slice(2)))}</h1>`
      if (t.startsWith('> ')) return `<blockquote>${inline(esc(t.slice(2)))}</blockquote>`
      if (/^[-*] /m.test(t))
        return `<ul>${t
          .split('\n')
          .map((l) => `<li>${inline(esc(l.replace(/^[-*] /, '')))}</li>`)
          .join('')}</ul>`
      return `<p>${inline(esc(t)).replace(/\n/g, '<br>')}</p>`
    })
    .join('')
}

/* ---------- 照片 ---------- */

const drop = $('drop')
const fileInput = $('file')

drop.addEventListener('click', () => fileInput.click())
drop.addEventListener('dragover', (e) => {
  e.preventDefault()
  drop.classList.add('over')
})
drop.addEventListener('dragleave', () => drop.classList.remove('over'))
drop.addEventListener('drop', (e) => {
  e.preventDefault()
  drop.classList.remove('over')
  uploadFiles(e.dataTransfer.files)
})
fileInput.addEventListener('change', () => uploadFiles(fileInput.files))

async function uploadFiles(files) {
  if (!files || !files.length) return
  $('drop-text').textContent = '压缩上传中…'
  const lines = []
  for (const file of Array.from(files)) {
    const form = new FormData()
    form.append('file', file)
    try {
      const r = await api('/api/photos', { method: 'POST', body: form })
      const saved = ((1 - r.bytes / file.size) * 100).toFixed(0)
      lines.push(`${r.name} · ${r.width}×${r.height} · ${(r.bytes / 1024).toFixed(0)}KB（省 ${saved}%）`)
    } catch (e) {
      lines.push(`${file.name} 失败：${e.message}`)
    }
  }
  $('drop-text').textContent = '把照片拖到这里，或点击选择'
  $('upload-log').innerHTML = lines.map((l) => `<div class="row"><span class="title">${esc(l)}</span></div>`).join('')
  loadPhotos()
}

async function loadPhotos() {
  const items = await api('/api/photos')
  $('photo-count').textContent = `已有 ${items.length} 张`
  $('gallery').innerHTML = items
    .map(
      (p) => `
      <div class="card" data-name="${esc(p.name)}">
        <div class="thumb" style="background-image:url('/photos/${encodeURIComponent(p.name)}')"></div>
        <div class="name">${esc(p.name)}</div>
        <input class="cap-in" placeholder="说明文字" value="${esc(p.meta.caption || '')}" />
        <input class="place-in" placeholder="地点" value="${esc(p.meta.place || '')}" />
        <button class="del-photo" title="删除这张照片">删除</button>
      </div>`
    )
    .join('')

  $('gallery').querySelectorAll('.card').forEach((card) => {
    const name = card.dataset.name
    const save = async () => {
      await api('/api/photos', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          caption: card.querySelector('.cap-in').value,
          place: card.querySelector('.place-in').value,
        }),
      })
    }
    card.querySelectorAll('input').forEach((i) => i.addEventListener('blur', save))

    card.querySelector('.del-photo').addEventListener('click', async () => {
      if (!confirm('确定删除这张照片吗？\n（会移到 .studio-backup/trash 里，还能找回）')) return
      try {
        await api('/api/photos?name=' + encodeURIComponent(name), { method: 'DELETE' })
        loadPhotos()
      } catch (e) {
        alert('删除失败：' + e.message)
      }
    })
  })
}

/* ---------- 书架 ---------- */

const STATUS_ZH = { reading: '在读', done: '读完', wish: '想读' }
let books = []

async function loadBooks() {
  books = await api('/api/books')
  renderBooks()
}

function renderBooks() {
  const el = $('books-table')
  el.innerHTML =
    `<div class="tbl-head books"><span>书名</span><span>作者</span><span>状态</span><span>评分/进度</span><span>批注</span><span></span></div>` +
    (books.length
      ? books
          .map(
            (b, i) => `
      <div class="tbl-row books" data-i="${i}">
        <input class="b-title" value="${esc(b.title || '')}" placeholder="书名" />
        <input class="b-author" value="${esc(b.author || '')}" placeholder="作者" />
        <select class="b-status">
          ${Object.entries(STATUS_ZH)
            .map(([k, v]) => `<option value="${k}" ${b.status === k ? 'selected' : ''}>${v}</option>`)
            .join('')}
        </select>
        <input class="b-extra" value="${b.status === 'reading' ? b.progress ?? '' : b.rating ?? ''}"
               placeholder="${b.status === 'reading' ? '进度%' : '评分1-5'}" />
        <input class="b-note" value="${esc(b.note || '')}" placeholder="一句话批注" />
        <button class="x" title="删除">×</button>
      </div>`
          )
          .join('')
      : '<div class="empty">还没有书，点下面添加一本</div>')

  el.querySelectorAll('.tbl-row').forEach((row) => {
    const i = Number(row.dataset.i)
    row.querySelector('.b-title').addEventListener('input', (e) => (books[i].title = e.target.value))
    row.querySelector('.b-author').addEventListener('input', (e) => (books[i].author = e.target.value))
    row.querySelector('.b-note').addEventListener('input', (e) => (books[i].note = e.target.value))
    row.querySelector('.b-extra').addEventListener('input', (e) => {
      const v = e.target.value.trim()
      if (books[i].status === 'reading') books[i].progress = v === '' ? undefined : Number(v)
      else books[i].rating = v === '' ? undefined : Number(v)
    })
    row.querySelector('.b-status').addEventListener('change', (e) => {
      books[i].status = e.target.value
      renderBooks()
    })
    row.querySelector('.x').addEventListener('click', () => {
      books.splice(i, 1)
      renderBooks()
    })
  })
}

$('book-add').addEventListener('click', () => {
  books.push({ title: '', author: '', status: 'wish' })
  renderBooks()
  const rows = $('books-table').querySelectorAll('.tbl-row')
  rows[rows.length - 1]?.querySelector('.b-title')?.focus()
})

$('book-save').addEventListener('click', async () => {
  const hint = $('book-hint')
  hint.className = 'hint'
  hint.textContent = '保存中…'
  try {
    const saved = await api('/api/books', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ books }),
    })
    books = saved
    renderBooks()
    hint.textContent = `已保存 ${saved.length} 本`
    loadOverview()
  } catch (e) {
    hint.className = 'hint err'
    hint.textContent = e.message
  }
})

/* ---------- 行程 ---------- */

let trips = []
let cities = {}

async function loadPlaces() {
  const data = await api('/api/places')
  trips = data.trips
  cities = data.cities || {}
  renderTrips()
}

function renderTrips() {
  const el = $('trips-table')
  const cityOptions = (current) =>
    Object.keys(cities)
      .map((c) => `<option value="${esc(c)}" ${c === current ? 'selected' : ''}>${esc(c)}</option>`)
      .join('')

  el.innerHTML =
    `<div class="tbl-head trips"><span>城市</span><span>日期</span><span>一句话</span><span></span></div>` +
    (trips.length
      ? trips
          .map(
            (t, i) => `
      <div class="tbl-row trips" data-i="${i}">
        <select class="t-city">
          <option value="">选城市</option>
          ${cityOptions(t.city)}
          ${t.city && !cities[t.city] ? `<option value="${esc(t.city)}" selected>${esc(t.city)}</option>` : ''}
        </select>
        <input class="t-date" type="date" value="${t.date || ''}" />
        <input class="t-note" value="${esc(t.note || '')}" placeholder="那天做了什么" />
        <button class="x" title="删除">×</button>
      </div>`
          )
          .join('')
      : '<div class="empty">还没有手动补的行程。日记里填了地点也会自动进来。</div>')

  el.querySelectorAll('.tbl-row').forEach((row) => {
    const i = Number(row.dataset.i)
    row.querySelector('.t-city').addEventListener('change', (e) => (trips[i].city = e.target.value))
    row.querySelector('.t-date').addEventListener('change', (e) => (trips[i].date = e.target.value))
    row.querySelector('.t-note').addEventListener('input', (e) => (trips[i].note = e.target.value))
    row.querySelector('.x').addEventListener('click', () => {
      trips.splice(i, 1)
      renderTrips()
    })
  })
}

$('trip-add').addEventListener('click', () => {
  trips.push({
    city: Object.keys(cities)[0] || '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })
  renderTrips()
})

$('trip-save').addEventListener('click', async () => {
  const hint = $('trip-hint')
  hint.className = 'hint'
  hint.textContent = '保存中…'
  try {
    const saved = await api('/api/places', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ trips }),
    })
    trips = saved
    renderTrips()
    hint.textContent = `已保存 ${saved.length} 段行程`
    loadOverview()
  } catch (e) {
    hint.className = 'hint err'
    hint.textContent = e.message
  }
})

/* ---------- 发布 ---------- */

const STATUS = { M: '修改', A: '新增', D: '删除', R: '重命名', '?': '未跟踪' }

async function loadGit() {
  const g = await api('/api/git')
  $('files').innerHTML = g.files.length
    ? g.files
        .map(
          (f) =>
            `<div class="file"><span class="st">${STATUS[f.status] || f.status}</span><span class="p">${esc(
              f.path
            )}</span></div>`
        )
        .join('')
    : `<div class="file"><span class="p" style="color: var(--ink-3)">工作区干净，没有待发布内容${
        g.ahead ? `（有 ${g.ahead} 个提交未推）` : ''
      }</span></div>`

  $('publish').disabled = !g.files.length && !g.ahead
  $('publish').textContent = g.files.length ? `发布 ${g.files.length} 个文件` : '发布'
}

$('refresh-git').addEventListener('click', loadGit)

$('publish').addEventListener('click', async () => {
  const hint = $('publish-hint')
  hint.className = 'hint'
  hint.textContent = '发布中…'
  try {
    const r = await api('/api/git', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: $('commit-msg').value }),
    })
    hint.textContent = r.message
    $('commit-msg').value = ''
    loadGit()
  } catch (e) {
    hint.className = 'hint err'
    hint.textContent = e.message
  }
})

/* ---------- 工具 ---------- */

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

/** 当前本地时分（HH:mm） */
function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 把「YYYY-MM-DD」或「YYYY-MM-DD HH:mm」拆成日期与时间两部分 */
function splitDateTime(s) {
  const str = String(s || '').trim()
  const m = str.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?/)
  return { date: m ? m[1] : '', time: m && m[2] ? m[2] : '' }
}

/* ---------- 启动 ---------- */

;(async function boot() {
  $('f-date').value = new Date().toISOString().slice(0, 10)
  $('f-time').value = nowTime()
  const s = await loadSite()
  if (s) window.__sitePort = s.port
  loadOverview()
  setInterval(loadSite, 5000)
})()
