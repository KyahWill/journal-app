import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Get the session cookie value to send to the backend
 * The backend will verify this session cookie using Firebase Admin SDK
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    // Return the session cookie - the backend will verify it
    return NextResponse.json({ token: sessionCookie })
  } catch (error: any) {
    console.error('Token fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to get token' },
      { status: 500 }
    )
  }
}

