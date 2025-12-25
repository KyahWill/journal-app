# RAG Firestore Indexes Documentation

This document describes the Firestore indexes required for the RAG (Retrieval-Augmented Generation) system's embeddings collection.

## Overview

The RAG system stores vector embeddings in a Firestore collection called `embeddings`. To enable efficient queries for semantic search and context retrieval, specific composite indexes are required.

## Collection Structure

### `embeddings` Collection

The embeddings collection stores vector representations of user content with the following schema:

```typescript
{
  id: string                        // Auto-generated document ID
  user_id: string                   // User who owns this embedding
  content_type: string              // Type: 'journal', 'goal', 'milestone', 'progress_update', 'chat_message'
  document_id: string               // ID of the source document
  embedding: number[]               // Vector embedding (768 dimensions)
  text_snippet: string              // First 500 characters of original text
  metadata: object                  // Content-specific metadata
  created_at: Timestamp             // When embedding was created
  updated_at: Timestamp             // When embedding was last updated
}
```

### Content Type: `chat_message`

Chat messages are stored as conversation pairs (user question + AI response) to preserve context. The document ID format is `{session_id}_msg_{index}`.

**Metadata Structure:**
```typescript
{
  session_id: string               // ID of the chat session
  session_title: string            // Title of the chat session (if set)
  personality_id: string           // Coach personality used for the response
  user_message_id: string          // ID of the user message
  assistant_message_id: string     // ID of the assistant response
  timestamp: string                // ISO timestamp of the conversation
}
```

**Text Format:**
```
User: {user's message content}

Coach: {AI assistant's response}
```

## Required Indexes

### 1. User + Content Type + Created Date Index

**Purpose:** Enable efficient filtering by user and content type with chronological ordering.

**Fields:**
- `user_id` (Ascending)
- `content_type` (Ascending)
- `created_at` (Descending)

**Use Cases:**
- Retrieve all journal embeddings for a user, sorted by date
- Fetch goal embeddings for semantic search
- Filter embeddings by specific content types during RAG retrieval
- Search past chat conversations for relevant context

**Example Query:**
```typescript
firestore
  .collection('embeddings')
  .where('user_id', '==', userId)
  .where('content_type', '==', 'journal')
  .orderBy('created_at', 'desc')
  .get()
```

### 2. User + Created Date Index

**Purpose:** Enable efficient retrieval of all user embeddings sorted chronologically.

**Fields:**
- `user_id` (Ascending)
- `created_at` (Descending)

**Use Cases:**
- Fetch all embeddings for a user for semantic search
- Retrieve recent embeddings for context prioritization
- Support migration and backfill operations

**Example Query:**
```typescript
firestore
  .collection('embeddings')
  .where('user_id', '==', userId)
  .orderBy('created_at', 'desc')
  .get()
```

## Performance Considerations

### Query Optimization

1. **User Isolation:** All queries are filtered by `user_id` first to ensure data privacy and leverage indexes effectively.

2. **Content Type Filtering:** When specific content types are needed (e.g., only journals), the first index is used for optimal performance.

3. **Chronological Ordering:** Both indexes support descending order by `created_at`, enabling efficient retrieval of recent content.

### Index Size and Cost

- **Storage:** Each index entry adds minimal storage overhead (~100 bytes per document)
- **Write Cost:** Each embedding write incurs index update costs (2 index writes per document)
- **Read Cost:** Indexed queries are significantly faster and more cost-effective than full collection scans

### Scalability

The indexes are designed to scale with user growth:

- **Per-User Partitioning:** Queries are scoped to individual users, preventing performance degradation as total embeddings grow
- **Efficient Pagination:** Indexes support cursor-based pagination for users with large embedding collections
- **Cache-Friendly:** The index structure aligns with the VectorStoreService's caching strategy

## Deployment

### Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Authenticated with Firebase: `firebase login`
3. Active Firebase project: `firebase use <project-id>`

### Deploy Indexes

#### Option 1: Deploy All Indexes (Recommended)

Deploy all Firestore indexes including RAG indexes:

```bash
cd web
./scripts/deploy-firestore-indexes.sh
```

#### Option 2: Deploy RAG Indexes Only

Deploy only the RAG-specific indexes:

```bash
cd backend
./scripts/deploy-rag-indexes.sh
```

#### Option 3: Manual Deployment

```bash
cd web
firebase deploy --only firestore:indexes
```

### Verify Deployment

Check if indexes are created and ready:

```bash
cd backend
./scripts/verify-rag-indexes.sh
```

Or check manually:

```bash
cd web
firebase firestore:indexes
```

### Monitor Progress

Index creation can take several minutes to hours depending on existing data volume. Monitor progress in the Firebase Console:

```
https://console.firebase.google.com/project/<project-id>/firestore/indexes
```

## Index Configuration File

Indexes are defined in `web/firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "embeddings",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "user_id",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "content_type",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "created_at",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "embeddings",
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
  ]
}
```

## Troubleshooting

### Index Creation Failed

**Symptoms:**
- Deployment command fails with error
- Indexes show "ERROR" status in console

**Solutions:**
1. Verify you have Owner or Editor role in Firebase project
2. Check for conflicting index definitions
3. Ensure field names match exactly (case-sensitive)
4. Try deleting failed indexes and redeploying

### Queries Not Using Indexes

**Symptoms:**
- Slow query performance
- "Missing index" errors in logs

**Solutions:**
1. Verify indexes are in "READY" state (not "CREATING")
2. Check query structure matches index definition exactly
3. Ensure field order in query matches index order
4. Review Firebase Console for suggested indexes

### Index Building Takes Too Long

**Symptoms:**
- Indexes stuck in "CREATING" state for hours

**Solutions:**
1. This is normal for large collections (>10,000 documents)
2. Check Firebase Console for estimated completion time
3. Indexes build in background; system remains operational
4. Contact Firebase support if stuck for >24 hours

### High Index Write Costs

**Symptoms:**
- Unexpected Firebase billing increases
- High write operation counts

**Solutions:**
1. Review embedding generation frequency
2. Implement batching for bulk operations
3. Consider index necessity for your use case
4. Monitor with Firebase usage dashboard

## Maintenance

### Regular Tasks

1. **Monitor Index Health:** Check Firebase Console weekly for index status
2. **Review Query Performance:** Analyze slow queries and optimize indexes
3. **Clean Up Orphaned Embeddings:** Run cleanup jobs to remove embeddings for deleted documents
4. **Audit Index Usage:** Remove unused indexes to reduce costs

### Index Updates

When modifying index definitions:

1. Update `web/firestore.indexes.json`
2. Deploy changes: `firebase deploy --only firestore:indexes`
3. Old indexes are automatically removed
4. New indexes are built in background
5. Verify deployment with verification script

## Security Considerations

### Data Isolation

All queries MUST filter by `user_id` to ensure:
- Users can only access their own embeddings
- No cross-user data leakage
- Compliance with privacy requirements

### Index Security

Indexes themselves don't expose data, but:
- Index definitions are visible in Firebase Console
- Field names and structure are revealed
- Ensure no sensitive data in field names

## Future Enhancements

### Potential Additional Indexes

1. **Document ID Index:**
   - Fields: `user_id` + `document_id`
   - Use case: Fast lookup of embeddings by source document

2. **Metadata Indexes:**
   - Fields: `user_id` + `metadata.category` + `created_at`
   - Use case: Filter embeddings by goal category or journal mood

3. **Update Timestamp Index:**
   - Fields: `user_id` + `updated_at`
   - Use case: Find recently updated embeddings for cache invalidation

### Migration to Vector Database

For improved performance at scale, consider migrating to a dedicated vector database:

- **Pinecone:** Managed vector database with built-in similarity search
- **Weaviate:** Open-source vector database with GraphQL API
- **Qdrant:** High-performance vector search engine
- **Milvus:** Scalable vector database for production workloads

These solutions offer:
- Native vector similarity search (no in-memory calculation)
- Approximate Nearest Neighbor (ANN) algorithms
- Better performance for large datasets (>100K embeddings)
- Advanced filtering and hybrid search capabilities

## References

- [Firestore Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Composite Index Best Practices](https://firebase.google.com/docs/firestore/query-data/index-overview)
- [RAG System Design](./design.md)
- [Vector Store Service](./vector-store.service.ts)

## Support

For issues or questions:

1. Check Firebase Console for index status
2. Review application logs for query errors
3. Consult Firebase documentation
4. Contact development team for assistance
