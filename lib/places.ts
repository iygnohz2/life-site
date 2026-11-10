import fs from 'node:fs'
import path from 'node:path'

export type LifeLike = {
  slug: string
  title: string
  date: string
  place?: string
  locked?: boolean
}

export type PlaceEntry = {
  slug: string
  title: string
  date: string
  place: string
  locked?: boolean
}

export type PlacePoint = {
  city: string
  region?: string
  lng: number
  lat: number
  visits: number
  latest: string
  entries: PlaceEntry[]
  notes: string[]
}

type Registry = {
  cities: Record<string, { lng: number; lat: number; region?: string }>
  trips: { city: string; date: string; note?: string }[]
}

const REGISTRY = path.join(process.cwd(), 'site-data', 'places.json')

function readRegistry(): Registry {
  if (!fs.existsSync(REGISTRY)) return { cities: {}, trips: [] }
  try {
    const raw = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'))
    return { cities: raw.cities ?? {}, trips: raw.trips ?? [] }
  } catch {
    return { cities: {}, trips: [] }
  }
}

/** 生活记录里的 place 形如「苏州 · 平江路」，取第一段作为城市 */
export function cityOf(place?: string) {
  if (!place) return undefined
  const [city] = place.split(/[·・|/]/)
  return city.trim() || undefined
}

/**
 * 足迹由两部分合并而成：
 * 1. 生活记录里出现过的地点（写日记就自动上地图）
 * 2. site-data/places.json 里手动补的行程（没有写成长记录的那些）
 */
export function getPlaces(lives: LifeLike[]): { points: PlacePoint[]; unknown: string[] } {
  const { cities, trips } = readRegistry()
  const map = new Map<string, PlacePoint>()
  const unknown = new Set<string>()

  const ensure = (city: string, date: string) => {
    let point = map.get(city)
    if (!point) {
      const geo = cities[city]
      if (!geo) {
        unknown.add(city)
        return undefined
      }
      point = {
        city,
        region: geo.region,
        lng: geo.lng,
        lat: geo.lat,
        visits: 0,
        latest: date,
        entries: [],
        notes: [],
      }
      map.set(city, point)
    }
    return point
  }

  for (const life of lives) {
    const city = cityOf(life.place)
    if (!city) continue
    const point = ensure(city, life.date)
    if (!point) continue
    point.visits += 1
    point.entries.push({
      slug: life.slug,
      title: life.title,
      date: life.date,
      place: life.place ?? city,
      locked: life.locked === true,
    })
    if (life.date > point.latest) point.latest = life.date
  }

  for (const trip of trips) {
    const point = ensure(trip.city, trip.date)
    if (!point) continue
    point.visits += 1
    if (trip.note) point.notes.push(trip.note)
    if (trip.date > point.latest) point.latest = trip.date
  }

  const points = [...map.values()]
    .map((p) => ({ ...p, entries: p.entries.sort((a, b) => b.date.localeCompare(a.date)) }))
    .sort((a, b) => b.visits - a.visits || b.latest.localeCompare(a.latest))

  return { points, unknown: [...unknown] }
}
