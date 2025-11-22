import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Entry',
  description: 'Create a new journal entry.',
}

export default function NewEntryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

