# Goals Data Fetching Fix

## Problem

The Goals page was not calling the REST API to fetch goals. Instead, it was using Firestore SDK real-time listeners directly, which bypassed the NestJS backend entirely.

## Root Cause

The `GoalContext` (`web/lib/contexts/goal-context.tsx`) was using:
- **Firestore SDK** with `onSnapshot()` for real-time updates
- This connected directly to Firestore, not to your NestJS backend
- The REST API endpoints (`GET /goal`) were never being called

## Solution

Changed the data fetching strategy from Firestore SDK to REST API:

### Before (Firestore SDK)
```typescript
const subscribeToGoals = useCallback(() => {
  const db = getDbInstance()
  const goalsRef = collection(db, 'goals')
  const q = query(goalsRef, where('user_id', '==', user.uid))
  
  const unsubscribeFn = onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    setGoalState({ goals, loading: false })
  })
}, [user?.uid])
```

### After (REST API)
```typescript
const fetchGoals = useCallback(async () => {
  const goals = await apiClient.getGoals()
  setGoalState({ goals, loading: false })
}, [user?.uid])

const subscribeToGoals = useCallback(() => {
  fetchGoals() // Initial fetch
  
  // Poll for updates every 30 seconds
  const intervalId = setInterval(() => {
    fetchGoals()
  }, 30000)
  
  setUnsubscribe(() => () => clearInterval(intervalId))
}, [user?.uid, fetchGoals])
```

## Benefits

1. **Consistent Data Flow**: All data now flows through your NestJS backend
2. **Backend Validation**: Goals are validated by your backend DTOs
3. **Rate Limiting**: Backend rate limiting applies
4. **Logging**: Backend logs all goal operations
5. **Custom Categories**: Works with the new custom categories feature
6. **Easier Debugging**: All requests visible in Network tab

## Trade-offs

### Lost: Real-time Updates
- **Before**: Instant updates when data changed in Firestore
- **After**: Updates every 30 seconds via polling

### Gained: Backend Control
- All requests go through your NestJS API
- Consistent authentication and authorization
- Better error handling and logging
- Support for custom categories

## Alternative Approaches

If you need real-time updates, consider:

### Option 1: WebSocket/SSE
Add real-time updates via WebSocket or Server-Sent Events:
```typescript
// Backend: Add WebSocket support
@WebSocketGateway()
export class GoalsGateway {
  @SubscribeMessage('goals:subscribe')
  handleSubscribe(client: Socket) {
    // Send updates when goals change
  }
}
```

### Option 2: Hybrid Approach
Use REST API for fetching, Firestore SDK for real-time updates:
```typescript
// Fetch via API
const goals = await apiClient.getGoals()

// Subscribe to changes via Firestore
const unsubscribe = onSnapshot(query, (snapshot) => {
  // Update only changed documents
})
```

### Option 3: Shorter Polling Interval
Reduce polling interval for near-real-time updates:
```typescript
// Poll every 5 seconds instead of 30
const intervalId = setInterval(fetchGoals, 5000)
```

## Testing

To verify the fix works:

1. **Open Network Tab** in browser DevTools
2. **Navigate to Goals page**
3. **Look for API calls**:
   - Should see `GET /goal` request
   - Should see response with goals array
4. **Wait 30 seconds**:
   - Should see another `GET /goal` request (polling)
5. **Create a goal**:
   - Should see `POST /goal` request
   - Goals list should update

## Performance Considerations

### Polling Interval
- **30 seconds**: Good balance between freshness and server load
- **Adjust if needed**: Change interval in `subscribeToGoals()`

### Caching
Consider adding caching to reduce API calls:
```typescript
let cachedGoals: Goal[] = []
let lastFetch: number = 0
const CACHE_TTL = 10000 // 10 seconds

const fetchGoals = async () => {
  const now = Date.now()
  if (now - lastFetch < CACHE_TTL) {
    return cachedGoals
  }
  
  const goals = await apiClient.getGoals()
  cachedGoals = goals
  lastFetch = now
  return goals
}
```

### Pagination
For users with many goals, implement pagination:
```typescript
const fetchGoals = async (page = 1, limit = 20) => {
  const result = await apiClient.getGoals({ 
    limit, 
    startAfter: page > 1 ? lastGoalId : undefined 
  })
  return result
}
```

## Migration Notes

### No Data Migration Needed
- Goals are still stored in Firestore
- Only the fetching mechanism changed
- Existing goals work without changes

### Backward Compatibility
- All existing goal operations still work
- Custom categories fully supported
- No breaking changes to API

## Monitoring

Monitor these metrics after deployment:

1. **API Request Count**: Should see regular `GET /goal` requests
2. **Response Times**: Should be < 500ms for goal fetching
3. **Error Rates**: Should be < 1% for goal operations
4. **User Experience**: Goals should load within 1-2 seconds

## Troubleshooting

### Goals Not Loading
1. Check Network tab for API errors
2. Verify authentication token is valid
3. Check backend logs for errors
4. Ensure Firestore indexes are deployed

### Slow Loading
1. Check API response time
2. Consider adding pagination
3. Optimize Firestore queries
4. Add caching layer

### Stale Data
1. Reduce polling interval
2. Add manual refresh button
3. Consider WebSocket for real-time updates
4. Implement optimistic updates

## Future Enhancements

1. **WebSocket Support**: Add real-time updates via WebSocket
2. **Offline Support**: Cache goals for offline access
3. **Optimistic Updates**: Update UI before API response
4. **Infinite Scroll**: Load goals on demand
5. **Smart Polling**: Only poll when tab is active

---

**Date**: 2024
**Status**: ✅ Implemented
**Impact**: All goal fetching now goes through REST API
