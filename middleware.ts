import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 工作台只允许本机 / 局域网访问。
 * 部署到线上（VERCEL 环境）时一律 404，避免把编辑入口暴露出去。
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/studio') && !pathname.startsWith('/api/studio')) {
    return NextResponse.next()
  }

  const host = (req.headers.get('host') || '').split(':')[0]
  const isLocalHost =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]' ||
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)

  if (process.env.VERCEL || !isLocalHost) {
    return NextResponse.rewrite(new URL('/404', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/studio/:path*', '/api/studio/:path*'],
}
