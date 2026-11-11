'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  addInteraction,
  getCurrentProfile,
  getInteractions,
  listInboxPartners,
  sendOtp,
  setProfileName,
  signOut,
  verifyInviteCode,
  verifyOtp,
} from '@/lib/interactions'
import type { Interaction, Profile } from '@/lib/supabase'

const INVITE_KEY = 'dreamland_invite_passed'

type Phase = 'loading' | 'passcode' | 'login' | 'naming' | 'ready'

const inputClass =
  'border-line bg-surface/60 text-ink placeholder:text-ink-3/70 focus:border-dream-500/50 focus:ring-dream-500/30 w-full rounded-lg border px-4 py-3 text-[14px] outline-none focus:ring-1'

export default function Messages() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [nickname, setNickname] = useState('')

  const [partners, setPartners] = useState<{ id: string; name: string | null }[]>([])
  const [activePartner, setActivePartner] = useState<string | null>(null)
  const [messages, setMessages] = useState<Interaction[]>([])
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const isOwner = profile?.is_owner === true

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const p = await getCurrentProfile()
        if (cancelled) return
        if (p) {
          setProfile(p)
          setPhase(p.name ? 'ready' : 'naming')
        } else if (window.sessionStorage.getItem(INVITE_KEY) === '1') {
          setPhase('login')
        } else {
          setPhase('passcode')
        }
      } catch {
        if (!cancelled) setPhase('passcode')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadMessages = useCallback(async (partnerId: string) => {
    const list = await getInteractions('inbox', partnerId)
    setMessages(list)
  }, [])

  const loadConversations = useCallback(async () => {
    if (!profile) return
    if (profile.is_owner) {
      const ps = await listInboxPartners()
      setPartners(ps)
      if (ps.length) setActivePartner((cur) => cur ?? ps[0].id)
    } else {
      setActivePartner(profile.id)
    }
  }, [profile])

  useEffect(() => {
    if (phase !== 'ready' || !profile) return
    loadConversations()
  }, [phase, profile, loadConversations])

  useEffect(() => {
    if (!activePartner) return
    loadMessages(activePartner)
  }, [activePartner, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function submitCode(e: FormEvent) {
    e.preventDefault()
    const value = code.trim()
    if (!value || busy) return
    setBusy(true)
    setError('')
    try {
      const ok = await verifyInviteCode(value)
      if (ok) {
        window.sessionStorage.setItem(INVITE_KEY, '1')
        setPhase('login')
      } else {
        setError('口令不对，再想想')
        setCode('')
      }
    } catch {
      setError('校验失败，请稍后再试')
    } finally {
      setBusy(false)
    }
  }

  async function submitEmail(e: FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!value || busy) return
    setBusy(true)
    setError('')
    try {
      const { error: err } = await sendOtp(value)
      if (err) throw err
      setOtpSent(true)
    } catch {
      setError('发送失败，检查邮箱地址后重试')
    } finally {
      setBusy(false)
    }
  }

  async function submitOtp(e: FormEvent) {
    e.preventDefault()
    const value = otp.trim()
    if (!value || busy) return
    setBusy(true)
    setError('')
    try {
      const { error: err } = await verifyOtp(email.trim(), value)
      if (err) throw err
      const p = await getCurrentProfile()
      if (!p) throw new Error('登录状态异常')
      setProfile(p)
      setPhase(p.name ? 'ready' : 'naming')
    } catch {
      setError('验证码不对或已过期')
    } finally {
      setBusy(false)
    }
  }

  async function submitName(e: FormEvent) {
    e.preventDefault()
    const value = nickname.trim()
    if (!value || busy) return
    setBusy(true)
    setError('')
    try {
      await setProfileName(value)
      const p = await getCurrentProfile()
      if (p) setProfile(p)
      setPhase('ready')
    } catch {
      setError('保存失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault()
    const value = draft.trim()
    if (!value || !activePartner || busy) return
    setBusy(true)
    setError('')
    try {
      await addInteraction({
        target_type: 'inbox',
        target_id: activePartner,
        kind: 'message',
        content: value,
        owner_name: profile?.name ?? null,
      })
      setDraft('')
      await loadMessages(activePartner)
      if (isOwner) await loadConversations()
    } catch {
      setError('发送失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  async function doLogout() {
    await signOut()
    window.sessionStorage.removeItem(INVITE_KEY)
    setProfile(null)
    setPhase('passcode')
    setMessages([])
    setPartners([])
    setActivePartner(null)
  }

  if (phase === 'loading') {
    return <div className="min-h-[60vh]" />
  }

  const gateWrap = 'flex flex-col items-center gap-3 py-10 text-center'

  return (
    <div className="min-h-[60vh]">
      {phase === 'passcode' ? (
        <form onSubmit={submitCode} className={gateWrap}>
          <div className="text-dream-500 text-[10.5px] tracking-[0.32em]">PRIVATE LETTERS</div>
          <p className="text-ink-3 max-w-xs text-[13px] leading-[1.9] tracking-[0.04em]">
            这里是与站主的私密往来，先输对邀请口令。
          </p>
          <input
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setError('')
            }}
            placeholder="邀请口令"
            aria-label="邀请口令"
            autoComplete="off"
            className={`${inputClass} max-w-xs text-center tracking-[0.2em]`}
          />
          {error ? <p className="text-[12px] text-red-400/80">{error}</p> : null}
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="bg-dream-500/15 text-dream-300 hover:bg-dream-500/25 rounded-lg px-5 py-2.5 text-[13px] tracking-[0.14em] transition-colors duration-300 disabled:opacity-40"
          >
            {busy ? '正在核对…' : '进入'}
          </button>
        </form>
      ) : null}

      {phase === 'login' ? (
        <div className={gateWrap}>
          <div className="text-dream-500 text-[10.5px] tracking-[0.32em]">SIGN IN</div>
          {!otpSent ? (
            <form onSubmit={submitEmail} className="flex w-full max-w-xs flex-col gap-3">
              <p className="text-ink-3 text-[13px] leading-[1.9] tracking-[0.04em]">
                留下你的邮箱，收到验证码即可进入。
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="你的邮箱"
                aria-label="邮箱"
                className={`${inputClass} text-center`}
              />
              <button
                type="submit"
                disabled={busy || !email.trim()}
                className="bg-dream-500/15 text-dream-300 hover:bg-dream-500/25 rounded-lg px-5 py-2.5 text-[13px] tracking-[0.14em] transition-colors duration-300 disabled:opacity-40"
              >
                {busy ? '发送中…' : '发送验证码'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitOtp} className="flex w-full max-w-xs flex-col gap-3">
              <p className="text-ink-3 text-[13px] leading-[1.9] tracking-[0.04em]">
                验证码已发到 {email}，请输入。
              </p>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="验证码"
                aria-label="验证码"
                className={`${inputClass} text-center text-[16px] tracking-[0.3em]`}
              />
              <button
                type="submit"
                disabled={busy || !otp.trim()}
                className="bg-dream-500/15 text-dream-300 hover:bg-dream-500/25 rounded-lg px-5 py-2.5 text-[13px] tracking-[0.14em] transition-colors duration-300 disabled:opacity-40"
              >
                {busy ? '验证中…' : '进入'}
              </button>
            </form>
          )}
          {error ? <p className="text-[12px] text-red-400/80">{error}</p> : null}
        </div>
      ) : null}

      {phase === 'naming' ? (
        <form onSubmit={submitName} className={`${gateWrap} mx-auto max-w-sm`}>
          <div className="text-dream-500 text-[10.5px] tracking-[0.32em]">YOUR NAME</div>
          <p className="text-ink-3 text-[13px] leading-[1.9] tracking-[0.04em]">
            给自己取个名字，私信里会显示它。
          </p>
          <div className="flex w-full gap-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="你的名字"
              aria-label="昵称"
              maxLength={20}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={busy || !nickname.trim()}
              className="bg-dream-500/15 text-dream-300 hover:bg-dream-500/25 shrink-0 rounded-lg px-4 py-2.5 text-[13px] tracking-[0.1em] transition-colors duration-300 disabled:opacity-40"
            >
              保存
            </button>
          </div>
        </form>
      ) : null}

      {phase === 'ready' && profile ? (
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <div className="text-dream-500 text-[10.5px] tracking-[0.32em]">LETTERS</div>
            <button
              type="button"
              onClick={doLogout}
              className="text-ink-3 hover:text-ink text-[11px] tracking-[0.08em] transition-colors"
            >
              退出（{profile.name || '未命名'}）
            </button>
          </div>

          {isOwner ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-[200px_1fr]">
              <aside className="border-line/70 border-r pr-4 sm:min-h-[50vh]">
                {partners.length ? (
                  <ul className="space-y-1">
                    {partners.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setActivePartner(p.id)}
                          className={`w-full truncate rounded-lg px-3 py-2 text-left text-[13px] tracking-[0.04em] transition-colors ${
                            activePartner === p.id
                              ? 'bg-dream-500/15 text-dream-300'
                              : 'text-ink-2 hover:text-ink hover:bg-surface'
                          }`}
                        >
                          {p.name || '某位访客'}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ink-3 text-[12px] leading-relaxed tracking-[0.04em]">
                    还没有人私信过你。
                  </p>
                )}
              </aside>

              <ChatPane
                messages={messages}
                active={activePartner}
                partnerName={partners.find((p) => p.id === activePartner)?.name ?? '某位访客'}
                draft={draft}
                setDraft={setDraft}
                busy={busy}
                error={error}
                onSubmit={sendMessage}
                bottomRef={bottomRef}
                mine={profile.id}
              />
            </div>
          ) : (
            <ChatPane
              messages={messages}
              active={activePartner}
              partnerName="站主"
              draft={draft}
              setDraft={setDraft}
              busy={busy}
              error={error}
              onSubmit={sendMessage}
              bottomRef={bottomRef}
              mine={profile.id}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}

function ChatPane({
  messages,
  active,
  partnerName,
  draft,
  setDraft,
  busy,
  error,
  onSubmit,
  bottomRef,
  mine,
}: {
  messages: Interaction[]
  active: string | null
  partnerName: string
  draft: string
  setDraft: (v: string) => void
  busy: boolean
  error: string
  onSubmit: (e: FormEvent) => void
  bottomRef: React.RefObject<HTMLDivElement | null>
  mine: string
}) {
  return (
    <div className="flex flex-col">
      <div className="text-ink-3 mb-3 text-[11.5px] tracking-[0.08em]">
        与 <span className="text-ink">{partnerName}</span> 的对话
      </div>

      <div className="hairline flex min-h-[320px] flex-col gap-4 py-4">
        {messages.length ? (
          messages.map((m) => {
            const isMine = m.owner_id === mine
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isMine ? 'text-right' : 'text-left'}`}>
                  <div className="text-ink-3 text-[10.5px] tracking-[0.06em]">
                    {m.owner_name || '某位访客'} ·{' '}
                    {new Date(m.created_at).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <p className="text-ink mt-1 text-[14px] leading-[1.85] whitespace-pre-wrap">
                    {m.content}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-ink-3 py-16 text-center text-[13px] tracking-[0.04em]">
            {active ? '还没有消息，写点什么吧。' : '从左侧选一个人开始对话。'}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="写私信…"
          aria-label="私信内容"
          disabled={!active}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy || !draft.trim() || !active}
          className="bg-dream-500/15 text-dream-300 hover:bg-dream-500/25 shrink-0 rounded-lg px-4 py-2.5 text-[13px] tracking-[0.1em] transition-colors duration-300 disabled:opacity-40"
        >
          发送
        </button>
      </form>
      {error ? <p className="mt-2 text-[12px] text-red-400/80">{error}</p> : null}
    </div>
  )
}
