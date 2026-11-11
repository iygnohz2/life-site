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
  locked?: boolean
}

export const MOOD_TONE: Record<string, string> = {
  开心: 'var(--color-dream-400)',
  温暖: 'var(--color-dream-300)',
  平静: 'var(--color-ink-3)',
  满足: 'var(--color-mist-500)',
  低沉: 'var(--color-mist-300)',
  疲惫: 'var(--color-ink-3)',
  兴奋: 'var(--color-dream-500)',
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
  // date 为「YYYY-MM-DD」或「YYYY-MM-DD HH:mm」固定宽度格式，字典序即时间序，避免 Date 时区偏移
  return [...list].sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

/**
 * 用正则解析日期字符串，避免依赖 new Date 的时区行为。
 * 支持「YYYY-MM-DD」和「YYYY-MM-DD HH:mm」（也兼容 ISO 的 T 分隔）。
 */
export function partsOf(date: string) {
  const m = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/)
  if (!m) {
    // 兜底：无法按规范格式解析时退回 Date（仅用于异常数据）
    const d = new Date(date)
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: null as number | null,
      minute: null as number | null,
      monthCn: MONTH_CN[d.getMonth()],
    }
  }
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const hour = m[4] != null ? Number(m[4]) : null
  const minute = m[5] != null ? Number(m[5]) : null
  return { year, month, day, hour, minute, monthCn: MONTH_CN[month - 1] }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function shortDate(date: string) {
  const { month, day } = partsOf(date)
  return `${pad2(month)}.${pad2(day)}`
}

/** 生活流列表用：有时分显示「MM.DD HH:mm」，纯日期只显示「MM.DD」 */
export function shortDateTime(date: string) {
  const p = partsOf(date)
  const base = `${pad2(p.month)}.${pad2(p.day)}`
  return p.hour == null ? base : `${base} ${pad2(p.hour)}:${pad2(p.minute ?? 0)}`
}

export function longDate(date: string) {
  const { year, monthCn, day } = partsOf(date)
  return `${year} 年 ${monthCn} ${day} 日`
}

/** 详情页用：有时分显示「YYYY 年 X 月 D 日 HH:mm」，纯日期只显示日期 */
export function longDateTime(date: string) {
  const p = partsOf(date)
  const base = `${p.year} 年 ${p.monthCn} ${p.day} 日`
  return p.hour == null ? base : `${base} ${pad2(p.hour)}:${pad2(p.minute ?? 0)}`
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
