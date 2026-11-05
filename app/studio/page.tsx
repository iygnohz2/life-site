import type { Metadata } from 'next'
import Studio from '@/components/studio/Studio'

export const metadata: Metadata = {
  title: '工作台',
  robots: { index: false, follow: false },
}

export default function StudioPage() {
  return <Studio />
}
