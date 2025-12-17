# Context Providers

This directory contains React Context providers for global state management across the application.

## Available Contexts

### AuthContext
**File**: `auth-context.tsx`  
**Hook**: `useAuth()`

Manages user authentication state and provides methods for sign in, sign up, and sign out.

```typescript
const { user, loading, isAuthenticated, signIn, signOut } = useAuth()
```

### GoalContext
**File**: `goal-context.tsx`  
**Hook**: `useGoals()`

Manages goal state with real-time synchronization, CRUD operations, and filtering utilities.

```typescript
const {
  goals,
  loading,
  error,
  connected,
  createGoal,
  updateGoal,
  deleteGoal,
  updateStatus,
  addMilestone,
  toggleMilestone,
  addProgress,
  filterGoals,
  getOverdueGoals,
  getUrgentGoals,
  sortGoals
} = useGoals()
```

**Features**:
- Real-time synchronization with Firestore
- Optimistic updates with automatic rollback on errors
- Comprehensive filtering and sorting
- Milestone and progress tracking
- Connection status monitoring

## Provider Hierarchy

The providers are nested in the following order in `app/layout.tsx`:

```
AuthProvider
  └── GoalProvider
      └── Application
```

This hierarchy ensures that:
1. Authentication is available first
2. Goal context can access auth state

## Usage Guidelines

### 1. Always use the custom hooks
```typescript
// ✅ Good
const { user } = useAuth()

// ❌ Bad
const context = useContext(AuthContext)
```

### 2. Handle loading states
```typescript
const { goals, loading } = useGoals()

if (loading) {
  return <LoadingSpinner />
}
```

### 3. Handle errors gracefully
```typescript
const { error, createGoal } = useGoals()

try {
  await createGoal(data)
  toast.success('Goal created!')
} catch (err) {
  toast.error(error || 'Failed to create goal')
}
```

### 4. Use optimistic updates wisely
The Goal context automatically handles optimistic updates. The UI updates immediately, and if the API call fails, the state rolls back automatically.

```typescript
// This updates the UI immediately
await updateGoal(id, { title: 'New Title' })
// If it fails, the old title is restored automatically
```

## Adding New Contexts

When adding a new context:

1. Create the context file in this directory
2. Follow the existing pattern (see `auth-context.tsx` or `goal-context.tsx`)
3. Export both the Provider and custom hook
4. Add the Provider to `app/layout.tsx` in the appropriate position
5. Update this README with usage information

## Best Practices

1. **Keep contexts focused**: Each context should manage a specific domain
2. **Use TypeScript**: All contexts should be fully typed
3. **Handle errors**: Always include error handling in context methods
4. **Optimize re-renders**: Use `useCallback` for methods and `useMemo` for computed values
5. **Clean up subscriptions**: Always unsubscribe from real-time listeners on unmount
6. **Document thoroughly**: Include JSDoc comments for all public methods
