'use client'

import { useDreamUnlocked } from '@/components/useDreamUnlocked'

/**
 * 足迹页地点列表里的日记标题：
 * 上锁日记未解锁时显示锁图标 +「朦胧的梦」，解锁后还原真实标题。
 */
export default function PlaceEntryTitle({ title, locked }: { title: string; locked?: boolean }) {
  const unlocked = useDreamUnlocked()

  if (locked && !unlocked) {
    return (
      <span className="text-ink-3 flex items-center gap-1.5">
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="text-dream-500/80 h-[11px] w-[11px] shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
        >
          <rect x="4" y="7" width="8" height="6" rx="1.5" />
          <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
        </svg>
        <span>朦胧的梦</span>
      </span>
    )
  }

  return <span className="group-hover:underline group-hover:underline-offset-4">{title}</span>
}
