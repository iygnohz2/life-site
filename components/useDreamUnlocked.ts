'use client'

import { useEffect, useState } from 'react'
import { isUnlocked, UNLOCK_EVENT } from '@/lib/dreamKey'

/**
 * 当前会话是否已用「梦之钥」解锁。
 * 挂载时读取 sessionStorage，并监听解锁事件实时刷新（解锁发生在别的页面/组件时也能同步）。
 * 初始为 false，与服务端首屏渲染一致，避免 hydration 不一致。
 */
export function useDreamUnlocked(): boolean {
  const [unlocked, setUnlockedState] = useState(false)

  useEffect(() => {
    setUnlockedState(isUnlocked())
    const onChange = () => setUnlockedState(isUnlocked())
    window.addEventListener(UNLOCK_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(UNLOCK_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  return unlocked
}
