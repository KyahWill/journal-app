# Milestone Counts Feature

## Overview
Added accurate milestone tracking to goal cards, displaying the number of completed milestones vs total milestones for each goal.

## Changes Made

### 1. New Hook: `useMilestoneCounts`
**File:** `web/lib/hooks/useMilestoneCounts.ts`

A custom React hook that fetches milestone data for multiple goals in parallel and returns a map of milestone counts.

**Features:**
- Fetches milestones for all provided goal IDs in parallel for performance
- Returns `{ total, completed }` counts for each goal
- Handles errors gracefully (returns 0/0 on error)
- Automatically updates when goal IDs change
- Includes loading state

**Usage:**
```typescript
const { counts, loading } = useMilestoneCounts(goalIds)
// counts = { 'goal-id-1': { total: 5, completed: 3 }, ... }
```

### 2. Updated `GoalCard` Component
**File:** `web/components/goal-card.tsx`

**Changes:**
- Added `milestonesCompleted` and `milestonesTotal` props (optional, default to 0)
- Updated the milestone count display from hardcoded `0 / 0` to use actual values
- Passes milestone data to `GoalProgressBar` component
- Updated memo comparison to include milestone props

**Props:**
```typescript
interface GoalCardProps {
  goal: Goal
  viewMode?: 'grid' | 'list'
  milestonesCompleted?: number  // NEW
  milestonesTotal?: number       // NEW
}
```

### 3. Updated `VirtualizedGoalList` Component
**File:** `web/components/goal-list-virtualized.tsx`

**Changes:**
- Imports and uses the `useMilestoneCounts` hook
- Fetches milestone counts for all visible goals
- Passes milestone data to each `GoalCard` component
- Works with both virtualized and non-virtualized rendering modes

**Implementation:**
```typescript
const goalIds = useMemo(() => goals.map((g) => g.id), [goals])
const { counts: milestoneCounts } = useMilestoneCounts(goalIds)

// Then for each goal:
const milestoneData = milestoneCounts[goal.id] || { total: 0, completed: 0 }
<GoalCard 
  goal={goal} 
  viewMode={viewMode}
  milestonesCompleted={milestoneData.completed}
  milestonesTotal={milestoneData.total}
/>
```

## User-Visible Changes

### Goal Cards
Each goal card now displays:
- **Progress Bar:** Shows milestone counts in the tooltip (e.g., "3 of 5 milestones completed")
- **Milestone Count:** Shows "Milestones: X / Y" with accurate numbers
- **Real-time Updates:** Counts update when milestones are added, completed, or deleted

### Example Display
```
┌─────────────────────────────────┐
│ Complete React Course           │
│ [Learning] [In Progress]        │
│                                 │
│ Progress: 60%                   │
│ ████████████░░░░░░░░ 3/5 milestones │
│                                 │
│ Target: Dec 31, 2024            │
│ 37 days remaining               │
│                                 │
│ Milestones: 3 / 5              │
│                                 │
│ [Complete] [Delete]             │
└─────────────────────────────────┘
```

## Performance Considerations

1. **Parallel Fetching:** All milestone counts are fetched in parallel, not sequentially
2. **Memoization:** Goal IDs are memoized to prevent unnecessary refetches
3. **Graceful Degradation:** If milestone fetch fails, displays 0/0 instead of breaking
4. **Efficient Updates:** Only refetches when the list of goal IDs changes

## Testing

To test the feature:

1. **Create a goal** with milestones
2. **Navigate to goals page** - should see "Milestones: 0 / X" initially
3. **Complete some milestones** - count should update to "Milestones: Y / X"
4. **Add more milestones** - total count should increase
5. **Delete milestones** - counts should decrease accordingly

## Future Enhancements

Potential improvements:
- Cache milestone counts in the goal context to reduce API calls
- Add milestone counts to the goal stats dashboard
- Show milestone progress in goal insights
- Add filtering by milestone completion status
