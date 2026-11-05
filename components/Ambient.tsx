'use client'

import { useEffect, useRef } from 'react'

/**
 * 背景氛围：两团极缓慢漂移的光雾 + 跟随鼠标的一点微光。
 * 漂移用 CSS 动画（20s~40s），鼠标光用 lerp 阻尼跟随，避免"贴手"的廉价感。
 */
export default function Ambient() {
  const glow = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = glow.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let tx = window.innerWidth / 2
    let ty = window.innerHeight * 0.32
    let cx = tx
    let cy = ty
    let raf = 0

    const onMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
    }

    const loop = () => {
      cx += (tx - cx) * 0.04
      cy += (ty - cy) * 0.04
      el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 漂移雾团 A：左上，偏紫 */}
      <div
        className="drift-a absolute -top-[28rem] -left-[22rem] h-[52rem] w-[52rem] rounded-full blur-[120px]"
        style={{
          background:
            'radial-gradient(circle at center, color-mix(in oklab, var(--color-dream-500) 22%, transparent) 0%, transparent 68%)',
        }}
      />
      {/* 漂移雾团 B：右下，偏青 */}
      <div
        className="drift-b absolute -right-[24rem] -bottom-[26rem] h-[48rem] w-[48rem] rounded-full blur-[130px]"
        style={{
          background:
            'radial-gradient(circle at center, color-mix(in oklab, var(--color-mist-500) 18%, transparent) 0%, transparent 66%)',
        }}
      />
      {/* 鼠标跟随微光 */}
      <div
        ref={glow}
        className="absolute -top-1/2 -left-1/2 h-[38rem] w-[38rem] rounded-full blur-[100px]"
        style={{
          background:
            'radial-gradient(circle at center, color-mix(in oklab, var(--color-dream-400) 14%, transparent) 0%, transparent 64%)',
        }}
      />
    </div>
  )
}
