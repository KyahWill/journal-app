import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-orange-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent group-hover:from-orange-600 group-hover:to-amber-600 transition-all">
              Journal App
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/#features" 
              className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
            >
              Features
            </Link>
            <Link 
              href="/privacy" 
              className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
            >
              Privacy
            </Link>
            <Link 
              href="/terms" 
              className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
            >
              Terms
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button 
                variant="ghost" 
                className="text-gray-700 hover:text-orange-600 hover:bg-orange-50"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button 
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg transition-all"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

