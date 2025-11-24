# Firebase Integration

**Complete Firebase integration for authentication and database**

---

**Last Updated**: November 2025  
**Status**: ✅ Production Ready

---

## Table of Contents

- [Overview](#overview)
- [Services Used](#services-used)
- [Setup](#setup)
- [Authentication](#authentication)
- [Firestore Database](#firestore-database)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

Firebase provides the core infrastructure for the Journal application, including authentication, database, and security. The application uses Firebase Admin SDK on the server side for secure operations and Firebase Client SDK on the web for real-time features.

**Key Features**:
- Server-side authentication with Firebase Admin SDK
- Real-time Firestore database
- Security rules for data protection
- Automatic scaling and high availability
- Offline support for web application

---

## Services Used

### Firebase Authentication

**Purpose**: User authentication and session management

**Features**:
- Email/password authentication
- Session cookie management (5-day expiry)
- Token verification and validation
- Refresh token revocation
- User profile management

**Implementation**: Server-side only using Firebase Admin SDK

### Cloud Firestore

**Purpose**: NoSQL document database for all application data

**Collections**:
- `profiles` - User profiles
- `journal_entries` - Journal entries
- `goals` - User goals with subcollections
- `chat_sessions` - AI coach conversations
- `voice_sessions` - Voice coaching sessions
- `coach_personalities` - Coach configurations
- `custom_categories` - User-defined categories
- `themes` - User theme preferences
- `rag_embeddings` - Vector embeddings for semantic search

**Features**:
- Real-time synchronization
- Offline persistence
- Composite indexes for complex queries
- Security rules for access control
- Automatic scaling

---

## Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name (e.g., "journal-app")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. Save changes

### 3. Create Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose **Production mode** (recommended)
4. Select database location (cannot be changed later)
   - `us-central1` - Iowa, USA
   - `europe-west1` - Belgium
   - `asia-northeast1` - Tokyo
5. Click "Enable"

### 4. Get Configuration

**For Web Application (Client SDK)**:

1. Go to **Project Settings** → **General**
2. Scroll to "Your apps"
3. Click web icon (</>) to add web app
4. Register app with nickname
5. Copy configuration object:

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

**For Backend (Admin SDK)**:

1. Go to **Project Settings** → **Service accounts**
2. Click "Generate new private key"
3. Save the JSON file securely
4. Stringify the JSON (remove newlines):

```bash
# macOS/Linux
cat serviceAccount.json | jq -c .

# Or manually copy and remove all newlines
```

### 5. Configure Environment Variables

**Web Application** (`.env.local`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Server-side only
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

**Backend API** (`.env`):
```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
FIREBASE_PROJECT_ID=your-project
FIREBASE_DATABASE_ID=(default)
```

---

## Authentication

### Architecture

The application uses **100% server-side authentication** with Firebase Admin SDK:

```
Client → Next.js API Routes → Firebase Admin SDK → Firebase Auth
```

**Benefits**:
- No client-side token exposure
- HTTP-only session cookies
- Server-side token verification
- Secure session management

### Authentication Flow

1. **Sign Up/Sign In**:
   - Client sends credentials to Next.js API route
   - Server authenticates with Firebase REST API
   - Server creates session cookie with Firebase Admin SDK
   - Cookie set as HTTP-only, secure

2. **Session Validation**:
   - Every request includes session cookie
   - Server verifies cookie with Firebase Admin SDK
   - Invalid sessions redirect to login

3. **Sign Out**:
   - Server revokes refresh tokens
   - Server deletes session cookie
   - User redirected to login

### Implementation

**Server-Side Initialization** (`web/lib/firebase/admin.ts`):
```typescript
import admin from 'firebase-admin'

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  )
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

export const firebaseAdmin = admin
export const auth = admin.auth()
export const db = admin.firestore()
```

**Backend Initialization** (`backend/src/firebase/firebase.service.ts`):
```typescript
import * as admin from 'firebase-admin'

@Injectable()
export class FirebaseService implements OnModuleInit {
  private db: admin.firestore.Firestore
  
  async onModuleInit() {
    const serviceAccount = JSON.parse(
      this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_KEY')
    )
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
    })
    
    this.db = admin.firestore()
    this.db.settings({
      databaseId: this.configService.get<string>('FIREBASE_DATABASE_ID') || '(default)',
    })
  }
}
```

---

## Firestore Database

### Collections Schema

**Profiles** (`profiles/{userId}`):
```typescript
{
  id: string
  email: string
  full_name: string | null
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Journal Entries** (`journal_entries/{entryId}`):
```typescript
{
  id: string
  user_id: string
  title: string
  content: string
  mood?: string
  tags?: string[]
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Goals** (`goals/{goalId}`):
```typescript
{
  id: string
  user_id: string
  title: string
  description: string
  category: string
  status: string
  target_date: Timestamp
  progress_percentage: number
  created_at: Timestamp
  updated_at: Timestamp
}
```

### Security Rules

Firestore security rules ensure users can only access their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Profiles
    match /profiles/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Journal entries
    match /journal_entries/{entryId} {
      allow read, delete: if isOwner(resource.data.user_id);
      allow create: if isOwner(request.resource.data.user_id);
      allow update: if isOwner(resource.data.user_id);
    }
    
    // Goals
    match /goals/{goalId} {
      allow read, delete: if isOwner(resource.data.user_id);
      allow create: if isOwner(request.resource.data.user_id);
      allow update: if isOwner(resource.data.user_id);
    }
  }
}
```

**Deploy Rules**:
```bash
cd web
firebase deploy --only firestore:rules
```

### Indexes

Composite indexes optimize query performance:

```json
{
  "indexes": [
    {
      "collectionGroup": "journal_entries",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "goals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "target_date", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**Deploy Indexes**:
```bash
cd web
firebase deploy --only firestore:indexes
```

---

## Configuration

### Firebase Admin SDK Permissions

The service account needs these IAM roles:

1. **Firebase Admin SDK Administrator Service Agent**
   - Full access to Firebase services
   - Required for authentication and Firestore

2. **Cloud Datastore User**
   - Read/write access to Firestore
   - Required for database operations

**Grant Permissions**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **IAM & Admin** → **IAM**
3. Find your service account
4. Click "Edit" and add roles

### Firestore Settings

**Database ID**: `(default)` (or custom)

**Location**: Choose based on user base
- US: `us-central1`
- Europe: `europe-west1`
- Asia: `asia-northeast1`

**Mode**: Production (with security rules)

---

## Usage Examples

### Authentication

**Create Session Cookie**:
```typescript
import { auth } from '@/lib/firebase/admin'

const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn })
```

**Verify Session Cookie**:
```typescript
const decodedToken = await auth.verifySessionCookie(sessionCookie, true)
const userId = decodedToken.uid
```

**Revoke Refresh Tokens**:
```typescript
await auth.revokeRefreshTokens(userId)
```

### Firestore Operations

**Create Document**:
```typescript
import { db } from '@/lib/firebase/admin'

await db.collection('journal_entries').add({
  user_id: userId,
  title: 'My Entry',
  content: 'Entry content...',
  created_at: admin.firestore.FieldValue.serverTimestamp(),
})
```

**Query Documents**:
```typescript
const snapshot = await db
  .collection('journal_entries')
  .where('user_id', '==', userId)
  .orderBy('created_at', 'desc')
  .limit(10)
  .get()

const entries = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data(),
}))
```

**Update Document**:
```typescript
await db.collection('journal_entries').doc(entryId).update({
  title: 'Updated Title',
  updated_at: admin.firestore.FieldValue.serverTimestamp(),
})
```

**Delete Document**:
```typescript
await db.collection('journal_entries').doc(entryId).delete()
```

**Batch Operations**:
```typescript
const batch = db.batch()

batch.set(db.collection('goals').doc(), goalData)
batch.update(db.collection('profiles').doc(userId), { updated_at: now })
batch.delete(db.collection('old_data').doc(oldId))

await batch.commit()
```

---

## Best Practices

### Security

1. **Never expose service account key** in client-side code
2. **Use security rules** for all collections
3. **Validate data** on both client and server
4. **Use server-side authentication** only
5. **Rotate service account keys** regularly
6. **Monitor authentication logs** for suspicious activity

### Performance

1. **Create indexes** for all queries
2. **Use batch operations** for multiple writes
3. **Implement pagination** for large result sets
4. **Cache frequently accessed data**
5. **Denormalize data** when appropriate
6. **Limit document size** (max 1MB)

### Cost Optimization

1. **Use indexes efficiently** (avoid over-indexing)
2. **Implement caching** to reduce reads
3. **Paginate results** (don't fetch all data)
4. **Clean up old data** regularly
5. **Monitor usage** in Firebase Console
6. **Set up billing alerts**

### Development

1. **Use separate projects** for dev/staging/production
2. **Test security rules** in Rules Playground
3. **Version control** security rules and indexes
4. **Document schema changes**
5. **Use TypeScript types** for data models
6. **Handle errors gracefully**

---

## Troubleshooting

### Database Not Found

**Error**: `5 NOT_FOUND: Database not found`

**Solutions**:
1. Verify Firestore is enabled in Firebase Console
2. Check `FIREBASE_PROJECT_ID` matches your project
3. Ensure database ID is correct (default: `(default)`)
4. Verify service account has proper permissions

### Permission Denied

**Error**: `Missing or insufficient permissions`

**Solutions**:
1. Verify user is authenticated
2. Check security rules are deployed
3. Ensure `user_id` matches authenticated user
4. Review Firebase Console → Firestore → Rules → Logs
5. Test rules in Rules Playground

### Authentication Errors

**Error**: `Invalid session cookie` or `Token expired`

**Solutions**:
1. Check session cookie is being sent with requests
2. Verify cookie hasn't expired (5-day limit)
3. Ensure service account key is valid
4. Check system clock is synchronized
5. Verify Firebase Admin SDK is initialized correctly

### Index Required

**Error**: `The query requires an index`

**Solutions**:
1. Click the link in error message to create index
2. Or add to `firestore.indexes.json` and deploy
3. Wait for index creation (can take minutes)
4. Retry query after index is enabled

### High Costs

**Issue**: Unexpected Firebase costs

**Solutions**:
1. Monitor reads/writes in Firebase Console
2. Implement caching to reduce repeated queries
3. Use pagination to limit result sets
4. Optimize security rules (avoid `get()` calls)
5. Set up billing alerts
6. Review query patterns for inefficiencies

---

## Related Documentation

- [Authentication Feature](../features/authentication.md)
- [Database Setup](../setup/database-setup.md)
- [Security Architecture](../architecture/security-architecture.md)
- [Environment Variables](../setup/environment-variables.md)

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Pricing](https://firebase.google.com/pricing)

---

**Last Updated**: November 2025  
**Status**: ✅ Production Ready
