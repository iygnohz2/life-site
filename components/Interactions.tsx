'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  addInteraction,
  deleteInteraction,
  getCurrentProfile,
  getInteractions,
  getOwnerIds,
  sendOtp,
  setProfileName,
  signOut,
  verifyInviteCode,
  verifyOtp,
} from '@/lib/interactions'
import type { Interaction, InteractionTargetType, Profile } from '@/lib/supabase'

const REACTIONS = ['👍', '❤️', '😊', '🥹', '🌟', '🫶']
const INVITE_KEY = 'dreamland_invite_passed'

type Phase = 'loading' | 'passcode' | 'login' | 'ready'

type Props = {
  targetType: InteractionTargetType
  targetId: string
  className?: string
}

export default function Interactions({ targetType, targetId, className }: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<Interaction[]>([])
  const [ownerIds, setOwnerIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [nickname, setNickname] = useState('')
  const [needName, setNeedName] = useState(false)

  const [comment, setComment] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')

  const isOwner = profile?.is_owner === true

  const loadItems = useCallback(async () => {
    const [list, owners] = await Promise.all([getInteractions(targetType, targetId), getOwnerIds()])
    setItems(list)
    setOwnerIds(new Set(owners))
  }, [targetType, targetId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const p = await getCurrentProfile()
        if (cancelled) return
        if (p) {
          setProfile(p)
          setNeedName(!p.name)
          await loadItems()
          setPhase('ready')
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
  }, [loadItems])

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
      setNeedName(!p.name)
      await loadItems()
      setPhase('ready')
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
      setNeedName(false)
    } catch {
      setError('保存失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  async function postComment(e: FormEvent) {
    e.preventDefault()
    const value = comment.trim()
    if (!value || busy) return
    setBusy(true)
    try {
      await addInteraction({
        target_type: targetType,
        target_id: targetId,
        kind: 'comment',
        content: value,
        owner_name: profile?.name ?? null,
      })
      setComment('')
      await loadItems()
    } catch {
      setError('发送失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  async function postReply(e: FormEvent) {
    e.preventDefault()
    const value = replyText.trim()
    if (!value || busy || replyTo == null) return
    setBusy(true)
    try {
      await addInteraction({
        target_type: targetType,
        target_id: targetId,
        kind: 'comment',
        content: value,
        reply_to: replyTo,
        owner_name: profile?.name ?? null,
      })
      setReplyText('')
      setReplyTo(null)
      await loadItems()
    } catch {
      setError('发送失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  async function tapReaction(r: string) {
    if (busy) return
    setBusy(true)
    try {
      await addInteraction({
        target_type: targetType,
        target_id: targetId,
        kind: 'reaction',
        reaction: r,
        owner_name: profile?.name ?? null,
      })
      await loadItems()
    } catch {
      setError('操作失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  async function doLogout() {
    await signOut()
    window.sessionStorage.removeItem(INVITE_KEY)
    setProfile(null)
    setItems([])
    setPhase('passcode')
  }

  async function deleteItem(id: number) {
    if (busy) return
    setBusy(true)
    try {
      await deleteInteraction(id)
      await loadItems()
    } catch {
      setError('删除失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  const reactionCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const it of items) {
      if (it.kind === 'reaction' && it.reaction) {
        map.set(it.reaction, (map.get(it.reaction) ?? 0) + 1)
      }
    }
    return map
  }, [items])

  const { top, replies } = useMemo(() => {
    const topList = items.filter((it) => it.kind === 'comment' && it.reply_to == null)
    const replyList = items.filter((it) => it.kind === 'comment' && it.reply_to != null)
    return { top: topList, replies: replyList }
  }, [items])

  const ownerLabel = (ownerId: string) => (ownerIds.has(ownerId) ? ' · 站主' : '')

  if (phase === 'loading') {
    return <div className={`${className ?? 'hairline mt-16 pt-10'} min-h-[40px]`} />
  }

  return (
    <div className={className ?? 'hairline mt-16 pt-10'}>
      {phase === 'passcode' ? (
        <form onSubmit={submitCode} className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="text-dream-500 text-[10.5px] tracking-[0.32em]">LEAVE A TRACE</div>
          <p className="text-ink-3 max-w-xs text-[13px] leading-[1.9] tracking-[0.04em]">
            这里可以留下只属于你我的回应，先输对邀请口令。
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
            className="border-line bg-surface/60 text-ink placeholder:text-ink-3/70 focus:border-dream-500/50 focus:ring-dream-500/30 w-full max-w-xs rounded-lg border px-4 py-3 text-center text-[14px] tracking-[0.2em] outline-none focus:ring-1"
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
        <div className="flex flex-col items-center gap-3 py-6 text-center">
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
                className="border-line bg-surface/60 text-ink placeholder:text-ink-3/70 focus:border-dream-500/50 focus:ring-dream-500/30 w-full rounded-lg border px-4 py-3 text-center text-[14px] outline-none focus:ring-1"
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
                className="border-line bg-surface/60 text-ink placeholder:text-ink-3/70 focus:border-dream-500/50 focus:ring-dream-500/30 w-full rounded-lg border px-4 py-3 text-center text-[16px] tracking-[0.3em] outline-none focus:ring-1"
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

      {phase === 'ready' ? (
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <div className="text-dream-500 text-[10.5px] tracking-[0.32em]">REPLIES</div>
            <button
              type="button"
              onClick={doLogout}
              className="text-ink-3 hover:text-ink text-[11px] tracking-[0.08em] transition-colors"
            >
              退出
            </button>
          </div>

          {needName ? (
            <form onSubmit={submitName} className="mt-6 flex max-w-sm flex-col gap-3">
              <p className="text-ink-3 text-[13px] leading-[1.9] tracking-[0.04em]">
                给自己取个名字，回应时会显示它。
              </p>
              <div className="flex gap-2">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="你的名字"
                  aria-label="昵称"
                  maxLength={20}
                  className="border-line bg-surface/60 text-ink placeholder:text-ink-3/70 focus:border-dream-500/50 focus:ring-dream-500/30 w-full rounded-lg border px-4 py-2.5 text-[14px] outline-none focus:ring-1"
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

          <div className="mt-8 flex flex-wrap gap-2">
            {REACTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => tapReaction(r)}
                disabled={busy}
                className="border-line hover:border-dream-500/50 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[15px] transition-colors duration-300 disabled:opacity-50"
              >
                <span>{r}</span>
                {reactionCounts.has(r) ? (
                  <span className="text-ink-3 text-[11.5px]">{reactionCounts.get(r)}</span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-6">
            {top.length === 0 && replies.length === 0 ? (
              <p className="text-ink-3 text-[13px] tracking-[0.04em]">
                还没有回应，第一个声音会是谁？
              </p>
            ) : (
              top.map((it) => (
                <div key={it.id}>
                  <div className="flex items-baseline gap-3">
                    <span className="text-ink-2 shrink-0 text-[13px]">
                      {it.owner_name || '某位访客'}
                      <span className="text-ink-3 text-[11px]">{ownerLabel(it.owner_id)}</span>
                    </span>
                    <span className="text-ink-3 font-mono text-[10.5px] tracking-[0.06em]">
                      {new Date(it.created_at).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(it.id)
                          setReplyText('')
                        }}
                        className="text-ink-3 hover:text-dream-300 text-[11px] tracking-[0.08em] transition-colors"
                      >
                        回复
                      </button>
                    ) : null}
                    {isOwner || it.owner_id === profile?.id ? (
                      <button
                        type="button"
                        onClick={() => deleteItem(it.id)}
                        className="text-ink-3 text-[11px] tracking-[0.08em] transition-colors hover:text-red-400/80"
                      >
                        删除
                      </button>
                    ) : null}
                  </div>
                  <p className="text-ink mt-1.5 text-[14px] leading-[1.9]">{it.content}</p>

                  {replies
                    .filter((r) => r.reply_to === it.id)
                    .map((r) => (
                      <div key={r.id} className="border-line mt-3 border-l pl-4">
                        <div className="flex items-baseline gap-3">
                          <span className="text-ink-2 shrink-0 text-[13px]">
                            {r.owner_name || '某位访客'}
                            <span className="text-ink-3 text-[11px]">{ownerLabel(r.owner_id)}</span>
                          </span>
                          <span className="text-ink-3 font-mono text-[10.5px]">
                            {new Date(r.created_at).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-ink mt-1.5 text-[14px] leading-[1.9]">{r.content}</p>
                      </div>
                    ))}
                </div>
              ))
            )}
          </div>

          {replyTo != null ? (
            <form onSubmit={postReply} className="mt-8 flex flex-col gap-2">
              <div className="text-ink-3 text-[11.5px] tracking-[0.08em]">
                回复第 {replyTo} 条
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="hover:text-dream-300 ml-2 transition-colors"
                >
                  取消
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="写下回复…"
                  aria-label="回复"
                  className="border-line bg-surface/60 text-ink placeholder:text-ink-3/70 focus:border-dream-500/50 focus:ring-dream-500/30 w-full rounded-lg border px-4 py-2.5 text-[14px] outline-none focus:ring-1"
                />
                <button
                  type="submit"
                  disabled={busy || !replyText.trim()}
                  className="bg-dream-500/15 text-dream-300 hover:bg-dream-500/25 shrink-0 rounded-lg px-4 py-2.5 text-[13px] tracking-[0.1em] transition-colors duration-300 disabled:opacity-40"
                >
                  回复
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={postComment} className="mt-8 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={isOwner ? '写下一段回应…' : '写下只属于你我的回应…'}
                aria-label="回应"
                className="border-line bg-surface/60 text-ink placeholder:text-ink-3/70 focus:border-dream-500/50 focus:ring-dream-500/30 w-full rounded-lg border px-4 py-2.5 text-[14px] outline-none focus:ring-1"
              />
              <button
                type="submit"
                disabled={busy || !comment.trim()}
                className="bg-dream-500/15 text-dream-300 hover:bg-dream-500/25 shrink-0 rounded-lg px-4 py-2.5 text-[13px] tracking-[0.1em] transition-colors duration-300 disabled:opacity-40"
              >
                回应
              </button>
            </form>
          )}

          {error ? <p className="mt-3 text-[12px] text-red-400/80">{error}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
