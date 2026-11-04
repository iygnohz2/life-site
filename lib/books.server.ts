import fs from 'node:fs'
import path from 'node:path'
import type { Book } from './books'

const FILE = path.join(process.cwd(), 'site-data', 'books.json')

/** 只在服务端调用（页面 / 布局），不要被客户端组件 import */
export function getBooks(): Book[] {
  if (!fs.existsSync(FILE)) return []
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    return (raw.books ?? []).filter((b: Book) => b?.title)
  } catch {
    return []
  }
}
