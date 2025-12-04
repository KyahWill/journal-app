import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Weekly Insights',
  description: 'AI-generated insights from your journal entries over the past week.',
}

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

