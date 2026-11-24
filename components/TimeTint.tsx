'use client'

import { useEffect } from 'react'

/**
 * 时间感知的蓝：根据访问时刻调整天光的浓淡（深夜更浓更深、破晓更淡更清）。
 * 通过覆盖 --sky / --sky-hi 两个 CSS 变量实现，主题切换（class 变化）时重新计算。
 */
export default function TimeTint() {
  useEffect(() => {
    const apply = () => {
      const h = new Date().getHours()
      let depth: number
      if (h >= 0 && h < 5) depth = 1
      else if (h < 8) depth = 1 - ((h - 5) / 3) * 0.35
      else if (h < 17) depth = 0.65
      else if (h < 20) depth = 0.65 + ((h - 17) / 3) * 0.35
      else depth = 1

      const light = document.documentElement.classList.contains('light')
      const skyA = (light ? 0.05 : 0.11) + depth * (light ? 0.05 : 0.1)
      const skyHiA = (light ? 0.07 : 0.08) + depth * (light ? 0.06 : 0.09)
      document.documentElement.style.setProperty('--sky', `rgba(47, 86, 232, ${skyA.toFixed(3)})`)
      document.documentElement.style.setProperty(
        '--sky-hi',
        `rgba(134, 165, 255, ${skyHiA.toFixed(3)})`
      )
    }

    apply()
    const mo = new MutationObserver(() => apply())
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])

  return null
}
