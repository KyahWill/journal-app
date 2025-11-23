# Chat Streaming Architecture

## Overview
The chat system uses Server-Sent Events (SSE) to stream AI responses in real-time, providing a better user experience by showing responses as they're generated rather than waiting for the complete response.

## Architecture Flow

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│   React     │      │  API Client  │      │   NestJS    │      │   Gemini AI  │
│  Component  │─────▶│  (Frontend)  │─────▶│  Backend    │─────▶│   Service    │
│ (page.tsx)  │      │ (client.ts)  │      │(controller) │      │(gemini.svc)  │
└─────────────┘      └──────────────┘      └─────────────┘      └──────────────┘
      │                     │                      │                     │
      │  1. sendMessage()   │                      │                     │
      ├────────────────────▶│                      │                     │
      │                     │  2. POST /stream     │                     │
      │                     ├─────────────────────▶│                     │
      │                     │                      │  3. Generate stream │
      │                     │                      ├────────────────────▶│
      │                     │                      │                     │
      │                     │  4. SSE: session     │◀────────────────────┤
      │  5. Update state    │◀─────────────────────┤                     │
      │◀────────────────────┤                      │                     │
      │                     │                      │                     │
      │                     │  6. SSE: chunk       │◀────────────────────┤
      │  7. Update UI       │◀─────────────────────┤                     │
      │◀────────────────────┤                      │                     │
      │                     │  (repeat chunks...)  │                     │
      │                     │                      │                     │
      │                     │  8. SSE: done        │                     │
      │  9. Finalize        │◀─────────────────────┤                     │
      │◀────────────────────┤                      │                     │
      │ 10. loading=false   │                      │                     │
```

## Component Breakdown

### 1. Frontend Component (`web/app/app/coach/page.tsx`)
**Responsibility**: User interface and interaction handling

**Key Actions**:
- User types message and clicks send
- Calls `sendMessage()` from useChat hook
- Displays messages with loading states
- Shows "Coach is thinking..." while `loading === true`

**State Management**:
```typescript
{
  messages: ChatMessage[],  // All messages in conversation
  loading: boolean,          // True while waiting for response
  error: string | null       // Error messages
}
```

### 2. useChat Hook (`web/lib/hooks/useChat.ts`)
**Responsibility**: Chat state management and API coordination

**Message Flow**:
1. **Initiate**: Set `loading = true`
2. **Add User Message**: Create temporary user message with unique ID
3. **Add Assistant Placeholder**: Create empty assistant message for streaming
4. **Stream Events**: Process events from API client
   - `session`: Store session ID and user message
   - `chunk`: Append to assistant message content
   - `done`: Replace temp messages with final versions, set `loading = false`
5. **Error Handling**: Remove temp messages, set `loading = false`

**Critical**: Must always set `loading = false` when done or on error!

### 3. API Client (`web/lib/api/client.ts`)
**Responsibility**: HTTP communication and SSE parsing

**Streaming Process**:
```typescript
async *sendChatMessageStream() {
  // 1. Send POST request with message
  const response = await fetch('/chat/message/stream', {
    method: 'POST',
    body: JSON.stringify({ message, sessionId, promptId })
  })
  
  // 2. Read response body as stream
  const reader = response.body.getReader()
  
  // 3. Parse SSE format
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    // 4. Decode and parse each line
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        yield data  // Emit event to caller
      }
    }
  }
}
```

**SSE Format**:
```
data: {"type":"session","sessionId":"abc123","userMessage":{...}}

data: {"type":"chunk","content":"Hello"}

data: {"type":"chunk","content":" world"}

data: {"type":"done","assistantMessage":{...}}

```

### 4. Backend Controller (`backend/src/chat/chat.controller.ts`)
**Responsibility**: HTTP endpoint and Observable creation

**Key Points**:
- Uses `@Post('message/stream')` decorator
- Returns `Observable<MessageEvent>` for SSE
- Wraps async generator in Observable
- NestJS automatically handles SSE headers

```typescript
@Post('message/stream')
async sendMessageStream(@Body() dto: SendMessageDto) {
  return new Observable((subscriber) => {
    (async () => {
      for await (const data of this.chatService.sendMessageStream(...)) {
        subscriber.next({ data: JSON.stringify(data) })
      }
      subscriber.complete()
    })()
  })
}
```

### 5. Chat Service (`backend/src/chat/chat.service.ts`)
**Responsibility**: Business logic and AI coordination

**Streaming Steps**:
1. **Rate Limit Check**: Verify user hasn't exceeded limits
2. **Session Management**: Get or create chat session
3. **Context Loading**: Load journal entries and goals
4. **Yield Session Info**: Send session metadata first
5. **Stream AI Response**: Forward chunks from Gemini
6. **Save to Database**: Store complete conversation
7. **Yield Done**: Send final message with complete content

```typescript
async *sendMessageStream(userId, dto) {
  // 1. Setup
  const session = await this.getSession(...)
  const context = await this.loadContext(...)
  
  // 2. Send session info
  yield { type: 'session', sessionId, userMessage, usageInfo }
  
  // 3. Stream AI response
  let fullResponse = ''
  for await (const chunk of this.geminiService.sendMessageStream(...)) {
    fullResponse += chunk
    yield { type: 'chunk', content: chunk }
  }
  
  // 4. Save and finalize
  await this.saveToDatabase(...)
  yield { type: 'done', assistantMessage }
}
```

### 6. Gemini Service (`backend/src/gemini/gemini.service.ts`)
**Responsibility**: AI API integration

**Streaming**:
- Calls Google Gemini API with streaming enabled
- Yields text chunks as they arrive
- Handles API errors and retries

## Event Types

### Session Event
Sent first, contains metadata:
```typescript
{
  type: 'session',
  sessionId: string,
  userMessage: ChatMessage,
  usageInfo: UsageInfo
}
```

### Chunk Event
Sent for each piece of AI response:
```typescript
{
  type: 'chunk',
  content: string  // Partial text to append
}
```

### Done Event
Sent last, contains complete message:
```typescript
{
  type: 'done',
  assistantMessage: ChatMessage  // Complete message with full content
}
```

## Error Handling

### Frontend
- Catches errors in useChat hook
- Removes temporary messages
- Sets `loading = false`
- Displays error message to user

### Backend
- Rate limiting throws 429 error
- AI errors propagate to controller
- Observable emits error event
- Frontend receives error and handles it

## Common Issues

### 1. "Coach is thinking" Stuck
**Cause**: `loading` state never set to `false`
**Fix**: Ensure all code paths set `loading = false`:
- After 'done' event
- On error
- On stream end without 'done' event

### 2. Duplicate Keys
**Cause**: Using `Date.now()` for message IDs
**Fix**: Use UUID or add counter to timestamp

### 3. Messages Not Appearing
**Cause**: Stream not being consumed or events not yielded
**Fix**: Check console logs at each layer

### 4. Partial Messages
**Cause**: Stream interrupted before 'done' event
**Fix**: Add fallback to finalize with streamed content

## Debugging

Enable console logs at each layer:
1. **Frontend Component**: User actions
2. **useChat Hook**: State changes
3. **API Client**: Network events
4. **Backend Controller**: Request handling
5. **Chat Service**: Business logic
6. **Gemini Service**: AI responses

Look for:
- Missing events (session, chunks, done)
- Errors in any layer
- State not updating
- Network issues

## Performance Considerations

- **Chunk Size**: Balance between responsiveness and overhead
- **Rate Limiting**: Prevent abuse while allowing normal use
- **Context Size**: Limit journal entries to recent 20
- **Session Caching**: Reuse sessions to reduce database reads
- **Connection Pooling**: Reuse HTTP connections for streaming
