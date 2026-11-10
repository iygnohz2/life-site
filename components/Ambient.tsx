'use client'

import { useEffect, useRef } from 'react'

/**
 * 氛围：全屏雾场（Canvas）+ 一层大颗粒乳浊 + 跟随鼠标的一点冷光。
 *
 * 雾场三层，全部极低透明度、极慢速度，制造"梦里没显影匀、雾在呼吸"的朦胧感：
 *   1. 雾纱  —— 平铺的低频噪声，整体缓慢漂移 + 极慢旋转（细密的雾颗粒）
 *   2. 游雾带 —— 几条横向的椭圆软斑，跨屏缓缓游过（像地平线上的薄雾）
 *   3. 大气雾团 —— 数团 Lissajous 漂移的大光斑，互相吞没、明暗起伏（浓雾翻涌）
 *
 * 性能：约 30fps、DPR 封顶 1.5、页面不可见时暂停、prefers-reduced-motion 时定格一帧。
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

// 确定性伪随机：同一批雾在每次 resize 后保持同一形状，不跳变
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

type Blob = {
  c: 0 | 1
  bx: number
  by: number
  br: number
  alpha: number
  ax: number
  ay: number
  sx: number
  sy: number
  px: number
  py: number
  sr: number
  pr: number
  sa: number
  pa: number
}

type Band = {
  c: 0 | 1
  bx: number
  by: number
  rx: number
  ry: number
  alpha: number
  ax: number
  sx: number
  px: number
}

export default function Ambient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glow = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const ctx2d = canvasEl.getContext('2d')
    if (!ctx2d) return
    // 窄化后用确定非空类型的别名，闭包内不再有 possibly-null 报错
    const cv: HTMLCanvasElement = canvasEl
    const c2d: CanvasRenderingContext2D = ctx2d

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let raf = 0
    let running = true
    let start = performance.now()
    let lastFrame = 0
    let pausedAt = 0

    const colors: { dream: RGB; mist: RGB } = {
      dream: [157, 176, 210],
      mist: [143, 176, 168],
    }
    const veilSize = 512
    // 雾的流动速度系数（微调入口：调大=更快，调小=更慢）
    const speed = 1.5
    let veilPattern: CanvasPattern | null = null

    let blobs: Blob[] = []
    let bands: Band[] = []

    // 低频噪声瓦片：多个软圆斑叠出云状明暗，边界做 3x3 wrap 保证平铺无缝
    function makeVeilTile(size: number, rgb: RGB): HTMLCanvasElement {
      const c = document.createElement('canvas')
      c.width = c.height = size
      const g = c.getContext('2d')
      if (!g) return c
      const layers = [
        { n: 26, r: 0.22, a: 0.5 },
        { n: 64, r: 0.12, a: 0.42 },
        { n: 140, r: 0.055, a: 0.34 },
      ]
      for (const L of layers) {
        for (let i = 0; i < L.n; i++) {
          const x = Math.random() * size
          const y = Math.random() * size
          const r = L.r * size * (0.5 + Math.random())
          for (let ox = -1; ox <= 1; ox++) {
            for (let oy = -1; oy <= 1; oy++) {
              const cx = x + ox * size
              const cy = y + oy * size
              const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r)
              gr.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${L.a})`)
              gr.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`)
              g.fillStyle = gr
              g.beginPath()
              g.arc(cx, cy, r, 0, Math.PI * 2)
              g.fill()
            }
          }
        }
      }
      return c
    }

    function readColors() {
      const cs = getComputedStyle(document.documentElement)
      colors.dream = hexToRgb(cs.getPropertyValue('--color-dream-500')) ?? colors.dream
      colors.mist = hexToRgb(cs.getPropertyValue('--color-mist-500')) ?? colors.mist
      veilPattern = c2d.createPattern(makeVeilTile(veilSize, colors.dream), 'repeat')
    }

    function initShapes() {
      const maxDim = Math.max(w, h)
      blobs = []
      const N = 7
      for (let i = 0; i < N; i++) {
        blobs.push({
          c: (i % 2) as 0 | 1,
          bx: 0.1 + 0.8 * hash(i + 1),
          by: 0.08 + 0.84 * hash(i + 2),
          br: (0.24 + 0.36 * hash(i + 3)) * maxDim,
          alpha: 0.06 + 0.07 * hash(i + 4),
          ax: (0.04 + 0.13 * hash(i + 5)) * w,
          ay: (0.05 + 0.15 * hash(i + 6)) * h,
          sx: (0.05 + 0.13 * hash(i + 7)) * speed,
          sy: (0.04 + 0.11 * hash(i + 8)) * speed,
          px: hash(i + 9) * Math.PI * 2,
          py: hash(i + 10) * Math.PI * 2,
          sr: 0.05 + 0.11 * hash(i + 11),
          pr: hash(i + 12) * Math.PI * 2,
          sa: 0.06 + 0.14 * hash(i + 13),
          pa: hash(i + 14) * Math.PI * 2,
        })
      }
      bands = []
      const BN = 4
      const heights = [0.16, 0.4, 0.66, 0.9]
      for (let i = 0; i < BN; i++) {
        bands.push({
          c: (i % 2) as 0 | 1,
          bx: hash(i + 30),
          by: heights[i] + (hash(i + 31) - 0.5) * 0.05,
          rx: (0.55 + 0.35 * hash(i + 32)) * w,
          ry: (0.06 + 0.09 * hash(i + 33)) * h,
          alpha: 0.04 + 0.04 * hash(i + 34),
          ax: (0.12 + 0.22 * hash(i + 35)) * w,
          sx: (0.03 + 0.06 * hash(i + 36)) * speed,
          px: hash(i + 37) * Math.PI * 2,
        })
      }
    }

    function resize() {
      w = window.innerWidth
      h = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      cv.width = Math.max(1, Math.floor(w * dpr))
      cv.height = Math.max(1, Math.floor(h * dpr))
      cv.style.width = w + 'px'
      cv.style.height = h + 'px'
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0)
      initShapes()
      if (reduced) draw(performance.now())
    }

    function drawBlob(x: number, y: number, r: number, rgb: RGB, alpha: number) {
      const rr = Math.max(r, 1)
      const g = c2d.createRadialGradient(x, y, 0, x, y, rr)
      g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`)
      g.addColorStop(0.6, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha * 0.55})`)
      g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`)
      c2d.fillStyle = g
      c2d.beginPath()
      c2d.arc(x, y, rr, 0, Math.PI * 2)
      c2d.fill()
    }

    function drawEllipse(x: number, y: number, rx: number, ry: number, rgb: RGB, alpha: number) {
      c2d.save()
      c2d.translate(x, y)
      c2d.scale(Math.max(rx, 1), Math.max(ry, 1))
      const g = c2d.createRadialGradient(0, 0, 0, 0, 0, 1)
      g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`)
      g.addColorStop(0.7, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha * 0.5})`)
      g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`)
      c2d.fillStyle = g
      c2d.beginPath()
      c2d.arc(0, 0, 1, 0, Math.PI * 2)
      c2d.fill()
      c2d.restore()
    }

    function draw(now: number) {
      const t = (now - start) / 1000
      c2d.clearRect(0, 0, w, h)

      // 1. 雾纱：整体缓慢漂移 + 极慢旋转
      if (veilPattern) {
        c2d.save()
        c2d.globalAlpha = 0.06
        const ox = (t * 6 * speed) % veilSize
        const oy = (t * 4 * speed) % veilSize
        c2d.translate(w / 2, h / 2)
        c2d.rotate(t * 0.002 * speed)
        c2d.translate(-w / 2, -h / 2)
        c2d.fillStyle = veilPattern
        c2d.fillRect(-ox - veilSize, -oy - veilSize, w + veilSize * 2, h + veilSize * 2)
        c2d.restore()
      }

      // 2. 游雾带：跨屏横向游过
      for (const b of bands) {
        const x = b.bx * w + b.ax * Math.sin(t * b.sx + b.px)
        const y = b.by * h
        drawEllipse(x, y, b.rx, b.ry, b.c === 0 ? colors.dream : colors.mist, b.alpha)
      }

      // 3. 大气雾团：Lissajous 漂移 + 明暗/大小起伏
      for (const b of blobs) {
        const x = b.bx * w + b.ax * Math.sin(t * b.sx + b.px)
        const y = b.by * h + b.ay * Math.sin(t * b.sy + b.py)
        const r = b.br * (1 + 0.1 * Math.sin(t * b.sr + b.pr))
        const a = b.alpha * (1 + 0.28 * Math.sin(t * b.sa + b.pa))
        drawBlob(x, y, r, b.c === 0 ? colors.dream : colors.mist, a)
      }
    }

    function loop(now: number) {
      if (!running) return
      if (now - lastFrame < 33) {
        raf = requestAnimationFrame(loop)
        return
      }
      lastFrame = now
      draw(now)
      raf = requestAnimationFrame(loop)
    }

    const onVis = () => {
      if (document.hidden) {
        pausedAt = performance.now()
        cancelAnimationFrame(raf)
        running = false
      } else if (!running) {
        if (pausedAt) {
          start += performance.now() - pausedAt
          pausedAt = 0
        }
        running = true
        lastFrame = 0
        raf = requestAnimationFrame(loop)
      }
    }

    // 主题切换（浅/深色）时重新读取雾的颜色
    const mo = new MutationObserver(() => readColors())
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    readColors()
    resize()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVis)

    if (!reduced) {
      raf = requestAnimationFrame(loop)
    }

    // --- 鼠标冷光（保留原实现） ---
    const el = glow.current
    let tx = window.innerWidth / 2
    let ty = window.innerHeight * 0.28
    let cx = tx
    let cy = ty
    let glowRaf = 0
    const onMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
    }
    const glowLoop = () => {
      cx += (tx - cx) * 0.035
      cy += (ty - cy) * 0.035
      if (el) el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`
      glowRaf = requestAnimationFrame(glowLoop)
    }
    if (!reduced) {
      window.addEventListener('mousemove', onMove, { passive: true })
      glowRaf = requestAnimationFrame(glowLoop)
    }

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(glowRaf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('visibilitychange', onVis)
      mo.disconnect()
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 雾场 */}
      <canvas ref={canvasRef} className="absolute inset-0" />

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
