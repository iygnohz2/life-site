import { writeFileSync, mkdirSync } from 'fs'
import { escape } from 'pliny/utils/htmlEscaper.js'
import siteMetadata from '../data/siteMetadata.js'
import { allLives } from '../.contentlayer/generated/index.mjs'

const outputFolder = process.env.EXPORT ? 'out' : 'public'

const item = (config, post) => `
  <item>
    <guid>${config.siteUrl}/${post.path}/</guid>
    <title>${escape(post.title)}</title>
    <link>${config.siteUrl}/${post.path}/</link>
    ${post.summary ? `<description>${escape(post.summary)}</description>` : ''}
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    <author>${config.email ? `${config.email} (${config.author})` : config.author}</author>
    ${(post.tags || []).map((tag) => `<category>${escape(tag)}</category>`).join('')}
  </item>`

const channel = (config, posts) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(config.title)}</title>
    <link>${config.siteUrl}/</link>
    <description>${escape(config.description)}</description>
    <language>${config.language}</language>
    <managingEditor>${config.email ? `${config.email} (${config.author})` : config.author}</managingEditor>
    <webMaster>${config.email ? `${config.email} (${config.author})` : config.author}</webMaster>
    <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>
    <atom:link href="${config.siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${posts.map((post) => item(config, post)).join('')}
  </channel>
</rss>
`

const rss = () => {
  const published = allLives
    .filter((post) => post.draft !== true)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  if (!published.length) {
    console.log('RSS: 没有可发布的生活记录，跳过')
    return
  }

  mkdirSync(outputFolder, { recursive: true })
  writeFileSync(`./${outputFolder}/feed.xml`, channel(siteMetadata, published))
  console.log(`RSS feed generated... (${published.length} 条)`)
}

export default rss
