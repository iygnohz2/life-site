'use client'

import { useEffect, useRef } from 'react'

/**
 * 背景微光：跟随鼠标的一团极淡暖光。
 * 用 lerp 做阻尼跟随，避免"贴手"的廉价感；尊重 reduced-motion。
 */
export default function Ambient() {
  const glow = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = glow.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let tx = window.innerWidth / 2
    let ty = window.innerHeight * 0.35
    let cx = tx
    let cy = ty
    let raf = 0

    const onMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
    }

    const loop = () => {
      cx += (tx - cx) * 0.045
      cy += (ty - cy) * 0.045
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
      <div
        ref={glow}
        className="absolute -top-1/2 -left-1/2 h-[46rem] w-[46rem] rounded-full opacity-70 blur-[90px]"
        style={{
          background:
            'radial-gradient(circle at center, rgba(179,86,58,0.10) 0%, rgba(179,86,58,0.05) 38%, rgba(179,86,58,0) 68%)',
        }}
      />
    </div>
  )
}
