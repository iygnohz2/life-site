/** @type {import("pliny/config").PlinyConfig } */
const siteMetadata = {
  // ↓↓↓ 这里改成你自己的信息 ↓↓↓
  title: "iygnohz's DreamLand",
  author: 'iygnohz2',
  headerTitle: "iygnohz's DreamLand",
  headerSubtitle: 'SINCE 2026',
  description: '梦是通往潜意识的皇家大道 —— 西格蒙德·弗洛伊德',
  // 首页引文（拆成正文与署名，方便排版成右下角题注）
  quote: {
    text: '梦是通往潜意识的皇家大道',
    emphasis: '皇家大道',
    author: '西格蒙德·弗洛伊德',
  },
  // 页脚等处用的短句，避免长引文塞满一行
  tagline: '一些日常，一些远行，一些没来由的念头。',
  language: 'zh-CN',
  locale: 'zh-CN',
  theme: 'dark',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'https://iygnohz.cn').replace(/\/$/, ''),
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
