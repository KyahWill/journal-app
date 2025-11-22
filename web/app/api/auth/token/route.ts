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
      console.warn('[/api/auth/token] No session cookie found')
      return NextResponse.json(
        { 
          error: 'No session',
          code: 'NO_SESSION',
          message: 'Session cookie not found. User may need to log in.'
        },
        { status: 401 }
      )
    }

    // Return the session cookie - the backend will verify it
    return NextResponse.json({ token: sessionCookie })
  } catch (error: any) {
    console.error('[/api/auth/token] Token fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get token',
        code: 'TOKEN_FETCH_ERROR',
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}

