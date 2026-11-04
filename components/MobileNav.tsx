'use client'

import { useEffect, useState } from 'react'
import Link from './Link'
import headerNavLinks from '@/data/headerNavLinks'

/**
 * 移动端菜单。
 * 不依赖 headlessui 的 Dialog —— 它的 portal 在 SSR 阶段会渲染成 <span> 占位符，
 * 与客户端结构不一致，React 19 下会触发 hydration mismatch。
 * 这里用纯 CSS 过渡 + 条件渲染，服务端输出保持为空。
 */
const MobileNav = () => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        aria-label="打开菜单"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="text-ink-2 hover:text-ink transition-colors sm:hidden"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path d="M3 7h16M3 15h16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-80 sm:hidden">
          <button
            aria-label="关闭菜单"
            onClick={() => setOpen(false)}
            className="bg-paper/95 absolute inset-0 backdrop-blur-md"
            style={{ animation: 'fadeIn .25s ease both' }}
          />
          <div
            className="bg-paper absolute inset-x-0 top-0 px-6 pt-6 pb-10"
            style={{ animation: 'dropIn .4s cubic-bezier(.22,1,.36,1) both' }}
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow">MENU</span>
              <button
                aria-label="关闭菜单"
                onClick={() => setOpen(false)}
                className="text-ink-2 hover:text-ink transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path
                    d="M4 4l12 12M16 4L4 16"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav className="mt-10 flex flex-col">
              {headerNavLinks.map((link, i) => (
                <Link
                  key={link.title}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="border-line/70 flex items-baseline justify-between border-b py-5"
                  style={{
                    animation: 'rise .5s cubic-bezier(.22,1,.36,1) both',
                    animationDelay: `${80 + i * 55}ms`,
                  }}
                >
                  <span className="font-serif text-[22px] tracking-[0.04em]">{link.title}</span>
                  <span className="text-ink-3 font-mono text-[10px] tracking-[0.2em]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default MobileNav
