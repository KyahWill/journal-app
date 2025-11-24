# Journal API

**Last Updated**: November 2025

## Overview

The Journal API provides endpoints for creating, managing, and searching journal entries. Journal entries can be linked to goals and support mood tracking and tagging. All endpoints require authentication.

**Base Path**: `/api/v1/journal`

## Endpoints

### Create Journal Entry

Create a new journal entry for the authenticated user.

**Endpoint**: `POST /journal`

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Great Day at Work",
  "content": "Had a productive meeting with the team today. We made significant progress on the project.",
  "mood": "happy",
  "tags": ["work", "productivity", "team"]
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Entry title (minimum 1 character) |
| content | string | Yes | Entry content (minimum 1 character) |
| mood | string | No | Mood indicator (e.g., happy, sad, neutral) |
| tags | string[] | No | Array of tags for categorization |

**Response** (201 Created):
```json
{
  "id": "journal_abc123",
  "user_id": "user_xyz789",
  "title": "Great Day at Work",
  "content": "Had a productive meeting with the team today...",
  "mood": "happy",
  "tags": ["work", "productivity", "team"],
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T10:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid data or validation failed
- `401 Unauthorized` - Missing or invalid token

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/journal \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Great Day at Work",
    "content": "Had a productive meeting today",
    "mood": "happy",
    "tags": ["work", "productivity"]
  }'
```

---

### List All Journal Entries

Get all journal entries for the authenticated user.

**Endpoint**: `GET /journal`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "entries": [
    {
      "id": "journal_abc123",
      "title": "Great Day at Work",
      "content": "Had a productive meeting...",
      "mood": "happy",
      "tags": ["work", "productivity"],
      "created_at": "2025-11-24T10:00:00Z",
      "linked_goals": ["goal_1", "goal_2"]
    },
    {
      "id": "journal_def456",
      "title": "Morning Reflection",
      "content": "Feeling grateful today...",
      "mood": "grateful",
      "tags": ["reflection"],
      "created_at": "2025-11-23T08:00:00Z",
      "linked_goals": []
    }
  ],
  "total": 2
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/journal \
  -H "Authorization: Bearer <token>"
```

---

### Get Recent Journal Entries

Get the most recent journal entries with optional limit.

**Endpoint**: `GET /journal/recent`

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of entries to return (default: 10) |

**Response** (200 OK):
```json
{
  "entries": [
    {
      "id": "journal_abc123",
      "title": "Great Day at Work",
      "content": "Had a productive meeting...",
      "created_at": "2025-11-24T10:00:00Z"
    }
  ],
  "total": 1
}
```

**Example**:
```bash
# Get 10 most recent entries (default)
curl -X GET https://api.example.com/api/v1/journal/recent \
  -H "Authorization: Bearer <token>"

# Get 5 most recent entries
curl -X GET "https://api.example.com/api/v1/journal/recent?limit=5" \
  -H "Authorization: Bearer <token>"
```

---

### Search Journal Entries

Search journal entries by text content.

**Endpoint**: `GET /journal/search`

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query text |

**Response** (200 OK):
```json
{
  "entries": [
    {
      "id": "journal_abc123",
      "title": "Great Day at Work",
      "content": "Had a productive meeting with the team...",
      "created_at": "2025-11-24T10:00:00Z",
      "relevance_score": 0.95
    }
  ],
  "query": "productive meeting",
  "total": 1
}
```

**Example**:
```bash
curl -X GET "https://api.example.com/api/v1/journal/search?q=productive" \
  -H "Authorization: Bearer <token>"
```

**Note**: Search uses the RAG (Retrieval-Augmented Generation) system for semantic search when enabled. Falls back to basic text search if RAG is disabled.

---

### Get Entries Grouped by Date

Get all journal entries grouped by date for calendar or timeline views.

**Endpoint**: `GET /journal/grouped`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "grouped_entries": {
    "2025-11-24": [
      {
        "id": "journal_abc123",
        "title": "Great Day at Work",
        "created_at": "2025-11-24T10:00:00Z"
      },
      {
        "id": "journal_def456",
        "title": "Evening Reflection",
        "created_at": "2025-11-24T20:00:00Z"
      }
    ],
    "2025-11-23": [
      {
        "id": "journal_ghi789",
        "title": "Morning Thoughts",
        "created_at": "2025-11-23T08:00:00Z"
      }
    ]
  },
  "total_days": 2,
  "total_entries": 3
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/journal/grouped \
  -H "Authorization: Bearer <token>"
```

---

### Get Journal Entry by ID

Get detailed information about a specific journal entry.

**Endpoint**: `GET /journal/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Journal entry ID |

**Response** (200 OK):
```json
{
  "id": "journal_abc123",
  "user_id": "user_xyz789",
  "title": "Great Day at Work",
  "content": "Had a productive meeting with the team today. We made significant progress on the project and everyone was engaged.",
  "mood": "happy",
  "tags": ["work", "productivity", "team"],
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T10:00:00Z",
  "linked_goals": [
    {
      "id": "goal_1",
      "title": "Complete Project X"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Journal entry not found

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/journal/journal_abc123 \
  -H "Authorization: Bearer <token>"
```

---

### Update Journal Entry

Update an existing journal entry.

**Endpoint**: `PUT /journal/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Journal entry ID |

**Request Body**:
```json
{
  "title": "Updated Title",
  "content": "Updated content with more details",
  "mood": "excited",
  "tags": ["work", "productivity", "success"]
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | New entry title |
| content | string | No | New entry content |
| mood | string | No | New mood indicator |
| tags | string[] | No | New array of tags |

**Response** (200 OK):
```json
{
  "id": "journal_abc123",
  "title": "Updated Title",
  "content": "Updated content with more details",
  "mood": "excited",
  "tags": ["work", "productivity", "success"],
  "updated_at": "2025-11-24T16:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Journal entry not found

**Example**:
```bash
curl -X PUT https://api.example.com/api/v1/journal/journal_abc123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "mood": "excited"
  }'
```

---

### Delete Journal Entry

Delete a journal entry and remove all goal links.

**Endpoint**: `DELETE /journal/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Journal entry ID |

**Response** (200 OK):
```json
{
  "message": "Journal entry deleted successfully",
  "id": "journal_abc123"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Journal entry not found

**Example**:
```bash
curl -X DELETE https://api.example.com/api/v1/journal/journal_abc123 \
  -H "Authorization: Bearer <token>"
```

**Note**: Deleting a journal entry also removes all links to goals, but does not delete the goals themselves.

---

### Get Linked Goals

Get all goals linked to a specific journal entry.

**Endpoint**: `GET /journal/:id/goals`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Journal entry ID |

**Response** (200 OK):
```json
{
  "journal_entry_id": "journal_abc123",
  "linked_goals": [
    {
      "id": "goal_1",
      "title": "Complete Project X",
      "status": "in_progress",
      "category": "career"
    },
    {
      "id": "goal_2",
      "title": "Improve Team Collaboration",
      "status": "in_progress",
      "category": "career"
    }
  ],
  "total": 2
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/journal/journal_abc123/goals \
  -H "Authorization: Bearer <token>"
```

---

## Mood Values

Common mood values (not restricted to these):

| Mood | Description |
|------|-------------|
| happy | Positive, joyful mood |
| sad | Negative, down mood |
| excited | Energetic, enthusiastic mood |
| anxious | Worried, nervous mood |
| grateful | Thankful, appreciative mood |
| neutral | Balanced, calm mood |
| frustrated | Annoyed, irritated mood |
| motivated | Driven, inspired mood |

**Note**: The mood field accepts any string value, allowing users to define custom moods.

## Tags

Tags are free-form strings that help categorize and organize journal entries. Common uses:

- **Topics**: work, personal, health, relationships
- **Activities**: exercise, meditation, reading, travel
- **Projects**: project-x, side-hustle, learning
- **Emotions**: reflection, gratitude, challenge

## Search Functionality

### Basic Search

When RAG is disabled, search performs basic text matching on title and content fields.

### Semantic Search (RAG Enabled)

When RAG is enabled, search uses vector embeddings for semantic similarity:

- Understands context and meaning
- Finds related entries even without exact keyword matches
- Returns results ranked by relevance
- Supports natural language queries

**Example Queries**:
- "times I felt accomplished at work"
- "entries about my fitness journey"
- "reflections on personal growth"

## Best Practices

### Creating Entries

1. Write descriptive titles for easy scanning
2. Include enough detail in content for future reference
3. Use consistent mood values for better tracking
4. Add relevant tags for organization
5. Link to related goals when applicable

### Organization

1. Use tags consistently across entries
2. Create entries regularly for better insights
3. Review and update old entries if needed
4. Use search to find related entries

### Performance

1. Use `/journal/recent` for dashboard views
2. Use `/journal/grouped` for calendar views
3. Cache frequently accessed entries
4. Implement pagination on the client for large lists

### Privacy

1. Journal entries are private to each user
2. Content is never shared between users
3. RAG embeddings are stored securely per user
4. Deleted entries are permanently removed

## Integration with Goals

Journal entries can be linked to goals to:

- Track progress and reflections
- Provide context for goal achievements
- Document challenges and solutions
- Build a narrative around goal pursuit

**Linking Process**:
1. Create or identify a journal entry
2. Use Goals API to link: `POST /goal/:id/link-journal`
3. View linked entries: `GET /goal/:id/linked-journals`
4. View linked goals: `GET /journal/:id/goals`

## Related Documentation

- [Journal Feature](../features/journal.md)
- [Goals API](./goals-api.md)
- [RAG System](../features/rag-system.md)
- [Data Models](../architecture/data-models.md)

---

[← Back to API Reference](../API_REFERENCE.md)
