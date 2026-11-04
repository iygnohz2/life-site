/** @type {import("pliny/config").PlinyConfig } */
const siteMetadata = {
  // ↓↓↓ 这里改成你自己的信息 ↓↓↓
  title: '拾光',
  author: 'Ethan',
  headerTitle: '拾光',
  headerSubtitle: 'SINCE 2026',
  description: '一些日常，一些远行，一些没来由的念头。',
  language: 'zh-CN',
  locale: 'zh-CN',
  theme: 'system',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com').replace(/\/$/, ''),
  siteRepo: '',
  siteLogo: `${process.env.BASE_PATH || ''}/static/images/logo.png`,
  socialBanner: `${process.env.BASE_PATH || ''}/static/images/twitter-card.png`,
  email: '',
  github: '',
  // ↑↑↑ 这里改成你自己的信息 ↑↑↑

  stickyNav: true,
  analytics: {},
  search: {
    provider: 'kbar',
    kbarConfig: {
      searchDocumentsPath: `${process.env.BASE_PATH || ''}/search.json`,
    },
  },
  comments: {
    // 已移除评论组件；如以后要接 giscus，把 Comments.tsx 加回来并在这里填 repo 与 repoId
    provider: '',
  },
}

module.exports = siteMetadata
