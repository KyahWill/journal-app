# Streaming Troubleshooting Guide

## Quick Fixes Applied

### 1. Fixed Duplicate Key Error ✅
**Problem**: React warning about duplicate keys `1763887972588`
**Root Cause**: Using `Date.now()` for message IDs caused collisions when messages were created in rapid succession
**Solution**: 
- Changed ID generation to use `temp-user-${timestamp}-${randomSuffix}` format
- Added random suffix to ensure uniqueness
- Updated message key to use `message.id || msg-${index}-${role}` as fallback

**Files Changed**:
- `web/lib/hooks/useChat.ts` - ID generation
- `web/app/app/coach/page.tsx` - Key rendering

### 2. Added Comprehensive Logging ✅
**Purpose**: Track message flow through entire system
**Locations**:
- Frontend: `useChat.ts`, `client.ts`
- Backend: `chat.controller.ts`, `chat.service.ts`, `gemini.service.ts`

### 3. Added Stream Completion Safeguard ✅
**Problem**: Stream could end without 'done' event, leaving loading state stuck
**Solution**: Added fallback in `useChat.ts` to finalize message if stream ends without 'done' event

## How to Debug Streaming Issues

### Step 1: Open Browser Console
Open DevTools (F12) and go to Console tab

### Step 2: Send a Test Message
Type a message in the coach chat and send it

### Step 3: Follow the Log Trail

You should see logs in this order:

```
[useChat] sendMessage called: { content: "...", promptId: "...", useStreaming: true }
[useChat] Adding user message: { id: "temp-user-...", ... }
[useChat] Using streaming API
[useChat] Adding temporary assistant message: { id: "temp-assistant-...", ... }
[apiClient] sendChatMessageStream called: { message: "...", ... }
[apiClient] Fetching: http://localhost:3001/chat/message/stream
[apiClient] Response status: 200 true
[apiClient] Starting to read stream...
[apiClient] Raw chunk received: data: {"type":"session"...
[apiClient] Parsed event: session
[useChat] Received event: session
[useChat] Session info received: { sessionIdFromStream: "...", ... }
[apiClient] Parsed event: chunk Hello
[useChat] Received chunk, total length: 5
[apiClient] Parsed event: chunk  world
[useChat] Received chunk, total length: 11
... (more chunks) ...
[apiClient] Parsed event: done
[useChat] Received event: done
[useChat] Stream complete, final assistant message: { ... }
[useChat] State updated, loading set to false
[apiClient] Stream reading complete
[apiClient] Releasing reader lock
```

### Step 4: Check Backend Logs

In your backend terminal, you should see:

```
[ChatController] sendMessageStream called for user: abc123 message: Hello...
[ChatController] Starting message stream
[ChatService] [sendMessageStream] Starting for user: abc123
[ChatService] [sendMessageStream] Message: Hello..., sessionId: null
[ChatService] [sendMessageStream] Session ready: xyz789
[ChatService] [sendMessageStream] Loaded 15 journal entries
[ChatService] [sendMessageStream] Goal context built
[ChatService] [sendMessageStream] Yielding session info
[ChatController] Sending event type: session
[ChatService] [sendMessageStream] Starting AI stream
[GeminiService] [sendMessageStream] Starting Gemini stream
[GeminiService] [sendMessageStream] Calling Gemini API
[GeminiService] [sendMessageStream] Gemini stream started, processing chunks
[ChatController] Sending event type: chunk
[ChatService] [sendMessageStream] Yielded 10 chunks, total length: 150
... (more chunks) ...
[GeminiService] [sendMessageStream] Gemini stream complete, total chunks: 45
[ChatService] [sendMessageStream] AI stream complete, total chunks: 45, length: 678
[ChatService] [sendMessageStream] Created assistant message with 678 chars
[ChatService] [sendMessageStream] Session updated
[ChatService] [sendMessageStream] Yielding done event
[ChatController] Sending event type: done
[ChatService] [sendMessageStream] Complete for session: xyz789
[ChatController] Stream complete
```

## Common Issues and Solutions

### Issue 1: "Coach is thinking" Never Stops

**Symptoms**:
- Loading spinner shows indefinitely
- No response appears
- Console shows events but no 'done' event

**Check**:
1. Look for errors in console
2. Check if 'done' event is received
3. Verify backend logs show completion

**Solutions**:
- If stream ends without 'done': Safeguard should kick in (check logs)
- If error occurs: Check error message in console
- If backend hangs: Check Gemini API status and rate limits

### Issue 2: Duplicate Key Warnings

**Symptoms**:
- React warning in console about duplicate keys
- Messages might duplicate or disappear

**Check**:
1. Look at message IDs in console logs
2. Check if IDs are unique

**Solution**:
- Already fixed with random suffix in ID generation
- If still occurs, check for other sources of duplicate IDs

### Issue 3: Partial Messages

**Symptoms**:
- Message appears but is incomplete
- Stream stops mid-sentence

**Check**:
1. Look for errors in console or backend logs
2. Check network tab for connection issues
3. Verify Gemini API didn't timeout

**Solutions**:
- Check Gemini API quota and rate limits
- Verify network connection is stable
- Check for backend errors or timeouts

### Issue 4: No Messages Appear

**Symptoms**:
- Loading spinner appears then disappears
- No messages show up
- No errors in console

**Check**:
1. Verify 'session' event is received
2. Check if messages array is updating
3. Look for React rendering issues

**Solutions**:
- Check state updates in useChat hook
- Verify message format matches ChatMessage interface
- Check for key conflicts in rendering

### Issue 5: Messages Appear Out of Order

**Symptoms**:
- User message appears after assistant message
- Messages jump around

**Check**:
1. Look at message IDs and timestamps
2. Check state updates in console

**Solutions**:
- Verify temp messages are replaced correctly
- Check that 'done' event properly replaces temp messages
- Ensure keys are stable and unique

## Testing Checklist

- [ ] Send a simple message ("Hello")
- [ ] Check console for complete log trail
- [ ] Verify loading state changes (true → false)
- [ ] Confirm message appears with correct content
- [ ] Send another message to test session continuity
- [ ] Test error handling (disconnect network mid-stream)
- [ ] Test rapid messages (send multiple quickly)
- [ ] Check for duplicate key warnings
- [ ] Verify messages persist after page refresh

## Performance Monitoring

### Frontend Metrics
- Time from send to first chunk: Should be < 2 seconds
- Chunk frequency: Should be steady stream
- Total time to completion: Varies by response length

### Backend Metrics
- Session lookup: < 100ms
- Journal loading: < 200ms
- Gemini API first chunk: 1-3 seconds
- Total processing: Varies by response length

## Emergency Fixes

### If Streaming Completely Broken
1. Disable streaming temporarily:
```typescript
// In coach page or useChat hook
const useStreaming = false
```

2. This will fall back to non-streaming API
3. User will see complete response at once (slower UX but functional)

### If Backend Logs Show Errors
1. Check Gemini API key is valid
2. Verify rate limits not exceeded
3. Check Firebase connection
4. Restart backend service

### If Frontend Stuck
1. Clear browser cache
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
3. Check for JavaScript errors
4. Verify API_BASE_URL is correct

## Getting Help

When reporting issues, include:
1. Full console logs (frontend)
2. Backend logs for the request
3. Network tab showing the streaming request
4. Steps to reproduce
5. Expected vs actual behavior
