# Authentication Cheat Sheet

**One-page quick reference for authentication**

## 🚀 Quick Start

```typescript
import { useAuth } from '@/lib/hooks/useAuth'

const { user, loading, isAuthenticated, signIn, signOut } = useAuth()
```

## 📋 Common Code Patterns

### Login
```typescript
const { signIn } = useAuth()
await signIn('user@example.com', 'password123')
```

### Signup
```typescript
const { signUp } = useAuth()
await signUp('user@example.com', 'password123', 'Display Name')
```

### Logout
```typescript
const { signOut } = useAuth()
await signOut()
```

### Check Auth Status
```typescript
const { isAuthenticated, user } = useAuth()

if (isAuthenticated) {
  console.log(`Logged in as ${user.email}`)
}
```

### Show User Info
```typescript
const { user } = useAuth()

return <div>Welcome, {user?.displayName || user?.email}!</div>
```

### Loading State
```typescript
const { loading, user } = useAuth()

if (loading) return <div>Loading...</div>
return <div>Hello {user?.email}</div>
```

### Protected Component
```typescript
const { isAuthenticated } = useAuth()

if (!isAuthenticated) {
  return <div>Please log in</div>
}

return <ProtectedContent />
```

### Server Component Auth
```typescript
import { firebaseServer } from '@/lib/firebase/server'
import { redirect } from 'next/navigation'

const user = await firebaseServer.getCurrentUser()
if (!user) redirect('/auth/login')
```

### Protected API Route
```typescript
import { firebaseServer } from '@/lib/firebase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await firebaseServer.getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  return NextResponse.json({ data: 'protected data' })
}
```

## 🔌 API Endpoints

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/auth/login` | POST | Sign in | `{ email, password }` |
| `/api/auth/signup` | POST | Create account | `{ email, password, displayName? }` |
| `/api/auth/logout` | POST | Sign out | (none) |
| `/api/auth/user` | GET | Get current user | (none) |
| `/api/auth/token` | GET | Get session token | (none) |

## 📦 useAuth Hook API

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Current user object |
| `loading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message |
| `isAuthenticated` | `boolean` | True if logged in |
| `signIn(email, password)` | `Promise<User>` | Sign in |
| `signUp(email, password, name?)` | `Promise<User>` | Sign up |
| `signOut()` | `Promise<void>` | Sign out |
| `refreshUser()` | `Promise<void>` | Refresh user data |

## 👤 User Object

```typescript
{
  uid: string              // User ID
  email: string | null     // Email address
  displayName: string | null  // Display name
  emailVerified: boolean   // Email verified?
  createdAt?: string       // Creation timestamp
}
```

## 🔒 Session Details

| Property | Value |
|----------|-------|
| Cookie Name | `session` |
| Duration | 5 days |
| Type | HTTP-only, Secure |
| SameSite | Lax |
| Path | `/` |

## ⚙️ Environment Variables

```bash
# Required for login/signup (REST API)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key

# Required for verification (Admin SDK)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Optional: Firebase config (for other features)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## 🐛 Debugging Checklist

- [ ] Cookie exists? (DevTools → Application → Cookies)
- [ ] Cookie sent with request? (DevTools → Network → Headers)
- [ ] `credentials: 'include'` in fetch?
- [ ] Environment variables set?
- [ ] Server logs showing errors?
- [ ] Session expired? (5 days max)

## ❌ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid credentials` | Wrong password | Check credentials |
| `Email already in use` | Duplicate email | Use different email |
| `No session` | Not logged in | Sign in first |
| `Session cookie expired` | Old session | Sign in again |
| `Unauthorized` | Not authenticated | Check session cookie |

## 🔄 Fetch with Auth

### Client-Side (Automatic)
```typescript
// Cookies sent automatically with credentials: 'include'
const response = await fetch('/api/protected', {
  credentials: 'include',
})
```

### To Backend API
```typescript
import { apiClient } from '@/lib/api/client'

// API client handles auth automatically
const data = await apiClient.get('/your-endpoint')
```

## 🛡️ Security Features

- ✅ HTTP-only cookies (no JS access)
- ✅ Secure flag in production (HTTPS only)
- ✅ SameSite attribute (CSRF protection)
- ✅ Server-side verification (every request)
- ✅ Token revocation on logout
- ✅ 5-day session expiry
- ✅ No client-side tokens

## 📍 Route Protection

### Middleware (Automatic)
```typescript
// Middleware protects /app/* routes automatically
// No code needed in components!

// Protected: /app/journal, /app/coach
// Public: /auth/login, /auth/signup
```

### Manual Protection
```typescript
// In component
const router = useRouter()
const { isAuthenticated, loading } = useAuth()

useEffect(() => {
  if (!loading && !isAuthenticated) {
    router.push('/auth/login')
  }
}, [isAuthenticated, loading])
```

## 🧪 Testing Commands

```bash
# Sign Up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -c cookies.txt

# Sign In
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -c cookies.txt

# Get User
curl http://localhost:3000/api/auth/user -b cookies.txt

# Sign Out
curl -X POST http://localhost:3000/api/auth/logout -b cookies.txt
```

## 📚 Learn More

- **Quick Overview**: [Authentication Summary](AUTHENTICATION_SUMMARY.md)
- **Complete Guide**: [Authentication Architecture](AUTHENTICATION_ARCHITECTURE.md)
- **Code Examples**: [Quick Reference](web/AUTH_QUICK_REFERENCE.md)
- **All Docs**: [Documentation Index](INDEX.md)

---

**Print this page for quick reference while coding!**

Last Updated: November 2024

