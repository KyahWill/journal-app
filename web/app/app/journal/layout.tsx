import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Write, organize, and reflect on your journal entries.',
}

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


