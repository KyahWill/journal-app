import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Coach',
  description: 'Get personalized insights and guidance from your AI executive coach.',
}

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


