import type { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'
import Bookshelf from '@/components/Bookshelf'
import { getBooks } from '@/lib/books.server'

export const metadata: Metadata = {
  title: '书架',
}

export default function BooksPage() {
  const books = getBooks()
  const count = (status: string) => books.filter((b) => b.status === status).length

  return (
    <PageHeader eyebrow="BOOKS" title="书架" desc="读过的书，和正在读的。读得慢，但不着急。">
      <div className="hairline mb-10 flex items-baseline justify-between py-4">
        <p className="text-ink-3 text-[11.5px] tracking-[0.14em]">
          {books.length} 本 · 读完 {count('done')} · 在读 {count('reading')} · 想读 {count('wish')}
        </p>
        <p className="text-ink-3 hidden text-[11.5px] tracking-[0.06em] sm:block">
          点一下书脊，看当时的批注
        </p>
      </div>

      <Bookshelf books={books} />
    </PageHeader>
  )
}
