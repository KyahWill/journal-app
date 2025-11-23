# Streaming Implementation for AI Coach

## Overview

This document describes the streaming implementation for AI Coach messages and insights generation. Streaming provides a better user experience by showing responses as they're generated, rather than waiting for the complete response.

## Architecture

### Backend (NestJS)

#### 1. Gemini Service (`backend/src/gemini/gemini.service.ts`)

Added streaming methods using async generators:

- `sendMessageStream()` - Streams AI coach responses
- `generateInsightsStream()` - Streams journal insights
- `generateGoalInsightsStream()` - Streams goal insights

These methods use the Gemini API's `generateContentStream()` method to receive chunks of text as they're generated.

#### 2. Chat Service (`backend/src/chat/chat.service.ts`)

Added streaming wrapper methods:

- `sendMessageStream()` - Handles session management and streams AI responses
- `generateInsightsStream()` - Streams insights with rate limiting
- `getGoalInsightsStream()` - Streams goal insights with rate limiting

#### 3. Chat Controller (`backend/src/chat/chat.controller.ts`)

Added Server-Sent Events (SSE) endpoints:

- `POST /chat/message/stream` - Stream chat messages
- `GET /chat/insights/stream` - Stream journal insights
- `GET /chat/goal-insights/:goalId/stream` - Stream goal insights

These endpoints use NestJS's `@Sse()` decorator and return `Observable<MessageEvent>` for streaming responses.

### Frontend (Next.js)

#### 1. API Client (`web/lib/api/client.ts`)

Added streaming methods using async generators:

- `sendChatMessageStream()` - Consumes SSE stream for chat messages
- `generateInsightsStream()` - Consumes SSE stream for insights
- `getGoalInsightsStream()` - Consumes SSE stream for goal insights

These methods:
- Handle SSE connection and parsing
- Yield chunks as they arrive
- Support optional callbacks for real-time updates

#### 2. Hooks

**useChat Hook (`web/lib/hooks/useChat.ts`)**
- Updated `sendMessage()` to support streaming (default: enabled)
- Updated `getInsights()` to support streaming (default: enabled)
- Real-time state updates as chunks arrive

**useGoalChat Hook (`web/lib/hooks/useGoalChat.ts`)**
- Updated `getGoalInsights()` to support streaming (default: enabled)
- Supports chunk callbacks for real-time rendering

#### 3. UI (`web/app/app/coach/page.tsx`)

Updated to use streaming:
- Chat messages stream in real-time
- Insights appear progressively
- Goal insights render as they're generated

## Usage

### Sending a Streaming Chat Message

```typescript
// In a component
const { sendMessage } = useChat()

// Streaming is enabled by default
await sendMessage('Tell me about my progress', promptId)

// Disable streaming (fallback to non-streaming)
await sendMessage('Tell me about my progress', promptId, false)
```

### Generating Streaming Insights

```typescript
const { getInsights } = useChat()

// With streaming and custom chunk handler
await getInsights(true, (chunk) => {
  console.log('Received chunk:', chunk)
  // Update UI in real-time
})
```

### Getting Streaming Goal Insights

```typescript
const { getGoalInsights } = useGoalChat()

await getGoalInsights(goalId, true, (chunk) => {
  // Update UI as chunks arrive
  setInsights((prev) => prev + chunk)
})
```

## Benefits

1. **Better UX** - Users see responses immediately instead of waiting
2. **Perceived Performance** - Feels faster even if total time is similar
3. **Progressive Rendering** - Content appears naturally, like a conversation
4. **Graceful Degradation** - Falls back to non-streaming if needed

## Technical Details

### SSE Format

Server-Sent Events use this format:
```
data: {"type": "chunk", "content": "Hello"}

data: {"type": "done", "assistantMessage": {...}}
```

### Error Handling

- Network errors are caught and propagated
- Rate limiting is enforced before streaming starts
- Partial responses are preserved on error

### Rate Limiting

Rate limits are checked before streaming begins to avoid wasting resources on requests that will be rejected.

## Future Improvements

1. Add retry logic for failed streams
2. Implement stream cancellation
3. Add progress indicators for long responses
4. Support multiple concurrent streams
5. Add metrics for stream performance
