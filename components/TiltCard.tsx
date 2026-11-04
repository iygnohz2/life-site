'use client'

import { useRef } from 'react'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  /** 最大倾斜角度 */
  max?: number
}

/**
 * 卡片微倾斜：跟随指针的 3D 倾角 + 一道柔和高光。
 * 位移很小（默认 5°），要的是"纸片被手指压了一下"的手感。
 */
export default function TiltCard({ children, className = '', max = 5 }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const shine = useRef<HTMLDivElement>(null)

  const reset = () => {
    if (inner.current) inner.current.style.transform = 'rotateX(0deg) rotateY(0deg)'
    if (shine.current) shine.current.style.opacity = '0'
  }

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = wrap.current
    if (!el || !inner.current) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const rx = (0.5 - py) * 2 * max
    const ry = (px - 0.5) * 2 * max
    inner.current.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
    if (shine.current) {
      shine.current.style.opacity = '1'
      shine.current.style.background = `radial-gradient(320px circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(255,253,248,0.16), transparent 65%)`
    }
  }

  return (
    <div
      ref={wrap}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`[perspective:900px] ${className}`}
    >
      <div
        ref={inner}
        className="relative h-full transition-transform duration-300 ease-out will-change-transform [transform-style:preserve-3d]"
      >
        {children}
        <div
          ref={shine}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500"
        />
      </div>
    </div>
  )
}
