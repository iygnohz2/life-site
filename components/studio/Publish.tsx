'use client'

import { useEffect, useState } from 'react'
import { api, type GitState } from './client'

const STATUS_LABEL: Record<string, string> = {
  M: '修改',
  A: '新增',
  D: '删除',
  R: '重命名',
  '?': '未跟踪',
  '!!': '忽略',
}

export default function Publish() {
  const [state, setState] = useState<GitState | null>(null)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = () =>
    api
      .git()
      .then(setState)
      .catch((e) => setResult({ kind: 'err', text: e.message }))

  useEffect(() => {
    refresh()
  }, [])

  async function publish() {
    setBusy(true)
    setResult(null)
    try {
      const r = await api.publish(message)
      setResult({
        kind: 'ok',
        text: r.pushed ? `${r.message}，Vercel 会自动开始构建` : r.message,
      })
      setMessage('')
      refresh()
    } catch (e) {
      setResult({ kind: 'err', text: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }

  const dirty = state?.files.length ?? 0

  return (
    <section>
      <header className="flex items-end justify-between">
        <div>
          <p className="eyebrow">PUBLISH</p>
          <h1 className="mt-3 font-serif text-[26px] font-light tracking-[0.04em]">发布</h1>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="text-ink-3 hover:text-ink text-[11.5px] tracking-[0.06em] transition-colors"
        >
          刷新
        </button>
      </header>

      <p className="text-ink-2 mt-6 text-[12.5px] leading-[2]">
        发布 = 提交这些改动并推到 GitHub，Vercel 会自动重新构建。约 1–2 分钟上线。
      </p>

      <div className="border-line/60 mt-8 border-t">
        {state?.files.length ? (
          state.files.map((f) => (
            <div key={f.path} className="border-line/40 flex items-baseline gap-3 border-b py-2.5">
              <span className="text-dream-400 w-12 shrink-0 font-mono text-[10px] tracking-[0.1em]">
                {STATUS_LABEL[f.status] ?? f.status}
              </span>
              <span className="text-ink-2 min-w-0 flex-1 truncate font-mono text-[11.5px]">
                {f.path}
              </span>
            </div>
          ))
        ) : (
          <p className="text-ink-3 py-6 text-[12px]">
            工作区是干净的，没有待发布的内容。
            {state?.ahead ? `（有 ${state.ahead} 个本地提交还没推）` : ''}
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`提交说明（留空则用「内容更新 ${new Date().toISOString().slice(0, 10)}」）`}
          className="border-line/70 bg-surface/40 focus:border-dream-400/70 min-w-[18rem] flex-1 rounded-[3px] border px-3 py-2.5 text-[12.5px] outline-none"
        />
        <button
          type="button"
          disabled={busy || (!dirty && !state?.ahead)}
          onClick={publish}
          className="bg-dream-600/90 hover:bg-dream-600 rounded-[3px] px-6 py-2.5 text-[12.5px] tracking-[0.08em] text-white transition-colors disabled:opacity-40"
        >
          {busy ? '发布中…' : `发布${dirty ? ` ${dirty} 个文件` : ''}`}
        </button>
      </div>

      {result ? (
        <p
          className={`mt-4 text-[12px] ${result.kind === 'err' ? 'text-red-400' : 'text-mist-500'}`}
        >
          {result.text}
        </p>
      ) : null}

      <p className="text-ink-3 mt-12 text-[11px] leading-[1.9]">
        发布前会自动 <span className="font-mono">git pull --rebase</span> 一次。如果远端有冲突，
        会停下来告诉你，不会强推。每次保存前，原文件都已快照到
        <span className="font-mono"> .studio-backup/</span>。
      </p>
    </section>
  )
}
