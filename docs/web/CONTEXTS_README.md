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

---

# Goal Context Usage

## Overview

The `GoalContext` provides shared goal and habit state across all components. It handles CRUD operations for goals, habit tracking with streak calculation, and optimistic updates for a responsive UI.

## How It Works

### 1. Provider Setup

The `GoalProvider` is wrapped in the app layout alongside `AuthProvider`:

```tsx
<AuthProvider>
  <GoalProvider>
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main>{children}</main>
    </div>
  </GoalProvider>
</AuthProvider>
```

### 2. Using the Hook

Any component within the provider can use the `useGoals` hook:

```tsx
import { useGoals } from '@/lib/contexts/goal-context'

function MyComponent() {
  const { 
    goals, 
    loading, 
    createGoal, 
    updateStatus, 
    toggleHabitCompletion 
  } = useGoals()
  
  if (loading) return <div>Loading...</div>
  
  // Separate habits and regular goals
  const habits = goals.filter(g => g.is_habit)
  const regularGoals = goals.filter(g => !g.is_habit)
  
  return (
    <div>
      <h2>Habits ({habits.length})</h2>
      {habits.map(habit => (
        <button 
          key={habit.id}
          onClick={() => toggleHabitCompletion(habit.id)}
        >
          {habit.title} - Streak: {habit.habit_streak}
        </button>
      ))}
    </div>
  )
}
```

### 3. Available Properties and Methods

The `useGoals` hook provides:

- **State:**
  - `goals`: Array of all goals (includes habits)
  - `loading`: Boolean indicating if goals are loading
  - `error`: Error message if any
  - `connected`: Boolean indicating connection status

- **Goal CRUD Methods:**
  - `createGoal(data)`: Create a new goal or habit
  - `updateGoal(id, data)`: Update goal properties
  - `deleteGoal(id)`: Delete a goal
  - `updateStatus(id, status)`: Update goal status

- **Habit Methods:**
  - `toggleHabitCompletion(id)`: Toggle today's completion for a habit

- **Milestone Methods:**
  - `addMilestone(goalId, data)`: Add a milestone
  - `toggleMilestone(goalId, milestoneId)`: Toggle milestone completion

- **Progress Methods:**
  - `addProgress(goalId, content)`: Add a progress update

- **Utility Methods:**
  - `filterGoals(filters)`: Filter goals by criteria
  - `getOverdueGoals()`: Get overdue goals
  - `getUrgentGoals()`: Get urgent goals
  - `sortGoals(goals, sortBy)`: Sort goals array

### 4. Creating a Habit

```tsx
const { createGoal } = useGoals()

// Create a daily habit
await createGoal({
  title: 'Exercise daily',
  description: '30 minutes of exercise',
  category: 'health',
  target_date: '2034-12-31',  // Far future for habits
  is_habit: true,
  habit_frequency: 'daily'
})
```

### 5. Toggling Habit Completion

```tsx
const { toggleHabitCompletion } = useGoals()

// Toggle today's completion - streak is automatically recalculated
const updatedHabit = await toggleHabitCompletion(habitId)
console.log(`New streak: ${updatedHabit.habit_streak}`)
```

### 6. Habit Fields in Goal Object

Goals that are habits (`is_habit: true`) have additional fields:

```typescript
interface Goal {
  // ... standard goal fields ...
  
  // Habit-specific fields
  is_habit: boolean           // true if this is a habit
  habit_frequency?: 'daily' | 'weekly' | 'monthly'
  habit_streak: number        // Current consecutive streak
  habit_completed_dates: string[]  // ISO dates when completed
}
```

### 7. Benefits

✅ **Unified System**: Goals and habits in one context
✅ **Optimistic Updates**: UI updates instantly before server confirms
✅ **Automatic Streak Calculation**: Streaks computed on toggle
✅ **Type Safety**: Full TypeScript support
✅ **Rollback on Error**: State reverts if API call fails

