# RAG Indexes Quick Reference

## TL;DR

```bash
# Deploy indexes
npm run rag:deploy-indexes

# Verify indexes
npm run rag:verify-indexes
```

## Required Indexes

### Index 1: User + Content Type + Created Date
```
Collection: embeddings
Fields:
  - user_id (ASC)
  - content_type (ASC)
  - created_at (DESC)
```

**Purpose:** Filter embeddings by user and content type, sorted by date

**Example Query:**
```typescript
db.collection('embeddings')
  .where('user_id', '==', userId)
  .where('content_type', '==', 'journal')
  .orderBy('created_at', 'desc')
```

### Index 2: User + Created Date
```
Collection: embeddings
Fields:
  - user_id (ASC)
  - created_at (DESC)
```

**Purpose:** Retrieve all user embeddings sorted by date

**Example Query:**
```typescript
db.collection('embeddings')
  .where('user_id', '==', userId)
  .orderBy('created_at', 'desc')
```

## Deployment Steps

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Set Active Project**
   ```bash
   firebase use <project-id>
   ```

4. **Deploy Indexes**
   ```bash
   cd backend
   npm run rag:deploy-indexes
   ```

5. **Wait for Index Creation**
   - Index creation takes 5-30 minutes depending on data volume
   - Monitor in Firebase Console

6. **Verify Deployment**
   ```bash
   npm run rag:verify-indexes
   ```

## Troubleshooting

### "Missing index" error
- Wait for indexes to finish building (check Firebase Console)
- Verify index definitions match query structure
- Ensure indexes are in "READY" state

### Deployment fails
- Check Firebase CLI is up to date: `npm install -g firebase-tools@latest`
- Verify you have Owner/Editor permissions
- Try manual deployment: `cd web && firebase deploy --only firestore:indexes`

### Slow queries
- Check if indexes are being used (Firebase Console > Firestore > Usage)
- Verify indexes are in "READY" state
- Consider adding more specific indexes

## Monitoring

**Firebase Console:**
```
https://console.firebase.google.com/project/<project-id>/firestore/indexes
```

**Check Index Status:**
```bash
cd web
firebase firestore:indexes
```

## Cost Considerations

- Each index adds ~100 bytes per document
- 2 index writes per embedding (one per index)
- Indexed queries are faster and cheaper than full scans
- Estimated cost: ~$0.06 per 100K embeddings/month

## Full Documentation

See [INDEXES.md](./INDEXES.md) for complete documentation.
