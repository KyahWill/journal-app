# Goals API

**Last Updated**: November 2025

## Overview

The Goals API provides comprehensive endpoints for goal management, including creating goals, tracking milestones, recording progress updates, and linking journal entries. All endpoints require authentication.

**Base Path**: `/api/v1/goal`

## Endpoints

### Create Goal

Create a new goal or habit for the authenticated user.

**Endpoint**: `POST /goal`

**Authentication**: Required

**Request Body** (Regular Goal):
```json
{
  "title": "Run a 5K",
  "description": "Complete a 5K race by end of year",
  "category": "health",
  "target_date": "2025-12-31"
}
```

**Request Body** (Habit):
```json
{
  "title": "Exercise daily",
  "description": "30 minutes of exercise every day",
  "category": "health",
  "target_date": "2035-12-31",
  "is_habit": true,
  "habit_frequency": "daily"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Goal title (3-200 characters) |
| description | string | No | Goal description (max 2000 characters) |
| category | string | Yes | Category name or custom category ID |
| target_date | string | Yes | Target completion date (ISO 8601). For habits, use a far-future date. |
| is_habit | boolean | No | Whether this is a recurring habit (default: false) |
| habit_frequency | string | No | Frequency for habits: `daily`, `weekly`, or `monthly` |

**Response** (201 Created):
```json
{
  "id": "goal_abc123",
  "user_id": "user_xyz789",
  "title": "Run a 5K",
  "description": "Complete a 5K race by end of year",
  "category": "health",
  "status": "not_started",
  "target_date": "2025-12-31T00:00:00Z",
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T10:00:00Z",
  "milestones": [],
  "is_habit": false,
  "habit_frequency": null,
  "habit_streak": 0,
  "habit_completed_dates": []
}
```

**Error Responses**:
- `400 Bad Request` - Invalid data or validation failed
- `401 Unauthorized` - Missing or invalid token

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/goal \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Run a 5K",
    "category": "health",
    "target_date": "2025-12-31"
  }'
```

---

### Batch Create Goals

Create multiple goals in a single request.

**Endpoint**: `POST /goal/batch`

**Authentication**: Required

**Request Body**:
```json
[
  {
    "title": "Run a 5K",
    "category": "health",
    "target_date": "2025-12-31"
  },
  {
    "title": "Read 12 books",
    "category": "personal",
    "target_date": "2025-12-31"
  }
]
```

**Response** (201 Created):
```json
{
  "created": 2,
  "goals": [
    {
      "id": "goal_abc123",
      "title": "Run a 5K",
      "status": "not_started"
    },
    {
      "id": "goal_def456",
      "title": "Read 12 books",
      "status": "not_started"
    }
  ]
}
```

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/goal/batch \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '[{"title": "Goal 1", "category": "health", "target_date": "2025-12-31"}]'
```

---

### Batch Update Goals

Update multiple goals in a single request.

**Endpoint**: `PUT /goal/batch`

**Authentication**: Required

**Request Body**:
```json
[
  {
    "goalId": "goal_abc123",
    "data": {
      "status": "in_progress"
    }
  },
  {
    "goalId": "goal_def456",
    "data": {
      "title": "Read 15 books"
    }
  }
]
```

**Response** (200 OK):
```json
{
  "updated": 2,
  "goals": [
    {
      "id": "goal_abc123",
      "status": "in_progress"
    },
    {
      "id": "goal_def456",
      "title": "Read 15 books"
    }
  ]
}
```

---

### List Goals

Get all goals for the authenticated user with optional filtering and pagination.

**Endpoint**: `GET /goal`

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | Filter by category |
| status | string | No | Filter by status (not_started, in_progress, completed, abandoned) |
| limit | number | No | Number of results to return |
| startAfter | string | No | Document ID to start after (pagination) |

**Response** (200 OK):
```json
{
  "goals": [
    {
      "id": "goal_abc123",
      "title": "Run a 5K",
      "category": "health",
      "status": "in_progress",
      "target_date": "2025-12-31T00:00:00Z",
      "created_at": "2025-11-24T10:00:00Z",
      "milestone_count": 3,
      "completed_milestones": 1
    }
  ],
  "hasMore": false
}
```

**Example**:
```bash
# Get all goals
curl -X GET https://api.example.com/api/v1/goal \
  -H "Authorization: Bearer <token>"

# Filter by category and status
curl -X GET "https://api.example.com/api/v1/goal?category=health&status=in_progress" \
  -H "Authorization: Bearer <token>"

# With pagination
curl -X GET "https://api.example.com/api/v1/goal?limit=20&startAfter=goal_abc123" \
  -H "Authorization: Bearer <token>"
```

---

### Get Goal Counts

Get aggregated counts of goals by status and category.

**Endpoint**: `GET /goal/counts`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "total": 15,
  "by_status": {
    "not_started": 3,
    "in_progress": 8,
    "completed": 4,
    "abandoned": 0
  },
  "by_category": {
    "health": 5,
    "career": 4,
    "personal": 6
  },
  "overdue": 2
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/goal/counts \
  -H "Authorization: Bearer <token>"
```

---

### Get Overdue Goals

Get all goals that are past their target date and not completed.

**Endpoint**: `GET /goal/overdue`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "goals": [
    {
      "id": "goal_abc123",
      "title": "Run a 5K",
      "target_date": "2025-10-31T00:00:00Z",
      "days_overdue": 24,
      "status": "in_progress"
    }
  ],
  "count": 1
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/goal/overdue \
  -H "Authorization: Bearer <token>"
```

---

### Get Goals by Category

Get all goals in a specific category.

**Endpoint**: `GET /goal/category/:category`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Category name or ID |

**Response** (200 OK):
```json
{
  "category": "health",
  "goals": [
    {
      "id": "goal_abc123",
      "title": "Run a 5K",
      "status": "in_progress"
    }
  ],
  "count": 1
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/goal/category/health \
  -H "Authorization: Bearer <token>"
```

---

### Get Goal by ID

Get detailed information about a specific goal.

**Endpoint**: `GET /goal/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Goal ID |

**Response** (200 OK):
```json
{
  "id": "goal_abc123",
  "user_id": "user_xyz789",
  "title": "Run a 5K",
  "description": "Complete a 5K race by end of year",
  "category": "health",
  "status": "in_progress",
  "target_date": "2025-12-31T00:00:00Z",
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T15:00:00Z",
  "milestones": [
    {
      "id": "milestone_1",
      "title": "Run 1K without stopping",
      "completed": true,
      "completed_at": "2025-11-20T10:00:00Z"
    }
  ],
  "progress_updates": [
    {
      "id": "progress_1",
      "content": "Completed first training run",
      "created_at": "2025-11-20T10:00:00Z"
    }
  ],
  "linked_journal_entries": ["journal_1", "journal_2"]
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Goal not found

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/goal/goal_abc123 \
  -H "Authorization: Bearer <token>"
```

---

### Update Goal

Update an existing goal's information.

**Endpoint**: `PUT /goal/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Goal ID |

**Request Body**:
```json
{
  "title": "Run a 10K",
  "description": "Updated goal description",
  "category": "health",
  "target_date": "2026-06-30"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | New goal title |
| description | string | No | New description |
| category | string | No | New category |
| target_date | string | No | New target date |

**Response** (200 OK):
```json
{
  "id": "goal_abc123",
  "title": "Run a 10K",
  "description": "Updated goal description",
  "updated_at": "2025-11-24T16:00:00Z"
}
```

**Example**:
```bash
curl -X PUT https://api.example.com/api/v1/goal/goal_abc123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Run a 10K"
  }'
```

---

### Update Goal Status

Update only the status of a goal.

**Endpoint**: `PATCH /goal/:id/status`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Goal ID |

**Request Body**:
```json
{
  "status": "completed"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | New status (not_started, in_progress, completed, abandoned) |

**Response** (200 OK):
```json
{
  "id": "goal_abc123",
  "status": "completed",
  "completed_at": "2025-11-24T16:00:00Z",
  "updated_at": "2025-11-24T16:00:00Z"
}
```

**Example**:
```bash
curl -X PATCH https://api.example.com/api/v1/goal/goal_abc123/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

---

### Toggle Habit Completion

Toggle the completion status of a habit for today.

**Endpoint**: `PATCH /goal/:id/habit-toggle`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Goal ID (must be a habit) |

**Response** (200 OK):
```json
{
  "id": "goal_abc123",
  "title": "Exercise daily",
  "is_habit": true,
  "habit_frequency": "daily",
  "habit_streak": 5,
  "habit_completed_dates": ["2025-12-01", "2025-12-02"],
  "updated_at": "2025-12-02T10:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Goal is not a habit
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Goal not found

**Example**:
```bash
curl -X PATCH https://api.example.com/api/v1/goal/goal_abc123/habit-toggle \
  -H "Authorization: Bearer <token>"
```

**Notes**:
- Calling this endpoint toggles today's completion status
- If today is already marked as completed, it will be unmarked
- If today is not completed, it will be marked as completed
- The streak is automatically recalculated based on consecutive completions

---

### Get Goal Deletion Info

Get information about what will be deleted when removing a goal.

**Endpoint**: `GET /goal/:id/deletion-info`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Goal ID |

**Response** (200 OK):
```json
{
  "goal_id": "goal_abc123",
  "title": "Run a 5K",
  "milestones_count": 3,
  "progress_updates_count": 5,
  "linked_journal_entries_count": 2,
  "warning": "This action cannot be undone"
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/goal/goal_abc123/deletion-info \
  -H "Authorization: Bearer <token>"
```

---

### Delete Goal

Delete a goal and all associated data (milestones, progress updates, links).

**Endpoint**: `DELETE /goal/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Goal ID |

**Response** (200 OK):
```json
{
  "message": "Goal deleted successfully",
  "id": "goal_abc123"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Goal not found

**Example**:
```bash
curl -X DELETE https://api.example.com/api/v1/goal/goal_abc123 \
  -H "Authorization: Bearer <token>"
```

---

## Milestone Endpoints

### Add Milestone

Add a milestone to a goal.

**Endpoint**: `POST /goal/:id/milestone`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Goal ID |

**Request Body**:
```json
{
  "title": "Run 1K without stopping",
  "due_date": "2025-12-15"
}
```

**Response** (201 Created):
```json
{
  "id": "milestone_abc123",
  "goal_id": "goal_xyz789",
  "title": "Run 1K without stopping",
  "completed": false,
  "due_date": "2025-12-15T00:00:00Z",
  "created_at": "2025-11-24T10:00:00Z"
}
```

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/goal/goal_abc123/milestone \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Run 1K without stopping"
  }'
```

---

### Get Milestones

Get all milestones for a goal.

**Endpoint**: `GET /goal/:id/milestone`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "milestones": [
    {
      "id": "milestone_1",
      "title": "Run 1K without stopping",
      "completed": true,
      "completed_at": "2025-11-20T10:00:00Z"
    },
    {
      "id": "milestone_2",
      "title": "Run 3K without stopping",
      "completed": false,
      "due_date": "2025-12-15T00:00:00Z"
    }
  ],
  "total": 2,
  "completed": 1
}
```

---

### Update Milestone

Update a milestone's information.

**Endpoint**: `PUT /goal/:goalId/milestone/:milestoneId`

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Run 2K without stopping",
  "due_date": "2025-12-10"
}
```

**Response** (200 OK):
```json
{
  "id": "milestone_abc123",
  "title": "Run 2K without stopping",
  "due_date": "2025-12-10T00:00:00Z",
  "updated_at": "2025-11-24T16:00:00Z"
}
```

---

### Toggle Milestone Completion

Mark a milestone as completed or incomplete.

**Endpoint**: `PATCH /goal/:goalId/milestone/:milestoneId/complete`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "milestone_abc123",
  "completed": true,
  "completed_at": "2025-11-24T16:00:00Z"
}
```

---

### Delete Milestone

Delete a milestone from a goal.

**Endpoint**: `DELETE /goal/:goalId/milestone/:milestoneId`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Milestone deleted successfully",
  "id": "milestone_abc123"
}
```

---

## Progress Update Endpoints

### Add Progress Update

Add a progress update to a goal.

**Endpoint**: `POST /goal/:id/progress`

**Authentication**: Required

**Request Body**:
```json
{
  "content": "Completed first training run. Felt great!"
}
```

**Response** (201 Created):
```json
{
  "id": "progress_abc123",
  "goal_id": "goal_xyz789",
  "content": "Completed first training run. Felt great!",
  "created_at": "2025-11-24T10:00:00Z"
}
```

---

### Get Progress Updates

Get all progress updates for a goal.

**Endpoint**: `GET /goal/:id/progress`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "progress_updates": [
    {
      "id": "progress_1",
      "content": "Completed first training run",
      "created_at": "2025-11-20T10:00:00Z"
    },
    {
      "id": "progress_2",
      "content": "Ran 2K today!",
      "created_at": "2025-11-22T10:00:00Z"
    }
  ],
  "total": 2
}
```

---

### Delete Progress Update

Delete a progress update.

**Endpoint**: `DELETE /goal/:goalId/progress/:progressId`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Progress update deleted successfully",
  "id": "progress_abc123"
}
```

---

## Journal Linking Endpoints

### Link Journal Entry

Link a journal entry to a goal.

**Endpoint**: `POST /goal/:id/link-journal`

**Authentication**: Required

**Request Body**:
```json
{
  "journal_entry_id": "journal_abc123"
}
```

**Response** (201 Created):
```json
{
  "message": "Journal entry linked successfully",
  "goal_id": "goal_xyz789",
  "journal_entry_id": "journal_abc123"
}
```

---

### Unlink Journal Entry

Remove the link between a journal entry and a goal.

**Endpoint**: `DELETE /goal/:id/link-journal/:entryId`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Journal entry unlinked successfully"
}
```

---

### Get Linked Journal Entries

Get all journal entries linked to a goal.

**Endpoint**: `GET /goal/:id/linked-journals`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "journal_entries": [
    {
      "id": "journal_1",
      "title": "Training Day 1",
      "created_at": "2025-11-20T10:00:00Z"
    },
    {
      "id": "journal_2",
      "title": "Progress Update",
      "created_at": "2025-11-22T10:00:00Z"
    }
  ],
  "total": 2
}
```

---

## Goal Status Values

| Status | Description |
|--------|-------------|
| not_started | Goal has been created but work hasn't begun |
| in_progress | Actively working on the goal |
| completed | Goal has been achieved |
| abandoned | Goal has been abandoned or cancelled |

## Best Practices

### Creating Goals

1. Use descriptive titles (3-200 characters)
2. Set realistic target dates
3. Add milestones to break down large goals
4. Use categories to organize goals

### Tracking Progress

1. Add progress updates regularly
2. Mark milestones as completed
3. Link relevant journal entries
4. Update goal status as you progress

### Performance

1. Use batch operations for multiple goals
2. Use pagination for large goal lists
3. Filter by category or status to reduce data transfer
4. Cache goal counts on the client

## Related Documentation

- [Goals Feature](../features/goals.md)
- [Data Models](../architecture/data-models.md)
- [Journal API](./journal-api.md)

---

[← Back to API Reference](../API_REFERENCE.md)
