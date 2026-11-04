'use client'

import { useEffect, useState } from 'react'

const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const MONTH = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
]
const DAY = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

function cnDay(n: number) {
  if (n <= 10) return `${DAY[n - 1]}日`
  if (n === 20) return '二十日'
  if (n === 30) return '三十日'
  const tens = n < 20 ? '十' : '二十'
  return `${tens}${DAY[(n % 10) - 1]}日`
}

function todayText() {
  const d = new Date()
  return `${d.getFullYear()} 年 ${MONTH[d.getMonth()]}${cnDay(d.getDate())} · ${WEEK[d.getDay()]}`
}

/**
 * 首屏日期行。
 * 服务端不知道用户时区，因此挂载后再填；容器高度已预留，不会造成布局跳动。
 */
export default function TodayLine() {
  const [text, setText] = useState('')

  useEffect(() => {
    setText(todayText())
  }, [])

  return (
    <p className="eyebrow rise h-[14px]" suppressHydrationWarning>
      {text || '\u00A0'}
    </p>
  )
}
