'use client'

import type { CSSProperties } from 'react'

/** 确定性伪随机：同一个 index 永远得到同一个 0..1 的数 */
function drift01(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

type ScatterTextProps = {
  /** 要散乱的文字 */
  text: string
  /** 散乱种子，不同实例用不同值避免千篇一律 */
  seed?: number
  /** 需要高亮的子串（如「值得记下」） */
  emphasis?: string
  /** 高亮颜色 class，默认 text-dream-300 */
  emphasisClass?: string
  /** 排列方向：h 横排 / v 竖排 / cloud 散成一团 */
  direction?: 'h' | 'v' | 'cloud'
  /** 是否悬停归位，默认 true */
  hoverable?: boolean
  /** 散乱强度（主要作用于旋转角度），默认 1 */
  intensity?: number
  /** 加到容器上的 class（字号、字体、间距等） */
  className?: string
}

/**
 * 散乱文字：把一段文字拆成单个字符，各自错位 + 微旋转，悬停时缓缓归位（像显影对焦）。
 * direction=cloud 时字脱离行列，在椭圆区域内散成一团（字云）。
 */
export default function ScatterText({
  text,
  seed = 1,
  emphasis = '',
  emphasisClass = 'text-dream-300',
  direction = 'h',
  hoverable = true,
  intensity = 1,
  className = '',
}: ScatterTextProps) {
  const chars = Array.from(text)
  const emStart = emphasis ? text.indexOf(emphasis) : -1
  const emEnd = emStart >= 0 ? emStart + emphasis.length : -1
  const isEm = (i: number) => i >= emStart && i < emEnd

  // 散团：每个字绝对定位，在椭圆内散开（中心略密）。
  // 悬停时字向中心收拢、恢复成竖排一列（可读，不重叠）。
  if (direction === 'cloud') {
    const items = chars.map((ch, i) => ({ ch, i })).filter(({ ch }) => !/\s/.test(ch))
    const n = items.length
    // 散落半径（em）—— 梦境要"四处散开"，半径偏大
    const radiusX = 4.2
    const radiusY = 5.2
    // 收拢后的竖排字距（em）
    const lineStep = 1.32
    return (
      <span className={`scatter-cloud ${hoverable ? '' : 'scatter-static'} ${className}`}>
        {items.map(({ ch, i }, k) => {
          const ang = drift01(i + seed * 7) * Math.PI * 2
          const rr = Math.sqrt(drift01(i + seed * 11))
          const x = (Math.cos(ang) * rr * radiusX).toFixed(3)
          const y = (Math.sin(ang) * rr * radiusY).toFixed(3)
          const rot = Math.round((drift01(i + seed * 3) - 0.5) * 36 * intensity)
          const o = (0.72 + drift01(i + seed * 5) * 0.28).toFixed(2)
          // 收拢目标：竖排一列，逐字向下排开，整体居中
          const sy = ((k - (n - 1) / 2) * lineStep).toFixed(3)
          // 漂浮：每字不同的幅度、周期与相位，缓慢地各自浮动
          const fx = ((drift01(i + seed * 13) - 0.5) * 0.6).toFixed(3)
          const fy = ((drift01(i + seed * 17) - 0.5) * 0.7).toFixed(3)
          const fr = ((drift01(i + seed * 29) - 0.5) * 6).toFixed(2)
          const fdNum = 6 + drift01(i + seed * 19) * 4
          const fdelay = (-drift01(i + seed * 23) * fdNum).toFixed(2)
          const style = {
            '--x': `${x}em`,
            '--y': `${y}em`,
            '--sy': `${sy}em`,
            '--rot': `${rot}deg`,
            '--o': o,
            '--fx': `${fx}em`,
            '--fy': `${fy}em`,
            '--fr': `${fr}deg`,
            '--fd': `${fdNum.toFixed(2)}s`,
            '--fdelay': `${fdelay}s`,
          } as CSSProperties
          return (
            <span key={i} className={`scatter-char ${isEm(i) ? emphasisClass : ''}`} style={style}>
              <span className="cloud-float">{ch}</span>
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <span
      className={`scatter scatter-${direction} ${hoverable ? '' : 'scatter-static'} ${className}`}
    >
      {chars.map((ch, i) => {
        if (/\s/.test(ch)) {
          return (
            <span key={i} className="inline-block">
              &nbsp;
            </span>
          )
        }
        const a = drift01(i + seed * 97)
        const b = drift01(i + seed * 131 + 17)
        const dx = ((a - 0.5) * 0.22 * intensity).toFixed(3)
        const dy = ((b - 0.5) * 0.16 * intensity).toFixed(3)
        const rot = Math.round((a - 0.5) * 18 * intensity)
        const o = (0.72 + b * 0.28).toFixed(2)
        const style = {
          '--dx': `${dx}em`,
          '--dy': `${dy}em`,
          '--rot': `${rot}deg`,
          '--o': o,
        } as CSSProperties
        return (
          <span key={i} className={`scatter-char ${isEm(i) ? emphasisClass : ''}`} style={style}>
            {ch}
          </span>
        )
      })}
    </span>
  )
}
