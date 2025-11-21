# Server-Side Authentication with Firebase

## Overview

This application now uses **100% server-side authentication** with Firebase. All authentication operations (login, signup, logout, session management) happen on the server, with no client-side Firebase Auth SDK usage.

## Architecture

### Key Components

1. **Server-Side API Routes** (`/app/api/auth/`)
   - `/api/auth/login` - Handles email/password login
   - `/api/auth/signup` - Handles user registration
   - `/api/auth/logout` - Handles logout and session revocation
   - `/api/auth/user` - Returns current authenticated user
   - `/api/auth/session` - Creates/deletes session cookies (legacy, still used internally)

2. **Authentication Hook** (`/lib/hooks/useAuth.ts`)
   - Client-side React hook that communicates with server API routes
   - No direct Firebase Auth SDK calls
   - Provides: `signIn`, `signUp`, `signOut`, `user`, `loading`, `isAuthenticated`

3. **Middleware** (`/middleware.ts`)
   - Protects routes requiring authentication (`/app/*`, `/dashboard/*`)
   - Verifies session cookies server-side
   - Redirects unauthenticated users to login
   - Redirects authenticated users away from auth pages

4. **API Client** (`/lib/api/client.ts`)
   - Updated to use cookie-based authentication
   - No manual token management
   - Automatically includes credentials in requests

## Authentication Flow

### Sign Up Flow

```
User → Signup Form → /api/auth/signup → Firebase Admin SDK
                                      ↓
                    Create User → Get ID Token → Create Session Cookie
                                                ↓
                                    Set HTTP-Only Cookie → Response
```

1. User submits email/password
2. Server creates user with Firebase Admin SDK
3. Server signs in user via Firebase REST API to get ID token
4. Server creates session cookie from ID token
5. Server sets HTTP-only, secure cookie
6. User is redirected to app

### Sign In Flow

```
User → Login Form → /api/auth/login → Firebase REST API
                                    ↓
                    Verify Credentials → Get ID Token → Verify with Admin SDK
                                                      ↓
                            Get User Data → Create Session Cookie → Set Cookie
```

1. User submits email/password
2. Server authenticates via Firebase REST API
3. Server verifies ID token with Admin SDK
4. Server creates session cookie (5-day expiry)
5. Server sets HTTP-only, secure cookie
6. User is redirected to app

### Sign Out Flow

```
User → Sign Out Button → /api/auth/logout → Verify Session → Revoke Tokens
                                                            ↓
                                            Delete Cookie → Redirect to Login
```

1. User clicks sign out
2. Server verifies session cookie
3. Server revokes refresh tokens for the user
4. Server deletes session cookie
5. User is redirected to login

### Session Verification

```
Request → Middleware → Check Cookie → Verify with Firebase Admin
                                   ↓
                        Valid → Allow Access
                        Invalid → Redirect to Login
```

For every request to protected routes:
1. Middleware checks for session cookie
2. Middleware verifies cookie with Firebase Admin SDK
3. If valid: request proceeds
4. If invalid: cookie is deleted, user redirected to login

## Security Benefits

### Why Server-Side Authentication?

1. **No Client-Side Token Exposure**
   - Tokens never exposed to JavaScript
   - HTTP-only cookies prevent XSS attacks
   - Secure flag ensures HTTPS-only transmission

2. **Better Session Control**
   - Server can revoke sessions at any time
   - Centralized session management
   - No client-side token storage vulnerabilities

3. **Simplified Client Code**
   - No token refresh logic on client
   - No token storage management
   - Browser handles cookie management automatically

4. **Defense in Depth**
   - Middleware verifies every request
   - Session cookies have short expiry (5 days)
   - Refresh tokens can be revoked server-side

## Environment Variables

Required environment variables:

```bash
# Client-side (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Server-side
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Backend API URL (optional)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Usage Examples

### In a React Component

```typescript
'use client'

import { useAuth } from '@/lib/hooks/useAuth'

export default function MyComponent() {
  const { user, loading, signIn, signOut, isAuthenticated } = useAuth()

  if (loading) return <div>Loading...</div>
  
  if (!isAuthenticated) {
    return <button onClick={() => signIn('email@example.com', 'password')}>
      Sign In
    </button>
  }

  return (
    <div>
      <p>Welcome {user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### In a Server Component

```typescript
import { firebaseServer } from '@/lib/firebase/server'

export default async function ServerComponent() {
  const user = await firebaseServer.getCurrentUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return <div>Welcome {user.email}</div>
}
```

### In an API Route

```typescript
import { NextResponse } from 'next/server'
import { firebaseServer } from '@/lib/firebase/server'

export async function GET() {
  const user = await firebaseServer.getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use user.uid to fetch user-specific data
  return NextResponse.json({ data: 'user-specific-data' })
}
```

## Session Management

### Session Cookie Details

- **Name**: `session`
- **Type**: HTTP-only, Secure
- **Duration**: 5 days (432,000 seconds)
- **SameSite**: Lax
- **Path**: `/`

### Session Refresh

Session cookies expire after 5 days. Users must log in again after expiry. This is intentional for security.

To extend session duration, modify the `expiresIn` constant in the auth routes:

```typescript
// In /api/auth/login/route.ts and /api/auth/signup/route.ts
const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days in milliseconds
```

## Migration from Client-Side Auth

### What Changed

1. **Removed**:
   - Direct Firebase Auth SDK usage in hooks
   - `onAuthStateChanged` listeners
   - Client-side token management
   - Token refresh logic

2. **Added**:
   - Server-side auth API routes
   - Cookie-based session management
   - Middleware session verification
   - Server-side user fetching

3. **Updated**:
   - `useAuth` hook now calls API routes
   - API client uses cookies instead of Bearer tokens
   - Middleware verifies sessions properly

### Code That Still Works

The `useAuth` hook maintains the same interface, so existing components work without changes:

```typescript
const { user, loading, signIn, signUp, signOut, isAuthenticated } = useAuth()
```

### Code That No Longer Works

Direct Firebase Auth SDK usage:

```typescript
// ❌ This no longer works
import { auth } from '@/lib/firebase/config'
import { signInWithEmailAndPassword } from 'firebase/auth'
await signInWithEmailAndPassword(auth, email, password)

// ✅ Use this instead
import { useAuth } from '@/lib/hooks/useAuth'
const { signIn } = useAuth()
await signIn(email, password)
```

## Troubleshooting

### Issue: "Session cookie expired" errors

**Solution**: This is expected behavior after 5 days. User must log in again.

### Issue: Middleware redirects in infinite loop

**Solution**: Check that auth routes (`/auth/login`, `/auth/signup`) are excluded from middleware protection.

### Issue: "Firebase Admin not initialized"

**Solution**: Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable is set correctly.

### Issue: User shown as logged out immediately after login

**Solution**: 
1. Check browser cookies are enabled
2. Check that cookie is being set (dev tools → Application → Cookies)
3. Verify `secure` flag matches environment (should be `false` in development)

### Issue: CORS errors when calling backend API

**Solution**: Backend must allow credentials in CORS config:

```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
})
```

## Testing

### Manual Testing

1. **Sign Up**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

2. **Sign In**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}' \
     -c cookies.txt
   ```

3. **Get User**:
   ```bash
   curl http://localhost:3000/api/auth/user -b cookies.txt
   ```

4. **Sign Out**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/logout -b cookies.txt
   ```

## Best Practices

1. **Always use HTTPS in production**
   - Session cookies marked as `secure` in production
   - Prevents cookie interception

2. **Set appropriate session duration**
   - Balance between UX and security
   - 5 days is a reasonable default
   - Consider "Remember Me" feature for longer sessions

3. **Handle session expiry gracefully**
   - API client automatically redirects to login on 401
   - Show friendly message to user

4. **Monitor session revocations**
   - Log when tokens are revoked
   - Track suspicious activity

5. **Use server components when possible**
   - Fetch user data server-side
   - Reduces client-side API calls
   - Better performance and SEO

## Future Enhancements

Potential improvements to consider:

1. **Refresh Token Rotation**
   - Implement automatic session refresh before expiry
   - Update session cookie without user interaction

2. **Multi-Factor Authentication (MFA)**
   - Add second factor verification
   - Use Firebase MFA features

3. **OAuth Providers**
   - Add Google, GitHub, etc. sign-in
   - Implement server-side OAuth flow

4. **Rate Limiting**
   - Add rate limiting to auth endpoints
   - Prevent brute force attacks

5. **Session Management UI**
   - Show active sessions to user
   - Allow remote session revocation

## References

- [Firebase Admin Auth Guide](https://firebase.google.com/docs/auth/admin)
- [Session Cookies Best Practices](https://firebase.google.com/docs/auth/admin/manage-cookies)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [HTTP Cookie Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#security)

