'use client'

import { useEffect, useState } from 'react'
import Link from './Link'

/**
 * 工作台入口：只在本地 / 局域网访问时显示。
 * 线上部署后 hostname 是正式域名，这里返回 null，不会出现死链。
 */
export default function StudioLink() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const host = window.location.hostname
    setShow(
      host === 'localhost' || host === '127.0.0.1' || /^192\.168\./.test(host) || /^10\./.test(host)
    )
  }, [])

  if (!show) return null

  return (
    <Link href="/studio" className="hover:text-dream-300 transition-colors">
      工作台
    </Link>
  )
}
