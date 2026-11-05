'use client'

import { useEffect, useRef } from 'react'

/** 顶部阅读进度：一根 1px 的陶土色细线 */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bar.current
    if (!el) return

    let raf = 0
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0
      el.style.transform = `scaleX(${ratio})`
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed top-0 left-0 z-70 h-px w-full">
      <div
        ref={bar}
        className="bg-dream-500 h-px w-full origin-left"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}
