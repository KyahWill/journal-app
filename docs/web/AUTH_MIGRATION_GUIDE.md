# Authentication Migration Guide

## Summary

The web application has been migrated from **client-side Firebase Authentication** to **server-side Firebase Authentication**.

## What Changed

### Before (Client-Side Auth)

```typescript
// Client-side Firebase Auth SDK
import { auth } from '@/lib/firebase/config'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'

// Auth state managed client-side
onAuthStateChanged(auth, (user) => {
  if (user) {
    const token = await user.getIdToken()
    // Manually manage token
  }
})
```

### After (Server-Side Auth)

```typescript
// Server-side API routes handle all auth
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
})

// Auth state fetched from server
const response = await fetch('/api/auth/user')
const { user } = await response.json()
```

## File Changes

### ✅ New Files Created

1. `/app/api/auth/login/route.ts` - Server-side login endpoint
2. `/app/api/auth/signup/route.ts` - Server-side signup endpoint
3. `/app/api/auth/logout/route.ts` - Server-side logout endpoint
4. `/app/api/auth/user/route.ts` - Get current user endpoint

### ♻️ Modified Files

1. `/lib/hooks/useAuth.ts` - Rewritten to use server APIs
2. `/lib/api/client.ts` - Updated to use cookies instead of tokens
3. `/proxy.ts` - Enhanced session verification
4. `/lib/firebase/config.ts` - Removed client-side auth initialization
5. `/lib/firebase/client.ts` - Removed auth methods

### 📦 Existing Files (No Changes Required)

- `/app/auth/login/page.tsx` - Works as-is
- `/app/auth/signup/page.tsx` - Works as-is
- `/app/app/layout.tsx` - Works as-is
- All other pages using `useAuth()` - Work as-is

## API Changes

### useAuth Hook

The `useAuth` hook interface remains **unchanged**, but the implementation now calls server APIs:

```typescript
// Still works exactly the same way
const { user, loading, signIn, signUp, signOut, isAuthenticated } = useAuth()

await signIn(email, password)  // Now calls /api/auth/login
await signUp(email, password)  // Now calls /api/auth/signup
await signOut()                // Now calls /api/auth/logout
```

### API Client

The API client no longer requires manual token management:

```typescript
// Before: Manual token management
apiClient.setToken(token)
apiClient.setTokenRefreshCallback(refreshCallback)

// After: Automatic (uses cookies)
// No manual setup required!
```

## Authentication Flow Comparison

### Before: Client-Side

```
Browser → Firebase SDK → Get Token → Store in Memory → 
  Send to API → Backend Verifies
```

**Issues**:
- Token exposed to JavaScript (XSS risk)
- Token management on client
- Token refresh complexity

### After: Server-Side

```
Browser → Server API → Firebase Admin → Create Session → 
  Set HTTP-Only Cookie → Automatic with Requests
```

**Benefits**:
- Token never exposed to JavaScript
- No token management on client
- Automatic cookie handling by browser
- HTTP-only, Secure cookies

## Breaking Changes

### ❌ Direct Firebase Auth Usage No Longer Works

```typescript
// ❌ This will NOT work
import { auth } from '@/lib/firebase/config'
// Error: 'auth' is no longer exported

// ✅ Use this instead
import { useAuth } from '@/lib/hooks/useAuth'
const { signIn } = useAuth()
```

### ❌ Token Management Methods Removed

```typescript
// ❌ These are removed from API client
apiClient.setToken(token)
apiClient.getToken()
apiClient.setTokenRefreshCallback(callback)

// ✅ Not needed - cookies handled automatically
```

### ❌ FirebaseClient Auth Methods Removed

```typescript
// ❌ These are removed
firebaseClient.signIn(email, password)
firebaseClient.signUp(email, password)
firebaseClient.signOut()
firebaseClient.getCurrentUser()
firebaseClient.onAuthStateChange(callback)

// ✅ Use server-side APIs via useAuth hook
```

## Migration Checklist

### For Developers

- [x] Server-side auth routes created
- [x] `useAuth` hook updated
- [x] API client updated for cookies
- [x] proxy updated for session verification
- [x] Firebase client config updated
- [ ] Environment variables configured (see below)
- [ ] Test authentication flow
- [ ] Update any custom auth code

### Environment Setup

Ensure these environment variables are set:

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

## Testing the Migration

### 1. Start the Development Server

```bash
cd web
pnpm install  # Install any new dependencies
pnpm dev
```

### 2. Test Sign Up

1. Navigate to `http://localhost:3000/auth/signup`
2. Enter email and password
3. Submit form
4. Should redirect to `/app/journal`
5. Check cookies in DevTools (should see `session` cookie)

### 3. Test Sign In

1. Sign out if logged in
2. Navigate to `http://localhost:3000/auth/login`
3. Enter credentials
4. Submit form
5. Should redirect to `/app/journal`

### 4. Test Protected Routes

1. While logged in, visit `/app/journal` - should work
2. Sign out
3. Try to visit `/app/journal` - should redirect to `/auth/login`

### 5. Test Session Persistence

1. Log in
2. Close browser
3. Reopen browser
4. Visit `/app/journal` - should still be logged in (for 5 days)

### 6. Test Sign Out

1. Log in
2. Click sign out button
3. Should redirect to `/auth/login`
4. Try to visit `/app/journal` - should redirect to `/auth/login`

## Common Issues

### Issue: "Firebase Auth not initialized"

**Cause**: Code trying to use client-side Firebase Auth

**Solution**: Update code to use `useAuth` hook or server APIs

### Issue: Not logged in after successful login

**Cause**: Cookies not being set/sent

**Solution**: 
- Check browser allows cookies
- Check `secure` flag matches environment (false for localhost)
- Check `credentials: 'include'` in fetch calls

### Issue: Infinite redirect loop

**Cause**: proxy misconfiguration

**Solution**: Verify proxy excludes auth routes from protection

## Rollback Plan

If issues arise, you can temporarily rollback by:

1. Restore previous versions of modified files from git
2. Comment out new API routes
3. Ensure environment variables still work with old code

However, this migration is designed to be backward-compatible at the component level, so rollback shouldn't be necessary.

## Next Steps

After migration is complete and tested:

1. ✅ Remove old client-side auth code (already done)
2. ✅ Update documentation (already done)
3. ⬜ Monitor for authentication errors in production
4. ⬜ Consider adding MFA (multi-factor authentication)
5. ⬜ Consider adding OAuth providers (Google, GitHub, etc.)
6. ⬜ Implement session refresh before expiry

## Support

For issues or questions about the migration:

1. Check `/web/docs/SERVER_SIDE_AUTH.md` for detailed documentation
2. Review the authentication API routes in `/app/api/auth/`
3. Check proxy configuration in `/proxy.ts`
4. Review the updated `useAuth` hook in `/lib/hooks/useAuth.ts`

## Summary of Benefits

✅ **Better Security**
- HTTP-only cookies prevent XSS attacks
- No token exposure to JavaScript
- Server-side session verification

✅ **Simpler Client Code**
- No token management
- No token refresh logic
- Automatic cookie handling

✅ **Better Control**
- Centralized session management
- Server can revoke sessions
- Easier to audit and monitor

✅ **Backward Compatible**
- Existing components still work
- Same `useAuth` interface
- No UI changes required

