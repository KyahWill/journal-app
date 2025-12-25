# RAG Migration Guide

This guide explains how to use the migration CLI to backfill embeddings for existing content in the RAG system.

## Overview

The migration service generates vector embeddings for all existing user content and stores them in the vector store. This enables semantic search and RAG-enhanced AI responses for historical data.

### Content Types Migrated

| Content Type | Description | What's Embedded |
|--------------|-------------|-----------------|
| Journal Entries | User journal entries | Title + content |
| Goals | User goals | Title + description |
| Milestones | Goal milestones | Milestone title |
| Progress Updates | Goal progress notes | Update content |
| **Chat Messages** | AI Coach conversations | User message + AI response pairs |

## Prerequisites

1. Ensure the backend is properly configured with:
   - Firebase credentials
   - Gemini API key
   - RAG enabled in environment variables

2. Install dependencies:
   ```bash
   cd backend
   pnpm install
   ```

## CLI Commands

**Important:** Use `--` before arguments to pass them to the script (npm requirement).

### Migrate a Single User

To migrate embeddings for a specific user:

```bash
npm run cli -- migrate-embeddings --userId=<user-id>
```

Example:
```bash
npm run cli -- migrate-embeddings --userId=abc123xyz
```

### Migrate All Users

To migrate embeddings for all users in the database:

```bash
npm run cli -- migrate-embeddings --all-users
```

**Warning:** This can take a long time depending on the amount of content. Use the dry-run mode first to estimate the time required.

### Dry Run Mode

To estimate the migration scope without actually creating embeddings:

```bash
npm run cli -- migrate-embeddings --userId=<user-id> --dry-run
```

Or for all users:

```bash
npm run cli -- migrate-embeddings --all-users --dry-run
```

The dry run will show:
- Number of items to migrate per user
- Estimated time to complete
- Breakdown by content type

## Migration Process

The migration service processes content in the following order:

1. **Journal Entries** - Embeds title and content
2. **Goals** - Embeds title and description
3. **Milestones** - Embeds milestone titles
4. **Progress Updates** - Embeds update content
5. **Chat Messages** - Embeds user/assistant message pairs from AI Coach sessions

### Chat Message Processing

Chat messages are processed as conversation pairs (user message + AI response). This preserves conversational context and enables the AI to reference past discussions.

**Document ID Format:** `{session_id}_msg_{index}`

**Text Format:**
```
User: {user's message}

Coach: {AI's response}
```

### Text Truncation

The embedding API has a 10,000 character limit. Long content is automatically truncated:
- Truncates at sentence boundaries (`.`, `?`, `!`, or newline) when possible
- Only truncates at a break point if it's within the last 20% of the text
- Appends `[Content truncated...]` to indicate truncation

### Batch Processing

- Items are processed in batches of 10 to avoid overwhelming the API
- 2-second delay between batches to respect rate limits
- 5-second delay between users when migrating all users

### Progress Monitoring

The migration service provides real-time progress updates:

```
[INFO] Starting content migration for user abc123xyz
[INFO] Found 50 journal entries to migrate
[INFO] Found 10 goals to migrate
[INFO] Found 25 milestones to migrate
[INFO] Found 15 progress updates to migrate
[INFO] Found 34 chat message pairs to migrate from 20 sessions
[INFO] Migration progress: 25/134 items (18.66%) - Est. time remaining: 3m 45s
...
[INFO] Migration complete
```

### Error Handling

- Failed embeddings are logged but don't stop the migration
- Errors are tracked and reported at the end
- Failed items can be retried by running the migration again

## Migration Results

After migration completes, you'll see a summary:

```
Migration Result:
  User ID: abc123xyz
  Total processed: 134
  Successful: 132
  Failed: 2
  Duration: 5m 23s
  Errors:
    - journal doc123: metadata.mood is undefined
    - chat_message session_msg_0: Text length exceeds maximum

Stats:
  journals: 50 processed, 1 failed
  goals: 10 processed, 0 failed
  milestones: 25 processed, 0 failed
  progressUpdates: 15 processed, 0 failed
  chatMessages: 34 processed, 1 failed
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `metadata.mood is undefined` | Journal entry has no mood set | Fixed in latest version - metadata fields are now optional |
| `metadata.personality_id is undefined` | Chat session has no personality | Fixed in latest version - metadata fields are now optional |
| `Text length exceeds maximum` | Content > 10,000 chars | Fixed in latest version - text is now auto-truncated |

## Best Practices

### 1. Start with a Dry Run

Always run a dry run first to understand the scope:

```bash
npm run cli migrate-embeddings --all-users --dry-run
```

### 2. Migrate During Off-Peak Hours

Large migrations can consume significant API quota. Run during off-peak hours to minimize impact.

### 3. Monitor API Usage

Keep an eye on your Gemini API quota during migration:
- Check the Google Cloud Console
- Monitor the logs for rate limit errors

### 4. Migrate in Stages

For large databases, consider migrating users in batches:

```bash
# Migrate user 1
npm run cli -- migrate-embeddings --userId=user1

# Wait and monitor

# Migrate user 2
npm run cli -- migrate-embeddings --userId=user2
```

### 5. Handle Failures

If the migration fails partway through:
- Check the error logs
- Fix any configuration issues
- Re-run the migration (it will skip already-embedded content)

## Troubleshooting

### "RAG is disabled"

Ensure `RAG_ENABLED=true` in your `.env` file.

### "GEMINI_API_KEY not found"

Add your Gemini API key to the `.env` file:
```
GEMINI_API_KEY=your_api_key_here
```

### Rate Limit Errors

If you encounter rate limit errors:
1. Increase the delay between batches in `migration.service.ts`
2. Reduce the batch size
3. Wait and retry later

### Out of Memory Errors

For very large datasets:
1. Migrate users one at a time instead of all at once
2. Increase Node.js memory limit:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run cli migrate-embeddings --all-users
   ```

## Performance Considerations

### Estimated Times

Based on typical API response times:
- ~2 seconds per item (including API call and storage)
- 100 items ≈ 3-4 minutes
- 1000 items ≈ 30-40 minutes
- 10000 items ≈ 5-7 hours

### API Costs

Each embedding generation counts toward your Gemini API quota:
- Check current pricing at https://ai.google.dev/pricing
- Monitor usage in Google Cloud Console
- Consider upgrading your quota for large migrations

## Monitoring

### Log Files

Migration logs are written to the console and can be redirected to a file:

```bash
npm run cli migrate-embeddings --all-users > migration.log 2>&1
```

### Progress Tracking

The service logs progress at multiple levels:
- Overall progress (percentage complete)
- Phase progress (journals, goals, etc.)
- Batch progress (items per batch)
- Individual item success/failure

### Metrics

Key metrics logged during migration:
- Items processed per second
- Success/failure rates
- Estimated time remaining
- API response times

## Post-Migration

After migration completes:

1. **Verify Embeddings**
   - Check the `embeddings` collection in Firestore
   - Verify counts match expected totals

2. **Test RAG Functionality**
   - Send test queries through the chat interface
   - Verify relevant context is retrieved

3. **Monitor Performance**
   - Check semantic search latency
   - Monitor cache hit rates
   - Review similarity scores

## Example Workflow

Complete migration workflow for a production system:

```bash
# 1. Dry run to estimate scope
npm run cli -- migrate-embeddings --all-users --dry-run

# 2. Review the estimates and plan accordingly

# 3. Run migration with logging
npm run cli -- migrate-embeddings --all-users > migration.log 2>&1

# 4. Monitor progress in another terminal
tail -f migration.log

# 5. After completion, review results
grep "Migration Result" migration.log
grep "MIGRATION SUMMARY" migration.log

# 6. Check for errors
grep "ERROR" migration.log

# 7. Verify in Firestore
# - Check embeddings collection
# - Verify document counts
# - Check for chat_message content types
```

## New Content After Migration

After the initial migration, new content is automatically embedded:

- **Journal entries**: Embedded when created/updated
- **Goals**: Embedded when created/updated
- **Milestones**: Embedded when created/updated
- **Progress updates**: Embedded when created
- **Chat messages**: Embedded after each AI Coach conversation (async, non-blocking)

No additional migration is needed for new content.

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Review the troubleshooting section above
3. Consult the main RAG documentation in `backend/src/rag/README.md`
