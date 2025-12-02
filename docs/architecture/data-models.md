# Data Models and Database Schema

**Complete database schema and data relationships**

---

**Last Updated**: November 2024  
**Status**: Current

---

## Table of Contents

1. [Overview](#overview)
2. [Firestore Collections](#firestore-collections)
3. [Data Relationships](#data-relationships)
4. [Indexes](#indexes)
5. [RAG Vector Store](#rag-vector-store)
6. [Data Validation](#data-validation)

---

## Overview

The application uses Firebase Firestore as its primary database. Firestore is a NoSQL document database that provides real-time synchronization, automatic scaling, and strong security rules.

**Database Type**: NoSQL (Document-oriented)  
**Provider**: Firebase Firestore  
**Hosting**: Google Cloud

---

## Firestore Collections

### profiles

User profile information.

```typescript
{
  id: string                    // Document ID (matches Firebase Auth UID)
  email: string                 // User email
  full_name: string | null      // Display name
  created_at: Timestamp         // Account creation date
  updated_at: Timestamp         // Last update date
}
```

**Indexes**:
- Single field: `email` (ASC)

**Security Rules**:
```javascript
match /profiles/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

---

### journal_entries

User journal entries.

```typescript
{
  id: string                    // Auto-generated document ID
  user_id: string               // User UID
  title: string                 // Entry title
  content: string               // Entry content (markdown)
  mood?: string                 // Optional mood indicator
  tags?: string[]               // Optional tags
  created_at: Timestamp         // Creation date
  updated_at: Timestamp         // Last update date
}
```

**Indexes**:
- Composite: `user_id` (ASC) + `created_at` (DESC)
- Single field: `user_id` (ASC)

**Security Rules**:
```javascript
match /journal_entries/{entryId} {
  allow read, write: if request.auth.uid == resource.data.user_id;
}
```

---

### goals

User goals and objectives with optional habit tracking.

```typescript
{
  id: string                    // Auto-generated document ID
  user_id: string               // User UID
  title: string                 // Goal title
  description: string           // Goal description
  category: string              // Goal category (default or custom category ID)
  target_date: Timestamp        // Target completion date (far future for habits)
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
  created_at: Timestamp         // Creation date
  updated_at: Timestamp         // Last update date
  completed_at?: Timestamp      // Completion date (if completed)
  status_changed_at: Timestamp  // Last status change date
  last_activity: Timestamp      // Last activity date
  progress_percentage: number   // Progress (0-100)
  milestones: Milestone[]       // Embedded milestones array
  
  // Habit fields
  is_habit: boolean             // Whether this is a recurring habit
  habit_frequency?: 'daily' | 'weekly' | 'monthly'  // Habit frequency
  habit_streak: number          // Current streak count
  habit_completed_dates: string[] // ISO dates (YYYY-MM-DD) when completed
}

interface Milestone {
  id: string
  title: string
  due_date?: Timestamp
  completed: boolean
  completed_at?: Timestamp
  order: number
  created_at: Timestamp
}
```

**Indexes**:
- Composite: `user_id` (ASC) + `status` (ASC) + `created_at` (DESC)
- Composite: `user_id` (ASC) + `category` (ASC)
- Composite: `user_id` (ASC) + `is_habit` (ASC)

**Security Rules**:
```javascript
match /goals/{goalId} {
  allow read, write: if request.auth.uid == resource.data.user_id;
}
```

---

### milestones

Goal milestones and sub-tasks.

```typescript
{
  id: string                    // Auto-generated document ID
  goal_id: string               // Parent goal ID
  user_id: string               // User UID
  title: string                 // Milestone title
  description: string           // Milestone description
  completed: boolean            // Completion status
  completed_at?: Timestamp      // Completion date (if completed)
  created_at: Timestamp         // Creation date
  updated_at: Timestamp         // Last update date
}
```

**Indexes**:
- Composite: `goal_id` (ASC) + `completed` (ASC)
- Composite: `user_id` (ASC) + `goal_id` (ASC)

**Security Rules**:
```javascript
match /milestones/{milestoneId} {
  allow read, write: if request.auth.uid == resource.data.user_id;
}
```

---

### progress_updates

Goal progress updates and notes.

```typescript
{
  id: string                    // Auto-generated document ID
  goal_id: string               // Parent goal ID
  user_id: string               // User UID
  content: string               // Update content
  created_at: Timestamp         // Creation date
  updated_at: Timestamp         // Last update date
}
```

**Indexes**:
- Composite: `goal_id` (ASC) + `created_at` (DESC)
- Composite: `user_id` (ASC) + `goal_id` (ASC)

**Security Rules**:
```javascript
match /progress_updates/{updateId} {
  allow read, write: if request.auth.uid == resource.data.user_id;
}
```

---

### chat_sessions

AI coach chat sessions.

```typescript
{
  id: string                    // Auto-generated document ID
  user_id: string               // User UID
  messages: Message[]           // Array of messages
  created_at: Timestamp         // Session creation date
  updated_at: Timestamp         // Last message date
}

interface Message {
  id: string                    // Message ID
  role: 'user' | 'assistant'    // Message sender
  content: string               // Message content
  timestamp: Date               // Message timestamp
}
```

**Indexes**:
- Composite: `user_id` (ASC) + `updated_at` (DESC)

**Security Rules**:
```javascript
match /chat_sessions/{sessionId} {
  allow read, write: if request.auth.uid == resource.data.user_id;
}
```

---

### voice_sessions

Voice AI coach sessions.

```typescript
{
  id: string                    // Auto-generated document ID
  user_id: string               // User UID
  personality_id: string        // Coach personality ID
  conversation: Conversation[]  // Array of conversation turns
  metrics: SessionMetrics       // Session metrics
  created_at: Timestamp         // Session creation date
  updated_at: Timestamp         // Last interaction date
}

interface Conversation {
  id: string                    // Turn ID
  user_input: string            // User's spoken input
  assistant_response: string    // AI's text response
  audio_url?: string            // Audio file URL (if stored)
  timestamp: Date               // Turn timestamp
}

interface SessionMetrics {
  total_turns: number           // Number of conversation turns
  total_duration_ms: number     // Total session duration
  avg_response_time_ms: number  // Average response time
}
```

**Indexes**:
- Composite: `user_id` (ASC) + `updated_at` (DESC)
- Composite: `user_id` (ASC) + `personality_id` (ASC)

**Security Rules**:
```javascript
match /voice_sessions/{sessionId} {
  allow read, write: if request.auth.uid == resource.data.user_id;
}
```

---

### coach_personalities

AI coach personality configurations.

```typescript
{
  id: string                    // Auto-generated document ID
  name: string                  // Personality name
  description: string           // Personality description
  voice_id: string              // ElevenLabs voice ID
  system_prompt: string         // AI system prompt
  is_default: boolean           // Default personality flag
  created_at: Timestamp         // Creation date
  updated_at: Timestamp         // Last update date
}
```

**Indexes**:
- Single field: `is_default` (ASC)

**Security Rules**:
```javascript
match /coach_personalities/{personalityId} {
  allow read: if request.auth != null;
  allow write: if false; // Admin only
}
```

---

### user_themes

Custom user themes.

```typescript
{
  id: string                    // Auto-generated document ID
  user_id: string               // User UID
  name: string                  // Theme name
  is_default: boolean           // Default theme flag
  is_public: boolean            // Public sharing flag
  colors: ThemeColors           // Color configuration
  typography: ThemeTypography   // Typography settings
  spacing: ThemeSpacing         // Spacing configuration
  borderRadius: number          // Border radius (rem)
  shadowIntensity: 'none' | 'subtle' | 'medium' | 'strong'
  animations: ThemeAnimations   // Animation settings
  density: 'comfortable' | 'compact' | 'spacious'
  created_at: Timestamp         // Creation date
  updated_at: Timestamp         // Last update date
}

interface ThemeColors {
  background: string            // HSL format
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
}

interface ThemeTypography {
  fontFamily: string            // Font family
  baseFontSize: number          // Base font size (px)
  headingScale: number          // Heading scale multiplier
  lineHeight: number            // Line height multiplier
}

interface ThemeSpacing {
  scale: number                 // Spacing scale multiplier
}

interface ThemeAnimations {
  duration: number              // Animation duration (ms)
  easing: string                // CSS easing function
}
```

**Indexes**:
- Composite: `user_id` (ASC) + `is_default` (ASC)
- Single field: `is_public` (ASC)

**Security Rules**:
```javascript
match /user_themes/{themeId} {
  allow read: if request.auth.uid == resource.data.user_id 
              || resource.data.is_public == true;
  allow write: if request.auth.uid == resource.data.user_id;
}
```

---

### custom_categories

Custom goal categories.

```typescript
{
  id: string                    // Auto-generated document ID
  user_id: string               // User UID
  name: string                  // Category name
  icon: string                  // Icon identifier
  color: string                 // Color (hex or HSL)
  created_at: Timestamp         // Creation date
  updated_at: Timestamp         // Last update date
}
```

**Indexes**:
- Single field: `user_id` (ASC)

**Security Rules**:
```javascript
match /custom_categories/{categoryId} {
  allow read, write: if request.auth.uid == resource.data.user_id;
}
```

---

### rag_embeddings

RAG vector embeddings for semantic search.

```typescript
{
  id: string                    // Auto-generated document ID
  user_id: string               // User UID
  content_type: 'journal' | 'goal' | 'milestone' | 'progress'
  content_id: string            // Original content document ID
  content_text: string          // Text content
  embedding: number[]           // 768-dimensional vector
  metadata: {
    title?: string              // Content title
    created_at: Date            // Original content creation date
    [key: string]: any          // Additional metadata
  }
  created_at: Timestamp         // Embedding creation date
  updated_at: Timestamp         // Last update date
}
```

**Indexes**:
- Composite: `user_id` (ASC) + `content_type` (ASC) + `created_at` (DESC)
- Composite: `user_id` (ASC) + `content_id` (ASC)

**Security Rules**:
```javascript
match /rag_embeddings/{embeddingId} {
  allow read, write: if request.auth.uid == resource.data.user_id;
}
```

---

### prompts

AI coaching prompts.

```typescript
{
  id: string                    // Auto-generated document ID
  category: string              // Prompt category
  text: string                  // Prompt text
  is_active: boolean            // Active status
  created_at: Timestamp         // Creation date
  updated_at: Timestamp         // Last update date
}
```

**Indexes**:
- Composite: `category` (ASC) + `is_active` (ASC)

**Security Rules**:
```javascript
match /prompts/{promptId} {
  allow read: if request.auth != null;
  allow write: if false; // Admin only
}
```

---

## Data Relationships

```
User (Firebase Auth)
  │
  ├─► profiles (1:1)
  │
  ├─► journal_entries (1:many)
  │
  ├─► goals (1:many)
  │     │
  │     ├─► milestones (1:many)
  │     │
  │     └─► progress_updates (1:many)
  │
  ├─► chat_sessions (1:many)
  │
  ├─► voice_sessions (1:many)
  │     │
  │     └─► coach_personalities (many:1)
  │
  ├─► user_themes (1:many)
  │
  ├─► custom_categories (1:many)
  │
  └─► rag_embeddings (1:many)
        │
        ├─► journal_entries (many:1)
        ├─► goals (many:1)
        ├─► milestones (many:1)
        └─► progress_updates (many:1)
```

---

## Indexes

### Composite Indexes

Defined in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "journal_entries",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "goals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "milestones",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "goal_id", "order": "ASCENDING" },
        { "fieldPath": "completed", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "chat_sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "updated_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "rag_embeddings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "content_type", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Index Deployment

```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# Verify indexes
firebase firestore:indexes
```

---

## RAG Vector Store

### Embedding Generation

Content is converted to 768-dimensional vectors using Gemini's `text-embedding-004` model:

```typescript
async function generateEmbedding(text: string): Promise<number[]> {
  const result = await geminiService.generateEmbedding(text)
  return result // 768-dimensional vector
}
```

### Semantic Search

Cosine similarity is used to find relevant content:

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

async function semanticSearch(
  query: string,
  userId: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<SearchResult[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query)
  
  // Get all user embeddings
  const embeddings = await firestore
    .collection('rag_embeddings')
    .where('user_id', '==', userId)
    .get()
  
  // Calculate similarities
  const results = embeddings.docs.map(doc => {
    const data = doc.data()
    const similarity = cosineSimilarity(queryEmbedding, data.embedding)
    return { ...data, similarity }
  })
  
  // Filter and sort
  return results
    .filter(r => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}
```

---

## Data Validation

### DTO Validation

Data Transfer Objects use class-validator for validation:

```typescript
import { IsString, IsOptional, IsArray, MinLength, MaxLength } from 'class-validator'

export class CreateJournalEntryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string
  
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  content: string
  
  @IsOptional()
  @IsString()
  mood?: string
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}
```

### Firestore Validation

Security rules provide server-side validation:

```javascript
function isValidEntry(entry) {
  return entry.keys().hasAll(['user_id', 'title', 'content', 'created_at', 'updated_at'])
    && entry.user_id is string
    && entry.title is string
    && entry.title.size() > 0
    && entry.title.size() <= 200
    && entry.content is string
    && entry.content.size() > 0
    && entry.content.size() <= 50000
    && entry.created_at is timestamp
    && entry.updated_at is timestamp;
}

match /journal_entries/{entryId} {
  allow create: if request.auth.uid == request.resource.data.user_id
                && isValidEntry(request.resource.data);
  allow update: if request.auth.uid == resource.data.user_id
                && isValidEntry(request.resource.data);
}
```

---

## Related Documentation

- **[Architecture Overview](../ARCHITECTURE.md)** - Complete architecture
- **[Backend Architecture](backend-architecture.md)** - Backend details
- **[Security Architecture](security-architecture.md)** - Security details
- **[System Overview](system-overview.md)** - High-level design

---

**Last Updated**: November 2024  
**Status**: Current
