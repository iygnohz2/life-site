'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Link from './Link'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import SearchButton from './SearchButton'

const Header = () => {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header
      className={`sticky top-0 z-60 transition-all duration-300 ${
        scrolled
          ? 'border-line/70 bg-paper/80 border-b backdrop-blur-md'
          : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          aria-label={siteMetadata.headerTitle}
          className="group flex items-baseline gap-3"
        >
          <span className="font-serif text-[19px] leading-none tracking-[0.18em]">
            {siteMetadata.headerTitle}
          </span>
          {siteMetadata.headerSubtitle ? (
            <span className="eyebrow hidden translate-y-[-1px] sm:inline">
              {siteMetadata.headerSubtitle}
            </span>
          ) : null}
        </Link>

        <div className="flex items-center gap-5 sm:gap-7">
          <nav className="hidden items-center gap-7 sm:flex">
            {headerNavLinks
              .filter((link) => link.href !== '/')
              .map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  data-active={isActive(link.href)}
                  className="ul-grow text-ink-2 hover:text-ink text-[13px] tracking-[0.1em] transition-colors"
                >
                  {link.title}
                </Link>
              ))}
          </nav>
          <div className="text-ink-3 flex items-center gap-3">
            <SearchButton />
            <ThemeSwitch />
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}

export default Header
