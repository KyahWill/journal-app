# Authentication Quick Reference

Quick reference guide for working with authentication in this application.

## 📖 Table of Contents
- [For Component Development](#for-component-development)
- [Common Patterns](#common-patterns)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Testing](#testing)

## For Component Development

### Basic Authentication Usage

```typescript
'use client'

import { useAuth } from '@/lib/hooks/useAuth'

export default function MyComponent() {
  const { user, loading, isAuthenticated, signIn, signOut } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>
  }

  return (
    <div>
      <h1>Welcome {user?.email}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Sign In Form

```typescript
'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const { signIn, error } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      router.push('/app/journal')
    } catch (err) {
      // Error is available in useAuth().error
      console.error('Login failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
```

### Sign Up Form

```typescript
'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupForm() {
  const { signUp, error } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await signUp(email, password, displayName)
      router.push('/app/journal')
    } catch (err) {
      console.error('Signup failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Display Name"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  )
}
```

### Server Component with Auth

```typescript
import { firebaseServer } from '@/lib/firebase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const user = await firebaseServer.getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>User: {user.email}</p>
    </div>
  )
}
```

### Protected API Route

```typescript
import { NextResponse } from 'next/server'
import { firebaseServer } from '@/lib/firebase/server'

export async function GET() {
  const user = await firebaseServer.getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Use user.uid for user-specific operations
  const data = await fetchUserData(user.uid)

  return NextResponse.json({ data })
}
```

## Common Patterns

### Conditional Rendering Based on Auth

```typescript
'use client'

import { useAuth } from '@/lib/hooks/useAuth'

export default function Header() {
  const { isAuthenticated, user, signOut } = useAuth()

  return (
    <header>
      <nav>
        {isAuthenticated ? (
          <>
            <span>{user?.email}</span>
            <button onClick={signOut}>Sign Out</button>
          </>
        ) : (
          <a href="/auth/login">Sign In</a>
        )}
      </nav>
    </header>
  )
}
```

### Refresh User Data

```typescript
'use client'

import { useAuth } from '@/lib/hooks/useAuth'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()

  async function handleUpdateProfile() {
    // Update profile via API...
    
    // Refresh user data from server
    await refreshUser()
  }

  return (
    <div>
      <p>{user?.displayName}</p>
      <button onClick={handleUpdateProfile}>Update</button>
    </div>
  )
}
```

### Protected Route in Layout

```typescript
'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
```

## API Endpoints

### POST /api/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "uid": "abc123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "emailVerified": true
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

### POST /api/auth/signup

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "uid": "abc123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "emailVerified": false
  }
}
```

**Error Response (400):**
```json
{
  "error": "Email already in use"
}
```

### GET /api/auth/user

**Success Response (200):**
```json
{
  "user": {
    "uid": "abc123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**No Session Response (200):**
```json
{
  "user": null
}
```

### POST /api/auth/logout

**Success Response (200):**
```json
{
  "success": true
}
```

### GET /api/auth/token

**Success Response (200):**
```json
{
  "token": "session-cookie-value"
}
```

**Error Response (401):**
```json
{
  "error": "No session"
}
```

## Error Handling

### Common Error Codes

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Invalid credentials` | Wrong email/password | Check credentials |
| `Email already in use` | Email taken | Use different email |
| `Password must be at least 6 characters` | Weak password | Use stronger password |
| `Email and password are required` | Missing fields | Provide all fields |
| `Failed to get user` | Server error | Check server logs |
| `No session` | Not logged in | Redirect to login |
| `Session cookie expired` | Session expired | Re-login required |

### Handling Errors in Components

```typescript
'use client'

import { useAuth } from '@/lib/hooks/useAuth'

export default function LoginPage() {
  const { signIn, error, loading } = useAuth()

  async function handleLogin(email: string, password: string) {
    try {
      await signIn(email, password)
      // Success - redirect handled by useAuth or component
    } catch (err) {
      // Error is available in useAuth().error
      // Show user-friendly message
      if (error?.includes('credentials')) {
        alert('Invalid email or password')
      } else if (error?.includes('network')) {
        alert('Connection error. Please try again.')
      } else {
        alert('Login failed. Please try again.')
      }
    }
  }
}
```

### Handling 401 in API Calls

```typescript
async function fetchProtectedData() {
  const response = await fetch('/api/protected', {
    credentials: 'include',
  })

  if (response.status === 401) {
    // Session expired - redirect to login
    window.location.href = '/auth/login'
    return
  }

  if (!response.ok) {
    throw new Error('Request failed')
  }

  return response.json()
}
```

## Testing

### Manual Testing with cURL

```bash
# Sign Up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt -v

# Sign In
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt -v

# Get User
curl http://localhost:3000/api/auth/user \
  -b cookies.txt -v

# Get Token
curl http://localhost:3000/api/auth/token \
  -b cookies.txt -v

# Sign Out
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt -v
```

### Testing Session Persistence

```typescript
// Test that session persists across page reloads
test('session persists after reload', async () => {
  // Login
  await signIn('test@example.com', 'password123')
  
  // Reload page
  window.location.reload()
  
  // Wait for auth to load
  await waitFor(() => expect(user).not.toBeNull())
  
  // User should still be logged in
  expect(user?.email).toBe('test@example.com')
})
```

### Testing Logout

```typescript
// Test that logout clears session
test('logout clears session', async () => {
  // Login first
  await signIn('test@example.com', 'password123')
  expect(user).not.toBeNull()
  
  // Logout
  await signOut()
  
  // User should be null
  expect(user).toBeNull()
  
  // Accessing protected route should redirect
  router.push('/app/journal')
  await waitFor(() => {
    expect(router.pathname).toBe('/auth/login')
  })
})
```

## Debugging Tips

### Check Session Cookie

Open DevTools → Application → Cookies → `http://localhost:3000`

Look for cookie named `session`:
- Should be HTTP-only
- Should have correct expiry (5 days from now)
- Should be present after login
- Should be deleted after logout

### Check Network Requests

Open DevTools → Network tab

Filter for `/api/auth/` requests:
- Login should return 200 with user data
- Login should set `Set-Cookie` header
- Subsequent requests should include `Cookie` header
- `/api/auth/user` should return user data when authenticated

### Check Console Logs

Server logs (terminal running `pnpm dev`):
- `Login error:` - login failures
- `Signup error:` - signup failures
- `Get user error:` - session verification failures
- `Logout error:` - logout failures

Client logs (browser console):
- `Fetch user error:` - failed to get user
- `Sign in error:` - login failed
- `Sign up error:` - signup failed
- `Sign out error:` - logout failed

### Common Issues

**Problem**: "Not logged in after successful login"
```bash
# Check if cookie is being set
curl -v http://localhost:3000/api/auth/login ... -c cookies.txt
# Look for Set-Cookie header in response
```

**Problem**: "Session expires immediately"
```bash
# Check cookie expiry
curl -v http://localhost:3000/api/auth/user -b cookies.txt
# Cookie should be valid for 5 days
```

**Problem**: "Infinite redirect loop"
```typescript
// Check middleware.ts
// Ensure auth routes are excluded from protection
const isAuthRoute = pathname.startsWith('/auth/login') || 
                    pathname.startsWith('/auth/signup')
```

## Related Documentation

- [Authentication Architecture](../AUTHENTICATION_ARCHITECTURE.md) - Complete system overview
- [Server-Side Auth Details](./SERVER_SIDE_AUTH.md) - Implementation details
- [Auth Migration Guide](./AUTH_MIGRATION_GUIDE.md) - Migration from client-side

---

**Last Updated**: November 2024  
**Quick Link**: For architecture overview, see [`/docs/AUTHENTICATION_ARCHITECTURE.md`](../AUTHENTICATION_ARCHITECTURE.md)

