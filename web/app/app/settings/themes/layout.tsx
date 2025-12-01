import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Theme Editor',
  description: 'Customize the look and feel of your Journal App with the theme editor.',
}

export default function ThemesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


