'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'

export default function AppHeader() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    try {
      setLoading(true)
      await signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold">Journal</h1>
            <nav className="flex space-x-4">
              <Link
                href="/app/journal"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Journal
              </Link>
              <Link
                href="/app/coach"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                AI Coach
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {user?.email && (
              <span className="text-sm text-gray-600">{user.email}</span>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              disabled={loading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {loading ? 'Signing out...' : 'Sign Out'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
