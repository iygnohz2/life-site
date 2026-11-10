import siteMetadata from '@/data/siteMetadata'
import { allLives } from 'contentlayer/generated'

export const dynamic = 'force-static'

type Life = { path: string; date: string; draft?: boolean; locked?: boolean }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function GET() {
  const base = siteMetadata.siteUrl.replace(/\/$/, '')
  const today = new Date().toISOString().split('T')[0]

  const staticRoutes = ['', 'life', 'photos', 'places', 'books', 'about'].map((r) => ({
    loc: `${base}/${r}`,
    lastmod: today,
  }))

  const lifeRoutes = (allLives as unknown as Life[])
    .filter((p) => !p.draft && !p.locked)
    .map((p) => ({ loc: `${base}/${p.path}`, lastmod: p.date.split('T')[0] }))

  const toUrl = (loc: string, lastmod: string) =>
    `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`

  const urls = [...staticRoutes, ...lifeRoutes].map((u) => toUrl(u.loc, u.lastmod)).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
