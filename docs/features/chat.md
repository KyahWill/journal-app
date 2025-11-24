# Chat Feature

**Context-aware AI coaching powered by Google Gemini**

---

**Last Updated**: November 2025  
**Status**: ✅ Complete

---

## Overview

The Chat feature provides an AI-powered executive coach that offers personalized guidance based on the user's journal entries and goals. It uses Google Gemini 2.5 Pro with streaming responses for a natural conversation experience.

## Key Features

### Chat Interface

#### Conversational UI
- Message bubbles for user and AI
- Distinct styling for each speaker
- Message history display
- Auto-scroll to latest message
- Timestamp for messages
- Loading indicator during AI response
- Streaming message display

#### Message Input
- Text input field
- Send button
- Voice input support
- Enter key to send
- Shift+Enter for new line
- Character count (optional)

### AI Integration

#### Google Gemini 2.5 Pro
- Advanced language model
- Temperature: 0.7 (balanced creativity/consistency)
- Context window: Large enough for full journal history
- Streaming responses for real-time feedback
- Error handling and retry logic

#### LangChain Framework
- Flexible AI orchestration
- Conversation memory management
- System prompt management
- Context injection
- Error handling

### Context Awareness

#### Journal Integration
- Reads all user's journal entries
- Formats entries with date, title, content
- Provides context-aware coaching
- References specific entries when relevant
- Identifies patterns and themes

#### Goal Integration
- Accesses user's goals and milestones
- Tracks progress on goals
- Provides goal-specific guidance
- Celebrates milestone completions

#### RAG Integration
- Semantic search for relevant entries
- Retrieves most relevant context
- Reduces token usage
- Improves response relevance

### Executive Coaching Persona

#### Characteristics
- Experienced executive coach specialization
- Leadership development focus
- Personal and professional growth guidance
- Empathetic and supportive tone
- Thoughtful questions for self-reflection
- Actionable advice and strategies

#### Coaching Style
- Celebrates wins and progress
- Helps work through challenges
- Conversational and authentic (not robotic)
- Concise but meaningful responses (2-4 paragraphs)
- References specific journal entries
- Identifies patterns and themes

### Conversation Management

#### History Management
- Last 20 messages kept in memory (10 exchanges)
- Context window management
- Conversation persistence
- Clear history functionality

#### System Prompt
- Coach persona definition
- Coaching guidelines
- Context injection (journal entries, goals)
- Response format instructions

### Chat Controls

#### Clear History
- Clear conversation button
- Confirmation dialog
- Preserves journal context
- Starts fresh conversation

#### Text-to-Speech
- Speaker button next to AI messages
- Play/stop controls
- Visual feedback (loading, playing)
- Auto-stop previous audio
- ElevenLabs voice synthesis

## Architecture

### Components

#### Chat Interface
- Message list with bubbles
- Message input field
- Send button
- Clear history button
- Loading indicators

#### Message Bubble
- User message styling
- AI message styling
- Timestamp display
- Text-to-speech button (AI only)
- Markdown rendering

#### Streaming Display
- Server-sent events (SSE)
- Real-time message updates
- Character-by-character display
- Smooth scrolling

### API Endpoints

**POST /chat/stream**
- Stream chat responses
- Body: { message, conversationHistory }
- Returns: SSE stream of response chunks

**GET /chat/history**
- Get conversation history
- Returns: Array of messages

**POST /chat/clear**
- Clear conversation history
- Returns: Success message

### Context Builder

The context builder service assembles context for the AI:

```typescript
interface ChatContext {
  journalEntries: JournalEntry[]
  goals: Goal[]
  milestones: Milestone[]
  relevantEntries: JournalEntry[]  // From RAG
  userStats: {
    totalGoals: number
    completedGoals: number
    totalEntries: number
  }
}
```

## Usage Examples

### Sending a Message

```typescript
import { useChat } from '@/lib/hooks/useChat'

function ChatComponent() {
  const { 
    messages, 
    sendMessage, 
    isLoading, 
    clearHistory 
  } = useChat()

  const handleSend = async (message: string) => {
    await sendMessage(message)
  }

  return (
    <div>
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <MessageInput onSend={handleSend} disabled={isLoading} />
    </div>
  )
}
```

### Streaming Responses

```typescript
async function streamChatResponse(message: string) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        // Update UI with data.content
      }
    }
  }
}
```

### Using Text-to-Speech

```typescript
import { useTextToSpeech } from '@/lib/hooks/useTextToSpeech'

function AIMessage({ content }) {
  const { play, stop, isPlaying, isLoading } = useTextToSpeech()

  const handlePlay = async () => {
    if (isPlaying) {
      stop()
    } else {
      await play(content)
    }
  }

  return (
    <div>
      <p>{content}</p>
      <button onClick={handlePlay}>
        {isPlaying ? 'Stop' : 'Play'}
      </button>
    </div>
  )
}
```

## Features in Detail

### Streaming Responses

Streaming provides real-time feedback as the AI generates responses:

**Benefits**:
- Immediate feedback to user
- Perceived faster response time
- Can stop generation early
- Better user experience

**Implementation**:
- Server-sent events (SSE)
- Chunked transfer encoding
- Character-by-character display
- Smooth auto-scrolling

**Error Handling**:
- Connection loss detection
- Automatic retry
- Fallback to non-streaming
- User-friendly error messages

### Context Management

Context is carefully managed to provide relevant information:

**Journal Context**:
- All entries included in system prompt
- Formatted with date, title, content
- Sorted by date (newest first)
- Truncated if too long

**Goal Context**:
- Active goals with milestones
- Progress percentages
- Target dates
- Completion status

**RAG Context**:
- Semantically relevant entries
- Retrieved based on user message
- Top 5 most relevant entries
- Reduces token usage

**Token Management**:
- Monitor total token count
- Truncate old messages if needed
- Prioritize recent context
- Keep system prompt intact

### Conversation Memory

Conversation history is maintained for context:

**Memory Limits**:
- Last 20 messages (10 exchanges)
- Older messages dropped
- System prompt always included
- Journal context always included

**Persistence**:
- In-memory during session
- Not persisted to database
- Cleared on page refresh
- Clear history button available

### Coaching Persona

The AI is configured with a specific coaching persona:

**System Prompt**:
```
You are an experienced executive coach specializing in leadership 
development and personal growth. You have access to the user's 
journal entries and goals.

Your role is to:
- Provide empathetic and supportive guidance
- Ask thoughtful questions that promote self-reflection
- Identify patterns and themes in their journal entries
- Offer actionable advice and strategies
- Celebrate their wins and progress
- Help them work through challenges

Be conversational and authentic, not robotic. Keep responses 
concise but meaningful (2-4 paragraphs typically). Reference 
specific journal entries when relevant.
```

## Performance Optimizations

### Streaming
- Reduces perceived latency
- Immediate user feedback
- Can stop generation early
- Better resource utilization

### RAG Integration
- Reduces context size
- Faster response generation
- Lower token costs
- More relevant responses

### Caching
- Cache journal entries
- Cache goals and milestones
- Reduce database queries
- Faster context building

### Debouncing
- Debounce typing indicators
- Prevent excessive updates
- Reduce network traffic

## Testing

### Manual Testing Checklist

- [ ] Send a message and receive response
- [ ] Verify streaming works (characters appear gradually)
- [ ] Test with long message (1000+ characters)
- [ ] Test with multiple messages in conversation
- [ ] Clear conversation history
- [ ] Test text-to-speech on AI message
- [ ] Test voice input for user message
- [ ] Test with no journal entries
- [ ] Test with many journal entries (100+)
- [ ] Test with no goals
- [ ] Test with many goals (50+)
- [ ] Test error handling (network failure)
- [ ] Test error handling (AI API failure)
- [ ] Test on mobile device
- [ ] Test with slow network connection

### API Testing

```bash
# Stream chat response
curl -X POST http://localhost:3001/api/v1/chat/stream \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How am I doing with my goals?",
    "conversationHistory": []
  }'

# Get conversation history
curl http://localhost:3001/api/v1/chat/history \
  -H "Authorization: Bearer $TOKEN"

# Clear history
curl -X POST http://localhost:3001/api/v1/chat/clear \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Streaming not working

**Symptoms**: Full response appears at once instead of streaming

**Possible Causes**:
1. SSE not supported by browser
2. Proxy buffering responses
3. Network middleware interfering

**Solutions**:
1. Check browser compatibility
2. Disable response buffering
3. Check network configuration
4. Test with different browser

### AI responses are irrelevant

**Symptoms**: AI doesn't reference journal entries or goals

**Possible Causes**:
1. Context not being included
2. RAG not retrieving relevant entries
3. System prompt not configured

**Solutions**:
1. Check context builder service
2. Verify RAG integration
3. Review system prompt
4. Check journal entries exist

### Responses are too slow

**Symptoms**: Long wait time for AI responses

**Possible Causes**:
1. Too much context in prompt
2. Network latency
3. AI API rate limiting

**Solutions**:
1. Reduce context size
2. Use RAG for selective context
3. Check network connection
4. Monitor API rate limits

## Future Enhancements

### Planned Features

- [ ] Multiple AI models support
- [ ] Custom coaching personas
- [ ] Conversation branching
- [ ] Message editing
- [ ] Message reactions
- [ ] Conversation export
- [ ] Conversation search
- [ ] Suggested questions
- [ ] Quick replies
- [ ] Conversation templates

### Potential Improvements

- [ ] Voice-only conversations
- [ ] Multi-language support
- [ ] Conversation analytics
- [ ] Coaching insights
- [ ] Progress tracking
- [ ] Goal recommendations
- [ ] Habit suggestions
- [ ] Mood analysis
- [ ] Writing prompts
- [ ] Reflection questions

## Related Documentation

- [API Reference](../API_REFERENCE.md#chat)
- [Streaming Architecture](../architecture/web-architecture.md#streaming)
- [RAG System](./rag-system.md)
- [Voice Coach](./voice-coach.md)
- [Gemini Integration](../integrations/gemini.md)

