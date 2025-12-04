# Goals & Habits Feature

**Comprehensive goal management with milestones, progress tracking, and habit streaks**

---

**Last Updated**: December 2025  
**Status**: ✅ Complete

---

## Overview

The Goals & Habits feature provides a complete system for setting, tracking, and achieving personal and professional goals, as well as building recurring habits with streak tracking. Goals and habits are unified under a single system, with habits being a special type of goal that tracks daily/weekly/monthly completions.

## Key Features

### Goal Management

#### Create Goals
- Title and description
- Target date selection
- Category assignment (default or custom)
- Status selection (not started, in progress, completed)
- Automatic timestamp tracking

#### Create Habits
- Title and description
- Frequency selection (daily, weekly, monthly)
- Category assignment
- Automatic streak tracking
- No target date required (habits are ongoing)

#### Update Goals
- Edit all goal properties
- Change status
- Update target dates
- Reassign categories
- Modify descriptions

#### Delete Goals
- Confirmation dialog
- Cascade delete milestones and progress updates
- Permanent deletion with warning

### Milestone Tracking

#### Add Milestones
- Milestone title and description
- Target date for milestone
- Link to parent goal
- Automatic ordering

#### Complete Milestones
- Mark milestones as complete
- Completion timestamp tracking
- Progress calculation updates
- Visual completion indicators

#### Milestone Counts
- Accurate completed/total counts
- Real-time updates
- Display on goal cards
- Progress bar integration

### Progress Tracking

#### Progress Updates
- Add progress notes
- Timestamp tracking
- Progress history timeline
- Percentage completion
- Visual progress indicators

#### Progress Calculation
- Milestone-based progress
- Percentage completion
- Time remaining calculations
- Visual progress bars

### Habit Tracking

#### Daily/Weekly/Monthly Habits
- Toggle completion for current period
- Automatic streak calculation
- Visual streak indicators (🔥)
- Frequency badges (D/W/M)

#### Streak Calculation
- **Daily habits**: Consecutive days completed
- **Weekly habits**: Weeks with at least one completion
- **Monthly habits**: Months with at least one completion
- Streak resets if period is missed

#### Habit UI
- Separate "Habits" section on goals page
- Quick toggle checkboxes
- Streak count display
- Total streak summary

### Goal Organization

#### Filtering
- Filter by category
- Filter by status (not started, in progress, completed)
- Filter by priority
- Combine multiple filters

#### Searching
- Search by title
- Search by description
- Real-time search results
- Case-insensitive search

#### Sorting
- Sort by creation date
- Sort by target date
- Sort by priority
- Sort by progress
- Ascending/descending order

#### View Modes
- Grid view with cards
- List view with details
- Virtualized rendering for performance
- Responsive layouts

### Goal Insights

#### Statistics Dashboard
- Total goals count
- Goals by status
- Goals by category
- Completion rates
- Average progress
- Time tracking

#### Progress Trends
- Progress over time
- Milestone completion rates
- Category performance
- Goal completion velocity

## Architecture

### Database Schema

#### Goals Collection

```typescript
interface Goal {
  id: string
  user_id: string
  title: string
  description: string
  category: string  // Default category name or custom category ID
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
  target_date: Timestamp  // Far future for habits
  created_at: Timestamp
  updated_at: Timestamp
  completed_at?: Timestamp
  status_changed_at: Timestamp
  last_activity: Timestamp
  progress_percentage: number
  milestones: Milestone[]
  
  // Habit fields
  is_habit: boolean
  habit_frequency?: 'daily' | 'weekly' | 'monthly'
  habit_streak: number
  habit_completed_dates: string[]  // ISO dates (YYYY-MM-DD)
}

type HabitFrequency = 'daily' | 'weekly' | 'monthly'
```

**Indexes**:
- `user_id + created_at` (DESC)
- `user_id + status`
- `user_id + category`
- `user_id + target_date`
- `user_id + is_habit`

#### Milestones Collection

```typescript
interface Milestone {
  id: string
  goal_id: string
  user_id: string
  title: string
  description?: string
  is_completed: boolean
  completed_at?: Timestamp
  target_date?: string
  order: number
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Indexes**:
- `goal_id + order`
- `user_id + goal_id`
- `goal_id + is_completed`

#### Progress Updates Collection

```typescript
interface ProgressUpdate {
  id: string
  goal_id: string
  user_id: string
  note: string
  progress_percentage: number
  created_at: Timestamp
}
```

**Indexes**:
- `goal_id + created_at` (DESC)
- `user_id + goal_id`

### Components

#### GoalTodoItem
- Displays goal in to-do list format
- Checkbox for completion toggle
- Due date badge with overdue indicator
- Category badge
- Hover actions (delete, view details)
- Responsive design

#### HabitItem
- Displays habit with completion checkbox
- Frequency badge (D/W/M)
- Streak counter with flame icon (🔥)
- Toggle completion for today
- Hover actions (delete, view details)

#### GoalCreationWizard
- Multi-step goal/habit creation
- Step 1: Title, description, habit toggle
- Step 2: Category selection
- Step 3: Timeline (goals only, skipped for habits)
- Step 4: Milestones (goals only, skipped for habits)
- Step 5: Review and create

#### GoalQuickAdd
- Simple input for quick goal creation
- Default category and 30-day target date
- Instant creation without wizard

#### MilestoneList
- List of milestones for a goal
- Add new milestone
- Mark milestones complete
- Edit milestone details
- Delete milestones
- Drag-and-drop reordering

#### ProgressUpdates
- Timeline of progress updates
- Add new progress note
- Progress percentage input
- Timestamp display
- Visual timeline

#### GoalStats
- Statistics dashboard
- Charts and graphs
- Category breakdown
- Status distribution
- Completion rates

#### VirtualizedGoalList
- Efficient rendering of large lists
- Virtualization for performance
- Grid and list view support
- Milestone counts integration
- Responsive design

### API Endpoints

#### Goal Management

**GET /goal**
- Get all goals for user
- Query parameters: status, category, sort
- Returns: Array of goals (includes habits)

**GET /goal/:id**
- Get specific goal or habit
- Returns: Goal object with habit fields

**POST /goal**
- Create new goal or habit
- Body: Goal data with optional `is_habit` and `habit_frequency`
- Returns: Created goal/habit

**PUT /goal/:id**
- Update goal or habit
- Body: Partial goal data
- Returns: Updated goal/habit

**PATCH /goal/:id/habit-toggle**
- Toggle habit completion for today
- Returns: Updated habit with new streak

**DELETE /goal/:id**
- Delete goal or habit
- Cascade deletes milestones and progress
- Returns: Success message

#### Milestone Management

**GET /goal/:id/milestones**
- Get all milestones for goal
- Returns: Array of milestones

**POST /goal/:id/milestones**
- Create new milestone
- Body: Milestone data
- Returns: Created milestone

**PUT /goal/:goalId/milestones/:id**
- Update milestone
- Body: Partial milestone data
- Returns: Updated milestone

**DELETE /goal/:goalId/milestones/:id**
- Delete milestone
- Returns: Success message

**PATCH /goal/:goalId/milestones/:id/complete**
- Mark milestone as complete
- Returns: Updated milestone

#### Progress Tracking

**GET /goal/:id/progress**
- Get progress updates for goal
- Returns: Array of progress updates

**POST /goal/:id/progress**
- Add progress update
- Body: Progress data
- Returns: Created progress update

## Usage Examples

### Creating a Goal

```typescript
import { apiClient } from '@/lib/api/client'

const goal = await apiClient.createGoal({
  title: 'Complete React Course',
  description: 'Finish the advanced React course on Udemy',
  category: 'learning',
  target_date: '2024-12-31'
})
```

### Creating a Habit

```typescript
const habit = await apiClient.createGoal({
  title: 'Exercise daily',
  description: '30 minutes of exercise every day',
  category: 'health',
  target_date: '2034-12-31',  // Far future for habits
  is_habit: true,
  habit_frequency: 'daily'
})
```

### Toggling Habit Completion

```typescript
// Toggle today's completion status
const updatedHabit = await apiClient.toggleHabitCompletion(habitId)
console.log(`New streak: ${updatedHabit.habit_streak}`)
```

### Adding Milestones (Goals only)

```typescript
const milestone = await apiClient.addMilestone(goalId, {
  title: 'Complete Module 1',
  due_date: '2024-11-30'
})
```

### Marking Milestone Complete

```typescript
await apiClient.toggleMilestone(goalId, milestoneId)
```

### Adding Progress Update

```typescript
await apiClient.addProgressUpdate(goalId, {
  content: 'Completed 3 lessons today'
})
```

### Using the useMilestoneCounts Hook

```typescript
import { useMilestoneCounts } from '@/lib/hooks/useMilestoneCounts'

function GoalList({ goals }) {
  const goalIds = goals.map(g => g.id)
  const { counts, loading } = useMilestoneCounts(goalIds)

  return goals.map(goal => {
    const milestoneData = counts[goal.id] || { total: 0, completed: 0 }
    return (
      <GoalCard
        key={goal.id}
        goal={goal}
        milestonesCompleted={milestoneData.completed}
        milestonesTotal={milestoneData.total}
      />
    )
  })
}
```

## Features in Detail

### Milestone Counts

The milestone counts feature provides accurate tracking of completed vs total milestones for each goal.

**Implementation**:
- Custom hook `useMilestoneCounts` fetches milestone data
- Parallel fetching for multiple goals
- Returns map of `goalId → { total, completed }`
- Automatic updates when goals change
- Graceful error handling

**Display**:
- Goal cards show "Milestones: X / Y"
- Progress bar tooltip shows milestone info
- Real-time updates when milestones change

**Performance**:
- Parallel API calls for efficiency
- Memoization to prevent unnecessary refetches
- Only fetches when goal list changes

### Progress Calculation

Progress is calculated based on milestone completion:

```typescript
const progress = (completedMilestones / totalMilestones) * 100
```

If no milestones exist, progress can be manually set via progress updates.

### Category Integration

Goals can be assigned to:
- **Default categories**: Career, Health, Personal, Financial, Relationships, Learning, Other
- **Custom categories**: User-defined categories with custom colors and icons

Category assignment:
- Default categories use category name (e.g., "career")
- Custom categories use category ID (e.g., "custom-cat-123")

### Status Workflow

Goals progress through statuses:
1. **Not Started**: Initial state
2. **In Progress**: Work has begun
3. **Completed**: Goal achieved

Status can be changed manually or automatically based on milestone completion.

### Priority Levels

Goals can have priority levels:
- **Low**: Nice to have
- **Medium**: Important
- **High**: Critical

Priority affects sorting and visual indicators.

## Performance Optimizations

### Virtualized Rendering
- Large goal lists use virtualization
- Only renders visible items
- Smooth scrolling performance
- Reduces memory usage

### Parallel Fetching
- Milestone counts fetched in parallel
- Multiple API calls executed simultaneously
- Reduces total loading time

### Memoization
- Goal IDs memoized to prevent refetches
- Component memoization for expensive renders
- Callback memoization for event handlers

### Real-time Updates
- Firestore real-time subscriptions
- Automatic UI updates on data changes
- No manual refresh needed

## Testing

### Manual Testing Checklist

- [ ] Create a goal with all fields
- [ ] Create a goal with minimal fields
- [ ] Edit goal details
- [ ] Change goal status
- [ ] Change goal category
- [ ] Delete goal (verify confirmation)
- [ ] Add milestones to goal
- [ ] Mark milestones as complete
- [ ] Edit milestone details
- [ ] Delete milestone
- [ ] Add progress update
- [ ] View progress history
- [ ] Filter goals by status
- [ ] Filter goals by category
- [ ] Search goals by title
- [ ] Sort goals by date
- [ ] Switch between grid and list view
- [ ] Verify milestone counts display correctly
- [ ] Verify progress bar updates
- [ ] Test with large number of goals (100+)

### API Testing

```bash
# Create goal
curl -X POST http://localhost:3001/api/v1/goal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Goal",
    "description": "Test description",
    "category": "learning",
    "status": "not_started",
    "target_date": "2024-12-31"
  }'

# Get goals
curl http://localhost:3001/api/v1/goal \
  -H "Authorization: Bearer $TOKEN"

# Add milestone
curl -X POST http://localhost:3001/api/v1/goal/$GOAL_ID/milestones \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Milestone",
    "order": 1
  }'

# Complete milestone
curl -X PATCH http://localhost:3001/api/v1/goal/$GOAL_ID/milestones/$MILESTONE_ID/complete \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Milestone counts showing 0/0

**Symptoms**: Goal cards always show "Milestones: 0 / 0"

**Possible Causes**:
1. Milestones not being fetched
2. API endpoint returning empty array
3. Hook not being called

**Solutions**:
1. Check network tab for API calls
2. Verify milestone data exists in database
3. Check `useMilestoneCounts` hook is being used
4. Verify goal IDs are being passed correctly

### Progress not updating

**Symptoms**: Progress bar doesn't update when milestones completed

**Possible Causes**:
1. Real-time subscription not working
2. Progress calculation error
3. Component not re-rendering

**Solutions**:
1. Check Firestore real-time connection
2. Verify milestone completion is saving
3. Check component dependencies in useEffect
4. Force refresh by navigating away and back

### Goals not loading

**Symptoms**: Goal list is empty or shows loading forever

**Possible Causes**:
1. Authentication issue
2. API endpoint error
3. Network connectivity
4. Firestore permissions

**Solutions**:
1. Check user is authenticated
2. Check browser console for errors
3. Verify API endpoint is accessible
4. Check Firestore security rules

## Future Enhancements

### Planned Features

- [ ] Goal templates
- [ ] Goal dependencies
- [ ] Goal sharing and collaboration
- [ ] Goal reminders and notifications
- [ ] Goal analytics dashboard
- [ ] Goal export to PDF
- [ ] Goal import from templates
- [ ] Goal archiving
- [ ] Goal tags
- [ ] Goal attachments
- [ ] Goal comments
- [ ] Goal activity feed
- [ ] Habit reminders/notifications
- [ ] Habit analytics and charts
- [ ] Habit streaks leaderboard

### Potential Improvements

- [ ] Drag-and-drop goal reordering
- [ ] Bulk goal operations
- [ ] Goal duplication
- [ ] Advanced filtering
- [ ] Saved filter presets
- [ ] Goal calendar view
- [ ] Goal kanban board
- [ ] Goal timeline view
- [ ] Habit calendar heatmap
- [ ] Habit completion history view

## Related Documentation

- [API Reference](../API_REFERENCE.md#goals)
- [Custom Categories](./categories.md)
- [Database Setup](../setup/database-setup.md)
- [Backend Architecture](../architecture/backend-architecture.md)

