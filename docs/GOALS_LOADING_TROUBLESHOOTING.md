# Goals Not Loading - Troubleshooting Guide

## Quick Fix Applied

**Issue**: Backend returns paginated response `{ goals: [], nextCursor: null }` but frontend expected `Goal[]`

**Fix**: Updated `apiClient.getGoals()` to extract the `goals` array from the paginated response.

## How to Debug

### Step 1: Check Browser Console

Open DevTools (F12) and check the Console tab for errors:

```javascript
// Look for these messages:
"Cannot fetch goals: user not authenticated"  // Auth issue
"Failed to fetch goals: [error message]"      // API error
```

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Reload the Goals page
3. Look for a request to `/goal`

**What to check:**
- ✅ Request is made to `/goal`
- ✅ Status code is 200 (success)
- ✅ Response contains `{ "goals": [...], "nextCursor": null }`
- ❌ Status 401 = Authentication issue
- ❌ Status 404 = Backend not running or wrong URL
- ❌ Status 500 = Backend error

### Step 3: Check Authentication

```javascript
// In browser console, check if user is authenticated:
localStorage.getItem('firebase:authUser')  // Should have user data
```

If null or undefined, you need to log in first.

### Step 4: Check Backend is Running

```bash
# Check if backend is running
curl http://localhost:3001/goal \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return:
# { "goals": [...], "nextCursor": null }
```

### Step 5: Check API Base URL

```javascript
// In browser console:
console.log(process.env.NEXT_PUBLIC_API_URL)

// Should be something like:
// "http://localhost:3001" (development)
// "https://your-api.com" (production)
```

## Common Issues & Solutions

### Issue 1: "Cannot fetch goals: user not authenticated"

**Cause**: User is not logged in or token expired

**Solution**:
1. Log out and log back in
2. Check if Firebase auth is working
3. Verify token is being sent in requests

### Issue 2: Network request fails (404)

**Cause**: Backend not running or wrong URL

**Solution**:
```bash
# Start backend
cd backend
npm run start:dev

# Verify it's running
curl http://localhost:3001/goal
```

### Issue 3: CORS error

**Cause**: Frontend and backend on different domains without CORS configured

**Solution**: Check backend CORS configuration in `backend/src/main.ts`:
```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'https://your-frontend.com'],
  credentials: true,
})
```

### Issue 4: Empty goals array

**Cause**: No goals in database or wrong user_id

**Solution**:
1. Create a test goal
2. Check Firestore console to verify goals exist
3. Verify `user_id` matches authenticated user

### Issue 5: Goals load but don't display

**Cause**: Frontend rendering issue

**Solution**: Check browser console for React errors

## Manual Testing

### Test 1: Check if API works directly

```bash
# Get your Firebase token
# (From browser console after logging in)
token=$(pbpaste)  # Or manually copy token

# Test API
curl http://localhost:3001/goal \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json"
```

**Expected response:**
```json
{
  "goals": [
    {
      "id": "abc123",
      "title": "My Goal",
      "category": "personal",
      "status": "in_progress",
      ...
    }
  ],
  "nextCursor": null
}
```

### Test 2: Check Firestore directly

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Check `goals` collection
4. Verify documents exist with your `user_id`

### Test 3: Check goal context state

```javascript
// In browser console (on Goals page):
// This will show the current state
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.forEach(r => {
  const fiber = r.getFiberRoots().values().next().value
  // Navigate to GoalContext and check state
})
```

Or use React DevTools extension to inspect GoalContext.

## Debug Mode

Add this to your `goal-context.tsx` to see detailed logs:

```typescript
const fetchGoals = useCallback(async () => {
  console.log('[DEBUG] fetchGoals called', { userId: user?.uid })
  
  if (!user?.uid) {
    console.warn('[DEBUG] No user ID, skipping fetch')
    return
  }

  try {
    console.log('[DEBUG] Fetching goals from API...')
    setGoalState((prev) => ({ ...prev, loading: true, error: null }))
    
    const goals = await apiClient.getGoals()
    console.log('[DEBUG] Goals fetched:', goals)
    
    setGoalState((prev) => ({
      ...prev,
      goals: Array.isArray(goals) ? goals : [],
      loading: false,
      connected: true,
      error: null,
    }))
    console.log('[DEBUG] State updated successfully')
  } catch (error: any) {
    console.error('[DEBUG] Failed to fetch goals:', error)
    setGoalState((prev) => ({
      ...prev,
      loading: false,
      connected: false,
      error: error.message || 'Failed to fetch goals',
    }))
  }
}, [user?.uid])
```

## Verification Checklist

- [ ] Backend is running (`npm run start:dev`)
- [ ] Frontend is running (`npm run dev`)
- [ ] User is logged in (check localStorage)
- [ ] API_URL is correct (check .env)
- [ ] Network request to `/goal` succeeds (200 status)
- [ ] Response contains `goals` array
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] Firestore has goals for this user
- [ ] Goals array is not empty

## Still Not Working?

### Check Backend Logs

```bash
cd backend
npm run start:dev

# Watch for logs when you load the Goals page
# Should see:
# [GoalService] Fetching goals for user: [user_id]
```

### Check Frontend State

Add this temporarily to `goals/page.tsx`:

```typescript
export default function GoalsPage() {
  const { goals, loading, error } = useGoals()
  
  // Debug output
  console.log('Goals Page State:', { 
    goalsCount: goals.length, 
    loading, 
    error 
  })
  
  // ... rest of component
}
```

### Check API Client Token

Add this to `web/lib/api/client.ts`:

```typescript
private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // ... existing code ...
  
  if (this.getToken) {
    const token = await this.getToken()
    console.log('[API] Token obtained:', token ? 'YES' : 'NO')
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }
  }
  
  console.log('[API] Request:', { endpoint, headers })
  
  // ... rest of method
}
```

## Expected Flow

1. User navigates to `/app/goals`
2. `GoalContext` initializes
3. `useEffect` detects authenticated user
4. `subscribeToGoals()` is called
5. `fetchGoals()` is called immediately
6. API request to `GET /goal` is made
7. Backend returns `{ goals: [...], nextCursor: null }`
8. Frontend extracts `goals` array
9. State is updated with goals
10. Goals page renders the list

## Contact Points

If you're still stuck, check:
1. Backend logs for errors
2. Firestore console for data
3. Network tab for failed requests
4. Console for JavaScript errors
5. React DevTools for component state
