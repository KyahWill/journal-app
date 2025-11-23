# User-Visible Content Logs

## Overview
These logs show exactly when and what content the user sees in the UI as chunks arrive.

## Log Format

### When Each Chunk Arrives

```javascript
[useChat] 📝 Chunk received (5 chars), total: 11 chars
[useChat] 👁️ USER SEES: "Hello"
[useChat] 💬 FULL MESSAGE SO FAR: "Hello world"
[useChat] ✨ UI Updated - Message count: 2
```

**Explanation**:
- **📝 Chunk received**: Technical info about the chunk size
- **👁️ USER SEES**: The exact text chunk that just arrived (what's new)
- **💬 FULL MESSAGE SO FAR**: The complete message as it appears to the user
- **✨ UI Updated**: Confirmation that React state was updated

### When React Renders

```javascript
[CoachPage] 🎨 RENDER: Messages updated, count: 2
[CoachPage] 📄 Last message: {
  role: "assistant",
  contentLength: 11,
  contentPreview: "Hello world",
  id: "temp-assistant-1234567890-abc123"
}
```

**Explanation**:
- **🎨 RENDER**: React component re-rendered with new messages
- **📄 Last message**: Details about the most recent message being displayed

## Example Flow

When a user sends "Hello" and receives "Hello! How can I help you today?", you'll see:

```javascript
// User sends message
🚀 [useChat] Sending Message
[useChat] Adding user message: { id: "temp-user-...", content: "Hello" }
[CoachPage] 🎨 RENDER: Messages updated, count: 1
[CoachPage] 📄 Last message: { role: "user", contentLength: 5, contentPreview: "Hello" }

// Stream starts
[useChat] Adding temporary assistant message: { id: "temp-assistant-...", content: "" }
[CoachPage] 🎨 RENDER: Messages updated, count: 2
[CoachPage] 📄 Last message: { role: "assistant", contentLength: 0, contentPreview: "" }

// First chunk arrives
[useChat] 📝 Chunk received (6 chars), total: 6 chars
[useChat] 👁️ USER SEES: "Hello!"
[useChat] 💬 FULL MESSAGE SO FAR: "Hello!"
[useChat] ✨ UI Updated - Message count: 2
[CoachPage] 🎨 RENDER: Messages updated, count: 2
[CoachPage] 📄 Last message: { role: "assistant", contentLength: 6, contentPreview: "Hello!" }

// Second chunk arrives
[useChat] 📝 Chunk received (4 chars), total: 10 chars
[useChat] 👁️ USER SEES: " How"
[useChat] 💬 FULL MESSAGE SO FAR: "Hello! How"
[useChat] ✨ UI Updated - Message count: 2
[CoachPage] 🎨 RENDER: Messages updated, count: 2
[CoachPage] 📄 Last message: { role: "assistant", contentLength: 10, contentPreview: "Hello! How" }

// Third chunk arrives
[useChat] 📝 Chunk received (15 chars), total: 25 chars
[useChat] 👁️ USER SEES: " can I help you"
[useChat] 💬 FULL MESSAGE SO FAR: "Hello! How can I help you"
[useChat] ✨ UI Updated - Message count: 2
[CoachPage] 🎨 RENDER: Messages updated, count: 2
[CoachPage] 📄 Last message: { role: "assistant", contentLength: 25, contentPreview: "Hello! How can I help you" }

// Fourth chunk arrives
[useChat] 📝 Chunk received (7 chars), total: 32 chars
[useChat] 👁️ USER SEES: " today?"
[useChat] 💬 FULL MESSAGE SO FAR: "Hello! How can I help you today?"
[useChat] ✨ UI Updated - Message count: 2
[CoachPage] 🎨 RENDER: Messages updated, count: 2
[CoachPage] 📄 Last message: { role: "assistant", contentLength: 32, contentPreview: "Hello! How can I help you today?" }

// Stream completes
[useChat] ✅ Stream DONE - Final message: { contentLength: 32 }
[useChat] ✔️ State updated, loading=false
[CoachPage] 🎨 RENDER: Messages updated, count: 2
[CoachPage] 📄 Last message: { role: "assistant", contentLength: 32, contentPreview: "Hello! How can I help you today?" }
```

## Key Indicators

### ✅ Everything Working
- **👁️ USER SEES** logs appear for each chunk
- **💬 FULL MESSAGE SO FAR** grows with each chunk
- **🎨 RENDER** happens after each chunk
- Content length increases progressively

### ⚠️ Potential Issues

#### Chunks Received But Not Displayed
```javascript
[useChat] 👁️ USER SEES: "Hello"
[useChat] 💬 FULL MESSAGE SO FAR: "Hello"
[useChat] ✨ UI Updated - Message count: 2
// Missing: [CoachPage] 🎨 RENDER
```
**Problem**: React not re-rendering
**Cause**: State update not triggering render

#### Content Not Accumulating
```javascript
[useChat] 👁️ USER SEES: "Hello"
[useChat] 💬 FULL MESSAGE SO FAR: "Hello"
[useChat] 👁️ USER SEES: " world"
[useChat] 💬 FULL MESSAGE SO FAR: " world"  // Should be "Hello world"
```
**Problem**: Content being replaced instead of appended
**Cause**: Bug in streamedContent accumulation

#### Renders But Content Empty
```javascript
[CoachPage] 🎨 RENDER: Messages updated, count: 2
[CoachPage] 📄 Last message: { contentLength: 0, contentPreview: "" }
```
**Problem**: Message exists but has no content
**Cause**: Message not being updated with chunks

## Filtering Console

To focus on user-visible content only:

1. **See what user sees**: Filter by `👁️ USER SEES`
2. **See full message**: Filter by `💬 FULL MESSAGE`
3. **See renders**: Filter by `🎨 RENDER`
4. **See everything**: Filter by `[CoachPage]` or `[useChat]`

## Performance Monitoring

### Good Performance
- Render happens within ~16ms of chunk arrival (60fps)
- Content accumulates smoothly
- No duplicate renders for same content

### Poor Performance
- Long delay between chunk and render
- Multiple renders for same content
- Renders without content changes

## Debugging Tips

1. **Compare chunk content with rendered content**:
   - Check if `👁️ USER SEES` matches what appears on screen
   - Verify `💬 FULL MESSAGE SO FAR` matches displayed message

2. **Count renders**:
   - Should be ~1 render per chunk
   - Too many renders = performance issue
   - Too few renders = missing updates

3. **Check timing**:
   - Chunk → UI Update → Render should be immediate
   - Delays indicate state update issues

4. **Verify accumulation**:
   - `💬 FULL MESSAGE SO FAR` should grow monotonically
   - Never decrease in length
   - Should match sum of all `👁️ USER SEES` chunks

## Quick Reference

| Log | Meaning | When It Appears |
|-----|---------|----------------|
| 👁️ USER SEES | New chunk content | Every chunk |
| 💬 FULL MESSAGE SO FAR | Complete message | Every chunk |
| ✨ UI Updated | State updated | Every chunk |
| 🎨 RENDER | Component rendered | After state update |
| 📄 Last message | Message details | After render |

## Testing Checklist

- [ ] Send a message
- [ ] See `👁️ USER SEES` for each chunk
- [ ] Verify `💬 FULL MESSAGE SO FAR` accumulates correctly
- [ ] Confirm `🎨 RENDER` happens after each chunk
- [ ] Check displayed content matches logs
- [ ] Verify no duplicate or missing chunks
- [ ] Confirm final message is complete
