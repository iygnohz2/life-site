import type { NextRequest } from 'next/server'
import { handle } from '@/lib/studio/api'
import { gitStatus, publish } from '@/lib/studio/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return handle(() => gitStatus())
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  return handle(() => publish(body.message))
}
