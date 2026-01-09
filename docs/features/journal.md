# Journal Feature

**Full-featured journaling system with search**

---

**Last Updated**: January 2026  
**Status**: ✅ Complete

---

## Overview

The Journal feature provides a comprehensive system for creating, managing, and searching personal journal entries. It includes real-time sync and full-text search.

## Key Features

### Entry Management

#### Create Entries
- Title and content fields
- Optional mood field
- Automatic timestamp tracking
- User-specific entry isolation

#### View Entries
- List view with entry previews
- Detail view with full content
- Sort by creation date (newest first)
- Entry preview truncation
- Pagination support

#### Update Entries
- Edit title and content
- Modify mood
- Automatic updated_at timestamp
- Save changes with confirmation
- Real-time sync of updates

#### Delete Entries
- Delete with confirmation dialog
- Permanent deletion warning
- Success feedback

### Search Functionality

#### Full-Text Search
- Search across title and content
- Case-insensitive search
- Real-time search results
- Search as you type
- Result count display

### Real-time Sync

#### Live Updates
- Firestore real-time subscriptions
- Auto-refresh entry list on changes
- Multi-device sync support
- Optimistic updates

---

## Architecture

### Database Schema

```typescript
interface JournalEntry {
  id: string
  user_id: string
  title: string
  content: string
  mood?: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Indexes**:
- `user_id` (ASC) + `created_at` (DESC)

**Security Rules**:
- Users can only read/write their own entries

### Components

#### Entry List
- Displays all user entries
- Entry preview cards
- Pagination controls
- Loading states
- Empty state

#### Entry Detail
- Full entry display
- Edit button
- Delete button
- Timestamp display

#### Entry Form
- Create/edit form
- Title input
- Content textarea
- Mood input
- Save/cancel buttons

### API Endpoints

**GET /journal**
- Get all entries for user
- Returns: Array of entries

**GET /journal/:id**
- Get specific entry
- Returns: Entry object

**POST /journal**
- Create new entry
- Body: Entry data
- Returns: Created entry

**PUT /journal/:id**
- Update entry
- Body: Partial entry data
- Returns: Updated entry

**DELETE /journal/:id**
- Delete entry
- Returns: Success message

---

## Related Documentation

- [API Reference](../API_REFERENCE.md#journal)
- [RAG System](./rag-system.md)
- [Database Setup](../setup/database-setup.md)
