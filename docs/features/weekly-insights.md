# Weekly Insights Feature

**Last Updated**: December 2025

## Overview

Weekly Insights is an AI-powered feature that automatically analyzes your journal entries on a Saturday-to-Friday cadence, providing personalized reflections, emotional pattern recognition, progress summaries, and actionable coaching recommendations.

## Key Features

### 1. Automatic Insight Generation

When you visit the Weekly Insights page, the system automatically:

1. Checks if an insight already exists for the current week
2. If not, gathers all journal entries from the week (Saturday–Friday)
3. Generates AI-powered analysis using Google Gemini
4. Saves the insight to the database for future reference

### 2. Streaming Content Display

Insights are streamed in real-time using Server-Sent Events (SSE):

- Content appears incrementally as it's generated
- Rich markdown formatting with custom styling
- Loading indicators during generation
- Smooth reading experience

### 3. Weekly Cadence

The feature uses a consistent Saturday-to-Friday weekly cycle:

- **Week Start**: Saturday at 00:00:00
- **Week End**: Friday at 23:59:59
- Each week gets exactly one insight
- Regeneration overwrites existing insight for the week

### 4. History & Archive

Browse and revisit past weekly insights:

- Full history of all generated insights
- Date range and entry count for each
- Quick navigation between historical insights
- Return to current week easily

### 5. Insight Management

- **Regenerate**: Force a new analysis for the current week
- **Delete**: Remove unwanted insights
- **View**: Read historical insights anytime

## User Interface

### Insights Page (`/app/insights`)

The main interface includes:

#### Hero Section
- Feature title and description
- Current week date range display
- Entry count badge
- Saved status indicator

#### Action Bar
- **Generate/Regenerate**: Create or refresh insights
- **History**: View past weekly insights
- **Chat with AI Coach**: Link to detailed coaching

#### History Panel
- Collapsible panel showing all past insights
- Click to view any historical insight
- Entry count per week displayed

#### Insight Display Card
- Full markdown-rendered content
- Custom styling for headers, lists, quotes
- Generation timestamp
- Delete option

#### Feature Cards
- Emotional Patterns tracking
- Progress & Wins celebration
- Saturday Cadence explanation

### Empty States

When no journal entries exist for the week:
- Clear explanation message
- Direct link to create a journal entry
- Encouraging call-to-action

## AI Analysis Content

Generated insights typically include:

### Sections

1. **Your Week in Review**
   - Overview of the week's journaling activity
   - Summary of main themes

2. **Emotional Patterns**
   - Mood trends throughout the week
   - Emotional themes and shifts
   - Patterns worth noticing

3. **Progress & Wins**
   - Accomplishments big and small
   - Goals advanced
   - Positive developments

4. **Challenges & Growth Areas**
   - Difficulties encountered
   - Areas for improvement
   - Growth opportunities

5. **Recommendations**
   - Actionable suggestions
   - Focus areas for next week
   - Coaching insights

### Content Characteristics

- **Personalized**: Based on actual journal content
- **Supportive**: Encouraging and constructive tone
- **Actionable**: Includes concrete suggestions
- **Insightful**: Identifies patterns user may not notice
- **Concise**: Focused and readable

## Technical Implementation

### Frontend Components

#### `InsightsPage` (`web/app/app/insights/page.tsx`)
- Main page component
- Manages state for insights, streaming, history
- Handles all user interactions

#### `useWeeklyInsights` Hook (`web/lib/hooks/useWeeklyInsights.ts`)
- Encapsulates all API interactions
- Manages loading, error, and data states
- Provides functions for all operations

### API Client Methods

```typescript
// Check current week
apiClient.getCurrentWeekInsights()

// Get history
apiClient.getWeeklyInsightsHistory()

// Get by ID
apiClient.getWeeklyInsightById(id)

// Generate (non-streaming)
apiClient.generateWeeklyInsights(forceRegenerate)

// Generate (streaming)
apiClient.generateWeeklyInsightsStream(forceRegenerate, onChunk)

// Delete
apiClient.deleteWeeklyInsight(id)
```

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat/weekly-insights/current` | GET | Check current week insight |
| `/chat/weekly-insights/history` | GET | Get all past insights |
| `/chat/weekly-insights/:id` | GET | Get specific insight |
| `/chat/weekly-insights/generate` | POST | Generate (non-streaming) |
| `/chat/weekly-insights/stream` | GET | Stream generation |
| `/chat/weekly-insights/regenerate` | POST | Force regeneration (streaming) |
| `/chat/weekly-insights/:id` | DELETE | Delete insight |

### Database Schema

**Collection**: `weekly_insights`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated ID |
| `user_id` | string | Firebase Auth user ID |
| `week_start` | timestamp | Saturday 00:00:00 |
| `week_end` | timestamp | Friday 23:59:59 |
| `content` | string | Markdown insight content |
| `entry_count` | number | Journal entries analyzed |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update time |

### Services

#### `WeeklyInsightsService`
- Core business logic for insight generation
- Week boundary calculations
- Entry aggregation and analysis
- Database CRUD operations

#### `WeeklyInsightsMigrationService`
- CLI tool for backfilling historical insights
- Batch processing for existing entries
- Dry-run support for testing

## Rate Limiting

Weekly insights generation is rate-limited to prevent abuse:

- **Daily Limit**: 10 generations per user per day
- **Warning**: Displayed when approaching limit
- **Reset**: Daily at midnight UTC

## Migration CLI

Generate insights for past weeks with the CLI:

```bash
# View statistics
pnpm cli migrate-weekly-insights --userId=USER_ID --stats

# Dry run (preview only)
pnpm cli migrate-weekly-insights --userId=USER_ID --dry-run

# Generate for all past weeks
pnpm cli migrate-weekly-insights --userId=USER_ID

# Generate for all users
pnpm cli migrate-weekly-insights
```

## Best Practices

### For Users

1. **Journal Regularly**: More entries = richer insights
2. **Be Honest**: Authentic entries produce better analysis
3. **Review Weekly**: Check insights every weekend
4. **Take Action**: Use recommendations to improve

### For Developers

1. **Handle Streaming**: Use proper SSE handling
2. **Cache History**: Reduce API calls for history
3. **Show Loading**: Always indicate generation progress
4. **Handle Errors**: Graceful fallbacks for API failures

## Security

- **User Isolation**: Users can only access their own insights
- **Authentication**: All endpoints require valid Firebase token
- **Rate Limiting**: Prevents abuse and excessive costs
- **Data Privacy**: Insights are private to each user

## Related Features

- **[Journal Entries](./journal.md)**: Source data for insights
- **[AI Chat Coach](./chat.md)**: Detailed coaching conversations
- **[Goals](./goals.md)**: Track progress mentioned in insights
- **[Voice Coach](./voice-coach.md)**: Voice-based coaching

## Related Documentation

- [Chat API Reference](../api/chat-api.md#weekly-insights)
- [Database Schema](../SCHEMA.md#4-weekly_insights)
- [Setup Guide](../SETUP.md)
- [Architecture Overview](../ARCHITECTURE.md)

---

[← Back to Features](../FEATURES.md)

