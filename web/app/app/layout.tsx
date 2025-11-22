import AppHeader from './app-header'
import { AuthProvider } from '@/lib/contexts/auth-context'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s | Journal App'
  },
  description: 'Your personal journaling and AI coaching dashboard.',
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Middleware already protects this route
  // AuthProvider provides shared user context to all children
  
  return (
    <AuthProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
        <AppHeader />
        <main>{children}</main>
      </div>
    </AuthProvider>
  )
}
