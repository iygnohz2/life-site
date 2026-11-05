'use client'

import { useEffect, useRef } from 'react'

/**
 * 氛围：两层极慢互吞的雾 + 一层大颗粒乳浊 + 跟随鼠标的一点冷光。
 * 不用圆形渐变堆彩，靠不规则的大尺度噪声制造"没显影匀"的感觉。
 */
export default function Ambient() {
  const glow = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = glow.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let tx = window.innerWidth / 2
    let ty = window.innerHeight * 0.28
    let cx = tx
    let cy = ty
    let raf = 0

    const onMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
    }

    const loop = () => {
      cx += (tx - cx) * 0.035
      cy += (ty - cy) * 0.035
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
      {/* 乳浊：整幅拉伸的大尺度噪声，避免平铺接缝 */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='1200'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='4' seed='7'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E\")",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* 雾团 A：从左上缓慢下沉 */}
      <div
        className="drift-a absolute -top-[30rem] -left-[26rem] h-[60rem] w-[60rem] rounded-full blur-[140px]"
        style={{
          background:
            'radial-gradient(circle at center, color-mix(in oklab, var(--color-dream-500) 30%, transparent) 0%, transparent 65%)',
        }}
      />

      {/* 雾团 B：右下，更淡，和 A 互相吞没 */}
      <div
        className="drift-b absolute -right-[28rem] -bottom-[30rem] h-[54rem] w-[54rem] rounded-full blur-[150px]"
        style={{
          background:
            'radial-gradient(circle at center, color-mix(in oklab, var(--color-mist-500) 22%, transparent) 0%, transparent 66%)',
        }}
      />

      {/* 鼠标冷光 */}
      <div
        ref={glow}
        className="absolute -top-1/2 -left-1/2 h-[34rem] w-[34rem] rounded-full blur-[110px]"
        style={{
          background:
            'radial-gradient(circle at center, color-mix(in oklab, var(--color-dream-300) 16%, transparent) 0%, transparent 62%)',
        }}
      />
    </div>
  )
}
