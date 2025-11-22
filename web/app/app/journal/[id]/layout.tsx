import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Entry',
  description: 'Edit your journal entry.',
}

export default function EditEntryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

