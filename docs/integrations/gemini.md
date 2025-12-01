# Google Gemini Integration

**AI-powered coaching and content generation**

---

**Last Updated**: November 2025  
**Status**: ✅ Production Ready

---

## Table of Contents

- [Overview](#overview)
- [Services Used](#services-used)
- [Setup](#setup)
- [Features](#features)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

Google Gemini provides the AI capabilities for the Journal application, including conversational coaching, content analysis, and vector embeddings for semantic search. The integration uses the Gemini API through the `@google/generative-ai` SDK.

**Key Features**:
- Conversational AI coaching with context awareness
- Streaming responses for real-time interaction
- Vector embeddings for RAG system
- Content analysis and insights generation
- Goal suggestions based on journal patterns
- Prompt analysis and optimization

**Models Used**:
- **gemini-3-pro-preview**: Chat and content generation
- **text-embedding-004**: Vector embeddings (768 dimensions)

---

## Services Used

### Gemini Pro (gemini-3-pro-preview)

**Purpose**: Conversational AI and content generation

**Capabilities**:
- Multi-turn conversations with context
- Streaming responses
- Long context window (up to 1M tokens)
- Function calling (not currently used)
- JSON mode (for structured outputs)

**Use Cases**:
- AI coach conversations
- Journal insights generation
- Goal suggestions
- Prompt analysis
- Content summarization

### Text Embedding (text-embedding-004)

**Purpose**: Generate vector embeddings for semantic search

**Specifications**:
- **Dimensions**: 768
- **Max Input**: 2048 tokens
- **Output**: Normalized vector
- **Quality**: State-of-the-art semantic understanding

**Use Cases**:
- RAG system embeddings
- Semantic search
- Content similarity
- Context retrieval

---

## Setup

### 1. Get API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API key"
4. Select or create a Google Cloud project
5. Copy the API key

**Note**: Free tier includes generous quotas. For production, enable billing for higher limits.

### 2. Configure Environment Variables

**Web Application** (`.env.local`):
```env
# Server-side only (never exposed to client)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Backend API** (`.env`):
```env
# Google Gemini API
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# RAG Configuration (for embeddings)
RAG_ENABLED=true
RAG_EMBEDDING_MODEL=text-embedding-004
RAG_EMBEDDING_DIMENSIONS=768
```

### 3. Install SDK

**Backend**:
```bash
cd backend
pnpm add @google/generative-ai
```

**Web** (if using server-side):
```bash
cd web
pnpm add @google/generative-ai
```

### 4. Initialize Client

**Backend Service** (`backend/src/gemini/gemini.service.ts`):
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

@Injectable()
export class GeminiService implements OnModuleInit {
  private genAI: GoogleGenerativeAI
  private model: GenerativeModel
  
  async onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY')
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found')
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-3-pro-preview',
    })
  }
}
```

---

## Features

### 1. AI Coach Conversations

**Purpose**: Provide personalized coaching based on journal entries and goals

**Context Awareness**:
- Recent journal entries
- Active goals and milestones
- Progress updates
- RAG-retrieved relevant content
- Custom coach personality prompts

**Implementation**:
```typescript
async sendMessage(
  userMessage: string,
  journalEntries: JournalEntry[],
  history: ChatMessage[] = [],
  customPrompt?: string,
  goalContext?: any,
  ragContext?: string,
): Promise<string> {
  const systemPrompt = this.getSystemPrompt(
    journalEntries,
    goalContext,
    ragContext,
    customPrompt
  )
  
  const conversationHistory = [
    `System: ${systemPrompt}`,
    ...history.map(msg => `${msg.role}: ${msg.content}`),
    `User: ${userMessage}`,
  ]
  
  const result = await this.model.generateContent(
    conversationHistory.join('\n\n')
  )
  
  return result.response.text()
}
```

### 2. Streaming Responses

**Purpose**: Real-time response generation for better UX

**Benefits**:
- Immediate feedback to user
- Perceived faster response time
- Progressive content display
- Better engagement

**Implementation**:
```typescript
async *sendMessageStream(
  userMessage: string,
  journalEntries: JournalEntry[],
  history: ChatMessage[] = [],
  customPrompt?: string,
  goalContext?: any,
  ragContext?: string,
): AsyncGenerator<string, void, unknown> {
  const prompt = this.buildPrompt(/* ... */)
  
  const result = await this.model.generateContentStream(prompt)
  
  let buffer = ''
  const maxChunkSize = 5
  
  for await (const chunk of result.stream) {
    const chunkText = chunk.text()
    if (chunkText) {
      buffer += chunkText
      
      while (buffer.length >= maxChunkSize) {
        const toSend = buffer.slice(0, maxChunkSize)
        buffer = buffer.slice(maxChunkSize)
        yield toSend
      }
    }
  }
  
  if (buffer.length > 0) {
    yield buffer
  }
}
```

### 3. Vector Embeddings

**Purpose**: Generate embeddings for RAG system

**Process**:
1. Clean and prepare text content
2. Generate embedding using text-embedding-004
3. Store 768-dimensional vector in Firebase
4. Use for semantic search

**Implementation**:
```typescript
async generateEmbedding(text: string): Promise<number[]> {
  const embeddingModel = this.genAI.getGenerativeModel({
    model: 'text-embedding-004',
  })
  
  const result = await embeddingModel.embedContent(text)
  return result.embedding.values
}

async generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddingModel = this.genAI.getGenerativeModel({
    model: 'text-embedding-004',
  })
  
  const results = await embeddingModel.batchEmbedContents({
    requests: texts.map(text => ({ content: { parts: [{ text }] } })),
  })
  
  return results.embeddings.map(e => e.values)
}
```

### 4. Insights Generation

**Purpose**: Analyze journal entries for patterns and themes

**Analysis Areas**:
- Emotional patterns and trends
- Recurring challenges
- Areas of growth
- Potential blind spots
- Actionable recommendations

**Implementation**:
```typescript
async generateInsights(journalEntries: JournalEntry[]): Promise<string> {
  const journalContext = this.formatJournalContext(journalEntries)
  
  const prompt = `Based on the following journal entries, provide key insights, patterns, and themes you observe. Focus on:
1. Emotional patterns and trends
2. Recurring challenges or concerns
3. Areas of growth and progress
4. Potential blind spots
5. Actionable recommendations

${journalContext}

Please provide a thoughtful analysis in 3-5 paragraphs.`
  
  const result = await this.model.generateContent(prompt)
  return result.response.text()
}
```

### 5. Goal Suggestions

**Purpose**: Suggest goals based on journal patterns

**Output**: Structured JSON with goal suggestions

**Implementation**:
```typescript
async generateGoalSuggestions(journalEntries: JournalEntry[]): Promise<any[]> {
  const journalContext = this.formatJournalContext(journalEntries)
  
  const prompt = `Based on the following journal entries, analyze patterns, themes, and aspirations to suggest 3-5 specific, actionable goals the user might want to pursue.

${journalContext}

For each goal suggestion, provide:
1. A clear, specific title (3-10 words)
2. A category (one of: career, health, personal, financial, relationships, learning, other)
3. A brief description explaining why this goal is relevant (2-3 sentences)
4. 2-4 suggested milestones to achieve this goal
5. A reasoning section that references specific journal entries

Format your response as a JSON array with this structure:
[
  {
    "title": "Goal title here",
    "category": "category_name",
    "description": "Why this goal matters...",
    "milestones": ["First milestone", "Second milestone"],
    "reasoning": "Based on your journal entries..."
  }
]

Provide ONLY the JSON array, no additional text.`
  
  const result = await this.model.generateContent(prompt)
  const text = result.response.text()
  
  // Parse JSON response
  let jsonText = text.trim()
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
  }
  
  return JSON.parse(jsonText)
}
```

### 6. Prompt Analysis

**Purpose**: Analyze and improve custom coach prompts

**Features**:
- Clarity assessment
- Specificity evaluation
- Tone analysis
- Effectiveness suggestions

**Implementation**:
```typescript
async analyzePrompt(promptText: string): Promise<{ suggestions: string }> {
  const analysisPrompt = `You are an expert in crafting effective AI system prompts. Analyze the following system prompt and modify it to be more effective.

System Prompt to Analyze:
"""
${promptText}
"""

Focus on clarity, specificity, tone, and effectiveness. 
Do not provide an analysis of the prompt, only the modified prompt.`
  
  const result = await this.model.generateContent(analysisPrompt)
  return { suggestions: result.response.text() }
}
```

---

## Configuration

### API Quotas

**Free Tier**:
- 15 requests per minute (RPM)
- 1 million tokens per minute (TPM)
- 1,500 requests per day (RPD)

**Paid Tier** (with billing enabled):
- 360 RPM
- 4 million TPM
- No daily limit

**Recommendations**:
- Enable billing for production
- Implement rate limiting
- Cache responses when possible
- Monitor usage in Google Cloud Console

### Model Parameters

**Generation Config**:
```typescript
const generationConfig = {
  temperature: 0.7,        // Creativity (0-1)
  topK: 40,                // Top-K sampling
  topP: 0.95,              // Nucleus sampling
  maxOutputTokens: 2048,   // Max response length
}

const model = this.genAI.getGenerativeModel({
  model: 'gemini-3-pro-preview',
  generationConfig,
})
```

**Parameter Guide**:
- **temperature**: Higher = more creative, lower = more focused
- **topK**: Limits vocabulary to top K tokens
- **topP**: Nucleus sampling threshold
- **maxOutputTokens**: Maximum response length

### Safety Settings

```typescript
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

const model = this.genAI.getGenerativeModel({
  model: 'gemini-3-pro-preview',
  safetySettings,
})
```

---

## Usage Examples

### Basic Chat

```typescript
const response = await geminiService.sendMessage(
  'How can I improve my productivity?',
  journalEntries,
  chatHistory
)

console.log(response)
```

### Streaming Chat

```typescript
const stream = geminiService.sendMessageStream(
  'Tell me about my progress this week',
  journalEntries,
  chatHistory
)

for await (const chunk of stream) {
  process.stdout.write(chunk)
}
```

### Generate Embeddings

```typescript
// Single embedding
const embedding = await ragService.generateEmbedding(
  'I had a great day today. Accomplished all my goals!'
)

// Batch embeddings
const embeddings = await ragService.generateEmbeddings([
  'First journal entry',
  'Second journal entry',
  'Third journal entry',
])
```

### Goal Insights

```typescript
const insights = await geminiService.generateGoalInsights(
  goal,
  milestones,
  progressUpdates
)

console.log(insights)
```

---

## Best Practices

### Performance

1. **Use streaming** for long responses
2. **Batch embeddings** when possible (up to 100 at once)
3. **Cache responses** for repeated queries
4. **Implement rate limiting** to avoid quota exhaustion
5. **Monitor token usage** to optimize costs
6. **Use appropriate context length** (don't send unnecessary data)

### Cost Optimization

1. **Cache embeddings** (don't regenerate unnecessarily)
2. **Limit context size** (only send relevant journal entries)
3. **Use streaming** to reduce perceived latency
4. **Implement pagination** for large datasets
5. **Monitor usage** in Google Cloud Console
6. **Set up billing alerts**

### Quality

1. **Provide clear system prompts** with specific instructions
2. **Include relevant context** (journal entries, goals)
3. **Use RAG** for better context awareness
4. **Validate responses** before displaying to users
5. **Handle errors gracefully** with fallback messages
6. **Test prompts** thoroughly before deployment

### Security

1. **Never expose API key** to clients
2. **Use server-side only** for all Gemini calls
3. **Validate user input** before sending to API
4. **Sanitize responses** before displaying
5. **Implement rate limiting** per user
6. **Monitor for abuse** (excessive requests)

---

## Troubleshooting

### API Key Errors

**Error**: `API key invalid` or `API key not found`

**Solutions**:
1. Verify `GEMINI_API_KEY` is set in `.env`
2. Check API key is correct (no extra spaces)
3. Ensure API key is enabled in Google AI Studio
4. Verify project has Gemini API enabled
5. Restart server after env changes

### Rate Limit Errors

**Error**: `429 Resource exhausted` or `Quota exceeded`

**Solutions**:
1. Enable billing in Google Cloud Console
2. Implement exponential backoff retry logic
3. Add rate limiting per user
4. Cache responses to reduce requests
5. Monitor usage and adjust quotas
6. Consider upgrading to paid tier

### Context Length Errors

**Error**: `Context length exceeded`

**Solutions**:
1. Reduce number of journal entries in context
2. Summarize long entries before sending
3. Implement pagination for chat history
4. Use RAG to send only relevant content
5. Monitor token usage per request

### Embedding Errors

**Error**: `Embedding generation failed`

**Solutions**:
1. Verify text is not empty
2. Check text length (max 2048 tokens)
3. Ensure model name is correct (text-embedding-004)
4. Validate API key has embedding permissions
5. Handle batch size limits (max 100)

### Streaming Errors

**Error**: `Stream interrupted` or `Connection lost`

**Solutions**:
1. Implement retry logic for failed streams
2. Handle network errors gracefully
3. Buffer chunks before sending to client
4. Set appropriate timeouts
5. Monitor connection stability

---

## Related Documentation

- [Chat Feature](../features/chat.md)
- [RAG System](../features/rag-system.md)
- [Goals Feature](../features/goals.md)
- [Backend Architecture](../architecture/backend-architecture.md)

---

## Additional Resources

- [Google AI Studio](https://aistudio.google.com)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini Models](https://ai.google.dev/models/gemini)
- [Embeddings Guide](https://ai.google.dev/docs/embeddings_guide)
- [Pricing](https://ai.google.dev/pricing)

---

**Last Updated**: November 2025  
**Status**: ✅ Production Ready
