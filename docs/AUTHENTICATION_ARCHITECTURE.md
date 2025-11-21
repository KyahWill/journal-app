# Authentication Architecture

## Overview

This application uses **server-side session-based authentication** with Firebase Admin SDK. All authentication operations are handled server-side using Next.js API routes, with HTTP-only cookies for session management. No client-side Firebase Auth SDK is used.

## Architecture Diagram

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

## Core Components

### 1. Client Layer

#### useAuth Hook (`/lib/hooks/useAuth.ts`)
- **Purpose**: Primary authentication interface for React components
- **Responsibilities**:
  - Manage authentication state (user, loading, error)
  - Provide methods: `signIn()`, `signUp()`, `signOut()`, `refreshUser()`
  - Communicate with server API routes
  - Automatic user fetching on mount
- **Key Feature**: Same interface as previous client-side implementation, ensuring backward compatibility

#### App Header (`/app/app/app-header.tsx`)
- **Purpose**: Display user info and provide logout functionality
- **Usage**: Fetches current user from `/api/auth/user` to display email

### 2. Server Layer - Next.js API Routes

#### `/api/auth/login` (POST)
**Purpose**: Authenticate existing users

**Flow**:
1. Receive email/password from client
2. Call Firebase REST API (`signInWithPassword`)
3. Receive ID token
4. Verify ID token with Firebase Admin SDK
5. Create session cookie (5-day expiry)
6. Set HTTP-only, secure cookie
7. Return user data

**Response**:
```json
{
  "success": true,
  "user": {
    "uid": "...",
    "email": "user@example.com",
    "displayName": "User Name",
    "emailVerified": true
  }
}
```

#### `/api/auth/signup` (POST)
**Purpose**: Create new user accounts

**Flow**:
1. Receive email/password/displayName from client
2. Create user with Firebase Admin SDK
3. Sign in new user via Firebase REST API
4. Create session cookie
5. Set HTTP-only, secure cookie
6. Return user data

**Special Cases**:
- Handles "email already exists" errors
- Handles weak password errors

#### `/api/auth/user` (GET)
**Purpose**: Get current authenticated user

**Flow**:
1. Read session cookie from request
2. Verify session cookie with Firebase Admin SDK
3. Fetch full user data from Firebase
4. Return user object or null

**Special Cases**:
- Returns `{ user: null }` if no session
- Deletes expired/invalid cookies automatically
- Returns 200 (not 401) when unauthenticated

**Used By**:
- `useAuth` hook (on mount and `refreshUser()`)
- App header (for displaying user email)

#### `/api/auth/logout` (POST)
**Purpose**: End user session

**Flow**:
1. Read session cookie
2. Verify session and get user ID
3. Revoke all refresh tokens for user
4. Delete session cookie
5. Return success

**Security**: Revokes refresh tokens to ensure user is logged out everywhere

#### `/api/auth/token` (GET)
**Purpose**: Get session token for backend API authentication

**Flow**:
1. Read session cookie
2. Return cookie value for backend verification

**Used By**: API client when calling NestJS backend

### 3. Middleware Layer

#### Middleware (`/middleware.ts`)
**Purpose**: Route protection and redirection

**Responsibilities**:
- Check for session cookie presence (not verification)
- Redirect unauthenticated users from `/app/*` to `/auth/login`
- Redirect authenticated users from `/auth/login` to `/app/journal`
- Run on Edge runtime (fast, but can't verify tokens)

**Important**: Middleware only checks cookie existence. Actual verification happens in:
- API routes (server-side)
- Server components (server-side)

### 4. Firebase Layer

#### Firebase Admin SDK (`/lib/firebase/admin.ts`)
**Responsibilities**:
- User creation and management
- Session cookie creation/verification
- Refresh token revocation
- ID token verification

**Configuration**: Uses `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable

#### Firebase REST API
**Used For**:
- Sign in operations (Admin SDK doesn't have email/password sign-in)
- Getting ID tokens for session cookie creation

## Authentication Flows

### Sign Up Flow

```
User enters credentials
        │
        ▼
Client calls /api/auth/signup
        │
        ▼
Server creates user (Admin SDK)
        │
        ▼
Server signs in user (REST API)
        │
        ▼
Server gets ID token
        │
        ▼
Server creates session cookie
        │
        ▼
Server sets HTTP-only cookie
        │
        ▼
User redirected to /app/journal
        │
        ▼
User is authenticated
```

### Sign In Flow

```
User enters credentials
        │
        ▼
Client calls /api/auth/login
        │
        ▼
Server authenticates (REST API)
        │
        ▼
Server verifies ID token (Admin SDK)
        │
        ▼
Server creates session cookie
        │
        ▼
Server sets HTTP-only cookie
        │
        ▼
User redirected to /app/journal
        │
        ▼
User is authenticated
```

### Protected Route Access Flow

```
User navigates to /app/journal
        │
        ▼
Middleware checks for session cookie
        │
        ├─ No cookie ──▶ Redirect to /auth/login
        │
        ▼
Has cookie ──▶ Allow access
        │
        ▼
Component calls /api/auth/user
        │
        ▼
Server verifies session cookie
        │
        ├─ Invalid ──▶ Return { user: null }
        │              Delete cookie
        │              Client redirects to login
        │
        ▼
Valid ──▶ Return user data
        │
        ▼
Component renders with user
```

### Sign Out Flow

```
User clicks Sign Out
        │
        ▼
Client calls /api/auth/logout
        │
        ▼
Server verifies session cookie
        │
        ▼
Server revokes refresh tokens
        │
        ▼
Server deletes session cookie
        │
        ▼
User redirected to /auth/login
        │
        ▼
User is unauthenticated
```

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

### Why 5 Days?

- **Security**: Shorter sessions reduce attack window
- **UX**: Long enough for daily use without constant re-login
- **Compliance**: Meets most security requirements
- **Customizable**: Can be adjusted in auth route code

## Security Features

### 1. HTTP-Only Cookies
- **Threat**: XSS attacks stealing tokens
- **Protection**: JavaScript cannot access session cookie
- **Benefit**: Even if XSS exists, session stays secure

### 2. Secure Flag (Production)
- **Threat**: Man-in-the-middle attacks
- **Protection**: Cookie only sent over HTTPS
- **Benefit**: Prevents token interception

### 3. SameSite Attribute
- **Threat**: CSRF attacks
- **Protection**: Cookie not sent with cross-site requests
- **Benefit**: Prevents unauthorized actions

### 4. Server-Side Verification
- **Threat**: Token tampering
- **Protection**: Every request verified with Firebase Admin
- **Benefit**: Cannot fake authentication

### 5. Token Revocation
- **Threat**: Stolen session used after logout
- **Protection**: Refresh tokens revoked on logout
- **Benefit**: User truly logged out everywhere

### 6. Short Session Duration
- **Threat**: Long-lived compromised sessions
- **Protection**: 5-day maximum session life
- **Benefit**: Limits damage from stolen cookie

### 7. No Client-Side Tokens
- **Threat**: Token exposure in localStorage/memory
- **Protection**: All tokens stay server-side
- **Benefit**: No client-side attack surface

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

## API Client Integration

### Backend Authentication Flow

```
Client needs data from backend
        │
        ▼
Client calls /api/auth/token
        │
        ▼
Gets session cookie value
        │
        ▼
Client sends to backend in Authorization header
        │
        ▼
Backend verifies with Firebase Admin SDK
        │
        ▼
Backend returns data
```

### API Client Setup (`/lib/api/client.ts`)

The API client automatically:
1. Calls `/api/auth/token` to get session cookie
2. Sends it to backend as Bearer token
3. Handles 401 responses by redirecting to login

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

# Backend API URL (optional)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Variable Usage

| Variable | Used By | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Login/Signup routes | Call REST API |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | All auth routes | Firebase Admin SDK |
| `NEXT_PUBLIC_API_URL` | API client | Backend communication |

## Testing

### Manual Testing Checklist

- [ ] Sign up with new email
- [ ] Sign up with existing email (should fail)
- [ ] Sign in with correct credentials
- [ ] Sign in with wrong password (should fail)
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

# Sign In
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
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

## Common Issues & Solutions

### Issue: Not logged in after successful login

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

### Issue: Infinite redirect loop

**Symptoms**: Browser stuck redirecting between login and app

**Possible Causes**:
1. Middleware configuration error
2. Session cookie malformed
3. Auth routes not excluded from middleware

**Solutions**:
1. Check middleware `matcher` config
2. Clear cookies and try again
3. Check middleware excludes `/api/*` routes

### Issue: "Firebase Admin not initialized"

**Symptoms**: Server errors when trying to authenticate

**Possible Causes**:
1. `FIREBASE_SERVICE_ACCOUNT_KEY` not set
2. Invalid service account JSON
3. Environment variable not loaded

**Solutions**:
1. Verify `.env.local` exists
2. Validate service account JSON format
3. Restart development server after env changes

### Issue: Session expires too quickly

**Symptoms**: Users logged out before expected

**Possible Causes**:
1. Session duration set too short
2. System time incorrect
3. Cookie expiry miscalculation

**Solutions**:
1. Adjust `expiresIn` in login/signup routes
2. Check server system time
3. Verify `maxAge` calculation (milliseconds vs seconds)

## Migration from Client-Side Auth

This system replaces the previous client-side Firebase Authentication. Key changes:

### Removed
- Direct Firebase Auth SDK usage in client
- `onAuthStateChanged` listeners
- Client-side token management
- Token refresh logic

### Added
- Server-side auth API routes
- Cookie-based session management
- Middleware session verification
- `/api/auth/user` endpoint

### Unchanged
- `useAuth` hook interface (backward compatible)
- Component code using `useAuth`
- UI components (login, signup forms)

See [`/docs/web/AUTH_MIGRATION_GUIDE.md`](./web/AUTH_MIGRATION_GUIDE.md) for detailed migration steps.

## Best Practices

### For Developers

1. **Always use `useAuth` hook** for authentication in components
2. **Never store tokens** in localStorage or sessionStorage
3. **Always include `credentials: 'include'`** in fetch calls
4. **Use server components** when possible for better performance
5. **Handle auth errors gracefully** with user-friendly messages
6. **Log security events** (failed logins, token revocations)

### For Security

1. **Use HTTPS in production** (required for secure cookies)
2. **Keep session duration reasonable** (5 days recommended)
3. **Monitor for suspicious activity** (multiple failed logins)
4. **Rotate Firebase credentials regularly**
5. **Implement rate limiting** on auth endpoints
6. **Log and alert on security events**

### For UX

1. **Show loading states** during authentication
2. **Provide clear error messages** (but not too specific for security)
3. **Redirect appropriately** after login/signup
4. **Persist user session** across browser restarts
5. **Handle session expiry** with re-login prompt

## Future Enhancements

### Planned Features

1. **Session Refresh**
   - Auto-refresh sessions before expiry
   - Seamless UX without re-login
   - Maintain security with token rotation

2. **Multi-Factor Authentication (MFA)**
   - SMS or authenticator app
   - Optional or required per user
   - Enhanced security for sensitive accounts

3. **OAuth Providers**
   - Google Sign-In
   - GitHub Sign-In
   - Social authentication

4. **Rate Limiting**
   - Prevent brute force attacks
   - IP-based limiting
   - Account lockout after failed attempts

5. **Session Management UI**
   - View active sessions
   - Remote session revocation
   - Device information tracking

6. **Remember Me**
   - Longer session duration option
   - Persistent login for trusted devices
   - Enhanced UX for frequent users

## Related Documentation

- [Server-Side Authentication Details](./web/SERVER_SIDE_AUTH.md)
- [Authentication Migration Guide](./web/AUTH_MIGRATION_GUIDE.md)
- [Implementation Summary](./web/IMPLEMENTATION_SUMMARY.md)
- [Firebase Admin Auth Guide](https://firebase.google.com/docs/auth/admin)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

## Support & Resources

### Internal Documentation
- `/docs/AUTHENTICATION_ARCHITECTURE.md` (this file)
- `/docs/web/SERVER_SIDE_AUTH.md` - Detailed implementation
- `/docs/web/AUTH_MIGRATION_GUIDE.md` - Migration steps

### Code References
- `/app/api/auth/` - Auth API routes
- `/lib/hooks/useAuth.ts` - Authentication hook
- `/middleware.ts` - Route protection
- `/lib/firebase/admin.ts` - Firebase Admin setup

### External Resources
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Session Cookies](https://firebase.google.com/docs/auth/admin/manage-cookies)
- [HTTP Cookie Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#security)

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Status**: Production Ready

