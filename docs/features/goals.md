# Goals Feature

**Comprehensive goal management with milestones and progress tracking**

---

**Last Updated**: November 2025  
**Status**: ✅ Complete

---

## Overview

The Goals feature provides a complete system for setting, tracking, and achieving personal and professional goals. It includes milestone tracking, progress updates, category organization, and detailed analytics.

## Key Features

### Goal Management

#### Create Goals
- Title and description
- Target date selection
- Category assignment (default or custom)
- Status selection (not started, in progress, completed)
- Priority levels
- Automatic timestamp tracking

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
  status: 'not_started' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  target_date: string  // ISO date
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Indexes**:
- `user_id + created_at` (DESC)
- `user_id + status`
- `user_id + category`
- `user_id + target_date`

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

#### GoalCard
- Displays goal summary
- Shows milestone counts
- Progress bar with percentage
- Status and category indicators
- Action buttons (complete, delete)
- Responsive design

#### GoalForm
- Create/edit goal form
- Field validation
- Category selection
- Date picker
- Status selection
- Error handling

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
- Returns: Array of goals

**GET /goal/:id**
- Get specific goal
- Returns: Goal object

**POST /goal**
- Create new goal
- Body: Goal data
- Returns: Created goal

**PUT /goal/:id**
- Update goal
- Body: Partial goal data
- Returns: Updated goal

**DELETE /goal/:id**
- Delete goal
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
  status: 'not_started',
  priority: 'high',
  target_date: '2024-12-31'
})
```

### Adding Milestones

```typescript
const milestone = await apiClient.createMilestone(goalId, {
  title: 'Complete Module 1',
  description: 'Finish all lessons in Module 1',
  target_date: '2024-11-30',
  order: 1
})
```

### Marking Milestone Complete

```typescript
await apiClient.completeMilestone(goalId, milestoneId)
```

### Adding Progress Update

```typescript
await apiClient.addProgressUpdate(goalId, {
  note: 'Completed 3 lessons today',
  progress_percentage: 60
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
- [ ] Recurring goals
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

### Potential Improvements

- [ ] Drag-and-drop goal reordering
- [ ] Bulk goal operations
- [ ] Goal duplication
- [ ] Goal versioning
- [ ] Goal rollback
- [ ] Advanced filtering
- [ ] Saved filter presets
- [ ] Goal calendar view
- [ ] Goal kanban board
- [ ] Goal timeline view

## Related Documentation

- [API Reference](../API_REFERENCE.md#goals)
- [Custom Categories](./categories.md)
- [Database Setup](../setup/database-setup.md)
- [Backend Architecture](../architecture/backend-architecture.md)

