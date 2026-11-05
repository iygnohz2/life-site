import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 线上环境一律拒绝。本地 dev 直接可用；
 * 用 next start 预览时需显式设置 STUDIO_ALLOW=1。
 */
function isAllowed() {
  if (process.env.VERCEL) return false
  return process.env.STUDIO_ALLOW === '1' || process.env.NODE_ENV !== 'production'
}

export async function handle<T>(fn: () => Promise<T> | T) {
  if (!isAllowed()) {
    return NextResponse.json({ ok: false, error: '工作台仅在本地环境可用' }, { status: 403 })
  }
  try {
    return NextResponse.json({ ok: true, data: await fn() })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message || '未知错误' }, { status: 400 })
  }
}
