export type LifeEntry = {
  slug: string
  path: string
  title: string
  date: string
  summary?: string
  mood?: string
  weather?: string
  place?: string
  kind?: string
  tags?: string[]
  photos?: string[]
  cover?: string
  draft?: boolean
}

export const MOOD_TONE: Record<string, string> = {
  开心: 'var(--color-clay-400)',
  温暖: 'var(--color-clay-300)',
  平静: 'var(--color-ink-3)',
  满足: 'var(--color-moss-500)',
  低沉: 'var(--color-moss-300)',
  疲惫: 'var(--color-ink-3)',
  兴奋: 'var(--color-clay-500)',
}

export const KIND_LABEL: Record<string, string> = {
  entry: '日记',
  note: '碎片',
  trip: '远行',
  photo: '照片',
}

const MONTH_CN = [
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

export function sortByDateDesc<T extends { date: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function partsOf(date: string) {
  const d = new Date(date)
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    monthCn: MONTH_CN[d.getMonth()],
  }
}

export function shortDate(date: string) {
  const { month, day } = partsOf(date)
  return `${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`
}

export function longDate(date: string) {
  const { year, monthCn, day } = partsOf(date)
  return `${year} 年 ${monthCn} ${day} 日`
}

export function groupByYear<T extends { date: string }>(list: T[]) {
  const map = new Map<number, T[]>()
  for (const item of list) {
    const y = partsOf(item.date).year
    if (!map.has(y)) map.set(y, [])
    map.get(y)!.push(item)
  }
  return [...map.entries()].map(([year, items]) => ({ year, items }))
}

export function readingMinutes(raw?: string) {
  if (!raw) return 1
  const chars = raw.replace(/\s/g, '').length
  return Math.max(1, Math.round(chars / 350))
}
