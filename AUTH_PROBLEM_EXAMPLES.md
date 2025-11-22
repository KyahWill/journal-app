# Authentication Edge Cases - Real Code Examples

This document shows **actual code snippets** from your codebase that cause the random authentication errors, with explanations of exactly when and why they fail.

---

## Problem #1: Token Fetched on Every Request (No Caching)

### Current Code
**Location**: `web/lib/contexts/auth-context.tsx` lines 72-86

```typescript
// This runs EVERY time an API call is made
apiClient.setTokenGetter(async () => {
  try {
    const response = await fetch('/api/auth/token', {
      credentials: 'include',
      cache: 'no-store',
    })
    if (response.ok) {
      const data = await response.json()
      return data.token  // ❌ Not cached!
    }
  } catch (error) {
    console.error('Failed to get token:', error)
  }
  return null
})
```

### When It Fails

**Scenario**: Journal page loads with 5 recent entries showing

```typescript
// In your journal page component
useEffect(() => {
  apiClient.getJournalEntries()       // Calls token getter → Fetch #1
  apiClient.getUserPrompts()          // Calls token getter → Fetch #2
  apiClient.getChatSessions()         // Calls token getter → Fetch #3
  apiClient.getDefaultTheme()         // Calls token getter → Fetch #4
  apiClient.getRecentJournalEntries() // Calls token getter → Fetch #5
}, [])
```

**Result**:
```
t=0ms:   All 5 API calls start
t=1ms:   All 5 call token getter
t=1ms:   5 concurrent requests to /api/auth/token
t=50ms:  Request 1 completes: ✅ token received
t=55ms:  Request 2 completes: ✅ token received
t=60ms:  Request 3 completes: ❌ 500 error (server hiccup)
t=65ms:  Request 4 completes: ✅ token received
t=200ms: Request 5 completes: ⏱️ timeout (too slow)

API Call 1: ✅ Success (has token)
API Call 2: ✅ Success (has token)
API Call 3: ❌ FAILS - token getter returned null
API Call 4: ✅ Success (has token)
API Call 5: ❌ FAILS - token getter returned null
```

**User sees**: "Authentication required. Please sign in." (even though they ARE signed in!)

---

## Problem #2: Silent Token Failures

### Current Code
**Location**: `web/lib/contexts/auth-context.tsx` lines 78-85

```typescript
if (response.ok) {
  const data = await response.json()
  return data.token
}
// ❌ No error thrown here - just falls through to return null
} catch (error) {
  console.error('Failed to get token:', error)
  // ❌ Also no error thrown - just logs and continues
}
return null  // ❌ Silently returns null
```

### When It Fails

**Scenario**: Network has brief hiccup

```typescript
// In API client request method
const token = await this.getToken()  // Returns null (network error)
if (token) {
  headers['Authorization'] = `Bearer ${token}`
  tokenObtained = true
}
// ❌ If token is null, we just proceed without it!

const response = await fetch(url, { headers })
// ❌ Backend receives request with NO Authorization header
// ❌ Backend throws: UnauthorizedException('No token provided')
```

**Backend Error**:
```typescript
// backend/src/common/guards/auth.guard.ts lines 17-19
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  throw new UnauthorizedException('No token provided')  // 🔥 This fires!
}
```

**User sees**: "Not authenticated" or "No token provided" (generic error message)

---

## Problem #3: Race Condition on Mount

### Current Code
**Location**: `web/lib/contexts/auth-context.tsx` lines 70-89

```typescript
useEffect(() => {
  // 1. Set up token getter
  apiClient.setTokenGetter(async () => {
    // ... fetches token
  })

  // 2. Fetch user IMMEDIATELY
  fetchUser()  // ❌ No wait for token getter to be ready
}, [fetchUser])
```

### When It Fails

**Scenario**: User refreshes page

```
Timeline:
t=0ms:   AuthProvider mounts
t=1ms:   Token getter being configured
t=2ms:   fetchUser() called
t=3ms:   Journal component mounts and calls apiClient.getJournalEntries()
t=4ms:   API client calls this.getToken()
t=5ms:   ❌ getToken might be null or not fully initialized yet!
t=10ms:  Token getter setup complete (too late!)
```

**What happens**:
```typescript
// In API client
if (this.getToken) {  // ❌ Might be null/undefined
  const token = await this.getToken()  // ❌ Or might not be ready yet
}
```

**Result**: First API call after page load randomly fails because token getter isn't ready.

---

## Problem #4: Cookie Propagation After Login

### Current Code
**Location**: `web/lib/contexts/auth-context.tsx` lines 92-122

```typescript
const signIn = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  setAuthState({
    user: data.user,
    loading: false,
    error: null,
  })

  return data.user  // ❌ Returns immediately, no wait for cookie to propagate
}
```

**Location**: `web/app/auth/login/page.tsx` lines 27-30

```typescript
await signIn(email, password)
// ❌ Redirects IMMEDIATELY after signIn returns
router.push('/app/journal')
```

### When It Fails

**Scenario**: User clicks "Login" button

```
Timeline:
t=0ms:   User submits login form
t=50ms:  /api/auth/login sets session cookie
t=51ms:  signIn() returns
t=52ms:  router.push('/app/journal') executes
t=53ms:  Browser starts navigating to /app/journal
t=54ms:  ❌ Session cookie might not be included in next request yet!
t=55ms:  Journal page loads and calls apiClient
t=56ms:  Token getter calls /api/auth/token
t=57ms:  ❌ /api/auth/token doesn't see session cookie yet!
t=58ms:  Returns 401 "No session"
t=100ms: Cookie finally propagates (too late!)
```

**Result**: User logs in successfully but first page load fails with auth error.

---

## Problem #5: No Retry Logic for Token Fetch

### Current Code
**Location**: `web/lib/contexts/auth-context.tsx` lines 74-84

```typescript
try {
  const response = await fetch('/api/auth/token', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (response.ok) {
    return data.token
  }
  // ❌ If response is not ok (500, 503, etc.), no retry!
} catch (error) {
  // ❌ If network error, no retry!
}
return null
```

### When It Fails

**Scenario**: Server has brief 500 error

```
User action: Load journal page
  ↓
API client: Need token, calling getToken()
  ↓
Token getter: fetch('/api/auth/token')
  ↓
Server: 500 Internal Server Error (temporary database blip)
  ↓
Token getter: ❌ Response not ok, return null
  ↓
API client: No token, proceed without Authorization header
  ↓
Backend: ❌ UnauthorizedException('No token provided')
  ↓
User sees: "Not authenticated"
```

**Reality**: Server was available 100ms later, but we never retried!

---

## Problem #6: Multiple Parallel Token Fetches

### Current Code
**Location**: Combination of `auth-context.tsx` and `client.ts`

No deduplication or queueing of token fetch requests.

### When It Fails

**Scenario**: Complex page with many components

```typescript
// app/app/journal/page.tsx (hypothetical)
export default function JournalPage() {
  const entries = useJournal()           // Fetches entries
  const prompts = usePrompts()           // Fetches prompts
  const sessions = useChatSessions()     // Fetches sessions
  const theme = useTheme()               // Fetches theme
  const user = useCurrentUser()          // Fetches user
  
  // All hooks mount and fetch data simultaneously
}
```

**What happens**:
```
t=0ms: All 5 hooks call their respective apiClient methods
  ↓
5 × apiClient.getJournalEntries()
5 × await this.getToken()
  ↓
5 concurrent requests to /api/auth/token
  ↓
Request 1: 100ms
Request 2: 120ms
Request 3: ❌ Failed (rate limited)
Request 4: 150ms
Request 5: ❌ Failed (timeout)
```

**Result**: 2 out of 5 API calls fail due to overwhelming `/api/auth/token` endpoint.

---

## Problem #7: No Expiration Handling

### Current Code
**Location**: Token has no expiration tracking

Session cookie expires after 5 days (set in `login/route.ts`):
```typescript
const expiresIn = 60 * 60 * 24 * 5 * 1000  // 5 days
```

But there's no code to:
- Track when token will expire
- Refresh before expiry
- Handle expired tokens gracefully

### When It Fails

**Scenario**: User leaves tab open for 6 days

```
Day 1: User logs in, session cookie created (expires in 5 days)
Day 2-4: User uses app normally
Day 5: Session cookie expires
Day 6: User returns to app
  ↓
Middleware checks session cookie: ✅ Present (still in browser)
  ↓
User can access /app pages
  ↓
But when making API calls:
  ↓
Backend verifies session cookie: ❌ Expired!
  ↓
UnauthorizedException('Invalid token')
  ↓
User sees: "Authentication required" but middleware shows them as logged in
```

**Result**: User is "half logged in" - can access pages but can't make API calls.

---

## How These Combine to Create "Random" Errors

In practice, multiple issues compound:

```
User logs in (Problem #4: cookie timing)
  ↓
Redirects to journal (Problem #3: race condition)
  ↓
3 components mount (Problem #6: parallel fetches)
  ↓
Each fetches token (Problem #1: no caching)
  ↓
1 fetch fails (Problem #5: no retry)
  ↓
Returns null (Problem #2: silent failure)
  ↓
API call fails with auth error
```

**Why it seems random**:
- Sometimes timing is good → no error
- Sometimes network is fast → no error
- Sometimes only 1 component mounts → no error
- Sometimes all factors align → ERROR!

This is why you can't reliably reproduce it - it depends on:
- Network latency
- Server response time
- Browser timing
- Number of components mounting
- Cache state
- User navigation speed

---

## The Solution: Token Caching + Retry Logic

### After Fix
```typescript
// Cache token
let cachedToken = null
let tokenExpiry = 0

apiClient.setTokenGetter(async () => {
  // ✅ Return cached token if valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  // ✅ Fetch with retry logic
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch('/api/auth/token')
      if (response.ok) {
        const data = await response.json()
        cachedToken = data.token
        tokenExpiry = Date.now() + (4 * 60 * 1000)
        return cachedToken
      }
      // ✅ Retry on failure
      if (attempt < 1) {
        await new Promise(r => setTimeout(r, 300))
      }
    } catch (error) {
      // ✅ Retry on error
      if (attempt < 1) {
        await new Promise(r => setTimeout(r, 300))
      }
    }
  }
  return null
})
```

### After Fix: Same Scenario
```
User loads page → 5 components mount
  ↓
Component 1: apiClient.getJournalEntries()
  ↓
Token getter: Cache miss, fetch token
  ↓
✅ Token fetched and CACHED
  ↓
Component 2: apiClient.getUserPrompts()
  ↓
Token getter: ✅ Cache HIT - return immediately
  ↓
Component 3-5: ✅ All use cached token

Result: 1 token fetch for 5 API calls
All 5 API calls succeed! 🎉
```

---

## Quick Reference: Which Files to Fix

| File | Lines | Fix |
|------|-------|-----|
| `web/lib/contexts/auth-context.tsx` | 72-86 | Add token caching + retry |
| `web/lib/contexts/auth-context.tsx` | 92-122 | Add post-login token wait |
| `web/lib/api/client.ts` | 169-175 | Improve retry logic |
| `web/app/api/auth/token/route.ts` | 10-15 | Better error responses |

See `AUTHENTICATION_FIXES.md` for complete code examples.

