# Chat Feature

**Context-aware AI coaching powered by Google Gemini**

---

**Last Updated**: January 2026  
**Status**: ✅ Complete

---

## Overview

The Chat feature provides an AI-powered executive coach that offers personalized guidance based on the user's journal entries and goals. It uses Google Gemini with streaming responses for a natural conversation experience.

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
- Enter key to send
- Shift+Enter for new line

### AI Integration

#### Google Gemini
- Advanced language model
- Streaming responses for real-time feedback
- Error handling and retry logic

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
- Message history kept in memory
- Conversation persistence in Firestore
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

---

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
- Markdown rendering

#### Streaming Display
- Server-sent events (SSE)
- Real-time message updates
- Smooth scrolling

### API Endpoints

**POST /chat/message/stream**
- Stream chat responses
- Body: { message, sessionId, personalityId }
- Returns: SSE stream of response chunks

**GET /chat/sessions**
- Get conversation sessions
- Returns: Array of sessions

**GET /chat/session/:id**
- Get specific session with history
- Returns: Session object with messages

**POST /chat/clear**
- Clear conversation history
- Returns: Success message

---

## Related Documentation

- [API Reference](../API_REFERENCE.md#chat)
- [RAG System](./rag-system.md)
- [Gemini Integration](../integrations/gemini.md)
