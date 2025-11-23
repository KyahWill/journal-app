# SSE Console Logs Guide

## Overview
The frontend now has comprehensive logging for all Server-Sent Events (SSE). This guide explains how to read and interpret these logs.

## How to View Logs

1. Open your browser's Developer Tools (F12 or Cmd+Option+I)
2. Go to the **Console** tab
3. Navigate to the Coach page
4. Send a message
5. Watch the logs appear in real-time

## Log Structure

The logs are organized in collapsible groups for easy navigation:

```
🚀 [useChat] Sending Message
  └─ 📡 [useChat] Processing SSE Stream
      └─ [apiClient] ========== STARTING SSE STREAM ==========
          └─ Multiple SSE events...
          └─ [apiClient] ========== STREAM COMPLETE ==========
```

## Reading the Logs

### 1. Message Initiation
```javascript
🚀 [useChat] Sending Message
  [useChat] sendMessage called: { content: "Hello", promptId: "...", useStreaming: true }
  [useChat] Adding user message: { id: "temp-user-...", ... }
  [useChat] Using streaming API
  [useChat] Adding temporary assistant message: { id: "temp-assistant-...", ... }
```

**What this means**: The user clicked send, and the system is preparing to stream the response.

### 2. API Client Connection
```javascript
[apiClient] sendChatMessageStream called: { message: "Hello", ... }
[apiClient] Fetching: http://localhost:3001/chat/message/stream
[apiClient] Response status: 200 true
```

**What this means**: The HTTP request was sent and the server responded successfully.

### 3. SSE Stream Start
```javascript
[apiClient] ========== STARTING SSE STREAM ==========
[apiClient] 📦 Raw SSE data (123 bytes): data: {"type":"session",...}

[apiClient] Split into 3 lines
[apiClient] Line 0: "data: {"type":"session",...}"
[apiClient] Line 1: ""
[apiClient] Line 2: ""
```

**What this means**: The stream has started, and we're receiving raw SSE data from the server.

### 4. Session Event
```javascript
[apiClient] 🔍 Found SSE data line: {"type":"session","sessionId":"abc123",...}
[apiClient] ✅ SSE Event #1: {
  type: "session",
  hasContent: false,
  hasSessionId: true,
  sessionId: "abc123",
  hasUserMessage: true,
  hasUsageInfo: true,
  fullEvent: {...}
}
[apiClient] 🎯 Session event: {
  sessionId: "abc123",
  userMessage: {...},
  usageInfo: {...}
}
```

**What this means**: The server sent session metadata (session ID, user message confirmation, usage limits).

### 5. Chunk Events (AI Response Streaming)
```javascript
[apiClient] ✅ SSE Event #2: {
  type: "chunk",
  hasContent: true,
  contentLength: 5,
  contentPreview: "Hello",
  fullEvent: {...}
}
[apiClient] 📝 Chunk #1: "Hello"
[useChat] 📝 Chunk received (5 chars), total: 5 chars

[apiClient] ✅ SSE Event #3: {
  type: "chunk",
  contentLength: 6,
  contentPreview: " world",
  ...
}
[apiClient] 📝 Chunk #2: " world"
[useChat] 📝 Chunk received (6 chars), total: 11 chars
```

**What this means**: The AI is generating the response in real-time. Each chunk is a piece of text that gets appended to the message.

**Key Metrics**:
- **Chunk count**: How many pieces the response was split into
- **Total chars**: Running total of characters received
- **Content preview**: First 100 characters of each chunk

### 6. Done Event
```javascript
[apiClient] ✅ SSE Event #45: {
  type: "done",
  hasAssistantMessage: true,
  fullEvent: {...}
}
[apiClient] ✔️ Done event: {
  assistantMessage: {...},
  messageLength: 678
}
[useChat] 📨 Event received: done
[useChat] ✅ Stream DONE - Final message: {
  messageId: "abc-123",
  contentLength: 678,
  contentPreview: "Hello world! Here's my response..."
}
[useChat] ✔️ State updated, loading=false
```

**What this means**: The AI has finished generating the response. The complete message is saved and the loading state is cleared.

### 7. Stream Complete
```javascript
[apiClient] ========== STREAM COMPLETE ==========
[apiClient] Total events received: 45
[apiClient] Total chunks received: 43
[apiClient] 🔒 Releasing reader lock
```

**What this means**: The stream has ended successfully. Summary shows total events and chunks.

## Event Types Explained

### Session Event
- **When**: First event in every stream
- **Contains**: Session ID, user message, usage info
- **Purpose**: Establish session context

### Chunk Event
- **When**: Multiple times during AI generation
- **Contains**: Partial text content
- **Purpose**: Stream response in real-time

### Done Event
- **When**: Last event in stream
- **Contains**: Complete assistant message
- **Purpose**: Finalize the conversation

## Troubleshooting with Logs

### Problem: "Coach is thinking" stuck

**Look for**:
```javascript
[apiClient] ========== STREAM COMPLETE ==========
Total events received: X
Total chunks received: Y
```

**If you see this**: Stream completed successfully
**If you DON'T see this**: Stream was interrupted

**Then check**:
```javascript
[useChat] ✅ Stream DONE - Final message: {...}
[useChat] ✔️ State updated, loading=false
```

**If you see this**: State was updated correctly
**If you DON'T see this**: State update failed (bug in useChat hook)

### Problem: Partial or missing response

**Look for**:
```javascript
[apiClient] Total chunks received: X
```

**If X = 0**: No chunks received (backend issue)
**If X > 0 but response incomplete**: Stream interrupted

**Then check**:
```javascript
[useChat] 📝 Chunk received (N chars), total: M chars
```

**Compare M with final message length**: Should match

### Problem: Duplicate key warnings

**Look for**:
```javascript
[useChat] Adding user message: { id: "temp-user-1234567890-abc123", ... }
[useChat] Adding temporary assistant message: { id: "temp-assistant-1234567890-abc123", ... }
```

**Check**: IDs should be unique with random suffix
**If IDs are identical**: Bug in ID generation

### Problem: Network errors

**Look for**:
```javascript
[apiClient] Response status: 500 false
[apiClient] ❌ Error response: {...}
```

**Or**:
```javascript
[useChat] ❌ ERROR: Failed to send message
```

**Check error details** for specific issue (auth, rate limit, server error)

## Performance Metrics

### Good Performance
- First chunk arrives: < 2 seconds
- Chunks arrive: Steady stream (multiple per second)
- Total time: Varies by response length
- Events/chunks ratio: ~1:1 (plus 2 for session and done)

### Example of Good Stream
```
Total events: 47
Total chunks: 45
Time: ~5 seconds
Chunk frequency: ~9 chunks/second
```

### Poor Performance
- First chunk arrives: > 5 seconds
- Chunks arrive: Sporadic or delayed
- Stream hangs mid-response

## Log Filtering

To focus on specific parts, use browser console filters:

- **All SSE events**: `[apiClient] ✅ SSE Event`
- **Only chunks**: `[apiClient] 📝 Chunk`
- **State updates**: `[useChat]`
- **Errors only**: `❌` or `ERROR`
- **Summary only**: `STREAM COMPLETE`

## Advanced Debugging

### Enable Verbose Mode
All logs are already enabled. To see even more detail, check the `fullEvent` objects in the console.

### Network Tab
1. Open DevTools → Network tab
2. Filter by "stream"
3. Click on the request
4. View "EventStream" tab to see raw SSE data

### Compare Frontend vs Backend
- Frontend logs show what was received
- Backend logs show what was sent
- Compare to find where data is lost

## Common Log Patterns

### Successful Stream
```
🚀 Sending Message
  → 📡 Processing SSE Stream
    → ========== STARTING SSE STREAM ==========
    → ✅ SSE Event #1: session
    → ✅ SSE Event #2-44: chunk (x43)
    → ✅ SSE Event #45: done
    → ========== STREAM COMPLETE ==========
  → ✔️ State updated, loading=false
```

### Stream Without Done Event
```
🚀 Sending Message
  → 📡 Processing SSE Stream
    → ========== STARTING SSE STREAM ==========
    → ✅ SSE Event #1: session
    → ✅ SSE Event #2-44: chunk (x43)
    → ========== STREAM COMPLETE ==========
  → ⚠️ Stream ended WITHOUT done event!
  → Finalizing with streamed content
```

### Failed Stream
```
🚀 Sending Message
  → 📡 Processing SSE Stream
    → ========== STARTING SSE STREAM ==========
    → ❌ Error response: {...}
  → ❌ ERROR: Failed to send message
```

## Tips

1. **Use console groups**: Click the arrows to collapse/expand sections
2. **Copy logs**: Right-click → "Save as..." to save logs for debugging
3. **Clear between tests**: Click "Clear console" (🚫) before each test
4. **Watch in real-time**: Keep console open while sending messages
5. **Compare sessions**: Send multiple messages and compare log patterns
