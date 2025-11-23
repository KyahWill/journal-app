# Firestore Goals Setup Guide

This guide explains how to set up the Firestore collections, security rules, and indexes for the goal-setting feature.

## Overview

The goal-setting feature uses the following Firestore structure:

- **`goals`** - Main collection for user goals
  - **`milestones`** - Subcollection for goal milestones
  - **`progress_updates`** - Subcollection for progress tracking
- **`goal_journal_links`** - Collection linking goals to journal entries

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in to Firebase: `firebase login`
3. Firebase project selected: `firebase use <project-id>`

## Setup Steps

### 1. Review the Schema

The collection schemas are documented in:
```
backend/src/firebase/migrations/setup-goal-collections.ts
```

This file contains:
- TypeScript interfaces for each collection
- Validation functions for data integrity
- Schema documentation

### 2. Deploy Security Rules

The security rules ensure:
- Users can only access their own goals
- Subcollections verify parent goal ownership
- Field validation (title length, valid categories, etc.)
- Cross-reference validation for goal-journal links

**Deploy the rules:**

```bash
cd web
firebase deploy --only firestore:rules
```

**Verify deployment:**
- Check the Firebase Console → Firestore → Rules
- Rules should show the updated timestamp

### 3. Deploy Indexes

The indexes optimize queries for:
- Filtering goals by status and target date
- Filtering goals by category
- Ordering milestones
- Chronological progress updates
- Goal-journal link lookups

**Deploy the indexes:**

Option A - Using the script:
```bash
cd web
./scripts/deploy-firestore-indexes.sh
```

Option B - Manual deployment:
```bash
cd web
firebase deploy --only firestore:indexes
```

**Monitor index creation:**
- Index creation can take several minutes
- Check status in Firebase Console → Firestore → Indexes
- Wait for all indexes to show "Enabled" status

### 4. Verify Setup

After deployment, verify:

1. **Security Rules**: Test in Firebase Console → Firestore → Rules → Playground
2. **Indexes**: Check Firebase Console → Firestore → Indexes (all should be "Enabled")
3. **Collections**: Will be created automatically when first document is added

## Collection Details

### Goals Collection

**Path:** `goals/{goalId}`

**Fields:**
- `user_id` (string) - Owner of the goal
- `title` (string, 3-200 chars) - Goal title
- `description` (string, max 2000 chars) - Goal description
- `category` (string) - One of: career, health, personal, financial, relationships, learning, other
- `status` (string) - One of: not_started, in_progress, completed, abandoned
- `target_date` (timestamp) - Goal deadline
- `created_at` (timestamp) - Creation time
- `updated_at` (timestamp) - Last update time
- `completed_at` (timestamp | null) - Completion time
- `status_changed_at` (timestamp) - Last status change
- `last_activity` (timestamp) - Last activity (update, milestone, progress)
- `progress_percentage` (number, 0-100) - Calculated progress

**Indexes:**
1. `user_id` (ASC) + `status` (ASC) + `target_date` (ASC)
2. `user_id` (ASC) + `category` (ASC) + `created_at` (DESC)

### Milestones Subcollection

**Path:** `goals/{goalId}/milestones/{milestoneId}`

**Fields:**
- `goal_id` (string) - Parent goal ID
- `title` (string, max 200 chars) - Milestone title
- `due_date` (timestamp | null) - Optional due date
- `completed` (boolean) - Completion status
- `completed_at` (timestamp | null) - Completion time
- `order` (number) - Display order
- `created_at` (timestamp) - Creation time

**Indexes:**
1. `goal_id` (ASC) + `order` (ASC)

### Progress Updates Subcollection

**Path:** `goals/{goalId}/progress_updates/{progressId}`

**Fields:**
- `goal_id` (string) - Parent goal ID
- `content` (string, max 2000 chars) - Progress update content
- `created_at` (timestamp) - Creation time

**Indexes:**
1. `goal_id` (ASC) + `created_at` (DESC)

### Goal-Journal Links Collection

**Path:** `goal_journal_links/{linkId}`

**Fields:**
- `goal_id` (string) - Goal ID
- `journal_entry_id` (string) - Journal entry ID
- `user_id` (string) - Owner of both resources
- `created_at` (timestamp) - Link creation time

**Indexes:**
1. `user_id` (ASC) + `goal_id` (ASC)
2. `user_id` (ASC) + `journal_entry_id` (ASC)

## Security Rules Summary

### Goals Collection
- **Read**: User must own the goal (`user_id` matches)
- **Create**: User must set their own `user_id`, validate all required fields
- **Update**: User must own the goal, validate updated fields
- **Delete**: User must own the goal

### Milestones Subcollection
- **Read/Write**: User must own the parent goal (verified via `get()` call)
- **Create**: Must set correct `goal_id`, validate title length
- **Update**: Cannot change `goal_id`, validate title length

### Progress Updates Subcollection
- **Read/Write**: User must own the parent goal (verified via `get()` call)
- **Create**: Must set correct `goal_id`, validate content length
- **Update**: Cannot change `goal_id`, validate content length

### Goal-Journal Links Collection
- **Read**: User must own the link (`user_id` matches)
- **Create**: User must own both the goal and journal entry (verified via `get()` calls)
- **Update**: User must own the link
- **Delete**: User must own the link

## Testing

### Test Security Rules Locally

Use the Firebase Emulator Suite:

```bash
cd web
firebase emulators:start --only firestore
```

Then run tests against the emulator.

### Test Queries

Verify indexes are being used:

1. Run a query in your application
2. Check Firebase Console → Firestore → Usage
3. Look for "Index" column - should show which index was used
4. If "Index" shows "None", you may need an additional index

## Troubleshooting

### "Missing or insufficient permissions" Error

**Cause:** Security rules are rejecting the request

**Solutions:**
1. Verify user is authenticated
2. Check that `user_id` matches `request.auth.uid`
3. For subcollections, verify parent goal exists and is owned by user
4. Check Firebase Console → Firestore → Rules → Logs for details

### "The query requires an index" Error

**Cause:** Query needs a composite index that doesn't exist

**Solutions:**
1. Click the link in the error message to create the index automatically
2. Or manually add the index to `firestore.indexes.json` and deploy
3. Wait for index creation to complete (can take several minutes)

### Index Creation Stuck

**Cause:** Large dataset or Firebase service issues

**Solutions:**
1. Check Firebase Status page for service issues
2. Try deleting and recreating the index
3. Contact Firebase support if issue persists

### Security Rules Not Updating

**Cause:** Rules deployment failed or cached

**Solutions:**
1. Redeploy rules: `firebase deploy --only firestore:rules`
2. Check Firebase Console for deployment errors
3. Clear browser cache and retry
4. Wait a few minutes for rules to propagate

## Monitoring

Monitor your Firestore usage:

1. **Firebase Console → Firestore → Usage**
   - Document reads/writes
   - Storage usage
   - Index usage

2. **Firebase Console → Firestore → Indexes**
   - Index status (Building/Enabled/Error)
   - Index size

3. **Firebase Console → Firestore → Rules**
   - Rule evaluation metrics
   - Denied requests

## Best Practices

1. **Always validate data** in application layer before writing to Firestore
2. **Use batch writes** for multiple related updates
3. **Implement pagination** for large result sets
4. **Monitor costs** - reads/writes can add up quickly
5. **Test security rules** thoroughly before deploying to production
6. **Use transactions** for operations that must be atomic
7. **Denormalize data** when needed for query performance
8. **Set up alerts** for unusual usage patterns

## Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firebase Console](https://console.firebase.google.com)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Firebase documentation
3. Check Firebase Status page
4. Contact the development team
