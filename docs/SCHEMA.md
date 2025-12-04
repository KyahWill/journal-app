# Firebase Schema Documentation

This document describes the complete Firestore database schema for the application, including all collections, subcollections, and their field structures.

## Collections Overview

The application uses the following top-level Firestore collections:

1. **goals** - User goals with milestones and progress tracking
2. **journal-entries** - User journal entries
3. **chat_sessions** - AI chat conversations
4. **user_themes** - Custom UI themes
5. **custom_categories** - User-defined goal categories
6. **goal_journal_links** - Links between goals and journal entries
7. **coach_personalities** - AI coach personality configurations (unified for text and voice)
8. **embeddings** - Vector embeddings for RAG (Retrieval-Augmented Generation)
9. **user_usage** - Rate limiting and usage tracking

---

## 1. goals

Stores user goals with embedded milestones, progress tracking, and optional habit functionality.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `user_id` | string | Firebase Auth user ID |
| `title` | string | Goal title |
| `description` | string | Goal description |
| `category` | string | Category ID (default category name or custom category ID) |
| `status` | string | Goal status: `not_started`, `in_progress`, `completed`, `abandoned` |
| `target_date` | timestamp | Target completion date (far future for habits) |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |
| `completed_at` | timestamp \| null | Completion timestamp (null if not completed) |
| `status_changed_at` | timestamp | Last status change timestamp |
| `last_activity` | timestamp | Last activity timestamp (updates, milestones, progress) |
| `progress_percentage` | number | Calculated progress (0-100) based on milestone completion |
| `milestones` | array | Array of milestone objects (embedded) |
| `is_habit` | boolean | Whether this goal is a recurring habit |
| `habit_frequency` | string \| null | Habit frequency: `daily`, `weekly`, `monthly` (null if not a habit) |
| `habit_streak` | number | Current streak count for habits |
| `habit_completed_dates` | array\<string\> | Array of ISO date strings (YYYY-MM-DD) when habit was completed |

### Milestone Object Structure (Embedded)

```typescript
{
  id: string,              // Unique milestone ID
  title: string,           // Milestone title
  due_date: timestamp | null,  // Optional due date
  completed: boolean,      // Completion status
  completed_at: timestamp | null,  // Completion timestamp
  order: number,           // Display order
  created_at: timestamp    // Creation timestamp
}
```

### Subcollection: progress_updates

Path: `goals/{goalId}/progress_updates`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `goal_id` | string | Parent goal ID |
| `content` | string | Progress update text |
| `created_at` | timestamp | Creation timestamp |

### Indexes Required

- `user_id` (ascending) + `created_at` (descending)
- `user_id` (ascending) + `category` (ascending)
- `user_id` (ascending) + `status` (ascending)
- `user_id` (ascending) + `last_activity` (descending)

---

## 2. journal-entries

Stores user journal entries with optional mood and tags.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `user_id` | string | Firebase Auth user ID |
| `title` | string | Entry title |
| `content` | string | Entry content (markdown supported) |
| `mood` | string \| undefined | Optional mood indicator |
| `tags` | array\<string\> | Array of tags |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

### Indexes Required

- `user_id` (ascending) + `created_at` (descending)

---

## 3. chat_sessions

Stores AI chat conversation sessions with message history.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `user_id` | string | Firebase Auth user ID |
| `title` | string \| undefined | Optional session title (auto-generated from first message) |
| `messages` | array | Array of message objects |
| `personality_id` | string \| undefined | Optional coach personality ID |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

### Message Object Structure (Embedded)

```typescript
{
  id: string,              // Unique message ID (UUID)
  role: 'user' | 'assistant' | 'system',  // Message role
  content: string,         // Message content
  timestamp: timestamp     // Message timestamp
}
```

### Indexes Required

- `user_id` (ascending) + `updated_at` (descending)

---


## 5. user_themes

Stores custom UI themes with color schemes and styling preferences.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `user_id` | string | Firebase Auth user ID |
| `name` | string | Theme name |
| `is_default` | boolean | Whether this is the user's default theme |
| `is_public` | boolean | Whether theme is publicly shareable |
| `colors` | object | Color scheme object (see below) |
| `typography` | object | Typography settings (see below) |
| `spacing` | object | Spacing configuration |
| `borderRadius` | number | Border radius value |
| `shadowIntensity` | string | Shadow intensity: `none`, `subtle`, `medium`, `strong` |
| `animations` | object | Animation settings |
| `density` | string | UI density: `comfortable`, `compact`, `spacious` |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

### Colors Object Structure

```typescript
{
  background: string,
  foreground: string,
  card: string,
  cardForeground: string,
  popover: string,
  popoverForeground: string,
  primary: string,
  primaryForeground: string,
  secondary: string,
  secondaryForeground: string,
  muted: string,
  mutedForeground: string,
  accent: string,
  accentForeground: string,
  destructive: string,
  destructiveForeground: string,
  border: string,
  input: string,
  ring: string
}
```

### Typography Object Structure

```typescript
{
  fontFamily: string,
  baseFontSize: number,
  headingScale: number,
  lineHeight: number
}
```

### Spacing Object Structure

```typescript
{
  scale: number
}
```

### Animations Object Structure

```typescript
{
  duration: number,
  easing: string
}
```

### Indexes Required

- `user_id` (ascending) + `created_at` (descending)
- `user_id` (ascending) + `is_default` (ascending)
- `is_public` (ascending)

---

## 6. custom_categories

Stores user-defined goal categories beyond the default categories.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `user_id` | string | Firebase Auth user ID |
| `name` | string | Category name |
| `color` | string \| null | Optional hex color code for UI |
| `icon` | string \| null | Optional icon name |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

### Default Categories

The following categories are built-in and don't require database entries:
- `career`
- `health`
- `personal`
- `financial`
- `relationships`
- `learning`
- `other`

### Indexes Required

- `user_id` (ascending) + `name` (ascending)

---

## 7. goal_journal_links

Links journal entries to goals for cross-referencing.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `goal_id` | string | Goal document ID |
| `journal_entry_id` | string | Journal entry document ID |
| `user_id` | string | Firebase Auth user ID |
| `created_at` | timestamp | Creation timestamp |

### Indexes Required

- `goal_id` (ascending) + `user_id` (ascending)
- `journal_entry_id` (ascending) + `user_id` (ascending)
- `user_id` (ascending) + `created_at` (descending)

---

## 8. coach_personalities

Stores voice coach personality configurations for ElevenLabs integration.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `user_id` | string | Firebase Auth user ID |
| `name` | string | Personality name |
| `description` | string | Personality description |
| `style` | string | Coaching style: `supportive`, `direct`, `motivational`, `analytical`, `empathetic` |
| `system_prompt` | string | AI system prompt for this personality |
| `voice_id` | string \| undefined | ElevenLabs voice ID |
| `voice_stability` | number \| undefined | Voice stability (0-1) |
| `voice_similarity_boost` | number \| undefined | Voice similarity boost (0-1) |
| `first_message` | string \| undefined | Initial greeting message |
| `language` | string \| undefined | Language code (default: 'en') |
| `is_default` | boolean | Whether this is the user's default personality |
| `elevenlabs_agent_id` | string \| undefined | Generated ElevenLabs agent ID |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

### Indexes Required

- `user_id` (ascending) + `created_at` (descending)
- `user_id` (ascending) + `is_default` (ascending)

---

## 9. embeddings

Stores vector embeddings for semantic search and RAG functionality.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `user_id` | string | Firebase Auth user ID |
| `content_type` | string | Content type: `journal`, `goal`, `milestone`, `progress_update` |
| `document_id` | string | Source document ID |
| `embedding` | array\<number\> | Vector embedding (768 dimensions for text-embedding-004) |
| `text_snippet` | string | First 500 characters of content |
| `metadata` | object | Additional metadata (varies by content type) |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

### Metadata Object Examples

**Journal Entry:**
```typescript
{
  mood?: string,
  tags?: string[]
}
```

**Goal:**
```typescript
{
  category: string,
  status: string,
  target_date: string
}
```

**Milestone:**
```typescript
{
  goal_id: string,
  due_date: string | null,
  completed: boolean,
  order: number
}
```

**Progress Update:**
```typescript
{
  goal_id: string,
  created_at: string
}
```

### Indexes Required

- `user_id` (ascending) + `content_type` (ascending)
- `user_id` (ascending) + `document_id` (ascending)
- `user_id` (ascending) + `created_at` (descending)

---

## 10. user_usage

Tracks daily usage for rate limiting across various features.

### Structure

Path: `user_usage/{userId}/daily/{YYYY-MM-DD}`

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `chat_count` | number | Number of chat messages sent |
| `insights_count` | number | Number of AI insights generated |
| `tts_count` | number | Number of text-to-speech uses |
| `prompt_suggestions_count` | number | Number of prompt suggestions generated |
| `goal_suggestions_count` | number | Number of goal suggestions generated |
| `goal_insights_count` | number | Number of goal insights generated |
| `rag_embedding_count` | number | Number of embeddings generated |
| `rag_search_count` | number | Number of semantic searches performed |
| `voice_coach_session_count` | number | Number of voice coaching sessions |
| `last_updated` | timestamp | Last update timestamp |

### Rate Limits (Daily)

| Feature | Limit |
|---------|-------|
| Chat messages | 20 |
| AI insights | 25 |
| Text-to-speech | 5 |
| Prompt suggestions | 20 |
| Goal suggestions | 10 |
| Goal insights | 10 |
| RAG embeddings | 100 |
| RAG searches | 200 |
| Voice coach sessions | 10 |

---

## Data Relationships

### Goal → Journal Entry (Many-to-Many)

Goals and journal entries are linked through the `goal_journal_links` collection:
- A goal can be linked to multiple journal entries
- A journal entry can be linked to multiple goals
- Links are user-scoped for data isolation

### Goal → Milestones (One-to-Many, Embedded)

Milestones are embedded directly in the goal document as an array:
- Simplifies queries and reduces read operations
- Maintains atomic updates
- Milestones are ordered by the `order` field

### Goal → Progress Updates (One-to-Many, Subcollection)

Progress updates are stored in a subcollection:
- Path: `goals/{goalId}/progress_updates`
- Allows for efficient pagination
- Keeps goal document size manageable

### User → Content (One-to-Many)

All content is scoped to users via `user_id`:
- Goals, journal entries, chat sessions, prompts, themes, categories
- Ensures data isolation and privacy
- Enables efficient user-specific queries

### Content → Embeddings (One-to-Many)

Each piece of content can have multiple embeddings:
- Linked via `document_id` and `content_type`
- Enables semantic search across user's content
- Embeddings are automatically updated when content changes

---

## Security Rules Considerations

All collections should implement the following security patterns:

1. **User Isolation**: Users can only access their own data
   ```javascript
   allow read, write: if request.auth != null && resource.data.user_id == request.auth.uid;
   ```

2. **Public Themes**: Themes marked as `is_public` can be read by anyone
   ```javascript
   allow read: if resource.data.is_public == true;
   ```

3. **Usage Tracking**: Only the system can write to `user_usage`
   ```javascript
   allow read: if request.auth != null && request.auth.uid == userId;
   allow write: if false; // Only server-side writes
   ```

---

## Migration Notes

### Milestone Migration

The application previously stored milestones in a subcollection (`goals/{goalId}/milestones`) but has migrated to embedding them in the goal document. The `MilestoneMigrationService` handles this migration automatically.

### Embedding Generation

Embeddings are generated asynchronously when content is created or updated:
- New content is queued for embedding generation
- Failed embeddings are retried automatically
- Embeddings can be backfilled for existing content via migration endpoints

---

## Performance Optimization

### Caching Strategy

1. **Goal Counts**: Cached for 1 minute to reduce repeated queries
2. **Embeddings**: User embeddings cached with TTL for faster semantic search
3. **Default Prompts/Themes**: Created on-demand and cached

### Pagination

Large collections support cursor-based pagination:
- Goals: 20 items per page by default
- Uses `startAfter` cursor for efficient pagination
- Returns `nextCursor` for fetching next page

### Batch Operations

Batch operations are supported for:
- Creating multiple goals
- Updating multiple goals
- Storing multiple embeddings
- Deleting related documents (cascade deletes)

---

## Backup and Recovery

### Recommended Backup Strategy

1. **Daily Firestore Exports**: Use Firebase's automated export feature
2. **Critical Collections**: Prioritize `goals`, `journal-entries`, `chat_sessions`
3. **Embedding Regeneration**: Embeddings can be regenerated from source content
4. **Usage Data**: Can be reset without data loss

### Data Retention

- User content: Retained indefinitely until user deletion
- Usage tracking: Daily documents (can be archived after 30 days)
- Embeddings: Automatically cleaned up when source content is deleted
- Chat sessions: Retained indefinitely (consider implementing auto-cleanup)

---

## Future Schema Considerations

### Potential Additions

1. **Shared Goals**: Support for collaborative goals
2. **Goal Templates**: Reusable goal templates
3. **Achievements**: Gamification and milestone badges
4. **Export History**: Track data exports for compliance

### Scalability Considerations

1. **Sharding**: Consider sharding large collections by date ranges
2. **Archival**: Move old data to cold storage after 1 year
3. **Aggregations**: Pre-compute statistics for dashboard views
4. **Search Indexes**: Consider Algolia/Elasticsearch for full-text search
