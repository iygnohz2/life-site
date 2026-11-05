'use client'

type Api<T> = { ok: boolean; data?: T; error?: string }

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init })
  const json = (await res.json()) as Api<T>
  if (!json.ok) throw new Error(json.error || `请求失败 (${res.status})`)
  return json.data as T
}

export type PostFrontmatter = {
  title?: string
  date?: string
  mood?: string
  weather?: string
  place?: string
  summary?: string
  tags?: string[]
  draft?: boolean
}

export type PostSummary = {
  slug: string
  title: string
  date: string
  summary?: string
  mood?: string
  weather?: string
  place?: string
  tags: string[]
  draft?: boolean
}

export type Overview = {
  posts: number
  drafts: number
  photos: number
  books: number
  trips: number
  cities: number
  recent: PostSummary[]
}

export type PhotoItem = {
  name: string
  date: string
  meta: { caption?: string; place?: string }
}

export type GitState = {
  files: { status: string; path: string }[]
  ahead: number
  branch: string
}

export const api = {
  overview: () => call<Overview>('/api/studio/overview'),

  posts: () => call<PostSummary[]>('/api/studio/posts'),
  post: (slug: string) =>
    call<{ slug: string; frontmatter: PostFrontmatter; body: string }>(
      `/api/studio/posts?slug=${encodeURIComponent(slug)}`
    ),
  savePost: (payload: Record<string, unknown>) =>
    call<{ slug: string; file: string }>('/api/studio/posts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  deletePost: (slug: string) =>
    call(`/api/studio/posts?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' }),

  photos: () => call<PhotoItem[]>('/api/studio/photos'),
  uploadPhoto: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return call<{ name: string; width: number; height: number; bytes: number }>(
      '/api/studio/photos',
      { method: 'POST', body: form }
    )
  },
  savePhotoMeta: (name: string, caption: string, place: string) =>
    call('/api/studio/photos', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, caption, place }),
    }),

  git: () => call<GitState>('/api/studio/git'),
  publish: (message: string) =>
    call<{ message: string; files: unknown[]; pushed: boolean; commit?: string }>(
      '/api/studio/git',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message }),
      }
    ),
}
