import { allLives } from 'contentlayer/generated'
import { sortByDateDesc, type LifeEntry } from '@/lib/life'
import Home from './Main'

export default function Page() {
  const latest = sortByDateDesc(
    (allLives as unknown as LifeEntry[]).filter(
      (p) => process.env.NODE_ENV !== 'production' || p.draft !== true
    )
  ).slice(0, 3)

  return <Home latest={latest} />
}
