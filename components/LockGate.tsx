'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { verifyDreamKey, isUnlocked, setUnlocked } from '@/lib/dreamKey'

/**
 * 上锁日记的「门」：未解锁时只显示锁界面（正文不渲染进 DOM），
 * 输入正确「梦之钥」后才渲染 children 正文。
 */
export default function LockGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlockedState] = useState(false)
  const [ready, setReady] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    setUnlockedState(isUnlocked())
    setReady(true)
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const value = input.trim()
    if (!value || checking) return
    setChecking(true)
    setError(false)
    const ok = await verifyDreamKey(value)
    setChecking(false)
    if (ok) {
      setUnlocked(true)
      setUnlockedState(true)
    } else {
      setError(true)
      setInput('')
    }
  }

  if (ready && unlocked) return <>{children}</>

  return (
    <div className="relative flex flex-col items-center justify-center py-16 text-center sm:py-24">
      <div className="text-dream-500 mb-8 text-[10.5px] tracking-[0.32em]">A LOCKED DREAM</div>

      <h1 className="font-serif text-[clamp(1.9rem,5vw,2.8rem)] leading-snug font-light tracking-[0.08em]">
        朦胧的梦
      </h1>

      <p className="text-ink-3 mt-5 max-w-xs text-[13px] leading-[1.9] tracking-[0.04em]">
        这个梦被上了锁，需要「梦之钥」才能解开。
      </p>

      <form onSubmit={submit} className="mt-10 flex w-full max-w-xs flex-col gap-3">
        <input
          type="password"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setError(false)
          }}
          placeholder="梦之钥"
          aria-label="梦之钥"
          autoComplete="off"
          className="border-line bg-surface/60 text-ink placeholder:text-ink-3/70 focus:border-dream-500/50 focus:ring-dream-500/30 w-full rounded-lg border px-4 py-3 text-center text-[14px] tracking-[0.2em] outline-none focus:ring-1"
        />

        {error ? (
          <p className="text-[12px] tracking-[0.04em] text-red-400/80">梦之钥不对，再试一次</p>
        ) : null}

        <button
          type="submit"
          disabled={checking || !input.trim()}
          className="bg-dream-500/15 text-dream-300 hover:bg-dream-500/25 mt-2 rounded-lg px-4 py-3 text-[13px] tracking-[0.14em] transition-colors duration-300 disabled:opacity-40"
        >
          {checking ? '正在解开…' : '解开这个梦'}
        </button>
      </form>
    </div>
  )
}
