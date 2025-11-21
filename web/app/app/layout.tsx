import AppHeader from './app-header'
import { AuthProvider } from '@/lib/contexts/auth-context'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Middleware already protects this route
  // AuthProvider provides shared user context to all children
  
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main>{children}</main>
      </div>
    </AuthProvider>
  )
}
