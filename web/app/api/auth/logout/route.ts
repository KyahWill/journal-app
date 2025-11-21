import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { auth as adminAuth } from '@/lib/firebase/admin'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value

    if (sessionCookie) {
      // Revoke refresh tokens for the user
      try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie)
        await adminAuth.revokeRefreshTokens(decodedToken.uid)
      } catch (error) {
        // Session already invalid or expired - that's fine
        console.log('Session already invalid:', error)
      }
    }

    // Delete the session cookie
    cookieStore.delete('session')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to logout' },
      { status: 500 }
    )
  }
}

