'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Menu, X, Mic } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { useGoals } from '@/lib/contexts/goal-context'
import { cn } from '@/lib/utils'
import { isFeatureEnabled } from '@/lib/config/features'

export default function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  
  // Safely get notification counts (may not be available in all contexts)
  let notificationCounts = { urgent: 0, overdue: 0, total: 0 }
  let hasNotifications = false
  
  try {
    const { getNotificationCounts } = useGoals()
    notificationCounts = getNotificationCounts()
    hasNotifications = notificationCounts.total > 0
  } catch (error) {
    // GoalProvider not available in this context, skip notifications
  }

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')
  const voiceCoachEnabled = isFeatureEnabled('voiceCoach')

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
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link href="/app">
              <h1 className="text-xl sm:text-2xl font-bold">Journal</h1>
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4">
              <Link
                href="/app/journal"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive('/app/journal')
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                Journal
              </Link>
              <Link
                href="/app/goals"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium relative transition-colors",
                  isActive('/app/goals')
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                Goals
                {hasNotifications && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {notificationCounts.total}
                  </Badge>
                )}
              </Link>
              <Link
                href="/app/coach"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive('/app/coach')
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                AI Coach
              </Link>
              {voiceCoachEnabled && (
                <Link
                  href="/app/ai-agent"
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                    isActive('/app/ai-agent')
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Mic className="h-4 w-4" />
                  Voice Coach
                </Link>
              )}
              <Link
                href="/app/settings"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive('/app/settings')
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                Settings
              </Link>
            </nav>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user?.email && (
              <span className="text-sm text-gray-600 hidden lg:inline">{user.email}</span>
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

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 border-t mt-3">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/app/journal"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive('/app/journal')
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                Journal
              </Link>
              <Link
                href="/app/goals"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between transition-colors",
                  isActive('/app/goals')
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Goals</span>
                {hasNotifications && (
                  <Badge variant="destructive" className="ml-2">
                    {notificationCounts.total}
                  </Badge>
                )}
              </Link>
              <Link
                href="/app/coach"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive('/app/coach')
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                AI Coach
              </Link>
              {voiceCoachEnabled && (
                <Link
                  href="/app/ai-agent"
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                    isActive('/app/ai-agent')
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Mic className="h-4 w-4" />
                  Voice Coach
                </Link>
              )}
              <Link
                href="/app/settings"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive('/app/settings')
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </Link>
              {user?.email && (
                <div className="px-3 py-2 text-sm text-gray-600 border-t">
                  {user.email}
                </div>
              )}
              <div className="px-3 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {loading ? 'Signing out...' : 'Sign Out'}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
