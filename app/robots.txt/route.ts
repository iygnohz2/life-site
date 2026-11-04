import siteMetadata from '@/data/siteMetadata'

export const dynamic = 'force-static'

/**
 * 注意：这里用 route handler 而不是 app/robots.ts。
 * 工程路径中含单引号字符，Next 的 metadata route loader 在生成
 * `throw new Error('... "PATH"')` 时会把路径拼进单引号字符串里导致语法错误。
 */
export function GET() {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${siteMetadata.siteUrl}/sitemap.xml`,
    '',
  ].join('\n')

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
