'use client'

import { useEffect, useRef } from 'react'

/**
 * 光标星尘：鼠标划过拖出一串克莱因蓝光粒，带惯性散开、轻微下坠、逐渐淡出。
 * 粒子用 globalCompositeOperation='lighter' 叠加出冷光；数量封顶、页面不可见时暂停、
 * prefers-reduced-motion 时完全不启动。
 */

type RGB = [number, number, number]

function hexToRgb(hex: string): RGB | null {
  const h = hex.trim().replace('#', '')
  if (h.length === 3) {
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
  }
  if (h.length === 6) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  return null
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  c: 0 | 1
}

const MAX_PARTICLES = 150

export default function CursorTrail() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let w = 0
    let h = 0
    let raf = 0
    let running = true
    let mx = -100
    let my = -100
    let lx = -100
    let ly = -100
    let hasMouse = false

    const particles: Particle[] = []
    const colors: { dream: RGB; mist: RGB } = {
      dream: [134, 165, 255],
      mist: [168, 198, 224],
    }

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement)
      colors.dream = hexToRgb(cs.getPropertyValue('--color-dream-300')) ?? colors.dream
      colors.mist = hexToRgb(cs.getPropertyValue('--color-mist-300')) ?? colors.mist
    }

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      cv.width = Math.max(1, Math.floor(w * dpr))
      cv.height = Math.max(1, Math.floor(h * dpr))
      cv.style.width = w + 'px'
      cv.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      if (!hasMouse) {
        lx = mx
        ly = my
      }
      hasMouse = true
    }

    const spawn = (n: number, x: number, y: number, dx: number, dy: number) => {
      for (let i = 0; i < n; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift()
        const ang = Math.random() * Math.PI * 2
        const sp = 0.3 + Math.random() * 1.7
        particles.push({
          x,
          y,
          vx: dx * 0.32 + Math.cos(ang) * sp,
          vy: dy * 0.32 + Math.sin(ang) * sp - 0.25,
          life: 0,
          max: 36 + Math.random() * 46,
          size: 1.1 + Math.random() * 1.9,
          c: Math.random() < 0.72 ? 0 : 1,
        })
      }
    }

    const step = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      if (hasMouse) {
        const dx = mx - lx
        const dy = my - ly
        const dist = Math.hypot(dx, dy)
        if (dist > 1.5) {
          const n = Math.min(3, Math.floor(dist / 20) + 1)
          spawn(n, mx, my, dx / Math.max(1, dist), dy / Math.max(1, dist))
        }
        lx = mx
        ly = my
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        if (p.life >= p.max) {
          particles.splice(i, 1)
          continue
        }
        p.vx *= 0.965
        p.vy = p.vy * 0.965 + 0.055
        p.x += p.vx
        p.y += p.vy
        const t = p.life / p.max
        const a = (1 - t) * (1 - t)
        const r = p.size * (1 - t * 0.55)
        const rgb = p.c === 0 ? colors.dream : colors.mist
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(a * 0.95).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    const loop = () => {
      if (!running) return
      step()
      raf = requestAnimationFrame(loop)
    }

    const onVis = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!running) {
        running = true
        raf = requestAnimationFrame(loop)
      }
    }

    readColors()
    resize()
    const mo = new MutationObserver(() => readColors())
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVis)
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
      mo.disconnect()
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[14]" />
}
