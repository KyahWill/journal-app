# Firebase Vector Search Integration

**Vector search capabilities for semantic search**

---

**Last Updated**: December 2025  
**Status**: ✅ Production Ready (RAG Feature)

---

## Table of Contents

- [Overview](#overview)
- [Services Used](#services-used)
- [Setup](#setup)
- [Vector Search](#vector-search)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

Firebase provides vector search capabilities for the Journal application's RAG (Retrieval-Augmented Generation) feature. It enables semantic search across journal entries, goals, and other content using vector embeddings stored in Firestore.

**Key Features**:
- Firestore database with vector search support
- Vector similarity search
- Efficient indexing for fast queries
- Real-time subscriptions
- Security rules for data protection
- RESTful API

**Use Case**: RAG system for semantic search and context retrieval

---

## Services Used

### Firestore Database

**Purpose**: Store vector embeddings and metadata for semantic search

**Features**:
- NoSQL document database
- Real-time synchronization
- Automatic scaling
- Complex queries and filtering
- JSON-like document structure
- Full-text search capabilities

### Vector Search

**Purpose**: Vector similarity search for RAG

**Features**:
- Store vector embeddings (up to 2048 dimensions)
- Cosine similarity search
- Euclidean distance search
- Efficient indexing for fast queries
- Integration with Firestore collections

### Firebase Client SDK

**Purpose**: JavaScript client for database operations

**Features**:
- Type-safe queries
- Real-time subscriptions
- Authentication integration
- Automatic connection management

---

## Setup

### 1. Enable Firestore

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. Click "Create database"
5. Choose production mode
6. Select a location closest to your users
7. Click "Enable"

### 2. Create Database Schema

Create collections in Firestore:

**Collection**: `rag_embeddings`

**Document Structure**:
```json
{
  "id": "auto-generated-id",
  "userId": "user-firebase-uid",
  "contentType": "journal_entry | goal | milestone | progress_update",
  "contentId": "reference-to-source-document",
  "contentText": "original text content",
  "embedding": [0.123, -0.456, ...], // 768-dimensional array
  "metadata": {
    "category": "optional-category",
    "date": "2025-12-01T00:00:00Z",
    "tags": ["tag1", "tag2"]
  },
  "createdAt": "2025-12-01T00:00:00Z",
  "updatedAt": "2025-12-01T00:00:00Z"
}
```

### 3. Create Indexes

Create composite indexes in Firestore:

1. Go to **Firestore Database** → **Indexes**
2. Click "Create Index"
3. Create the following indexes:

**Index 1**: User + Content Type
- Collection: `rag_embeddings`
- Fields: `userId` (Ascending), `contentType` (Ascending)
- Query scope: Collection

**Index 2**: User + Created At
- Collection: `rag_embeddings`
- Fields: `userId` (Ascending), `createdAt` (Descending)
- Query scope: Collection

### 4. Set Security Rules

Configure Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // RAG embeddings - users can only access their own
    match /rag_embeddings/{embeddingId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 5. Configure Environment Variables

**Backend API** (`.env`):
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# RAG Configuration
RAG_ENABLED=true
RAG_EMBEDDING_MODEL=text-embedding-004
RAG_EMBEDDING_DIMENSIONS=768
RAG_SIMILARITY_THRESHOLD=0.7
RAG_MAX_RETRIEVED_DOCS=5
```

---

## Vector Search

### How It Works

1. **Content Ingestion**:
   - User creates journal entry, goal, or milestone
   - Backend generates embedding using Gemini API
   - Embedding stored in Firestore with metadata

2. **Semantic Search**:
   - User sends chat message
   - Backend generates query embedding
   - Firebase finds similar embeddings using cosine similarity
   - Relevant content returned to enhance AI response

3. **Context Enhancement**:
   - Retrieved content added to AI prompt
   - AI generates response with relevant context
   - User gets personalized, context-aware coaching

### Vector Dimensions

The application uses **768-dimensional vectors** from Google's `text-embedding-004` model:

- **Dimensions**: 768
- **Model**: text-embedding-004
- **Provider**: Google Gemini API
- **Quality**: High-quality semantic embeddings
- **Performance**: Optimized for similarity search

### Similarity Search

**Cosine Similarity**:
- Measures angle between vectors
- Range: -1 (opposite) to 1 (identical)
- Threshold: 0.7 (configurable)
- Best for semantic similarity

**Implementation**:
The similarity search is performed by:
1. Fetching all embeddings for the user
2. Computing cosine similarity in-memory
3. Filtering by threshold
4. Sorting by similarity score
5. Returning top N results

---

## Configuration

### Database Schema

**rag_embeddings Collection**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID (auto-generated) |
| `userId` | string | Owner user ID (from Firebase Auth) |
| `contentType` | string | Type: journal_entry, goal, milestone, progress_update |
| `contentId` | string | Reference to source document |
| `contentText` | string | Original text content |
| `embedding` | number[] | 768-dimensional embedding array |
| `metadata` | object | Additional metadata (category, date, etc.) |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

### Indexes

1. **User ID + Content Type**: Fast filtering by user and type
2. **User ID + Created At**: Chronological queries
3. **Single field indexes**: Automatic for userId, contentType, contentId

### Security Rules

**Rules**:
- Users can only access their own embeddings
- Enforced at database level
- Authentication required for all operations
- Create operations validate userId matches auth.uid

---

## Usage Examples

### Initialize Firebase Client

**Backend Service** (`backend/src/rag/vector-store.service.ts`):
```typescript
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

@Injectable()
export class VectorStoreService {
  private db: Firestore
  
  constructor(private configService: ConfigService) {
    const app = initializeApp({
      credential: cert({
        projectId: this.configService.get('FIREBASE_PROJECT_ID'),
        clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
        privateKey: this.configService.get('FIREBASE_PRIVATE_KEY'),
      }),
    })
    
    this.db = getFirestore(app)
  }
}
```

### Store Embedding

```typescript
async storeEmbedding(
  userId: string,
  contentType: string,
  contentId: string,
  contentText: string,
  embedding: number[],
  metadata: any = {}
): Promise<void> {
  const embeddingDoc = {
    userId,
    contentType,
    contentId,
    contentText,
    embedding,
    metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  await this.db.collection('rag_embeddings').add(embeddingDoc)
}
```

### Search Similar Content

```typescript
async searchSimilar(
  userId: string,
  queryEmbedding: number[],
  limit: number = 5,
  threshold: number = 0.7
): Promise<any[]> {
  // Fetch all user embeddings
  const snapshot = await this.db
    .collection('rag_embeddings')
    .where('userId', '==', userId)
    .get()
  
  // Calculate similarities
  const results = []
  snapshot.forEach(doc => {
    const data = doc.data()
    const similarity = this.cosineSimilarity(queryEmbedding, data.embedding)
    
    if (similarity >= threshold) {
      results.push({
        id: doc.id,
        contentText: data.contentText,
        contentType: data.contentType,
        contentId: data.contentId,
        metadata: data.metadata,
        similarity,
      })
    }
  })
  
  // Sort by similarity and limit
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}

private cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
```

### Delete Embeddings

```typescript
async deleteEmbedding(userId: string, contentId: string): Promise<void> {
  const snapshot = await this.db
    .collection('rag_embeddings')
    .where('userId', '==', userId)
    .where('contentId', '==', contentId)
    .get()
  
  const batch = this.db.batch()
  snapshot.forEach(doc => batch.delete(doc.ref))
  await batch.commit()
}
```

### Update Embedding

```typescript
async updateEmbedding(
  userId: string,
  contentId: string,
  contentText: string,
  embedding: number[]
): Promise<void> {
  const snapshot = await this.db
    .collection('rag_embeddings')
    .where('userId', '==', userId)
    .where('contentId', '==', contentId)
    .get()
  
  if (snapshot.empty) {
    throw new Error('Embedding not found')
  }
  
  const doc = snapshot.docs[0]
  await doc.ref.update({
    contentText,
    embedding,
    updatedAt: new Date(),
  })
}
```

---

## Best Practices

### Performance

1. **Use composite indexes** for common query patterns
2. **Batch operations** when possible
3. **Set appropriate similarity threshold** (0.6-0.8)
4. **Limit result count** (3-10 documents)
5. **Cache embeddings** to avoid regeneration
6. **Monitor query performance** in Firebase Console

### Security

1. **Use Firebase Admin SDK** on backend only
2. **Enforce security rules** for data protection
3. **Validate userId** matches authenticated user
4. **Sanitize content** before storing
5. **Monitor access logs** in Firebase Console
6. **Use service account** with minimal permissions

### Cost Optimization

1. **Delete old embeddings** periodically
2. **Use appropriate vector dimensions** (768 is good balance)
3. **Implement caching** to reduce queries
4. **Monitor database size** in Firebase Console
5. **Set up billing alerts**
6. **Optimize query patterns** to reduce reads

### Data Quality

1. **Clean text** before generating embeddings
2. **Include relevant metadata** for filtering
3. **Update embeddings** when content changes
4. **Delete embeddings** when content is deleted
5. **Validate embedding dimensions** match model
6. **Handle errors gracefully**

---

## Troubleshooting

### Connection Errors

**Error**: `Failed to connect to Firebase`

**Solutions**:
1. Verify Firebase credentials are correct
2. Check service account has proper permissions
3. Ensure Firestore is enabled in project
4. Check network connectivity
5. Verify project ID is correct

### Vector Dimension Mismatch

**Error**: `Vector dimension mismatch`

**Solutions**:
1. Verify embedding model outputs 768 dimensions
2. Check `RAG_EMBEDDING_DIMENSIONS=768` in config
3. Ensure all embeddings use same dimensions
4. Regenerate embeddings if dimension changed
5. Validate embedding array length before storing

### Slow Queries

**Issue**: Vector search is slow

**Solutions**:
1. Verify composite indexes are created
2. Reduce result limit
3. Increase similarity threshold
4. Monitor database performance in Console
5. Consider implementing server-side caching
6. Optimize query patterns

### Permission Errors

**Error**: `Permission denied`

**Solutions**:
1. Verify security rules are correct
2. Check user is authenticated
3. Ensure `userId` matches authenticated user
4. Test rules in Firebase Console
5. Verify service account permissions

### High Costs

**Issue**: Unexpected Firebase costs

**Solutions**:
1. Monitor database size in Console
2. Delete old/unused embeddings
3. Implement data retention policy
4. Optimize query patterns to reduce reads
5. Set up billing alerts
6. Review usage reports regularly

---

## Related Documentation

- [RAG System Feature](../features/rag-system.md)
- [Backend Architecture](../architecture/backend-architecture.md)
- [Environment Variables](../setup/environment-variables.md)
- [Gemini Integration](gemini.md) (for embeddings)

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Vector Search Best Practices](https://firebase.google.com/docs/firestore/solutions/search)
- [Firebase Pricing](https://firebase.google.com/pricing)

---

**Last Updated**: December 2025  
**Status**: ✅ Production Ready (RAG Feature)
