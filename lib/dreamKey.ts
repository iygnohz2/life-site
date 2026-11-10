import dreamKey from '@/site-data/dream-key.json'

const STORAGE_KEY = 'dream-unlocked'

/**
 * 校验「梦之钥」：对输入做 SHA-256，与站点配置里的哈希比对。
 * 哈希不可逆，所以把 hash 公开放在前端是安全的。
 */
export async function verifyDreamKey(input: string): Promise<boolean> {
  const data = new TextEncoder().encode(input.trim())
  const digest = await crypto.subtle.digest('SHA-256', data)
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hex === dreamKey.hash
}

/** 当前会话是否已解锁（sessionStorage 记录，关标签页失效） */
export function isUnlocked(): boolean {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(STORAGE_KEY) === '1'
}

export function setUnlocked(value: boolean): void {
  if (typeof window === 'undefined') return
  if (value) window.sessionStorage.setItem(STORAGE_KEY, '1')
  else window.sessionStorage.removeItem(STORAGE_KEY)
}
