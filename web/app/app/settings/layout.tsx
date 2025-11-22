import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your prompts, themes, and account preferences.',
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

