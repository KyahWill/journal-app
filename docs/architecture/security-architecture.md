# Security Architecture

**Complete security and authentication architecture**

---

**Last Updated**: November 2024  
**Status**: Current

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication System](#authentication-system)
3. [Session Management](#session-management)
4. [Authorization](#authorization)
5. [Security Layers](#security-layers)
6. [Firestore Security Rules](#firestore-security-rules)
7. [Rate Limiting](#rate-limiting)
8. [Best Practices](#best-practices)

---

## Overview

The Journal application implements a comprehensive security architecture with multiple layers of protection. The system uses **100% server-side authentication** with Firebase Admin SDK, ensuring no client-side token exposure.

**Key Security Principles**:
- Server-side authentication only
- HTTP-only session cookies
- Defense in depth
- Principle of least privilege
- Zero trust architecture

---

## Authentication System

### Architecture Diagram

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
│  │              API Routes (/app/api/auth/)                   │  │
│  │                                                            │  │
│  │  POST /api/auth/login     - Authenticate user              │  │
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

### Authentication Flows

#### Sign Up Flow

```
1. User enters credentials (email, password, display name)
   │
   ▼
2. Client calls POST /api/auth/signup
   │
   ▼
3. Server creates user with Firebase Admin SDK
   │
   ▼
4. Server signs in user via Firebase REST API
   │
   ▼
5. Server receives ID token
   │
   ▼
6. Server creates session cookie (5-day expiry)
   │
   ▼
7. Server sets HTTP-only, secure cookie
   │
   ▼
8. User redirected to /app/journal
   │
   ▼
9. User is authenticated
```

#### Sign In Flow

```
1. User enters credentials (email, password)
   │
   ▼
2. Client calls POST /api/auth/login
   │
   ▼
3. Server authenticates via Firebase REST API
   │
   ▼
4. Server verifies ID token with Firebase Admin SDK
   │
   ▼
5. Server creates session cookie (5-day expiry)
   │
   ▼
6. Server sets HTTP-only, secure cookie
   │
   ▼
7. User redirected to /app/journal
   │
   ▼
8. User is authenticated
```

#### Protected Route Access Flow

```
1. User navigates to /app/journal
   │
   ▼
2. Middleware checks for session cookie
   │
   ├─ No cookie ──▶ Redirect to /auth/login
   │
   ▼
3. Has cookie ──▶ Allow access
   │
   ▼
4. Component calls GET /api/auth/user
   │
   ▼
5. Server verifies session cookie with Firebase Admin SDK
   │
   ├─ Invalid ──▶ Return { user: null }
   │              Delete cookie
   │              Client redirects to login
   │
   ▼
6. Valid ──▶ Return user data
   │
   ▼
7. Component renders with user
```

#### Sign Out Flow

```
1. User clicks Sign Out
   │
   ▼
2. Client calls POST /api/auth/logout
   │
   ▼
3. Server verifies session cookie
   │
   ▼
4. Server revokes all refresh tokens for user
   │
   ▼
5. Server deletes session cookie
   │
   ▼
6. User redirected to /auth/login
   │
   ▼
7. User is unauthenticated
```

### Implementation Details

**Login API Route** (`app/api/auth/login/route.ts`):
```typescript
export async function POST(request: Request) {
  const { email, password } = await request.json()
  
  // 1. Authenticate with Firebase REST API
  const idToken = await signInWithFirebase(email, password)
  
  // 2. Verify ID token with Firebase Admin SDK
  const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken)
  
  // 3. Create session cookie (5-day expiry)
  const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
  const sessionCookie = await firebaseAdmin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
  
  // 4. Get user data
  const user = await firebaseAdmin.auth().getUser(decodedToken.uid)
  
  // 5. Set HTTP-only, secure cookie
  const response = NextResponse.json({
    success: true,
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
    },
  })
  
  response.cookies.set('session', sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 5, // 5 days
    path: '/',
  })
  
  return response
}
```

**Middleware** (`middleware.ts`):
```typescript
export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  const { pathname } = request.nextUrl
  
  // Protected routes require session
  if (pathname.startsWith('/app') && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  // Auth pages redirect if already authenticated
  if (pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/app/journal', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/auth/:path*'],
}
```

**Backend Auth Guard** (`backend/src/common/guards/auth.guard.ts`):
```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly firebaseService: FirebaseService) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided')
    }
    
    const token = authHeader.substring(7)
    
    try {
      // Try session cookie first (from Next.js)
      let decodedToken
      try {
        decodedToken = await this.firebaseService.verifySessionCookie(token, true)
      } catch {
        // Fallback to ID token
        decodedToken = await this.firebaseService.verifyIdToken(token)
      }
      
      request.user = decodedToken
      return true
    } catch (error) {
      throw new UnauthorizedException('Invalid token')
    }
  }
}
```

---

## Session Management

### Session Cookie Properties

| Property | Value | Purpose |
|----------|-------|---------|
| Name | `session` | Cookie identifier |
| Type | HTTP-only | Prevents JavaScript access (XSS protection) |
| Secure | `true` in production | HTTPS-only transmission |
| SameSite | `lax` | CSRF protection |
| Max Age | 5 days (432,000 seconds) | Session duration |
| Path | `/` | Available to all routes |

### Session Lifecycle

```
Creation
   │
   ▼
Validation (on every request)
   │
   ├─ Valid ──▶ Continue
   │
   └─ Invalid ──▶ Delete cookie
                  Redirect to login
```

**Session Creation**:
- User signs in or signs up
- Server creates session cookie with Firebase Admin SDK
- Cookie set with HTTP-only, secure flags

**Session Validation**:
- On every API request
- On every page navigation (middleware)
- Server verifies with Firebase Admin SDK

**Session Expiration**:
- Automatic after 5 days
- Manual on logout (with refresh token revocation)
- On invalid/tampered cookie

### Why 5 Days?

- **Security**: Shorter sessions reduce attack window
- **UX**: Long enough for daily use without constant re-login
- **Compliance**: Meets most security requirements
- **Customizable**: Can be adjusted in auth route code

---

## Authorization

### Resource Ownership

All resources are owned by users and protected by ownership checks:

```typescript
// Service layer authorization
async getJournalEntry(userId: string, entryId: string) {
  const entry = await this.firebaseService.getDocument('journal_entries', entryId)
  
  if (!entry) {
    throw new NotFoundException('Entry not found')
  }
  
  if (entry.user_id !== userId) {
    throw new ForbiddenException('Access denied')
  }
  
  return entry
}
```

### Role-Based Access Control (Future)

Planned for future implementation:

```typescript
enum Role {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

@Roles(Role.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
async adminEndpoint() {
  // Admin-only logic
}
```

---

## Security Layers

### Defense in Depth

```
┌─────────────────────────────────────────┐
│         Request from Client             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Layer 1: HTTPS/TLS                  │
│     ✓ Encrypted transmission            │
│     ✓ Certificate validation            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Layer 2: CORS Policy                │
│     ✓ Origin validation                 │
│     ✓ Allowed methods                   │
│     ✓ Credentials handling               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Layer 3: Request Validation         │
│     ✓ DTO validation                    │
│     ✓ Type checking                     │
│     ✓ Required fields                   │
│     ✓ Input sanitization                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Layer 4: Authentication (Guard)     │
│     ✓ Token verification                │
│     ✓ User identification               │
│     ✓ Session validation                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Layer 5: Authorization (Service)    │
│     ✓ Resource ownership check          │
│     ✓ User permissions                  │
│     ✓ Role validation                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Layer 6: Firestore Rules            │
│     ✓ Server-side validation            │
│     ✓ Data access rules                 │
│     ✓ Field-level security              │
└──────────────┬──────────────────────────┘
               │
               ▼
          [Resource Access]
```

### Security Features

1. **HTTP-Only Cookies**
   - **Threat**: XSS attacks stealing tokens
   - **Protection**: JavaScript cannot access session cookie
   - **Benefit**: Even if XSS exists, session stays secure

2. **Secure Flag (Production)**
   - **Threat**: Man-in-the-middle attacks
   - **Protection**: Cookie only sent over HTTPS
   - **Benefit**: Prevents token interception

3. **SameSite Attribute**
   - **Threat**: CSRF attacks
   - **Protection**: Cookie not sent with cross-site requests
   - **Benefit**: Prevents unauthorized actions

4. **Server-Side Verification**
   - **Threat**: Token tampering
   - **Protection**: Every request verified with Firebase Admin
   - **Benefit**: Cannot fake authentication

5. **Token Revocation**
   - **Threat**: Stolen session used after logout
   - **Protection**: Refresh tokens revoked on logout
   - **Benefit**: User truly logged out everywhere

6. **Short Session Duration**
   - **Threat**: Long-lived compromised sessions
   - **Protection**: 5-day maximum session life
   - **Benefit**: Limits damage from stolen cookie

7. **No Client-Side Tokens**
   - **Threat**: Token exposure in localStorage/memory
   - **Protection**: All tokens stay server-side
   - **Benefit**: No client-side attack surface

---

## Firestore Security Rules

### Complete Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidString(value, minLen, maxLen) {
      return value is string 
        && value.size() >= minLen 
        && value.size() <= maxLen;
    }
    
    // Profiles
    match /profiles/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Journal entries
    match /journal_entries/{entryId} {
      allow read, delete: if isOwner(resource.data.user_id);
      allow create: if isOwner(request.resource.data.user_id)
        && isValidString(request.resource.data.title, 1, 200)
        && isValidString(request.resource.data.content, 1, 50000);
      allow update: if isOwner(resource.data.user_id)
        && isValidString(request.resource.data.title, 1, 200)
        && isValidString(request.resource.data.content, 1, 50000);
    }
    
    // Goals
    match /goals/{goalId} {
      allow read, delete: if isOwner(resource.data.user_id);
      allow create: if isOwner(request.resource.data.user_id)
        && isValidString(request.resource.data.title, 1, 200);
      allow update: if isOwner(resource.data.user_id)
        && isValidString(request.resource.data.title, 1, 200);
    }
    
    // Milestones
    match /milestones/{milestoneId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // Progress updates
    match /progress_updates/{updateId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // Chat sessions
    match /chat_sessions/{sessionId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // Voice sessions
    match /voice_sessions/{sessionId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // User themes
    match /user_themes/{themeId} {
      allow read: if isOwner(resource.data.user_id) 
                  || resource.data.is_public == true;
      allow write: if isOwner(resource.data.user_id);
    }
    
    // Custom categories
    match /custom_categories/{categoryId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // RAG embeddings
    match /rag_embeddings/{embeddingId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // Coach personalities (user-owned, unified for text & voice)
    match /coach_personalities/{personalityId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
  }
}
```

---

## Rate Limiting

### Implementation

```typescript
@Injectable()
export class RateLimitService {
  private readonly limits = new Map<string, number[]>()
  
  async checkLimit(userId: string, action: string): Promise<void> {
    const key = `${userId}:${action}`
    const now = Date.now()
    const windowMs = 60 * 60 * 1000 // 1 hour
    
    // Get timestamps within window
    const timestamps = this.limits.get(key) || []
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs)
    
    // Check limit
    const limit = this.getLimitForAction(action)
    if (validTimestamps.length >= limit) {
      throw new RateLimitExceededException()
    }
    
    // Add new timestamp
    validTimestamps.push(now)
    this.limits.set(key, validTimestamps)
  }
  
  private getLimitForAction(action: string): number {
    const limits = {
      chat: 50,        // 50 messages per hour
      insights: 10,    // 10 insight generations per hour
      voice: 20,       // 20 voice sessions per hour
      rag: 100,        // 100 RAG queries per hour
    }
    return limits[action] || 100
  }
}
```

### Rate Limits

| Action | Limit | Window |
|--------|-------|--------|
| Chat messages | 50 | 1 hour |
| Insight generation | 10 | 1 hour |
| Voice sessions | 20 | 1 hour |
| RAG queries | 100 | 1 hour |
| Default | 100 | 1 hour |

---

## Best Practices

### For Developers

1. **Always use `useAuth` hook** for authentication in components
2. **Never store tokens** in localStorage or sessionStorage
3. **Always include `credentials: 'include'`** in fetch calls
4. **Use server components** when possible for better security
5. **Handle auth errors gracefully** with user-friendly messages
6. **Log security events** (failed logins, token revocations)

### For Security

1. **Use HTTPS in production** (required for secure cookies)
2. **Keep session duration reasonable** (5 days recommended)
3. **Monitor for suspicious activity** (multiple failed logins)
4. **Rotate Firebase credentials regularly**
5. **Implement rate limiting** on all endpoints
6. **Log and alert on security events**
7. **Regular security audits**
8. **Keep dependencies updated**

### For UX

1. **Show loading states** during authentication
2. **Provide clear error messages** (but not too specific for security)
3. **Redirect appropriately** after login/signup
4. **Persist user session** across browser restarts
5. **Handle session expiry** with re-login prompt
6. **Graceful degradation** on errors

---

## Related Documentation

- **[Architecture Overview](../ARCHITECTURE.md)** - Complete architecture
- **[Web Architecture](web-architecture.md)** - Frontend details
- **[Backend Architecture](backend-architecture.md)** - Backend details
- **[System Overview](system-overview.md)** - High-level design

---

**Last Updated**: November 2024  
**Status**: Current
