'use client'

import Link from '@/components/Link'
import { shortDate, type LifeEntry } from '@/lib/life'
import { useDreamUnlocked } from '@/components/useDreamUnlocked'

/**
 * 主页「最近记下」列表：上锁的日记未解锁前显示「朦胧的梦」+ 锁图标，
 * 与生活流界面一致；解锁后还原真实标题与心情。
 */
export default function RecentEntries({ latest }: { latest: LifeEntry[] }) {
  const unlocked = useDreamUnlocked()

  if (!latest.length) {
    return (
      <p className="text-ink-3 py-10 text-[12px] tracking-[0.08em]">还没有记录 —— 从今天开始</p>
    )
  }

  return (
    <ul>
      {latest.map((item) => {
        const hidden = item.locked === true && !unlocked
        return (
          <li key={item.slug}>
            <Link href={`/life/${item.slug}`} className="group flex items-baseline gap-5 py-5">
              <span className="text-ink-3 w-11 shrink-0 font-mono text-[11px] tracking-[0.08em]">
                {shortDate(item.date)}
              </span>
              {hidden ? (
                <span className="text-ink-3 flex min-w-0 flex-1 items-center gap-2.5 font-serif text-[15.5px]">
                  <svg
                    aria-hidden
                    viewBox="0 0 16 16"
                    className="text-dream-500/80 h-[13px] w-[13px] shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  >
                    <rect x="4" y="7" width="8" height="6" rx="1.5" />
                    <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
                  </svg>
                  <span className="truncate">朦胧的梦</span>
                </span>
              ) : (
                <span className="group-hover:text-dream-300 min-w-0 flex-1 truncate font-serif text-[15.5px] transition-colors duration-500">
                  {item.title}
                </span>
              )}
              {!hidden && item.mood ? (
                <span className="text-ink-3 shrink-0 text-[11px] tracking-[0.06em]">
                  {item.mood}
                </span>
              ) : null}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
