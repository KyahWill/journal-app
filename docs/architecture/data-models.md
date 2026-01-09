# Data Models and Database Schema

**Complete database schema and data relationships**

---

**Last Updated**: January 2026  
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

User goals and objectives.

```typescript
{
  id: string                    // Auto-generated document ID
  user_id: string               // User UID
  title: string                 // Goal title
  description: string           // Goal description
  category: string              // Goal category (default or custom category ID)
  target_date: Timestamp        // Target completion date
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
  created_at: Timestamp         // Creation date
  updated_at: Timestamp         // Last update date
  completed_at?: Timestamp      // Completion date (if completed)
  status_changed_at: Timestamp  // Last status change date
  last_activity: Timestamp      // Last activity date
  progress_percentage: number   // Progress (0-100)
  milestones: Milestone[]       // Embedded milestones array
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

**Security Rules**:
```javascript
match /goals/{goalId} {
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
  personality_id?: string       // Optional coach personality ID
  created_at: Timestamp         // Session creation date
  updated_at: Timestamp         // Last message date
}

interface Message {
  id: string                    // Message ID
  role: 'user' | 'assistant' | 'system' // Message role
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

### coach_personalities

AI coach personality configurations.

```typescript
{
  id: string                    // Auto-generated document ID
  user_id: string               // User UID
  name: string                  // Personality name
  description: string           // Personality description
  style: string                 // Coaching style
  system_prompt: string         // AI system prompt
  first_message?: string        // Initial greeting message
  language?: string             // Language code
  is_default: boolean           // Default personality flag
  created_at: Timestamp         // Creation date
  updated_at: Timestamp         // Last update date
}
```

**Indexes**:
- Composite: `user_id` (ASC) + `is_default` (ASC)

**Security Rules**:
```javascript
match /coach_personalities/{personalityId} {
  allow read, write: if request.auth.uid == resource.data.user_id;
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
  document_id: string           // Original content document ID
  embedding: number[]           // 768-dimensional vector
  text_snippet: string          // Preview text
  metadata: {
    [key: string]: any          // Additional metadata
  }
  created_at: Timestamp         // Embedding creation date
  updated_at: Timestamp         // Last update date
}
```

**Indexes**:
- Composite: `user_id` (ASC) + `content_type` (ASC) + `created_at` (DESC)
- Composite: `user_id` (ASC) + `document_id` (ASC)

**Security Rules**:
```javascript
match /rag_embeddings/{embeddingId} {
  allow read, write: if request.auth.uid == resource.data.user_id;
}
```


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
  │     └─► progress_updates (1:many)
  │
  ├─► chat_sessions (1:many)
  │
  ├─► coach_personalities (1:many)
  │
  ├─► user_themes (1:many)
  │
  ├─► custom_categories (1:many)
  │
  └─► rag_embeddings (1:many)
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

---

## RAG Vector Store

### Embedding Generation

Content is converted to 768-dimensional vectors using Gemini's `text-embedding-004` model.

### Semantic Search

Cosine similarity is used to find relevant content by comparing query embeddings with stored document embeddings.

---

## Data Validation

### DTO Validation

Data Transfer Objects use class-validator for validation in the backend.

### Firestore Validation

Security rules provide server-side validation for all Firestore operations.

---

## Related Documentation

- **[Architecture Overview](../ARCHITECTURE.md)** - Complete architecture
- **[Backend Architecture](backend-architecture.md)** - Backend details
- **[Security Architecture](security-architecture.md)** - Security details
- **[System Overview](system-overview.md)** - High-level design

---

**Last Updated**: January 2026
