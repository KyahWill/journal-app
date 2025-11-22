# Authentication Issues Analysis

## Overview
Your application uses a server-side authentication architecture with Firebase, where:
- Frontend uses HTTP-only session cookies
- API client fetches session tokens from `/api/auth/token` for backend authentication
- Backend NestJS API verifies tokens using Firebase Admin SDK

## Identified Edge Cases & Race Conditions

### 1. **Token Fetching on Every Request (No Caching)**
**Location**: `web/lib/contexts/auth-context.tsx` (lines 72-86)

**Issue**: The token getter fetches from `/api/auth/token` on **every single API request** to the backend. This creates:
- Unnecessary overhead and latency
- Race conditions when multiple API calls happen simultaneously
- Potential for intermittent failures due to timing

**Example Scenario**:
```
User loads page → 3 components mount simultaneously
  → Component A calls apiClient.getJournalEntries()
  → Component B calls apiClient.getUserPrompts()  
  → Component C calls apiClient.getChatSessions()
  ↓
All 3 trigger token getter simultaneously → 3 requests to /api/auth/token
If any fail or are slow → that API call proceeds without token → Auth error
```

**Current Code**:
```typescript
apiClient.setTokenGetter(async () => {
  try {
    const response = await fetch('/api/auth/token', {
      credentials: 'include',
      cache: 'no-store',
    })
    if (response.ok) {
      const data = await response.json()
      return data.token
    }
  } catch (error) {
    console.error('Failed to get token:', error)
  }
  return null  // Silent failure
})
```

---

### 2. **Silent Token Getter Failures**
**Location**: `web/lib/contexts/auth-context.tsx` (lines 72-86)

**Issue**: When the token getter fails (network error, 401, etc.), it silently returns `null`. The API client then makes a backend request **without an Authorization header**, leading to "No token provided" error.

**Flow**:
```
Token getter fails → returns null
  ↓
API client: "No token? I'll proceed anyway"
  ↓
Backend AuthGuard: "No Authorization header!"
  ↓
throws UnauthorizedException('No token provided')
```

**User sees**: "Authentication required. Please sign in." (even though they ARE signed in)

---

### 3. **Race Condition on Initial Mount**
**Location**: `web/lib/contexts/auth-context.tsx` (lines 70-89)

**Issue**: The AuthProvider sets up the token getter and immediately calls `fetchUser()`. However, if a component tries to make an API call to the backend **before** the token getter is fully initialized, it will fail.

**Timeline**:
```
t=0ms:  AuthProvider mounts
t=1ms:  Token getter being set up
t=2ms:  Component renders and calls apiClient.getJournalEntries()
t=3ms:  API client tries to get token → getToken is null or not ready
t=4ms:  Request sent without Authorization header
t=5ms:  Token getter setup complete (too late!)
```

---

### 4. **Cookie Propagation Timing After Login/Signup**
**Location**: `web/app/api/auth/login/route.ts` (lines 62-70)

**Issue**: After successful login/signup, a session cookie is set. However, there's no guarantee that subsequent requests will include this cookie immediately due to:
- Browser cookie propagation delays
- React state update timing
- Redirect timing

**Scenario**:
```
User logs in
  ↓
/api/auth/login sets session cookie
  ↓
AuthContext updates state with user
  ↓
Router redirects to /app/journal
  ↓
Journal page mounts and calls apiClient.getJournalEntries() IMMEDIATELY
  ↓
Token getter calls /api/auth/token
  ↓
Session cookie might not be included in this request yet!
  ↓
Returns 401 → token getter returns null → backend call fails
```

---

### 5. **No Retry Logic for Token Fetch Failures**
**Location**: `web/lib/api/client.ts` (lines 169-175)

**Issue**: The API client has retry logic for 401 errors, but it only retries if a token was **obtained** (tokenObtained = true). If the token getter returned `null`, there's no retry.

**Current Logic**:
```typescript
if (response.status === 401) {
  // Only retry if we had a token before (tokenObtained = true)
  if (retryCount === 0 && tokenObtained && this.getToken) {
    console.log('Token expired, retrying with fresh token...')
    return this.request<T>(endpoint, options, retryCount + 1)
  }
  throw new Error('Authentication required. Please sign in.')
}
```

**Problem**: If token getter returns `null` due to a transient error (network blip, server hiccup), the request fails immediately without retry.

---

### 6. **Multiple Parallel Token Fetches**
**Location**: `web/lib/api/client.ts` (lines 146-156)

**Issue**: When multiple API calls happen simultaneously (common on page load), each one independently calls the token getter, resulting in multiple concurrent requests to `/api/auth/token`. This can:
- Overwhelm the server
- Hit rate limits
- Cause some requests to timeout or fail
- Waste resources

---

### 7. **No Token Expiration Handling**
**Location**: Across authentication system

**Issue**: Session cookies expire after 5 days (set in login route), but there's no proactive token refresh mechanism. When a token expires:
- User is authenticated (has valid session cookie for Next.js middleware)
- But backend calls fail because token verification fails
- No automatic refresh or re-authentication flow

---

## How These Cause "Random" Errors

The errors appear random because they depend on:
1. **Timing**: How fast the user navigates, how quickly components mount
2. **Network conditions**: Latency, packet loss, slow responses
3. **Load**: How many components try to fetch data simultaneously
4. **Browser behavior**: Cookie propagation timing, cache behavior
5. **Server load**: Response time variations

## Recommended Fixes

### Priority 1: Add Token Caching
```typescript
// Cache token with expiration
let cachedToken: string | null = null
let tokenExpiry: number = 0
const TOKEN_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

apiClient.setTokenGetter(async () => {
  // Return cached token if valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }
  
  // Fetch fresh token
  try {
    const response = await fetch('/api/auth/token', {
      credentials: 'include',
      cache: 'no-store',
    })
    
    if (response.ok) {
      const data = await response.json()
      cachedToken = data.token
      tokenExpiry = Date.now() + TOKEN_CACHE_DURATION
      return cachedToken
    }
    
    // Clear cache on failure
    cachedToken = null
    tokenExpiry = 0
  } catch (error) {
    console.error('Failed to get token:', error)
    cachedToken = null
    tokenExpiry = 0
  }
  
  return null
})
```

### Priority 2: Add Retry Logic to Token Getter
```typescript
async function fetchTokenWithRetry(maxRetries = 2, delay = 500): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/api/auth/token', {
        credentials: 'include',
        cache: 'no-store',
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.token
      }
      
      // If 401, user is not authenticated - don't retry
      if (response.status === 401) {
        return null
      }
      
      // For other errors, retry after delay
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    } catch (error) {
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  return null
}
```

### Priority 3: Add Initialization Check
```typescript
// Ensure token getter is ready before allowing API calls
let tokenGetterReady = false

const initializeAuth = async () => {
  tokenGetterReady = false
  
  apiClient.setTokenGetter(async () => {
    // ... token getter implementation
  })
  
  // Warm up the cache
  await apiClient.setTokenGetter(...)
  
  tokenGetterReady = true
}

// In components, wait for auth to be ready
if (!tokenGetterReady) {
  // Show loading state or delay API calls
}
```

### Priority 4: Add Post-Login Verification
```typescript
// After login/signup, verify token is available before proceeding
const signIn = async (email: string, password: string) => {
  // ... existing login logic
  
  // Wait for token to be available
  let retries = 3
  while (retries > 0) {
    const token = await apiClient.getToken()
    if (token) break
    await new Promise(resolve => setTimeout(resolve, 200))
    retries--
  }
  
  // Now safe to redirect/proceed
  router.push('/app/journal')
}
```

### Priority 5: Better Error Messaging
Add specific error codes/types to distinguish:
- "No session cookie" (user not logged in)
- "Token fetch failed" (temporary network error)
- "Token expired" (need to re-authenticate)
- "Token invalid" (session corrupted)

This helps both debugging and user experience.

## Testing the Fixes

To test if these issues are resolved:

1. **Rapid Page Loads**: Refresh the page multiple times quickly
2. **Network Throttling**: Use Chrome DevTools to simulate slow 3G
3. **Concurrent Requests**: Open multiple tabs simultaneously
4. **Session Edge Cases**: Test right after login, after token expiry time
5. **Component Mounting**: Test pages with many components that fetch data

## Monitoring Recommendations

Add logging/monitoring for:
- Token fetch failures and reasons
- Token cache hit/miss rates
- Authentication errors by type
- Time between login and first successful API call
- Number of concurrent token fetch requests

This will help identify if edge cases are truly resolved or if new issues emerge.

