# Auth Context Usage

## Overview

The `AuthContext` provides a shared authentication state across all components in your application. This eliminates the need for multiple API calls to fetch user data - it's fetched once and shared everywhere.

## How It Works

### 1. Provider Setup

The `AuthProvider` is wrapped around your app layout in `/app/app/layout.tsx`:

```tsx
<AuthProvider>
  <div className="min-h-screen bg-gray-50">
    <AppHeader />
    <main>{children}</main>
  </div>
</AuthProvider>
```

This ensures all child components can access the shared auth state.

### 2. Using the Hook

Any component within the provider can use the `useAuth` hook:

```tsx
import { useAuth } from '@/lib/contexts/auth-context'

function MyComponent() {
  const { user, loading, isAuthenticated, signOut } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      {user && <p>Welcome, {user.email}!</p>}
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### 3. Available Properties and Methods

The `useAuth` hook provides:

- **State:**
  - `user`: Current user object or null
  - `loading`: Boolean indicating if auth state is loading
  - `error`: Error message if any
  - `isAuthenticated`: Boolean, true if user is logged in

- **Methods:**
  - `signIn(email, password)`: Sign in a user
  - `signUp(email, password, displayName?)`: Register a new user
  - `signOut()`: Sign out the current user
  - `refreshUser()`: Manually refresh user data from server

### 4. Benefits

✅ **Single API Call**: User data is fetched once on mount, not per component
✅ **Shared State**: All components see the same user data instantly
✅ **API Token Setup**: Automatically configures the API client with token getter
✅ **Consistent**: No state synchronization issues between components
✅ **Performance**: Reduces unnecessary network requests

### 5. Migration Notes

The old `/lib/hooks/useAuth.ts` now simply re-exports from the context for backward compatibility. All new code should import from:

```tsx
import { useAuth } from '@/lib/contexts/auth-context'
```

### 6. Example: AppHeader

Before (multiple fetch calls):
```tsx
useEffect(() => {
  async function fetchUser() {
    const response = await fetch('/api/auth/user', ...)
    // ...
  }
  fetchUser()
}, [])
```

After (shared context):
```tsx
const { user, signOut } = useAuth()
// User data already available!
```

## Implementation Details

The context:
1. Fetches user data once on mount
2. Sets up the API client token getter for backend authentication
3. Provides auth methods (signIn, signUp, signOut)
4. Maintains consistent state across all components
5. Handles loading and error states centrally

