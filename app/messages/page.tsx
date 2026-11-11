import type { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'
import Messages from '@/components/Messages'

export const metadata: Metadata = {
  title: '私信',
}

export default function MessagesPage() {
  return (
    <PageHeader eyebrow="LETTERS" title="私信" desc="只属于你我的往来，别人看不见。">
      <Messages />
    </PageHeader>
  )
}
