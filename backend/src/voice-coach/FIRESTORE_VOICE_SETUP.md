# Firestore Voice Collections Setup

This document describes the Firestore collections, indexes, and security rules for the Voice AI Coach feature.

## Collections

### voice_conversations

Stores conversation transcripts and metadata for completed voice coaching sessions.

**Schema:**
```typescript
{
  id: string;                    // Auto-generated document ID
  user_id: string;               // Firebase Auth UID
  conversation_id: string;       // ElevenLabs conversation ID
  agent_id: string;              // ElevenLabs agent ID
  transcript: Array<{            // Conversation messages
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    audioUrl?: string;
  }>;
  duration: number;              // Duration in seconds (max 1800 = 30 min)
  started_at: Timestamp;         // When conversation started
  ended_at: Timestamp;           // When conversation ended
  created_at: Timestamp;         // When record was created
  summary?: string;              // Optional AI-generated summary
  context_snapshot: {            // Context used during conversation
    goals_count: number;
    active_goals: string[];      // Goal IDs
    journal_entries_referenced: string[];  // Journal IDs from RAG
  };
}
```

### voice_sessions

Tracks active and recent voice coaching sessions.

**Schema:**
```typescript
{
  id: string;                    // Auto-generated document ID
  user_id: string;               // Firebase Auth UID
  agent_id: string;              // ElevenLabs agent ID
  status: 'active' | 'completed' | 'abandoned';
  started_at: Timestamp;         // When session started
  last_activity: Timestamp;      // Last activity timestamp
  expires_at: Timestamp;         // When session expires (30 min from start)
  context: UserContext;          // Snapshot of user context at session start
}
```

## Indexes

### voice_conversations Index

**Purpose:** Efficiently query user's conversation history sorted by creation date.

**Fields:**
- `user_id` (ASCENDING)
- `created_at` (DESCENDING)

**Usage:**
```typescript
db.collection('voice_conversations')
  .where('user_id', '==', userId)
  .orderBy('created_at', 'desc')
  .limit(20)
  .get();
```

### voice_sessions Index

**Purpose:** Find active sessions for a user that haven't expired yet.

**Fields:**
- `user_id` (ASCENDING)
- `status` (ASCENDING)
- `expires_at` (ASCENDING)

**Usage:**
```typescript
db.collection('voice_sessions')
  .where('user_id', '==', userId)
  .where('status', '==', 'active')
  .where('expires_at', '>', new Date())
  .get();
```

## Security Rules

### voice_conversations Rules

**Read:** Users can only read their own conversations
```
allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
```

**Create:** Users can create conversations with validation
- Must be authenticated
- Must own the conversation (user_id matches auth.uid)
- Must include required fields: user_id, conversation_id, agent_id, transcript, duration, started_at, ended_at, created_at
- Duration must be between 0 and 1800 seconds (30 minutes)

**Update:** Users can update their own conversations
```
allow update: if isAuthenticated() && 
              resource.data.user_id == request.auth.uid &&
              request.resource.data.user_id == request.auth.uid;
```

**Delete:** Users can delete their own conversations
```
allow delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
```

### voice_sessions Rules

**Read:** Users can only read their own sessions
```
allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
```

**Create:** Users can create sessions with validation
- Must be authenticated
- Must own the session (user_id matches auth.uid)
- Must include required fields: user_id, agent_id, status, started_at, last_activity, expires_at
- Status must be one of: 'active', 'completed', 'abandoned'
- Expiration time must be in the future

**Update:** Users can update their own sessions with expiration check
- Must be authenticated
- Must own the session
- Session must not be expired (request.time < resource.data.expires_at)
- Status (if updated) must be valid: 'active', 'completed', 'abandoned'

**Delete:** Users can delete their own sessions
```
allow delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
```

## Deployment

### Deploy Indexes

From the `web` directory, run:

```bash
./scripts/deploy-firestore-indexes.sh
```

Or manually:

```bash
cd web
firebase deploy --only firestore:indexes
```

### Deploy Security Rules

From the `web` directory, run:

```bash
firebase deploy --only firestore:rules
```

### Verify Deployment

After deployment, verify the indexes are being built in the Firebase Console:
https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/indexes

Index creation can take several minutes depending on existing data volume.

## Testing Security Rules

You can test the security rules locally using the Firebase Emulator:

```bash
cd web
firebase emulators:start --only firestore
```

Then run tests against the emulator to verify the rules work as expected.

## Rate Limiting

In addition to Firestore security rules, the backend implements rate limiting:

- **Session Creation:** 10 sessions per user per hour
- **Session Duration:** Maximum 30 minutes per session
- **Concurrent Sessions:** 1 active session per user at a time

These limits are enforced in the `VoiceCoachService` using the `RateLimitService`.

## Data Retention

Consider implementing a data retention policy for voice conversations:

- Archive conversations older than 90 days
- Delete archived conversations after 1 year
- Provide users with export functionality before deletion

This can be implemented using Firebase Cloud Functions with scheduled triggers.

## Privacy Considerations

- Conversation transcripts contain sensitive user data
- Ensure compliance with GDPR/CCPA requirements
- Provide users with ability to:
  - View all their conversations
  - Export their conversation data
  - Delete individual or all conversations
  - Opt-out of voice coaching feature

## Monitoring

Monitor the following metrics:

- Number of conversations per day
- Average conversation duration
- Failed conversation attempts
- Security rule violations
- Index performance and query times

Use Firebase Analytics and Cloud Monitoring to track these metrics.
