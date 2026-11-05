'use client'

import { useEffect, useRef, useState } from 'react'
import { api, type PhotoItem } from './client'

export default function Photos() {
  const [items, setItems] = useState<PhotoItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const refresh = () =>
    api
      .photos()
      .then(setItems)
      .catch(() => {})
  useEffect(() => {
    refresh()
  }, [])

  async function upload(files: FileList | File[]) {
    if (!files || !files.length) return
    setBusy(true)
    const lines: string[] = []
    for (const file of Array.from(files)) {
      try {
        const r = await api.uploadPhoto(file)
        const saved = ((1 - r.bytes / file.size) * 100).toFixed(0)
        lines.push(
          `${r.name} · ${r.width}×${r.height} · ${(r.bytes / 1024).toFixed(0)}KB（省 ${saved}%）`
        )
      } catch (e) {
        lines.push(`${file.name} 失败：${e instanceof Error ? e.message : String(e)}`)
      }
    }
    setLog(lines)
    setBusy(false)
    refresh()
  }

  return (
    <section>
      <header>
        <p className="eyebrow">PHOTOS</p>
        <h1 className="mt-3 font-serif text-[26px] font-light tracking-[0.04em]">照片</h1>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          upload(e.dataTransfer.files)
        }}
        className={`mt-8 flex h-40 flex-col items-center justify-center rounded-[3px] border border-dashed transition-colors ${
          dragging ? 'border-dream-400 bg-dream-500/10' : 'border-line/80'
        }`}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="hover:text-dream-300 px-3 py-2 text-[13px] transition-colors"
        >
          {busy ? '压缩上传中…' : '把照片拖到这里，或点击选择'}
        </button>
        <p className="text-ink-3 text-[11px]">
          自动压到长边 1600 / 质量 82；文件名请用 2026-11-05-短名.jpg
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {log.length ? (
        <ul className="mt-4 space-y-1">
          {log.map((l, i) => (
            <li key={i} className="font-mono text-[11px] text-mist-500">
              {l}
            </li>
          ))}
        </ul>
      ) : null}

      <h2 className="mt-12 font-serif text-[15px] tracking-[0.1em]">已有 {items.length} 张</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <PhotoCard key={p.name} item={p} onSaved={refresh} />
        ))}
        {!items.length ? <p className="text-ink-3 text-[12px]">还没有照片。</p> : null}
      </div>
    </section>
  )
}

function PhotoCard({ item, onSaved }: { item: PhotoItem; onSaved: () => void }) {
  const [caption, setCaption] = useState(item.meta.caption ?? '')
  const [place, setPlace] = useState(item.meta.place ?? '')
  const [saved, setSaved] = useState(false)

  async function save() {
    await api.savePhotoMeta(item.name, caption, place)
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
    onSaved()
  }

  return (
    <div className="border-line/60 rounded-[3px] border p-2">
      <div
        className="bg-surface aspect-[4/3] w-full rounded-[2px] bg-cover bg-center"
        style={{ backgroundImage: `url("/photos/${encodeURIComponent(item.name)}")` }}
        role="img"
        aria-label={item.meta.caption || item.name}
      />
      <p className="text-ink-3 mt-2 truncate font-mono text-[10px]">{item.name}</p>
      <input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        onBlur={save}
        placeholder="说明文字"
        className="border-line/60 bg-surface/40 focus:border-dream-400/60 mt-1.5 w-full rounded-[2px] border px-2 py-1.5 text-[12px] outline-none"
      />
      <div className="mt-1.5 flex items-center gap-2">
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          onBlur={save}
          placeholder="地点"
          className="border-line/60 bg-surface/40 focus:border-dream-400/60 w-full rounded-[2px] border px-2 py-1 text-[11px] outline-none"
        />
        {saved ? <span className="shrink-0 text-[10px] text-mist-500">已存</span> : null}
      </div>
    </div>
  )
}
