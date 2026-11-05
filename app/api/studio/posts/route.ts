import type { NextRequest } from 'next/server'
import { handle } from '@/lib/studio/api'
import { listPosts, readPost, savePost, deletePost } from '@/lib/studio/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  return handle(() => (slug ? readPost(slug) : listPosts()))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  return handle(() => savePost(body))
}

export async function DELETE(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || ''
  return handle(() => deletePost(slug))
}
