import { handle } from '@/lib/studio/api'
import { overview } from '@/lib/studio/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return handle(() => overview())
}
