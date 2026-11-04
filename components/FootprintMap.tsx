'use client'

import { useMemo, useState } from 'react'
import { longDate } from '@/lib/life'
import type { PlacePoint } from '@/lib/places'

const W = 720
const H = 320
const PAD_X = 64
const PAD_Y = 40

type Dot = PlacePoint & { x: number; y: number; r: number }

type Box = { x1: number; y1: number; x2: number; y2: number }

const overlaps = (a: Box, b: Box) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1

/**
 * 自绘经纬度散点：只画自己的坐标点、经纬网与时间连线，
 * 不加载任何底图瓦片，也不涉及行政区划边界。
 * 经度按纬度余弦压缩，避免高纬度被拉宽。
 */
function project(points: PlacePoint[]): Dot[] {
  if (!points.length) return []

  const lngs = points.map((p) => p.lng)
  const lats = points.map((p) => p.lat)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)

  const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  const spanX = Math.max((maxLng - minLng) * kx, 0.02)
  const spanY = Math.max(maxLat - minLat, 0.02)

  const innerW = W - PAD_X * 2
  const innerH = H - PAD_Y * 2
  const scale = Math.min(innerW / spanX, innerH / spanY)
  const offsetX = PAD_X + (innerW - spanX * scale) / 2
  const offsetY = PAD_Y + (innerH - spanY * scale) / 2

  return points.map((p) => ({
    ...p,
    x: offsetX + (p.lng - minLng) * kx * scale,
    y: offsetY + (maxLat - p.lat) * scale,
    r: 4.2 + Math.min(5, p.visits * 1.1),
  }))
}

/**
 * 城市挨得近时标签会互相盖住（苏州和上海只差 80 公里）。
 * 按"记录多的先摆"，依次试右/上左/下，选第一个既不压标签也不压圆点的位置。
 */
function layoutLabels(dots: Dot[]) {
  const result = new Map<string, { dx: number; dy: number; anchor: 'start' | 'end' }>()
  const taken: Box[] = []
  const dotBoxes: Box[] = dots.map((d) => ({
    x1: d.x - d.r - 4,
    y1: d.y - d.r - 4,
    x2: d.x + d.r + 4,
    y2: d.y + d.r + 4,
  }))

  for (const dot of [...dots].sort((a, b) => b.visits - a.visits)) {
    const textW = dot.city.length * 13 + 8
    const candidates: { dx: number; dy: number; anchor: 'start' | 'end' }[] = [
      { dx: dot.r + 9, dy: 4, anchor: 'start' },
      { dx: dot.r + 9, dy: -10, anchor: 'start' },
      { dx: -(dot.r + 9), dy: 4, anchor: 'end' },
      { dx: -(dot.r + 9), dy: -10, anchor: 'end' },
      { dx: dot.r + 9, dy: 18, anchor: 'start' },
      { dx: -(dot.r + 9), dy: 18, anchor: 'end' },
      { dx: 0, dy: -(dot.r + 11), anchor: 'start' },
    ]

    let chosen = candidates[0]
    for (const c of candidates) {
      const box: Box =
        c.anchor === 'start'
          ? {
              x1: dot.x + c.dx,
              y1: dot.y + c.dy - 11,
              x2: dot.x + c.dx + textW,
              y2: dot.y + c.dy + 2,
            }
          : {
              x1: dot.x + c.dx - textW,
              y1: dot.y + c.dy - 11,
              x2: dot.x + c.dx,
              y2: dot.y + c.dy + 2,
            }

      const inBounds = box.x1 > 6 && box.x2 < W - 6 && box.y1 > 6 && box.y2 < H - 6
      const hitLabel = taken.some((t) => overlaps(box, t))
      const hitDot = dotBoxes.some((d) => overlaps(box, d))

      if (inBounds && !hitLabel && !hitDot) {
        chosen = c
        taken.push(box)
        break
      }
    }

    result.set(dot.city, chosen)
  }

  return result
}

export default function FootprintMap({ points }: { points: PlacePoint[] }) {
  const [hover, setHover] = useState<string | null>(null)
  const dots = useMemo(() => project(points), [points])
  const labels = useMemo(() => layoutLabels(dots), [dots])

  if (!dots.length) {
    return (
      <div className="border-line bg-surface/60 rounded-[4px] border border-dashed px-6 py-16 text-center">
        <p className="text-ink-3 text-[13px] tracking-[0.08em]">
          还没有带地点的记录 —— 在日记里填上 place 就会出现在这里
        </p>
      </div>
    )
  }

  const route = [...dots].sort((a, b) => a.latest.localeCompare(b.latest))
  const active = dots.find((p) => p.city === hover) ?? null

  return (
    <div>
      <div className="border-line bg-surface/40 relative overflow-hidden rounded-[4px] border">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="足迹地理分布图"
        >
          <defs>
            <pattern id="fp-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0H0V24" fill="none" stroke="var(--color-line)" strokeWidth="0.5" />
            </pattern>
          </defs>

          <rect x="0" y="0" width={W} height={H} fill="url(#fp-grid)" opacity="0.75" />

          {Array.from({ length: 5 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={PAD_X}
              x2={W - PAD_X}
              y1={PAD_Y + ((H - PAD_Y * 2) / 4) * i}
              y2={PAD_Y + ((H - PAD_Y * 2) / 4) * i}
              stroke="var(--color-line)"
              strokeWidth="0.5"
              strokeDasharray="2 6"
            />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line
              key={`v${i}`}
              y1={PAD_Y}
              y2={H - PAD_Y}
              x1={PAD_X + ((W - PAD_X * 2) / 6) * i}
              x2={PAD_X + ((W - PAD_X * 2) / 6) * i}
              stroke="var(--color-line)"
              strokeWidth="0.5"
              strokeDasharray="2 6"
            />
          ))}

          {route.length > 1 ? (
            <polyline
              points={route.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="var(--color-clay-500)"
              strokeWidth="0.9"
              strokeDasharray="3 5"
              opacity="0.5"
            />
          ) : null}

          {dots.map((p) => {
            const isActive = p.city === hover
            const label = labels.get(p.city) ?? { dx: p.r + 9, dy: 4, anchor: 'start' as const }
            return (
              <g
                key={p.city}
                onMouseEnter={() => setHover(p.city)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p.city)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                role="button"
                aria-label={`${p.city}，${p.visits} 条记录`}
                className="cursor-pointer outline-none"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.r + 10}
                  fill="var(--color-clay-500)"
                  opacity={isActive ? 0.16 : 0.07}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  fill="var(--color-clay-500)"
                  opacity={isActive ? 1 : 0.85}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.r + 3.5}
                  fill="none"
                  stroke="var(--color-clay-500)"
                  strokeWidth="0.6"
                  opacity={isActive ? 0.7 : 0}
                />
                <text
                  x={p.x + label.dx}
                  y={p.y + label.dy}
                  textAnchor={label.anchor}
                  className="font-serif"
                  fontSize="12.5"
                  fill={isActive ? 'var(--color-ink)' : 'var(--color-ink-2)'}
                >
                  {p.city}
                </text>
              </g>
            )
          })}
        </svg>

        <div className="text-ink-3 absolute right-4 bottom-3 text-[10.5px] tracking-[0.12em]">
          圆点大小 = 记录条数
        </div>
      </div>

      <div className="hairline mt-3 flex min-h-[38px] items-center justify-between py-2">
        {active ? (
          <p className="text-[12.5px] tracking-[0.04em]">
            <span className="font-serif text-[14px]">{active.city}</span>
            {active.region ? <span className="text-ink-3"> · {active.region}</span> : null}
            <span className="text-ink-3 ml-3">{active.visits} 条记录</span>
            <span className="text-ink-3 ml-3">最近 {longDate(active.latest)}</span>
          </p>
        ) : (
          <p className="text-ink-3 text-[12px] tracking-[0.06em]">
            把鼠标放到圆点上，或者看下面的地点列表
          </p>
        )}
        <p className="text-ink-3 hidden font-mono text-[10.5px] tracking-[0.14em] sm:block">
          SCATTER / GCJ-02
        </p>
      </div>
    </div>
  )
}
