# Journal Feature

**Full-featured journaling system with search and voice input**

---

**Last Updated**: November 2025  
**Status**: ✅ Complete

---

## Overview

The Journal feature provides a comprehensive system for creating, managing, and searching personal journal entries. It includes voice input capabilities, real-time sync, and full-text search.

## Key Features

### Entry Management

#### Create Entries
- Title and content fields
- Optional mood field
- Automatic timestamp tracking
- User-specific entry isolation
- Voice input for all fields
- Rich text support ready

#### View Entries
- List view with entry previews
- Detail view with full content
- Sort by creation date (newest first)
- Entry preview truncation
- Pagination support
- Infinite scroll ready

#### Update Entries
- Edit title and content
- Modify mood
- Automatic updated_at timestamp
- Save changes with confirmation
- Cancel editing without saving
- Real-time sync of updates

#### Delete Entries
- Delete with confirmation dialog
- Permanent deletion warning
- Cascade delete handling
- Success feedback
- Error handling

### Search Functionality

#### Full-Text Search
- Search across title and content
- Case-insensitive search
- Real-time search results
- Search as you type
- Clear search functionality
- Result count display

### Voice Input

#### Speech-to-Text
- Voice input for title field
- Voice input for content field
- Voice input for mood field
- ElevenLabs integration
- Visual recording indicators
- Processing feedback
- Auto-append transcription

### Real-time Sync

#### Live Updates
- Firestore real-time subscriptions
- Auto-refresh entry list on changes
- Multi-device sync support
- Optimistic updates
- Conflict resolution

## Architecture

### Database Schema

```typescript
interface JournalEntry {
  id: string
  user_id: string
  title: string
  content: string
  mood?: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Indexes**:
- `user_id + created_at` (DESC)
- `user_id + updated_at` (DESC)

**Security Rules**:
- Users can only read/write their own entries
- Entry ownership verified on all operations

### Components

#### Entry List
- Displays all user entries
- Entry preview cards
- Pagination controls
- Loading states
- Empty state

#### Entry Detail
- Full entry display
- Edit button
- Delete button
- Timestamp display
- Navigation controls

#### Entry Form
- Create/edit form
- Title input with voice
- Content textarea with voice
- Mood input with voice
- Save/cancel buttons
- Validation

#### Voice Input Controls
- Microphone button
- Recording indicator
- Stop recording button
- Processing indicator
- Error handling

### API Endpoints

**GET /journal**
- Get all entries for user
- Query parameters: limit, offset, search
- Returns: Array of entries

**GET /journal/:id**
- Get specific entry
- Returns: Entry object

**POST /journal**
- Create new entry
- Body: Entry data
- Returns: Created entry

**PUT /journal/:id**
- Update entry
- Body: Partial entry data
- Returns: Updated entry

**DELETE /journal/:id**
- Delete entry
- Returns: Success message

**GET /journal/search**
- Search entries
- Query parameters: q (query string)
- Returns: Array of matching entries

## Usage Examples

### Creating an Entry

```typescript
import { apiClient } from '@/lib/api/client'

const entry = await apiClient.createJournalEntry({
  title: 'My First Entry',
  content: 'Today was a great day...',
  mood: 'happy'
})
```

### Searching Entries

```typescript
const results = await apiClient.searchJournalEntries('great day')
```

### Using Voice Input

```typescript
import { useSpeechToText } from '@/lib/hooks/useSpeechToText'

function JournalForm() {
  const { 
    isRecording, 
    isProcessing, 
    transcription, 
    startRecording, 
    stopRecording 
  } = useSpeechToText()

  const handleVoiceInput = async () => {
    if (isRecording) {
      await stopRecording()
      // transcription will be available
    } else {
      await startRecording()
    }
  }

  return (
    <div>
      <textarea value={transcription} />
      <button onClick={handleVoiceInput}>
        {isRecording ? 'Stop' : 'Record'}
      </button>
    </div>
  )
}
```

### Real-time Subscription

```typescript
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

function useJournalEntries(userId: string) {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, 'journal_entries'),
      where('user_id', '==', userId)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setEntries(data)
    })

    return unsubscribe
  }, [userId])

  return entries
}
```

## Features in Detail

### Voice Input Integration

Voice input is powered by ElevenLabs speech-to-text:

**Supported Fields**:
- Title field
- Content field
- Mood field

**Recording Process**:
1. User clicks microphone button
2. Browser requests microphone permission
3. Recording starts (visual indicator)
4. User clicks stop button
5. Audio uploaded to backend
6. ElevenLabs transcribes audio
7. Transcription appended to field

**Audio Format**:
- WebM with Opus codec
- Automatic format selection
- Browser compatibility handling

### Search Implementation

Search uses Firestore queries with text matching:

**Search Scope**:
- Entry titles
- Entry content
- Case-insensitive matching

**Search Features**:
- Real-time results
- Debounced input
- Result highlighting
- Result count

**Performance**:
- Indexed fields for fast queries
- Limit results to prevent overload
- Pagination for large result sets

### Real-time Sync

Real-time sync uses Firestore subscriptions:

**Sync Events**:
- New entry created
- Entry updated
- Entry deleted

**Sync Behavior**:
- Automatic UI updates
- No manual refresh needed
- Multi-device support
- Optimistic updates

## Performance Optimizations

### Pagination
- Load entries in batches
- Infinite scroll support
- Lazy loading
- Reduced initial load time

### Debouncing
- Search input debounced (300ms)
- Prevents excessive API calls
- Improves performance

### Caching
- Entry list cached in memory
- Reduces redundant fetches
- Faster navigation

### Optimistic Updates
- UI updates before server confirmation
- Rollback on error
- Better perceived performance

## Testing

### Manual Testing Checklist

- [ ] Create entry with title and content
- [ ] Create entry with voice input
- [ ] Edit existing entry
- [ ] Delete entry (verify confirmation)
- [ ] Search entries by title
- [ ] Search entries by content
- [ ] View entry detail
- [ ] Navigate between entries
- [ ] Test real-time sync (two devices)
- [ ] Test voice input for title
- [ ] Test voice input for content
- [ ] Test voice input for mood
- [ ] Test with no microphone permission
- [ ] Test with network offline
- [ ] Test with large content (10,000+ characters)

### API Testing

```bash
# Create entry
curl -X POST http://localhost:3001/api/v1/journal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Entry",
    "content": "Test content",
    "mood": "happy"
  }'

# Get entries
curl http://localhost:3001/api/v1/journal \
  -H "Authorization: Bearer $TOKEN"

# Search entries
curl "http://localhost:3001/api/v1/journal/search?q=test" \
  -H "Authorization: Bearer $TOKEN"

# Update entry
curl -X PUT http://localhost:3001/api/v1/journal/$ENTRY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title"
  }'

# Delete entry
curl -X DELETE http://localhost:3001/api/v1/journal/$ENTRY_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Voice input not working

**Symptoms**: Microphone button doesn't start recording

**Possible Causes**:
1. Microphone permission denied
2. Browser doesn't support MediaRecorder
3. HTTPS not enabled (required for microphone)

**Solutions**:
1. Check browser permissions
2. Use supported browser (Chrome, Edge, Firefox, Safari)
3. Enable HTTPS in development

### Entries not syncing

**Symptoms**: Changes don't appear on other devices

**Possible Causes**:
1. Real-time subscription not active
2. Network connectivity issue
3. Firestore rules blocking access

**Solutions**:
1. Check Firestore connection
2. Verify network connectivity
3. Check Firestore security rules
4. Check browser console for errors

### Search not returning results

**Symptoms**: Search returns empty even with matching entries

**Possible Causes**:
1. Search query too specific
2. Case sensitivity issue
3. Index not deployed

**Solutions**:
1. Try broader search terms
2. Verify case-insensitive search
3. Deploy Firestore indexes
4. Check search implementation

## Future Enhancements

### Planned Features

- [ ] Rich text formatting (bold, italic, lists)
- [ ] Image attachments
- [ ] Entry templates
- [ ] Tags and categories
- [ ] Mood tracking with analytics
- [ ] Entry reminders
- [ ] Export to PDF/Markdown
- [ ] Print functionality
- [ ] Archive entries
- [ ] Entry versioning
- [ ] Collaborative entries
- [ ] Entry comments
- [ ] Entry reactions

### Potential Improvements

- [ ] Advanced search with filters
- [ ] Search by date range
- [ ] Search by mood
- [ ] Saved searches
- [ ] Entry statistics
- [ ] Writing streaks
- [ ] Word count tracking
- [ ] Reading time estimates
- [ ] Entry insights
- [ ] AI-powered suggestions

## Related Documentation

- [API Reference](../API_REFERENCE.md#journal)
- [Voice Integration](../integrations/elevenlabs.md)
- [RAG System](./rag-system.md)
- [Database Setup](../setup/database-setup.md)

