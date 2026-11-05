import type { NextRequest } from 'next/server'
import { handle } from '@/lib/studio/api'
import { listPhotos, savePhoto, savePhotoMeta } from '@/lib/studio/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return handle(() => listPhotos())
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return handle(() => {
      throw new Error('没有收到文件')
    })
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  return handle(() => savePhoto(file.name, buffer))
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  return handle(() => savePhotoMeta(body.name, { caption: body.caption, place: body.place }))
}
