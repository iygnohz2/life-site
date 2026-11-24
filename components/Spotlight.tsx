'use client'

import { useEffect, useRef } from 'react'

/**
 * 迷雾聚焦：整页像浸在蓝雾里，只有光标附近「对焦显影」，四周蒙上一层雾。
 * 用一层径向渐变实现（中心透明 → 四周雾色），CSS 变量 --mx/--my 平滑跟随鼠标，
 * 不碰 backdrop-filter，性能可控；prefers-reduced-motion 时定格在页面中上部。
 */
export default function Spotlight() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let tx = window.innerWidth / 2
    let ty = window.innerHeight * 0.3
    let cx = tx
    let cy = ty
    let raf = 0

    const onMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
    }
    const loop = (now: number) => {
      cx += (tx - cx) * 0.07
      cy += (ty - cy) * 0.07
      // 节流到约 30fps，减少径向渐变的整层重绘
      if (now - lastWrite > 32) {
        el.style.setProperty('--mx', cx.toFixed(1) + 'px')
        el.style.setProperty('--my', cy.toFixed(1) + 'px')
        lastWrite = now
      }
      raf = requestAnimationFrame(loop)
    }

    let lastWrite = 0
    el.style.setProperty('--mx', tx.toFixed(1) + 'px')
    el.style.setProperty('--my', ty.toFixed(1) + 'px')
    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[15]"
      style={{
        background: `radial-gradient(260px circle at var(--mx, 50%) var(--my, 40%), color-mix(in oklab, var(--color-dream-400) 15%, transparent) 0%, transparent 72%),
        radial-gradient(660px circle at var(--mx, 50%) var(--my, 40%), transparent 0, transparent 52%, color-mix(in oklab, var(--color-dream-600) 28%, transparent) 100%)`,
      }}
    />
  )
}
