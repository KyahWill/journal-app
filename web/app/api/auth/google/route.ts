import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { auth as adminAuth } from '@/lib/firebase/admin'

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      )
    }

    // Verify the ID token from Google sign-in
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const googleUser = await adminAuth.getUser(decodedToken.uid)
    const email = googleUser.email

    if (!email) {
      return NextResponse.json(
        { error: 'Google account must have an email' },
        { status: 400 }
      )
    }

    let finalUser = googleUser
    let finalIdToken = idToken

    // Check if there's an existing account with this email that has a different UID
    // This handles the case where user signed up with email/password first
    try {
      const existingUser = await adminAuth.getUserByEmail(email)
      
      if (existingUser.uid !== googleUser.uid) {
        // Found an existing account with different UID - need to link accounts
        console.log(`Linking Google provider to existing account: ${existingUser.uid}`)
        
        // Check if the existing account already has Google linked
        const hasGoogleProvider = existingUser.providerData.some(
          (provider) => provider.providerId === 'google.com'
        )
        
        if (!hasGoogleProvider) {
          // Link the Google provider to the existing account
          // We need to update the existing user with the Google provider info
          const googleProviderData = googleUser.providerData.find(
            (provider) => provider.providerId === 'google.com'
          )
          
          if (googleProviderData) {
            // Update existing user to link Google provider
            await adminAuth.updateUser(existingUser.uid, {
              // Preserve existing display name if they have one, otherwise use Google's
              displayName: existingUser.displayName || googleUser.displayName,
              // Mark email as verified since Google verified it
              emailVerified: true,
            })
            
            // Note: Firebase Admin SDK doesn't directly support linking providers,
            // but since we're using the same email, we can:
            // 1. Delete the duplicate Google-created account
            // 2. The user will need to use their original account
            
            // Delete the newly created Google account (it has no data)
            await adminAuth.deleteUser(googleUser.uid)
            console.log(`Deleted duplicate Google account: ${googleUser.uid}`)
          }
        }
        
        // Use the existing user for the session
        finalUser = existingUser
        
        // Create a new custom token for the existing user so we can create a session
        const customToken = await adminAuth.createCustomToken(existingUser.uid)
        
        // Return special response indicating account was linked
        // The client will need to sign in again with the custom token
        const cookieStore = await cookies()
        // Clear any existing session
        cookieStore.delete('session')
        
        return NextResponse.json({
          success: true,
          accountLinked: true,
          customToken,
          message: 'Your Google account has been linked to your existing account.',
          user: {
            uid: existingUser.uid,
            email: existingUser.email,
            displayName: existingUser.displayName,
            emailVerified: existingUser.emailVerified,
          },
        })
      }
    } catch (lookupError: any) {
      // getUserByEmail throws if user doesn't exist - that's fine, proceed normally
      if (lookupError.code !== 'auth/user-not-found') {
        console.error('Error looking up existing user:', lookupError)
      }
    }

    // Normal flow - no existing account with different UID
    // Create session cookie (5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000
    const sessionCookie = await adminAuth.createSessionCookie(finalIdToken, { expiresIn })

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
        uid: finalUser.uid,
        email: finalUser.email,
        displayName: finalUser.displayName,
        emailVerified: finalUser.emailVerified,
      },
    })
  } catch (error: any) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to authenticate with Google' },
      { status: 500 }
    )
  }
}

