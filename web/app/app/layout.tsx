import AppHeader from './app-header'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Middleware already protects this route
  // No need to verify user here - just display the UI
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main>{children}</main>
    </div>
  )
}
