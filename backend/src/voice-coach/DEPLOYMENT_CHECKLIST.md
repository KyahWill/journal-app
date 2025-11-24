# Voice AI Coach - Firestore Deployment Checklist

## Pre-Deployment Verification

- [x] Firestore indexes added to `web/firestore.indexes.json`
  - [x] voice_conversations index (user_id, created_at)
  - [x] voice_sessions index (user_id, status, expires_at)

- [x] Security rules added to `web/firestore.rules`
  - [x] voice_conversations collection rules
  - [x] voice_sessions collection rules

- [x] Documentation created
  - [x] FIRESTORE_VOICE_SETUP.md
  - [x] DEPLOYMENT_CHECKLIST.md

## Deployment Steps

### 1. Verify Firebase CLI Setup

```bash
# Check if Firebase CLI is installed
firebase --version

# If not installed, install it
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify you're using the correct project
firebase use
```

### 2. Deploy Firestore Indexes

```bash
# Navigate to web directory
cd web

# Deploy indexes
firebase deploy --only firestore:indexes

# Or use the deployment script
./scripts/deploy-firestore-indexes.sh
```

**Expected Output:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR_PROJECT_ID/overview
```

### 3. Monitor Index Creation

1. Open Firebase Console: https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/indexes
2. Check the status of the new indexes:
   - voice_conversations (user_id, created_at)
   - voice_sessions (user_id, status, expires_at)
3. Wait for indexes to finish building (status: "Enabled")

**Note:** Index creation time depends on existing data:
- Empty collections: ~1-2 minutes
- Small datasets (<1000 docs): ~5-10 minutes
- Large datasets (>10000 docs): ~30+ minutes

### 4. Deploy Security Rules

```bash
# From web directory
firebase deploy --only firestore:rules
```

**Expected Output:**
```
✔ Deploy complete!

Firestore Rules: Released
```

### 5. Verify Deployment

#### Test Security Rules

```bash
# Start Firebase emulator (optional, for local testing)
firebase emulators:start --only firestore

# Run security rule tests (if you have them)
npm run test:firestore-rules
```

#### Test Indexes in Production

1. Navigate to the AI Agent page in your app
2. Start a voice conversation
3. Check browser console for any Firestore errors
4. Verify conversation history loads quickly
5. Check Firebase Console for query performance

### 6. Post-Deployment Verification

- [ ] Indexes show as "Enabled" in Firebase Console
- [ ] Security rules deployed successfully
- [ ] Voice conversations can be created
- [ ] Voice sessions can be created
- [ ] Conversation history loads correctly
- [ ] Users can only access their own data
- [ ] No Firestore errors in application logs

## Rollback Plan

If issues occur after deployment:

### Rollback Security Rules

```bash
# Revert to previous rules version in Firebase Console
# Or redeploy previous version from git
git checkout HEAD~1 web/firestore.rules
firebase deploy --only firestore:rules
```

### Rollback Indexes

```bash
# Remove problematic indexes from firestore.indexes.json
# Redeploy
firebase deploy --only firestore:indexes

# Or delete indexes in Firebase Console
```

## Troubleshooting

### Issue: "Index not found" errors

**Solution:**
1. Check Firebase Console to see if indexes are still building
2. Wait for indexes to complete
3. Verify index configuration matches query patterns

### Issue: "Permission denied" errors

**Solution:**
1. Check security rules in Firebase Console
2. Verify user is authenticated
3. Check that user_id matches auth.uid
4. Review firestore.rules for typos

### Issue: Slow query performance

**Solution:**
1. Check if indexes are being used (Firebase Console > Firestore > Usage)
2. Verify index fields match query fields
3. Consider adding additional indexes for complex queries

## Monitoring

After deployment, monitor:

1. **Firestore Usage**
   - Document reads/writes
   - Index usage
   - Query performance

2. **Error Rates**
   - Permission denied errors
   - Index not found errors
   - Query timeout errors

3. **User Experience**
   - Conversation loading time
   - Session creation success rate
   - Overall voice feature usage

## Additional Resources

- [Firestore Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- Project Documentation: `backend/src/voice-coach/FIRESTORE_VOICE_SETUP.md`

## Support

If you encounter issues:

1. Check Firebase Console for detailed error messages
2. Review application logs for Firestore errors
3. Verify environment variables are set correctly
4. Check that ElevenLabs integration is working
5. Review the FIRESTORE_VOICE_SETUP.md documentation

## Notes

- Always test in a development environment first
- Keep backups of working configurations
- Document any custom changes or modifications
- Monitor performance after deployment
- Plan for data retention and cleanup
