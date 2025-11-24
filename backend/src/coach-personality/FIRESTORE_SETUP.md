# Firestore Setup for Coach Personalities

## Collection Structure

### coach_personalities

```
coach_personalities/
  {personalityId}/
    user_id: string
    name: string
    description: string
    style: string
    system_prompt: string
    voice_id?: string
    voice_stability?: number
    voice_similarity_boost?: number
    first_message?: string
    language?: string
    is_default: boolean
    elevenlabs_agent_id?: string
    created_at: Timestamp
    updated_at: Timestamp
```

## Security Rules

Add these rules to your `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check authentication
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Coach Personalities Collection
    match /coach_personalities/{personalityId} {
      // Users can read their own personalities
      allow read: if isAuthenticated() && isOwner(resource.data.user_id);
      
      // Users can create personalities for themselves
      allow create: if isAuthenticated() 
        && isOwner(request.resource.data.user_id)
        && request.resource.data.keys().hasAll([
          'user_id', 
          'name', 
          'description', 
          'style', 
          'system_prompt', 
          'is_default',
          'created_at', 
          'updated_at'
        ])
        && request.resource.data.style in [
          'supportive', 
          'direct', 
          'motivational', 
          'analytical', 
          'empathetic'
        ]
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() <= 100
        && request.resource.data.description is string
        && request.resource.data.description.size() <= 500
        && request.resource.data.system_prompt is string
        && request.resource.data.system_prompt.size() > 0
        && request.resource.data.system_prompt.size() <= 5000
        && request.resource.data.is_default is bool;
      
      // Users can update their own personalities
      allow update: if isAuthenticated() 
        && isOwner(resource.data.user_id)
        && isOwner(request.resource.data.user_id)
        && request.resource.data.user_id == resource.data.user_id;
      
      // Users can delete their own personalities
      allow delete: if isAuthenticated() && isOwner(resource.data.user_id);
    }
  }
}
```

## Composite Indexes

Create these indexes in the Firebase Console or using `firestore.indexes.json`:

### Index 1: Query user's personalities by creation date

```json
{
  "collectionGroup": "coach_personalities",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "user_id",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "created_at",
      "order": "DESCENDING"
    }
  ]
}
```

### Index 2: Query user's default personality

```json
{
  "collectionGroup": "coach_personalities",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "user_id",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "is_default",
      "order": "ASCENDING"
    }
  ]
}
```

## Complete firestore.indexes.json

Add these to your `web/firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "coach_personalities",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "user_id",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "created_at",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "coach_personalities",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "user_id",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "is_default",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## Deployment

### Deploy Security Rules

```bash
cd web
firebase deploy --only firestore:rules
```

### Deploy Indexes

```bash
cd web
firebase deploy --only firestore:indexes
```

### Verify Deployment

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click on "Indexes" tab
4. Verify that the indexes are created and building

## Testing Security Rules

### Using Firebase Emulator

```bash
cd web
firebase emulators:start --only firestore
```

### Test Cases

```javascript
// Test 1: User can create their own personality
const testCreate = {
  user_id: 'test-user-123',
  name: 'Test Coach',
  description: 'A test coach',
  style: 'supportive',
  system_prompt: 'You are a test coach',
  is_default: true,
  created_at: new Date(),
  updated_at: new Date(),
};

// Test 2: User cannot create personality for another user
const testCreateFail = {
  user_id: 'other-user-456',
  name: 'Test Coach',
  // ... other fields
};

// Test 3: User can read their own personalities
// Test 4: User cannot read other users' personalities
// Test 5: User can update their own personalities
// Test 6: User cannot update other users' personalities
// Test 7: User can delete their own personalities
// Test 8: User cannot delete other users' personalities
```

## Migration Script

If you need to migrate existing data or set up default personalities:

```typescript
import { FirebaseService } from '@/firebase/firebase.service';
import { CoachPersonalityService } from './coach-personality.service';

async function migrateExistingUsers() {
  const db = firebaseService.getFirestore();
  
  // Get all unique user IDs from voice_sessions or voice_conversations
  const usersSnapshot = await db
    .collection('voice_sessions')
    .select('user_id')
    .get();
  
  const userIds = new Set(usersSnapshot.docs.map(doc => doc.data().user_id));
  
  // Create default personality for each user
  for (const userId of userIds) {
    const existing = await coachPersonalityService.findAll(userId);
    
    if (existing.length === 0) {
      await coachPersonalityService.create(userId, {
        name: 'Default Coach',
        description: 'Your friendly AI coach',
        style: 'supportive',
        systemPrompt: 'You are a supportive AI coach who helps users achieve their goals...',
        isDefault: true,
      });
      
      console.log(`Created default personality for user: ${userId}`);
    }
  }
}
```

## Monitoring

### Queries to Monitor

1. **Personality Creation Rate**
```javascript
db.collection('coach_personalities')
  .where('created_at', '>', yesterday)
  .get()
```

2. **Users with Multiple Personalities**
```javascript
// Aggregate query to find users with > 1 personality
```

3. **Most Popular Coaching Styles**
```javascript
db.collection('coach_personalities')
  .where('style', '==', 'motivational')
  .get()
```

### Performance Considerations

- Index all queries that filter by `user_id`
- Limit personality count per user (e.g., max 10)
- Cache default personality lookups
- Use batch operations for bulk updates

## Backup and Recovery

### Backup Personalities

```bash
# Export coach_personalities collection
firebase firestore:export gs://your-bucket/backups/coach_personalities
```

### Restore Personalities

```bash
# Import coach_personalities collection
firebase firestore:import gs://your-bucket/backups/coach_personalities
```

## Data Retention

Consider implementing:
- Archive unused personalities after 90 days
- Delete personalities for deleted users
- Backup before major migrations
- Audit log for personality changes
