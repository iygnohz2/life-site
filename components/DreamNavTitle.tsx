'use client'

import { useDreamUnlocked } from '@/components/useDreamUnlocked'

/**
 * 详情页「上一篇 / 下一篇」导航里的标题：
 * 上锁的邻居日记，未解锁时显示「朦胧的梦」，解锁后还原真实标题。
 */
export default function DreamNavTitle({ title, locked }: { title: string; locked?: boolean }) {
  const unlocked = useDreamUnlocked()
  return <>{locked && !unlocked ? '朦胧的梦' : title}</>
}
