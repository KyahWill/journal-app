import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { auth as adminAuth } from '@/lib/firebase/admin'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Sign in with Firebase Admin SDK
    // Note: Firebase Admin SDK doesn't have a direct signInWithEmailAndPassword method
    // We need to use the REST API for this
    const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    
    if (!FIREBASE_API_KEY) {
      return NextResponse.json(
        { error: 'Firebase configuration error' },
        { status: 500 }
      )
    }

    // Use Firebase Auth REST API for sign in
    const signInResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    )

    if (!signInResponse.ok) {
      const errorData = await signInResponse.json()
      return NextResponse.json(
        { error: errorData.error?.message || 'Invalid credentials' },
        { status: 401 }
      )
    }

    const { idToken, localId } = await signInResponse.json()

    // Verify the ID token and get user data
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const user = await adminAuth.getUser(decodedToken.uid)

    // Create session cookie (5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    })

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to login' },
      { status: 500 }
    )
  }
}

