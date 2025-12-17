# Firestore Migrations

This directory contains schema definitions and migration scripts for Firestore collections.

## Migration Scripts

### User ID Migration (`migrate-user-id.ts`)

Migrates all user data from one user ID (UID) to another. This is useful when:
- A user's UID changed due to Google authentication creating a duplicate account
- Merging two accounts into one
- Recovering data after accidental account creation with wrong provider

#### Usage

```bash
cd backend

# Step 1: Preview migration (recommended)
npx ts-node src/firebase/migrations/migrate-user-id.ts <OLD_UID> <NEW_UID> --dry-run

# Step 2: Run actual migration
npx ts-node src/firebase/migrations/migrate-user-id.ts <OLD_UID> <NEW_UID>
```

#### Arguments

| Argument | Description |
|----------|-------------|
| `OLD_UID` | The user ID to migrate FROM (the one with existing data) |
| `NEW_UID` | The user ID to migrate TO (the one you want to use) |
| `--dry-run` | Optional. Preview changes without making them |

#### What Gets Migrated

| Collection | Migration Type |
|------------|----------------|
| `goals` | Updates `user_id` field |
| `journal-entries` | Updates `user_id` field |
| `chat_sessions` | Updates `user_id` field |
| `user_prompts` | Updates `user_id` field |
| `custom_categories` | Updates `user_id` field |
| `goal_journal_links` | Updates `user_id` field |
| `coach_personalities` | Updates `user_id` field |
| `embeddings` | Updates `user_id` field |
| `profiles` | Copies document to new ID, deletes old |
| `user_usage` | Copies subcollection to new path, deletes old |

#### Example

```bash
# Preview what would be migrated
npx ts-node src/firebase/migrations/migrate-user-id.ts abc123olduid xyz789newuid --dry-run

# Output:
# ============================================================
# USER ID MIGRATION
# ============================================================
# Old UID: abc123olduid
# New UID: xyz789newuid
# Mode: DRY RUN (no changes will be made)
# ============================================================
# 
# Migrating collections with user_id field...
#   [goals] Found 5 documents
#   [journal-entries] Found 42 documents
#   ...
# 
# MIGRATION SUMMARY
# Total documents found: 67
# Total documents would be updated: 67
# ============================================================
```

---

## Collections Structure

## Collections Structure

### 1. `goals` Collection

Main collection for storing user goals.

**Schema:**
```typescript
{
  id: string
  user_id: string
  title: string                    // 3-200 characters
  description: string              // max 2000 characters
  category: GoalCategory           // career, health, personal, financial, relationships, learning, other
  status: GoalStatus               // not_started, in_progress, completed, abandoned
  target_date: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
  completed_at: Timestamp | null
  status_changed_at: Timestamp
  last_activity: Timestamp
  progress_percentage: number      // 0-100
}
```

**Subcollections:**
- `milestones` - Milestones for the goal
- `progress_updates` - Progress updates for the goal

### 2. `goals/{goalId}/milestones` Subcollection

Stores milestones for each goal.

**Schema:**
```typescript
{
  id: string
  goal_id: string
  title: string                    // max 200 characters
  due_date: Timestamp | null
  completed: boolean
  completed_at: Timestamp | null
  order: number
  created_at: Timestamp
}
```

### 3. `goals/{goalId}/progress_updates` Subcollection

Stores progress updates for each goal.

**Schema:**
```typescript
{
  id: string
  goal_id: string
  content: string                  // max 2000 characters
  created_at: Timestamp
}
```

### 4. `goal_journal_links` Collection

Links goals to journal entries.

**Schema:**
```typescript
{
  id: string
  goal_id: string
  journal_entry_id: string
  user_id: string
  created_at: Timestamp
}
```

### 5. `custom_categories` Collection

Stores user-defined custom goal categories.

**Schema:**
```typescript
{
  id: string
  user_id: string
  name: string                     // 1-50 characters, unique per user
  color: string | null             // Hex color (#RRGGBB)
  icon: string | null              // Emoji or icon name, max 50 characters
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Features:**
- Users can create custom categories beyond the default ones
- Each category can have a custom color and icon
- Category names must be unique per user
- When a category is deleted, associated goals are moved to "other"

**Migration Script:** `setup-custom-categories.ts`

## Security Rules

Security rules are defined in `web/firestore.rules` and enforce:

1. **User Isolation**: Users can only access their own goals
2. **Parent Ownership**: Subcollections (milestones, progress_updates) verify parent goal ownership
3. **Field Validation**: Title length, description length, valid categories/statuses
4. **Cross-Reference Validation**: Goal-journal links verify ownership of both resources

## Indexes

Composite indexes are defined in `web/firestore.indexes.json`:

### Goal-Related Indexes

1. **Goals by user, status, and target date** - For filtering and sorting goals
2. **Goals by user, category, and created date** - For category-based queries
3. **Milestones by goal and order** - For ordered milestone lists
4. **Progress updates by goal and created date** - For chronological progress history
5. **Goal-journal links by user and goal** - For finding journal entries linked to a goal
6. **Goal-journal links by user and journal entry** - For finding goals linked to a journal entry
7. **Custom categories by user and name** - For unique category name validation
8. **Custom categories by user and created date** - For listing user categories

### RAG Embeddings Indexes

9. **Embeddings by user, content type, and created date** - For filtered semantic search
10. **Embeddings by user and created date** - For retrieving all user embeddings

For detailed RAG index documentation, see [backend/src/rag/INDEXES.md](../../rag/INDEXES.md).

## Deployment

### Deploy Security Rules

```bash
cd web
firebase deploy --only firestore:rules
```

### Deploy Indexes

```bash
cd web
./scripts/deploy-firestore-indexes.sh
```

Or manually:

```bash
cd web
firebase deploy --only firestore:indexes
```

**Note:** Index creation can take several minutes. Monitor progress in the [Firebase Console](https://console.firebase.google.com).

## Validation

The `setup-goal-collections.ts` file provides validation functions:

- `validateGoalDocument()` - Validates goal document structure
- `validateMilestoneDocument()` - Validates milestone document structure
- `validateProgressUpdateDocument()` - Validates progress update document structure
- `validateGoalJournalLinkDocument()` - Validates goal-journal link document structure

These validators are used in the application layer (DTOs) to ensure data integrity before writing to Firestore.

## Usage in Application

### Creating a Goal

```typescript
const goalData = {
  user_id: userId,
  title: 'Complete marathon training',
  description: 'Train for and complete a full marathon',
  category: 'health',
  status: 'not_started',
  target_date: admin.firestore.Timestamp.fromDate(new Date('2024-12-31')),
  created_at: admin.firestore.Timestamp.now(),
  updated_at: admin.firestore.Timestamp.now(),
  completed_at: null,
  status_changed_at: admin.firestore.Timestamp.now(),
  last_activity: admin.firestore.Timestamp.now(),
  progress_percentage: 0
}

const docRef = await firestore.collection('goals').add(goalData)
```

### Adding a Milestone

```typescript
const milestoneData = {
  goal_id: goalId,
  title: 'Run 10K without stopping',
  due_date: admin.firestore.Timestamp.fromDate(new Date('2024-06-30')),
  completed: false,
  completed_at: null,
  order: 1,
  created_at: admin.firestore.Timestamp.now()
}

await firestore
  .collection('goals')
  .doc(goalId)
  .collection('milestones')
  .add(milestoneData)
```

### Querying Goals

```typescript
// Get all active goals for a user, sorted by target date
const snapshot = await firestore
  .collection('goals')
  .where('user_id', '==', userId)
  .where('status', '==', 'in_progress')
  .orderBy('target_date', 'asc')
  .get()

const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
```

## Testing

Before deploying to production:

1. Test security rules using the Firebase Emulator Suite
2. Verify indexes are created successfully
3. Test queries to ensure they use the correct indexes
4. Validate data integrity with the provided validation functions

## Monitoring

Monitor your Firestore usage in the Firebase Console:

- **Database Usage**: Check document reads/writes
- **Index Status**: Verify all indexes are built
- **Security Rules**: Review rule evaluation metrics
- **Performance**: Monitor query performance

## Troubleshooting

### Index Creation Failed

If index creation fails:
1. Check the Firebase Console for error messages
2. Verify you have sufficient permissions
3. Ensure the index definition is valid
4. Try deploying indexes individually

### Security Rules Errors

If security rules are rejecting valid requests:
1. Check the Firebase Console security rules logs
2. Verify the user is authenticated
3. Ensure the document has the required fields
4. Test rules in the Firebase Emulator

### Query Performance Issues

If queries are slow:
1. Check if the query is using an index (Firebase Console)
2. Create additional indexes if needed
3. Consider denormalizing data for frequently accessed queries
4. Use pagination for large result sets
