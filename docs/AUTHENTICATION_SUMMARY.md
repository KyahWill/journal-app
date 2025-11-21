# Authentication System Summary

**Quick 5-minute overview of the authentication system**

## 🎯 TL;DR

- **100% Server-Side**: All auth happens on the server using Firebase Admin SDK
- **Session-Based**: HTTP-only cookies for security
- **No Client SDK**: No Firebase Auth SDK in browser
- **5-Day Sessions**: Automatic expiry for security
- **Drop-in Hook**: `useAuth()` works like before

## 🔒 Security Model

```
Traditional (Client-Side)          This App (Server-Side)
─────────────────────              ──────────────────────
                                   
Browser                            Browser
  ├── Firebase SDK                   └── (No tokens)
  ├── Tokens in JS ❌                     ↓
  └── Token in localStorage ❌      HTTP-only Cookie ✅
                                         ↓
      ↓                             Next.js Server
                                         ↓
API Server                          Verifies Cookie ✅
  └── Verifies token                     ↓
                                    Firebase Admin SDK
```

**Key Difference**: Tokens never touch JavaScript = safer from XSS attacks

## 📦 What You Need to Know

### For Frontend Developers

**Use the `useAuth` hook:**

```typescript
import { useAuth } from '@/lib/hooks/useAuth'

const { user, loading, signIn, signOut, isAuthenticated } = useAuth()
```

**That's it!** Works exactly like before, but more secure.

### For Backend Developers

**Server APIs handle everything:**

```typescript
POST /api/auth/login    → Sign in
POST /api/auth/signup   → Create account
POST /api/auth/logout   → Sign out
GET  /api/auth/user     → Get current user
```

All use Firebase Admin SDK internally.

### For Security Teams

**Protection against:**
- ✅ XSS attacks (HTTP-only cookies)
- ✅ Token theft (no client-side tokens)
- ✅ CSRF (SameSite cookies)
- ✅ Long-lived sessions (5-day expiry)
- ✅ Token tampering (server-side verification)

## 🔄 Authentication Flow (Simplified)

### Login
```
1. User enters email/password
2. Server verifies with Firebase
3. Server creates session cookie
4. Cookie set automatically
5. User is logged in
```

### Using the App
```
1. User visits page
2. Browser sends cookie automatically
3. Server checks cookie
4. Page loads if valid
5. Redirect to login if invalid
```

### Logout
```
1. User clicks logout
2. Server revokes tokens
3. Cookie deleted
4. User logged out
```

## 🎨 Usage Examples

### Login Form
```typescript
const { signIn } = useAuth()
await signIn(email, password)
```

### Check if Logged In
```typescript
const { isAuthenticated, user } = useAuth()
if (isAuthenticated) {
  console.log(user.email)
}
```

### Logout
```typescript
const { signOut } = useAuth()
await signOut()
```

### Protected Route (Server Component)
```typescript
const user = await firebaseServer.getCurrentUser()
if (!user) redirect('/auth/login')
```

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| Session Duration | 5 days |
| Token Type | HTTP-only cookie |
| Verification | Every request |
| SDK Used | Firebase Admin (server) |
| Client SDK | None |

## ⚙️ Configuration

**Required Environment Variables:**

```bash
# For Firebase REST API (login/signup)
NEXT_PUBLIC_FIREBASE_API_KEY=...

# For Firebase Admin SDK (verification)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

That's it! Only 2 variables needed for auth.

## 🚨 Common Issues

### "Not logged in after login"
- Check cookies are enabled
- Check `credentials: 'include'` in fetch calls
- Check cookie in DevTools

### "Session expires too fast"
- Default is 5 days
- Adjust in `/api/auth/login/route.ts`

### "Infinite redirect loop"
- Check middleware excludes `/api/*` routes
- Check auth pages excluded from protection

## 📚 Where to Learn More

### Quick Start
→ [Quick Reference Guide](web/AUTH_QUICK_REFERENCE.md) - Code examples

### Complete Details
→ [Authentication Architecture](AUTHENTICATION_ARCHITECTURE.md) - Full documentation

### Implementation
→ [Server-Side Auth Details](web/SERVER_SIDE_AUTH.md) - How it's built

### Migration
→ [Migration Guide](web/AUTH_MIGRATION_GUIDE.md) - Moving from client-side

### Navigation
→ [Documentation Index](INDEX.md) - All documentation

## 🎓 Key Concepts

### HTTP-Only Cookies
Cookies that JavaScript cannot access. Safer from XSS attacks.

### Session Cookie
A cookie that represents an authenticated session. Contains encrypted user token.

### Firebase Admin SDK
Server-side SDK for managing Firebase. Can create and verify session cookies.

### Middleware
Next.js code that runs before page loads. We use it to check authentication.

### Server-Side Verification
Checking authentication on the server, not in the browser. More secure.

## 📋 Checklist for Using Auth

- [ ] Import `useAuth` hook in components
- [ ] Use `isAuthenticated` to check login state
- [ ] Use `user` object for user info
- [ ] Call `signIn()` for login
- [ ] Call `signOut()` for logout
- [ ] Include `credentials: 'include'` in API calls
- [ ] Handle loading and error states
- [ ] Redirect unauthenticated users
- [ ] Use server components when possible

## 🎯 Quick Decision Tree

**Need to add auth to a component?**
```
Is it a client component?
├─ Yes → Use useAuth() hook
└─ No  → Use firebaseServer.getCurrentUser()

Need to protect a route?
├─ Page → Middleware handles it automatically
└─ API  → Check user in route handler

Need to call backend API?
└─ apiClient handles auth automatically
```

## 💡 Best Practices

1. **Always use `useAuth()`** - Don't try to manage auth yourself
2. **Check `loading`** - Wait for auth state before rendering
3. **Handle errors** - Show user-friendly messages
4. **Use server components** - Better performance
5. **Include credentials** - Always send cookies

## 🔍 Debugging Steps

1. **Check cookie exists**: DevTools → Application → Cookies
2. **Check cookie sent**: DevTools → Network → Headers
3. **Check API response**: Look for error messages
4. **Check server logs**: Terminal running `pnpm dev`
5. **Check middleware**: Is route protected correctly?

## 📞 Support

**Having issues?**

1. Check [Quick Reference](web/AUTH_QUICK_REFERENCE.md) - Common solutions
2. Check [Debugging Tips](web/AUTH_QUICK_REFERENCE.md#debugging-tips) - Troubleshooting
3. Read [Full Documentation](AUTHENTICATION_ARCHITECTURE.md) - Complete details
4. Check server logs for error messages

## 🎉 Summary

You now know:
- ✅ Auth is server-side with cookies
- ✅ Use `useAuth()` hook in components
- ✅ Sessions last 5 days
- ✅ HTTP-only cookies = more secure
- ✅ No client-side Firebase SDK needed
- ✅ Where to find more details

**Ready to code?** → [Quick Reference Guide](web/AUTH_QUICK_REFERENCE.md)

**Want details?** → [Full Architecture](AUTHENTICATION_ARCHITECTURE.md)

**Need help?** → [Documentation Index](INDEX.md)

---

**Last Updated**: November 2024  
**Reading Time**: 5 minutes  
**Next Steps**: [Quick Reference Guide](web/AUTH_QUICK_REFERENCE.md)

