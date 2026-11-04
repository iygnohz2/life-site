export type BookStatus = 'reading' | 'done' | 'wish'

export type Book = {
  title: string
  author: string
  status: BookStatus
  rating?: number
  progress?: number
  date?: string
  note?: string
  tags?: string[]
}

export const STATUS_ORDER: BookStatus[] = ['reading', 'done', 'wish']

export const STATUS_LABEL: Record<BookStatus, string> = {
  reading: '在读',
  done: '读完',
  wish: '想读',
}

/** 书脊配色：低饱和，亮暗两个主题都能压住 */
export const SPINES = ['#8c4a35', '#4c6b58', '#3b3733', '#a8815a', '#6b5468', '#33505f']

export function groupBooks(books: Book[]) {
  return STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    books: books.filter((b) => b.status === status),
  })).filter((group) => group.books.length > 0)
}

/** 书脊高度：同一层架子上高度接近，只做很小的长短差 */
export function spineHeight(book: Book, index: number) {
  let hash = index * 7
  for (let i = 0; i < book.title.length; i += 1) hash += book.title.charCodeAt(i)
  return 186 + (hash % 4) * 9
}

/** 书脊宽度：书名越长越厚，保证竖排标题能完整放下 */
export function spineWidth(book: Book) {
  return Math.min(56, Math.max(34, 28 + book.title.length * 3.4))
}

export function spineTone(book: Book, index: number) {
  let hash = index * 3
  for (let i = 0; i < book.title.length; i += 1) hash += book.title.charCodeAt(i) * (i + 1)
  return SPINES[hash % SPINES.length]
}
