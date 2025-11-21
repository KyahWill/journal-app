import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { auth as adminAuth } from '@/lib/firebase/admin'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value

    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Verify the session cookie
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true)
    
    // Get full user data
    const user = await adminAuth.getUser(decodedToken.uid)

    return NextResponse.json({
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime,
      },
    })
  } catch (error: any) {
    console.error('Get user error:', error)
    
    // If session is invalid, return null user instead of error
    if (error.code === 'auth/session-cookie-expired' || 
        error.code === 'auth/session-cookie-revoked') {
      // Delete the invalid cookie
      const cookieStore = await cookies()
      cookieStore.delete('session')
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500 }
    )
  }
}

