'use client'

import { useEffect, useMemo, useState } from 'react'
import { api, type PostSummary } from './client'

const MOODS = ['平静', '愉快', '低落', '疲惫', '兴奋', '恍惚', '思念']
const WEATHERS = ['晴', '多云', '阴', '雨', '雪', '雾', '风']

const today = () => new Date().toISOString().slice(0, 10)

/** 极简 Markdown 渲染：只处理标题、引用、列表、粗斜体、行内代码 */
function renderMarkdown(src: string) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inline = (s: string) =>
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
      return `<p>${inline(esc(t)).replace(/\n/g, '<br/>')}</p>`
    })
    .join('')
}

const inputClass =
  'w-full rounded-[3px] border border-line/70 bg-surface/40 px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-dream-400/70'
const labelClass = 'text-ink-3 text-[10.5px] tracking-[0.12em] uppercase'

export default function Writer() {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [slug, setSlug] = useState<string | undefined>()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today())
  const [mood, setMood] = useState('平静')
  const [weather, setWeather] = useState('晴')
  const [place, setPlace] = useState('')
  const [tags, setTags] = useState('')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [state, setState] = useState<{ kind: 'idle' | 'ok' | 'err'; text: string }>({
    kind: 'idle',
    text: '',
  })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .posts()
      .then(setPosts)
      .catch(() => {})
  }, [])

  const canSave = title.trim().length > 0 && !busy
  const html = useMemo(() => renderMarkdown(body), [body])

  async function load(target: string) {
    if (!target) {
      setSlug(undefined)
      setTitle('')
      setDate(today())
      setBody('')
      setSummary('')
      setPlace('')
      setTags('')
      return
    }
    const post = await api.post(target)
    const fm = post.frontmatter
    setSlug(post.slug)
    setTitle(fm.title ?? '')
    setDate(String(fm.date ?? today()).slice(0, 10))
    setMood(fm.mood ?? '')
    setWeather(fm.weather ?? '')
    setPlace(fm.place ?? '')
    setTags((fm.tags ?? []).join(', '))
    setSummary(fm.summary ?? '')
    setBody(post.body)
  }

  async function save(draft: boolean) {
    setBusy(true)
    setState({ kind: 'idle', text: '' })
    try {
      const res = await api.savePost({
        slug,
        title,
        date,
        mood,
        weather,
        place,
        summary,
        draft,
        tags: tags
          .split(/[,，\s]+/)
          .map((t) => t.trim())
          .filter(Boolean),
        body,
      })
      setSlug(res.slug)
      setState({ kind: 'ok', text: `已保存 → ${res.file}` })
      api
        .posts()
        .then(setPosts)
        .catch(() => {})
    } catch (e) {
      setState({ kind: 'err', text: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">WRITE</p>
          <h1 className="mt-3 font-serif text-[26px] font-light tracking-[0.04em]">写日记</h1>
        </div>

        <select
          value={slug ?? ''}
          onChange={(e) => load(e.target.value)}
          className="border-line/70 bg-surface/40 text-ink-2 rounded-[3px] border px-3 py-2 text-[12px]"
        >
          <option value="">＋ 新建</option>
          {posts.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.date} {p.title}
            </option>
          ))}
        </select>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={labelClass}>标题</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="今天发生了什么"
            className={`${inputClass} mt-1.5`}
          />
        </label>

        <label>
          <span className={labelClass}>日期</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </label>

        <label>
          <span className={labelClass}>地点</span>
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="苏州 · 平江路（会进足迹页）"
            className={`${inputClass} mt-1.5`}
          />
        </label>

        <label>
          <span className={labelClass}>心情</span>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className={`${inputClass} mt-1.5`}
          >
            <option value="">（不填）</option>
            {MOODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>天气</span>
          <select
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            className={`${inputClass} mt-1.5`}
          >
            <option value="">（不填）</option>
            {WEATHERS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>标签</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="日常, 吃"
            className={`${inputClass} mt-1.5`}
          />
        </label>

        <label>
          <span className={labelClass}>摘要</span>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="一句话，列表和搜索里显示"
            className={`${inputClass} mt-1.5`}
          />
        </label>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label>
          <span className={labelClass}>正文（Markdown）</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            placeholder="写点什么。支持 # 标题、> 引用、- 列表、**粗体**。"
            className={`${inputClass} mt-1.5 resize-y font-mono text-[12.5px] leading-[1.9]`}
          />
        </label>

        <div>
          <span className={labelClass}>预览</span>
          <div
            className="prose prose-sm dark:prose-invert border-line/70 bg-surface/30 mt-1.5 h-[calc(14*1.9*12.5px+0.8rem)] overflow-y-auto rounded-[3px] border px-5 py-4 text-[13px]"
            dangerouslySetInnerHTML={{
              __html: html || '<p class="text-ink-3">预览会显示在这里</p>',
            }}
          />
        </div>
      </div>

      <div className="bg-paper/95 sticky bottom-0 mt-6 flex flex-wrap items-center gap-3 py-3 backdrop-blur-sm">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => save(false)}
          className="bg-dream-600/90 hover:bg-dream-600 rounded-[3px] px-5 py-2.5 text-[12.5px] tracking-[0.06em] text-white transition-colors disabled:opacity-40"
        >
          {busy ? '保存中…' : '保存'}
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => save(true)}
          className="border-line hover:border-dream-400/60 rounded-[3px] border px-4 py-2.5 text-[12.5px] tracking-[0.06em] transition-colors disabled:opacity-40"
        >
          存为草稿
        </button>
        {state.text ? (
          <span
            className={`text-[11.5px] ${state.kind === 'err' ? 'text-red-400' : 'text-mist-500'}`}
          >
            {state.text}
          </span>
        ) : null}
      </div>
    </section>
  )
}
