# Database Setup Guide

**Last Updated**: November 2025

This guide explains how to set up Firebase Firestore for the Journal application, including collections, security rules, and indexes.

## Table of Contents

- [Overview](#overview)
- [Firestore Setup](#firestore-setup)
- [Collections Schema](#collections-schema)
- [Security Rules](#security-rules)
- [Indexes](#indexes)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Journal application uses Firebase Firestore as its primary database. Firestore is a NoSQL document database that provides:
- Real-time synchronization
- Offline support
- Automatic scaling
- Security rules
- Composite indexes

### Database Structure

The application uses the following collections:

- **profiles** - User profiles
- **journal_entries** - Journal entries
- **goals** - User goals
  - **milestones** (subcollection) - Goal milestones
  - **progress_updates** (subcollection) - Progress tracking
- **goal_journal_links** - Links between goals and journal entries
- **chat_sessions** - AI coach chat sessions
- **voice_sessions** - Voice coach sessions
- **coach_personalities** - Coach personality configurations
- **custom_categories** - User-defined categories
- **themes** - User theme preferences
- **rag_embeddings** - Vector embeddings for RAG (if enabled)

---

## Firestore Setup

### 1. Enable Firestore

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Build** → **Firestore Database** (left sidebar)
4. Click **"Create database"**

### 2. Choose Database Mode

**Production Mode (Recommended):**
- Secure by default
- Requires security rules
- Best for production applications

**Test Mode:**
- Open access for 30 days
- Good for initial development
- Must add security rules before expiration

**Recommendation:** Choose Production mode and deploy security rules immediately.

### 3. Select Location

Choose a location for your database:
- **us-central1** - Iowa, USA (recommended for US users)
- **europe-west1** - Belgium (recommended for EU users)
- **asia-northeast1** - Tokyo (recommended for Asia users)

**Important:** Location cannot be changed after creation!

### 4. Verify Database Creation

After creation, you should see:
- Database name: `(default)`
- Status: Active
- Empty collections (will be created automatically)

---

## Collections Schema

### Profiles Collection

**Path:** `profiles/{userId}`

**Fields:**
```typescript
{
  id: string              // Document ID (matches user UID)
  email: string           // User email
  full_name: string | null // User's full name
  created_at: Timestamp   // Account creation time
  updated_at: Timestamp   // Last update time
}
```

**Indexes:** None required (simple queries only)

### Journal Entries Collection

**Path:** `journal_entries/{entryId}`

**Fields:**
```typescript
{
  id: string              // Auto-generated document ID
  user_id: string         // Owner user ID
  title: string           // Entry title
  content: string         // Entry content
  mood?: string           // Optional mood
  tags?: string[]         // Optional tags
  created_at: Timestamp   // Creation time
  updated_at: Timestamp   // Last update time
}
```

**Indexes:**
1. `user_id` (ASC) + `created_at` (DESC)

### Goals Collection

**Path:** `goals/{goalId}`

**Fields:**
```typescript
{
  id: string                    // Auto-generated document ID
  user_id: string               // Owner user ID
  title: string                 // Goal title (3-200 chars)
  description: string           // Goal description (max 2000 chars)
  category: string              // One of: career, health, personal, financial, relationships, learning, other
  status: string                // One of: not_started, in_progress, completed, abandoned
  target_date: Timestamp        // Goal deadline
  created_at: Timestamp         // Creation time
  updated_at: Timestamp         // Last update time
  completed_at?: Timestamp      // Completion time (if completed)
  status_changed_at: Timestamp  // Last status change
  last_activity: Timestamp      // Last activity (update, milestone, progress)
  progress_percentage: number   // Calculated progress (0-100)
}
```

**Indexes:**
1. `user_id` (ASC) + `status` (ASC) + `target_date` (ASC)
2. `user_id` (ASC) + `category` (ASC) + `created_at` (DESC)

### Milestones Subcollection

**Path:** `goals/{goalId}/milestones/{milestoneId}`

**Fields:**
```typescript
{
  id: string                // Auto-generated document ID
  goal_id: string           // Parent goal ID
  title: string             // Milestone title (max 200 chars)
  due_date?: Timestamp      // Optional due date
  completed: boolean        // Completion status
  completed_at?: Timestamp  // Completion time
  order: number             // Display order
  created_at: Timestamp     // Creation time
}
```

**Indexes:**
1. `goal_id` (ASC) + `order` (ASC)

### Progress Updates Subcollection

**Path:** `goals/{goalId}/progress_updates/{progressId}`

**Fields:**
```typescript
{
  id: string              // Auto-generated document ID
  goal_id: string         // Parent goal ID
  content: string         // Progress update content (max 2000 chars)
  created_at: Timestamp   // Creation time
}
```

**Indexes:**
1. `goal_id` (ASC) + `created_at` (DESC)

### Goal-Journal Links Collection

**Path:** `goal_journal_links/{linkId}`

**Fields:**
```typescript
{
  id: string                // Auto-generated document ID
  goal_id: string           // Goal ID
  journal_entry_id: string  // Journal entry ID
  user_id: string           // Owner user ID
  created_at: Timestamp     // Link creation time
}
```

**Indexes:**
1. `user_id` (ASC) + `goal_id` (ASC)
2. `user_id` (ASC) + `journal_entry_id` (ASC)

### Chat Sessions Collection

**Path:** `chat_sessions/{sessionId}`

**Fields:**
```typescript
{
  id: string              // Auto-generated document ID
  user_id: string         // Owner user ID
  title?: string          // Optional session title
  messages: Array<{       // Chat messages
    role: 'user' | 'assistant'
    content: string
    timestamp: Timestamp
  }>
  created_at: Timestamp   // Creation time
  updated_at: Timestamp   // Last update time
}
```

**Indexes:**
1. `user_id` (ASC) + `updated_at` (DESC)

### Voice Sessions Collection

**Path:** `voice_sessions/{sessionId}`

**Fields:**
```typescript
{
  id: string              // Auto-generated document ID
  user_id: string         // Owner user ID
  personality_id: string  // Coach personality ID
  status: string          // Session status
  duration?: number       // Session duration in seconds
  transcript?: string     // Session transcript
  created_at: Timestamp   // Creation time
  ended_at?: Timestamp    // End time
}
```

**Indexes:**
1. `user_id` (ASC) + `created_at` (DESC)

### Coach Personalities Collection

**Path:** `coach_personalities/{personalityId}`

**Fields:**
```typescript
{
  id: string              // Auto-generated document ID
  name: string            // Personality name
  description: string     // Personality description
  system_prompt: string   // AI system prompt
  voice_id?: string       // ElevenLabs voice ID
  is_default: boolean     // Default personality flag
  is_active: boolean      // Active status
  created_at: Timestamp   // Creation time
}
```

**Indexes:** None required

### Custom Categories Collection

**Path:** `custom_categories/{categoryId}`

**Fields:**
```typescript
{
  id: string              // Auto-generated document ID
  user_id: string         // Owner user ID
  name: string            // Category name
  color: string           // Category color (hex)
  icon?: string           // Optional icon
  created_at: Timestamp   // Creation time
}
```

**Indexes:**
1. `user_id` (ASC) + `created_at` (ASC)

### Themes Collection

**Path:** `themes/{themeId}`

**Fields:**
```typescript
{
  id: string              // Auto-generated document ID
  user_id: string         // Owner user ID
  name: string            // Theme name
  colors: {               // Theme colors
    primary: string
    secondary: string
    background: string
    // ... other colors
  }
  created_at: Timestamp   // Creation time
}
```

**Indexes:**
1. `user_id` (ASC)

### RAG Embeddings Collection

**Path:** `rag_embeddings/{embeddingId}`

**Fields:**
```typescript
{
  id: string              // Auto-generated document ID
  user_id: string         // Owner user ID
  content_type: string    // Type: journal_entry, goal, milestone, progress_update
  content_id: string      // Reference to source document
  content_text: string    // Text content
  embedding: number[]     // Vector embedding (768 dimensions)
  metadata: {             // Additional metadata
    created_at: Timestamp
    category?: string
    // ... other metadata
  }
  created_at: Timestamp   // Embedding creation time
}
```

**Indexes:**
1. `user_id` (ASC) + `content_type` (ASC) + `created_at` (DESC)
2. `user_id` (ASC) + `content_id` (ASC)

---

## Security Rules

Security rules ensure users can only access their own data.

### Deploy Security Rules

**Prerequisites:**
- Firebase CLI installed: `npm install -g firebase-tools`
- Logged in: `firebase login`
- Project selected: `firebase use <project-id>`

**Deploy:**
```bash
cd web
firebase deploy --only firestore:rules
```

### Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to **Firestore Database** → **Rules**
3. Check the updated timestamp
4. Rules should show proper user authentication checks

### Key Security Rules

**User Data Access:**
```javascript
// Users can only access their own data
match /profiles/{userId} {
  allow read, write: if request.auth.uid == userId;
}

match /journal_entries/{entryId} {
  allow read, write: if request.auth.uid == resource.data.user_id;
}

match /goals/{goalId} {
  allow read, write: if request.auth.uid == resource.data.user_id;
}
```

**Subcollection Access:**
```javascript
// Verify parent goal ownership
match /goals/{goalId}/milestones/{milestoneId} {
  allow read, write: if request.auth.uid == get(/databases/$(database)/documents/goals/$(goalId)).data.user_id;
}
```

**Field Validation:**
```javascript
// Validate goal fields
allow create: if request.auth != null
  && request.resource.data.user_id == request.auth.uid
  && request.resource.data.title.size() >= 3
  && request.resource.data.title.size() <= 200
  && request.resource.data.category in ['career', 'health', 'personal', 'financial', 'relationships', 'learning', 'other'];
```

### Test Security Rules

Use the Firebase Console Rules Playground:

1. Go to **Firestore Database** → **Rules**
2. Click **"Rules Playground"**
3. Test read/write operations
4. Verify rules work as expected

---

## Indexes

Composite indexes optimize query performance.

### Deploy Indexes

**Option 1 - Using Script:**
```bash
cd web
./scripts/deploy-firestore-indexes.sh
```

**Option 2 - Manual Deployment:**
```bash
cd web
firebase deploy --only firestore:indexes
```

### Monitor Index Creation

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to **Firestore Database** → **Indexes**
3. Check status of each index:
   - **Building** - Index is being created
   - **Enabled** - Index is ready
   - **Error** - Index creation failed

**Note:** Index creation can take several minutes to hours for large datasets.

### Required Indexes

The application requires these composite indexes:

**Journal Entries:**
- `user_id` (ASC) + `created_at` (DESC)

**Goals:**
- `user_id` (ASC) + `status` (ASC) + `target_date` (ASC)
- `user_id` (ASC) + `category` (ASC) + `created_at` (DESC)

**Milestones:**
- `goal_id` (ASC) + `order` (ASC)

**Progress Updates:**
- `goal_id` (ASC) + `created_at` (DESC)

**Goal-Journal Links:**
- `user_id` (ASC) + `goal_id` (ASC)
- `user_id` (ASC) + `journal_entry_id` (ASC)

**Chat Sessions:**
- `user_id` (ASC) + `updated_at` (DESC)

**Voice Sessions:**
- `user_id` (ASC) + `created_at` (DESC)

**Custom Categories:**
- `user_id` (ASC) + `created_at` (ASC)

**RAG Embeddings:**
- `user_id` (ASC) + `content_type` (ASC) + `created_at` (DESC)
- `user_id` (ASC) + `content_id` (ASC)

### Create Index from Error

If you get "The query requires an index" error:

1. Click the link in the error message
2. Firebase will auto-generate the index
3. Wait for index creation to complete
4. Retry your query

---

## Verification

### Verify Firestore Setup

Use the verification script:

```bash
cd web
./scripts/verify-firestore-setup.sh
```

This checks:
- Firestore is enabled
- Security rules are deployed
- Required indexes exist
- Collections are accessible

### Manual Verification

**1. Check Database Exists:**
```bash
# Using Firebase CLI
firebase firestore:databases:list
```

**2. Check Security Rules:**
```bash
# Get current rules
firebase firestore:rules:get
```

**3. Check Indexes:**
```bash
# List indexes
firebase firestore:indexes
```

**4. Test Connection:**

Create a test document:
```javascript
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

db.collection('test').add({ message: 'Hello' })
  .then(() => console.log('✅ Connection successful'))
  .catch(err => console.error('❌ Connection failed:', err));
```

---

## Troubleshooting

### Database Not Found Error

**Error:** `5 NOT_FOUND: Database not found`

**Solutions:**
1. Verify Firestore is enabled in Firebase Console
2. Check `FIREBASE_PROJECT_ID` matches your project
3. Ensure database ID is `(default)` or set `FIREBASE_DATABASE_ID`
4. Verify service account has Firestore permissions

### Permission Denied Error

**Error:** `Missing or insufficient permissions`

**Solutions:**
1. Verify user is authenticated
2. Check security rules are deployed
3. Ensure `user_id` matches `request.auth.uid`
4. For subcollections, verify parent document ownership
5. Check Firebase Console → Firestore → Rules → Logs

### Index Required Error

**Error:** `The query requires an index`

**Solutions:**
1. Click the link in error message to create index
2. Or manually add to `firestore.indexes.json` and deploy
3. Wait for index creation to complete (can take minutes)
4. Retry query

### Index Creation Stuck

**Error:** Index stuck in "Building" state

**Solutions:**
1. Check [Firebase Status](https://status.firebase.google.com/)
2. Wait longer (can take hours for large datasets)
3. Try deleting and recreating the index
4. Contact Firebase support if persists

### Security Rules Not Updating

**Error:** Rules changes not taking effect

**Solutions:**
1. Redeploy rules: `firebase deploy --only firestore:rules`
2. Check Firebase Console for deployment errors
3. Clear browser cache
4. Wait a few minutes for propagation
5. Verify rules in Firebase Console

### Slow Queries

**Issue:** Queries are slow

**Solutions:**
1. Check indexes are deployed and enabled
2. Add missing indexes for your queries
3. Limit result set size (use pagination)
4. Denormalize data if needed
5. Monitor usage in Firebase Console

### High Costs

**Issue:** Unexpected Firestore costs

**Solutions:**
1. Monitor reads/writes in Firebase Console
2. Implement pagination to reduce reads
3. Use caching to reduce repeated queries
4. Optimize security rules (avoid `get()` calls)
5. Set up billing alerts

---

## Best Practices

### Data Modeling

1. **Denormalize when needed** - Duplicate data to avoid joins
2. **Use subcollections** - For one-to-many relationships
3. **Limit document size** - Max 1MB per document
4. **Use batch writes** - For multiple related updates
5. **Implement pagination** - For large result sets

### Security

1. **Always validate data** - In security rules and application
2. **Use server-side validation** - Don't trust client input
3. **Minimize `get()` calls** - In security rules (they count as reads)
4. **Test rules thoroughly** - Use Rules Playground
5. **Monitor denied requests** - In Firebase Console

### Performance

1. **Create proper indexes** - For all queries
2. **Use caching** - Reduce repeated queries
3. **Implement pagination** - Limit result sets
4. **Batch operations** - Group related writes
5. **Monitor usage** - Track reads/writes/storage

### Cost Optimization

1. **Use indexes efficiently** - Avoid over-indexing
2. **Implement caching** - Reduce reads
3. **Paginate results** - Don't fetch all data
4. **Clean up old data** - Archive or delete unused documents
5. **Set up alerts** - Monitor costs

---

## Additional Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Pricing Calculator](https://firebase.google.com/pricing)

---

**Need help?** Check the [Troubleshooting Guide](../guides/troubleshooting.md) or return to [Setup Guide](../SETUP.md).
