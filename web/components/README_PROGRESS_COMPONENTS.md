# Progress Visualization Components

This document describes the progress visualization components created for the goal-setting feature.

## Components

### 1. GoalProgressBar (`goal-progress-bar.tsx`)

A reusable progress bar component with enhanced features for displaying goal progress.

**Features:**
- Horizontal progress bar with percentage display
- Color-coded based on progress level:
  - 0%: Gray (not started)
  - 1-24%: Red (just started)
  - 25-49%: Orange (early progress)
  - 50-74%: Yellow (halfway)
  - 75-99%: Blue (almost there)
  - 100%: Green (completed)
- Shows milestone completion fraction (e.g., "3/5 milestones")
- Interactive tooltip with detailed information on hover
- Configurable size (sm, md, lg)
- Accessible with ARIA labels

**Usage:**
```tsx
import { GoalProgressBar } from '@/components/goal-progress-bar'

<GoalProgressBar
  progress={65}
  milestonesCompleted={3}
  milestonesTotal={5}
  size="md"
  showPercentage={true}
  showMilestones={true}
/>
```

**Props:**
- `progress` (number, required): Progress percentage (0-100)
- `milestonesCompleted` (number, optional): Number of completed milestones
- `milestonesTotal` (number, optional): Total number of milestones
- `className` (string, optional): Additional CSS classes
- `showPercentage` (boolean, optional): Show percentage text (default: true)
- `showMilestones` (boolean, optional): Show milestone fraction (default: true)
- `size` ('sm' | 'md' | 'lg', optional): Bar height (default: 'md')

### 2. GoalDashboardWidget (`goal-dashboard-widget.tsx`)

A comprehensive dashboard widget that displays goal statistics and highlights.

**Features:**
- Summary statistics (active goals, completed goals, success rate)
- List of urgent goals with quick links (goals due within 7 days)
- Recent progress updates section
- Overdue goal indicator
- Responsive layout for dashboard integration
- Empty state with call-to-action
- Loading and error states

**Usage:**
```tsx
import { GoalDashboardWidget } from '@/components/goal-dashboard-widget'

<GoalDashboardWidget
  maxUrgentGoals={3}
  maxRecentUpdates={3}
/>
```

**Props:**
- `className` (string, optional): Additional CSS classes
- `maxUrgentGoals` (number, optional): Maximum urgent goals to display (default: 3)
- `maxRecentUpdates` (number, optional): Maximum recent updates to display (default: 3)

**Sections:**
1. **Summary Statistics**: Displays active, completed, and success rate
2. **Urgent Goals**: Shows goals approaching deadline with days remaining
3. **Recent Activity**: Lists recently updated goals with progress
4. **View All Link**: Button to navigate to full goals page

### 3. Tooltip Component (`ui/tooltip.tsx`)

A reusable tooltip component built with Radix UI for displaying contextual information.

**Usage:**
```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>
      <p>Tooltip content here</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Integration

### Updated Components

1. **GoalCard** (`goal-card.tsx`): Now uses `GoalProgressBar` instead of the basic `Progress` component
2. **Dashboard Page** (`app/app/page.tsx`): Now displays the `GoalDashboardWidget` on the main dashboard

### Requirements Satisfied

These components satisfy the following requirements from the design document:

- **Requirement 7.1**: Display horizontal progress bar with percentage
- **Requirement 7.2**: Color code based on progress level
- **Requirement 7.3**: Display summary statistics (active, completed, completion rate)
- **Requirement 9.1**: Identify goals with target_date within 7 days
- **Requirement 9.2**: Display notification for urgent goals

## Styling

All components use Tailwind CSS for styling and follow the application's design system:
- Consistent color palette
- Responsive breakpoints
- Accessible focus states
- Smooth transitions and animations

## Accessibility

- Progress bars include ARIA labels and roles
- Keyboard navigation supported
- Screen reader friendly
- Color contrast meets WCAG standards
- Semantic HTML structure

## Future Enhancements

Potential improvements for future iterations:
- Add goal analytics charts (pie chart for category distribution)
- Progress timeline visualization
- Completion trend line chart
- Animated progress transitions
- Customizable color themes
