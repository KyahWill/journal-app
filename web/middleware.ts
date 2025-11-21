import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware for route protection and authentication
 * 
 * Note: This middleware runs on Edge runtime and cannot import Firebase Admin SDK.
 * It only checks for the presence of a session cookie. Actual verification
 * happens in API routes and server components using Firebase Admin SDK.
 */
export async function middleware(request: NextRequest) {
  // Get session cookie
  const session = request.cookies.get('session')?.value
  const hasSession = !!session

  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const isProtectedRoute = pathname.startsWith('/app') || pathname.startsWith('/dashboard')
  
  // Auth routes that should redirect if already authenticated
  const isAuthRoute = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')

  // Protect routes - redirect to login if no session cookie
  if (isProtectedRoute && !hasSession) {
    const url = new URL('/auth/login', request.url)
    return NextResponse.redirect(url)
  }

  // Redirect to app if already has session and trying to access auth pages
  if (isAuthRoute && hasSession) {
    const url = new URL('/app/journal', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

