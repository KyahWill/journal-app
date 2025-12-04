# Authentication Feature

**Server-side authentication system with Firebase Admin SDK**

---

**Last Updated**: December 2025  
**Status**: ✅ Complete

---

## Overview

The Journal application uses a server-side authentication system built on Firebase Admin SDK. This provides secure, scalable authentication with session-based management for the web application and token-based authentication for the backend API.

## Key Features

### User Registration
- Email/password signup with validation
- Optional full name field during registration
- Automatic user profile creation in Firestore
- Auto-login after successful registration
- Email validation and password strength requirements
- Error handling for duplicate accounts

### User Login
- Email/password authentication
- **Google Sign-in** with OAuth 2.0 popup flow
- Session persistence across browser restarts
- Secure token management via Firebase Admin SDK
- Remember user session (5-day duration)
- Comprehensive error handling (invalid credentials, network errors)

### Session Management
- HTTP-only cookies for security
- Automatic session validation on every request
- Server-side session verification
- Session expiry handling (5 days)
- Secure logout with refresh token revocation

### Password Management
- Password reset via email
- Secure password recovery flow
- Password validation rules
- Password strength requirements

### Profile Management
- Update user profile (full name)
- View current user information
- Profile data linked to Firebase Auth users

## Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                        │
│                                                                 │
│  ┌──────────────┐    ┌────────────┐    ┌──────────────────┐     │
│  │  Login Page  │    │  useAuth   │    │  App Components  │     │
│  │  Signup Page │───▶│    Hook    │◀───│   (Protected)    │     │
│  └──────────────┘    └────────────┘    └──────────────────┘     │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    Fetch API (HTTP)
                    with credentials
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                   Next.js Server (API Routes)                    │
│                            │                                     │
│  ┌─────────────────────────▼────────────────────────────────┐    │
│  │               Middleware (middleware.ts)                 │    │
│  │  - Check session cookie presence                         │    │
│  │  - Redirect unauthenticated users to /auth/login         │    │
│  │  - Redirect authenticated users away from auth pages     │    │
│  └────────────────────────┬─────────────────────────────────┘    │
│                            │                                     │
│  ┌─────────────────────────▼──────────────────────────────────┐  │
│  │              API Routes (/app/api/auth/)                   |  │
│  │                                                            │  │
│  │  POST /api/auth/login     - Authenticate user              │  │
│  │  POST /api/auth/google    - Authenticate via Google        │  │
│  │  POST /api/auth/signup    - Create new user                │  │
│  │  POST /api/auth/logout    - Revoke session                 │  │
│  │  GET  /api/auth/user      - Get current user               │  │
│  │  GET  /api/auth/token     - Get session token for backend  │  │
│  │                                                            │  │
│  └─────────────────────────┬──────────────────────────────────┘  │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                    Firebase Admin SDK
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                    Firebase Authentication                       │
│                                                                  │
│  - User Management                                               │
│  - Session Cookie Creation/Verification                          │
│  - Token Management                                              │
│  - Refresh Token Revocation                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Components

#### Client Layer
- **useAuth Hook** (`web/lib/hooks/useAuth.ts`): Primary authentication interface for React components
- **App Header** (`web/app/app/app-header.tsx`): Display user info and logout functionality

#### Server Layer - Next.js API Routes
- **POST /api/auth/login**: Authenticate existing users with email/password
- **POST /api/auth/google**: Authenticate users via Google OAuth
- **POST /api/auth/signup**: Create new user accounts
- **GET /api/auth/user**: Get current authenticated user
- **POST /api/auth/logout**: End user session
- **GET /api/auth/token**: Get session token for backend API

#### Middleware Layer
- **Middleware** (`web/middleware.ts`): Route protection and redirection

#### Firebase Layer
- **Firebase Admin SDK** (`web/lib/firebase/admin.ts`): User management and session handling
- **Firebase REST API**: Sign-in operations and ID token generation

#### Backend API Layer (NestJS)
- **AuthGuard** (`backend/src/common/guards/auth.guard.ts`): Protect backend API routes
- **CurrentUser Decorator**: Extract authenticated user from request

## Security Features

### HTTP-Only Cookies
- **Threat**: XSS attacks stealing tokens
- **Protection**: JavaScript cannot access session cookie
- **Benefit**: Even if XSS exists, session stays secure

### Secure Flag (Production)
- **Threat**: Man-in-the-middle attacks
- **Protection**: Cookie only sent over HTTPS
- **Benefit**: Prevents token interception

### SameSite Attribute
- **Threat**: CSRF attacks
- **Protection**: Cookie not sent with cross-site requests
- **Benefit**: Prevents unauthorized actions

### Server-Side Verification
- **Threat**: Token tampering
- **Protection**: Every request verified with Firebase Admin
- **Benefit**: Cannot fake authentication

### Token Revocation
- **Threat**: Stolen session used after logout
- **Protection**: Refresh tokens revoked on logout
- **Benefit**: User truly logged out everywhere

### Short Session Duration
- **Threat**: Long-lived compromised sessions
- **Protection**: 5-day maximum session life
- **Benefit**: Limits damage from stolen cookie

### No Client-Side Tokens
- **Threat**: Token exposure in localStorage/memory
- **Protection**: All tokens stay server-side
- **Benefit**: No client-side attack surface

## Session Management

### Session Cookie Details

| Property | Value | Purpose |
|----------|-------|---------|
| Name | `session` | Cookie identifier |
| Type | HTTP-only | Prevents JavaScript access (XSS protection) |
| Secure | `true` in production | HTTPS-only transmission |
| SameSite | `lax` | CSRF protection |
| Max Age | 5 days (432,000 seconds) | Session duration |
| Path | `/` | Available to all routes |

### Session Lifecycle

1. **Creation**: When user signs in or signs up
2. **Validation**: On every API request and page navigation
3. **Refresh**: Not automatic - user must re-login after 5 days
4. **Revocation**: On logout or when refresh tokens are revoked
5. **Expiration**: Automatically after 5 days

## API Reference

### Sign Up

**Endpoint**: `POST /api/auth/signup`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "uid": "abc123...",
    "email": "user@example.com",
    "displayName": "John Doe",
    "emailVerified": false
  }
}
```

### Sign In (Email/Password)

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "uid": "abc123...",
    "email": "user@example.com",
    "displayName": "John Doe",
    "emailVerified": true
  }
}
```

### Sign In (Google)

**Endpoint**: `POST /api/auth/google`

**Flow**:
1. Client initiates Google Sign-in popup via Firebase Client SDK
2. User authenticates with Google and grants permissions
3. Client receives ID token from Firebase
4. Client sends ID token to this endpoint
5. Server verifies token and creates session cookie

**Request**:
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "uid": "abc123...",
    "email": "user@gmail.com",
    "displayName": "John Doe",
    "emailVerified": true
  }
}
```

**Note**: Google Sign-in automatically creates a new user if one doesn't exist with that email.

### Get Current User

**Endpoint**: `GET /api/auth/user`

**Response**:
```json
{
  "user": {
    "uid": "abc123...",
    "email": "user@example.com",
    "displayName": "John Doe",
    "emailVerified": true
  }
}
```

Or if not authenticated:
```json
{
  "user": null
}
```

### Sign Out

**Endpoint**: `POST /api/auth/logout`

**Response**:
```json
{
  "success": true
}
```

### Get Session Token

**Endpoint**: `GET /api/auth/token`

**Response**:
```json
{
  "token": "session-cookie-value"
}
```

## Usage Examples

### Using the useAuth Hook

```typescript
import { useAuth } from '@/lib/contexts/auth-context'

function MyComponent() {
  const { user, loading, isAuthenticated, signIn, signInWithGoogle, signOut } = useAuth()

  // Login with email/password
  const handleLogin = async () => {
    try {
      await signIn('user@example.com', 'password123')
      // User is now logged in
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  // Login with Google
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
      // User is now logged in with Google account
    } catch (error) {
      console.error('Google login failed:', error)
    }
  }

  // Signup
  const handleSignup = async () => {
    try {
      await signUp('user@example.com', 'password123', 'Display Name')
      // User is now logged in
    } catch (error) {
      console.error('Signup failed:', error)
    }
  }

  // Logout
  const handleLogout = async () => {
    await signOut()
    // User is now logged out
  }

  // Check auth status
  if (loading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please log in</div>

  return <div>Welcome, {user.email}!</div>
}
```

### Protected Route (Server Component)

```typescript
import { firebaseServer } from '@/lib/firebase/admin'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const user = await firebaseServer.getCurrentUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return <div>Protected content for {user.email}</div>
}
```

### Protected Route (Client Component)

```typescript
'use client'

import { useAuth } from '@/lib/hooks/useAuth'

export default function ProtectedComponent() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please log in</div>

  return <div>Protected content</div>
}
```

### Backend AuthGuard

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@/common/guards/auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'

@Controller('journal')
@UseGuards(AuthGuard)
export class JournalController {
  @Get()
  async getEntries(@CurrentUser() user: any) {
    // user.uid, user.email available
    return this.service.getEntries(user.uid)
  }
}
```

## Error Handling

### Client-Side Errors

| Scenario | Handling |
|----------|----------|
| Network failure | Show error message, allow retry |
| Invalid credentials | Display specific error from server |
| Session expired | Redirect to login with message |
| Rate limiting | Show "too many attempts" message |

### Server-Side Errors

| Scenario | Response |
|----------|----------|
| Invalid session cookie | Return `{ user: null }`, delete cookie |
| Expired session | Return `{ user: null }`, delete cookie |
| Firebase error | Log error, return 500 |
| Missing credentials | Return 400 with error message |
| Email already exists | Return 400 with specific message |

## Testing

### Manual Testing Checklist

#### Email/Password Authentication
- [ ] Sign up with new email
- [ ] Sign up with existing email (should fail)
- [ ] Sign in with correct credentials
- [ ] Sign in with wrong password (should fail)

#### Google Authentication
- [ ] Sign in with Google account
- [ ] Sign up with Google (new user - should auto-create account)
- [ ] Sign in with Google (existing user)
- [ ] Cancel Google popup (should handle gracefully)

#### Session & Protected Routes
- [ ] Access protected route while logged in
- [ ] Access protected route while logged out (should redirect)
- [ ] Access auth page while logged in (should redirect to app)
- [ ] Sign out
- [ ] Verify can't access protected routes after logout
- [ ] Verify session persists after browser restart (within 5 days)
- [ ] Verify session expires after 5 days

### API Testing Examples

```bash
# Sign Up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test User"}' \
  -c cookies.txt

# Sign In (Email/Password)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Sign In (Google) - Note: Requires ID token from client-side Google auth
curl -X POST http://localhost:3000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<firebase-id-token-from-google-popup>"}' \
  -c cookies.txt

# Get User
curl http://localhost:3000/api/auth/user \
  -b cookies.txt

# Get Token
curl http://localhost:3000/api/auth/token \
  -b cookies.txt

# Sign Out
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

## Troubleshooting

### Not logged in after successful login

**Symptoms**: Login succeeds but user immediately redirected to login

**Possible Causes**:
1. Cookies not enabled in browser
2. `secure` flag mismatch (should be `false` in development)
3. Cookie not being sent with subsequent requests

**Solutions**:
1. Check browser cookie settings
2. Verify `credentials: 'include'` in fetch calls
3. Check cookie in DevTools → Application → Cookies
4. Ensure cookie `secure` flag matches environment

### Infinite redirect loop

**Symptoms**: Browser stuck redirecting between login and app

**Possible Causes**:
1. Middleware configuration error
2. Session cookie malformed
3. Auth routes not excluded from middleware

**Solutions**:
1. Check middleware `matcher` config
2. Clear cookies and try again
3. Check middleware excludes `/api/*` routes

### "Firebase Admin not initialized"

**Symptoms**: Server errors when trying to authenticate

**Possible Causes**:
1. `FIREBASE_SERVICE_ACCOUNT_KEY` not set
2. Invalid service account JSON
3. Environment variable not loaded

**Solutions**:
1. Verify `.env.local` exists
2. Validate service account JSON format
3. Restart development server after env changes

## Environment Variables

### Required Variables

```bash
# Client-side (public)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Server-side (private)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

## Google Sign-in Setup

### Firebase Console Configuration

To enable Google Sign-in, you must configure it in Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Click **Enable**
6. Configure the following:
   - **Project support email**: Select your email
   - **Web SDK configuration**: Your OAuth client ID will be auto-configured
7. Click **Save**

### Authorized Domains

Make sure your domains are authorized:

1. In Firebase Console → **Authentication** → **Settings**
2. Go to **Authorized domains**
3. Verify these domains are listed:
   - `localhost` (for development)
   - Your production domain (e.g., `your-app.com`)

### OAuth Consent Screen (if needed)

If users see an "unverified app" warning:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure your app information:
   - App name
   - User support email
   - Developer contact information
5. Add authorized domains
6. Submit for verification (for production apps)

### Troubleshooting Google Sign-in

| Issue | Solution |
|-------|----------|
| Popup blocked | Ensure browser allows popups for your domain |
| "Popup closed by user" error | User closed popup - handle gracefully |
| "auth/unauthorized-domain" | Add domain to Firebase authorized domains |
| "auth/operation-not-allowed" | Enable Google provider in Firebase Console |

## Related Documentation

- [Security Architecture](../architecture/security-architecture.md)
- [API Reference](../API_REFERENCE.md#authentication)
- [Setup Guide](../SETUP.md#authentication-setup)

