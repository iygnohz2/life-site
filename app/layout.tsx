import 'css/tailwind.css'
import 'pliny/search/algolia.css'
import 'remark-github-blockquote-alert/alert.css'
// 中文衬线：本机（及多数 Windows）没有可用的宋体回退，必须自托管
import '@fontsource/noto-serif-sc/400.css'
import '@fontsource/noto-serif-sc/500.css'

import { SearchProvider, SearchConfig } from 'pliny/search'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Ambient from '@/components/Ambient'
import CursorTrail from '@/components/CursorTrail'
import Spotlight from '@/components/Spotlight'
import TimeTint from '@/components/TimeTint'
import ScrollProgress from '@/components/ScrollProgress'
import MusicPlayer from '@/components/MusicPlayer'
import { getTracks } from '@/lib/music.server'
import siteMetadata from '@/data/siteMetadata'
import { ThemeProviders } from './theme-providers'
import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    default: `${siteMetadata.title} · ${siteMetadata.description}`,
    template: `%s · ${siteMetadata.title}`,
  },
  description: siteMetadata.description,
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: './',
    siteName: siteMetadata.title,
    images: [siteMetadata.socialBanner],
    locale: siteMetadata.locale,
    type: 'website',
  },
  alternates: {
    canonical: './',
    types: {
      'application/rss+xml': `${siteMetadata.siteUrl}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const basePath = process.env.BASE_PATH || ''
  const tracks = getTracks()

  return (
    <html lang={siteMetadata.language} className="scroll-smooth" suppressHydrationWarning>
      <link
        rel="apple-touch-icon"
        sizes="76x76"
        href={`${basePath}/static/favicons/apple-touch-icon.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={`${basePath}/static/favicons/favicon-32x32.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={`${basePath}/static/favicons/favicon-16x16.png`}
      />
      <link rel="manifest" href={`${basePath}/static/favicons/site.webmanifest`} />
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#eef1f7" />
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#070b18" />
      <link rel="alternate" type="application/rss+xml" href={`${basePath}/feed.xml`} />
      <body className="text-ink font-sans antialiased">
        {/* IKB 颜料晕染：全局 SVG 湍流滤镜，供 .ink-blob 引用做有机边缘 */}
        <svg aria-hidden className="absolute h-0 w-0" focusable="false">
          <defs>
            <filter id="ikb-ink" x="-60%" y="-60%" width="220%" height="220%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012 0.02"
                numOctaves="3"
                seed="7"
                result="n"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="n"
                scale="34"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
        <ThemeProviders>
          <Ambient />
          <CursorTrail />
          <Spotlight />
          <ScrollProgress />
          <TimeTint />
          <SearchProvider searchConfig={siteMetadata.search as SearchConfig}>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </SearchProvider>
          {tracks.length > 0 ? <MusicPlayer tracks={tracks} /> : null}
        </ThemeProviders>
      </body>
    </html>
  )
}
