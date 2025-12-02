# Features Documentation

**Complete feature reference for the Journal application**

---

**Last Updated**: November 2025  
**Status**: Current

---

## Overview

This document provides a comprehensive catalog of all features available in the Journal application. Features are organized by functional area with status indicators, technical implementation notes, and links to detailed documentation.

## Feature Status Legend

- ✅ **Complete** - Fully implemented and production-ready
- 🚧 **In Progress** - Currently being developed
- 📋 **Planned** - Scheduled for future development
- 🔄 **Beta** - Available but undergoing testing/refinement

---

## Table of Contents

1. [Authentication & User Management](#authentication--user-management)
2. [Goal Setting & Tracking](#goal-setting--tracking)
3. [Journal Entries](#journal-entries)
4. [AI Chat Coach](#ai-chat-coach)
5. [Voice AI Coach](#voice-ai-coach)
6. [RAG System](#rag-system)
7. [Theming System](#theming-system)
8. [Custom Categories](#custom-categories)
9. [Platform Features](#platform-features)

---

## Authentication & User Management

**Status**: ✅ Complete

### Overview
Server-side authentication system using Firebase Admin SDK with session-based authentication for the web app and token-based authentication for the backend API.

### Key Features

#### User Registration
- Email/password signup with validation
- Optional full name field
- Automatic user profile creation
- Auto-login after successful registration
- Password strength requirements
- Duplicate account detection

#### User Login
- Email/password authentication
- Session persistence (5-day duration)
- Secure token management
- Remember user session
- Comprehensive error handling

#### Session Management
- HTTP-only cookies for security
- Automatic session validation
- Server-side verification
- Session expiry handling
- Secure logout with token revocation

#### Password Management
- Password reset via email
- Secure recovery flow
- Password validation rules

#### Profile Management
- Update user profile information
- View current user details
- Profile data linked to Firebase Auth

### Technical Implementation

**Architecture**:
- Server-side only authentication
- Firebase Admin SDK for user management
- HTTP-only cookies for web sessions
- Bearer tokens for API authentication
- Zero client-side token exposure

**Security Features**:
- XSS protection via HTTP-only cookies
- CSRF protection with SameSite attribute
- HTTPS enforcement in production
- Token revocation on logout
- Short session duration (5 days)

**Components**:
- Next.js API routes for auth operations
- NestJS AuthGuard for backend protection
- useAuth hook for client-side state
- Middleware for route protection

### Related Documentation
- [Authentication Architecture](./architecture/security-architecture.md)
- [API Reference](./API_REFERENCE.md#authentication)

---

## Goal Setting & Tracking

**Status**: ✅ Complete

### Overview
Comprehensive goal management system with milestones, progress tracking, and category organization.

### Key Features

#### Goal Management
- Create goals with title, description, and target date
- Update goal details and status
- Delete goals with confirmation
- Goal categories (default + custom)
- Goal status tracking (not started, in progress, completed)
- Goal priority levels

#### Milestone Tracking
- Add milestones to goals
- Mark milestones as complete
- Track milestone progress
- Accurate milestone counts on goal cards
- Milestone completion percentages
- Visual progress indicators

#### Progress Tracking
- Progress updates with notes
- Progress history timeline
- Percentage completion calculation
- Visual progress bars
- Milestone-based progress
- Time remaining indicators

#### Goal Organization
- Filter by category
- Filter by status
- Search goals by title/description
- Sort by various criteria
- Grid and list view modes
- Virtualized rendering for performance

#### Goal Insights
- Goal statistics dashboard
- Completion rates
- Category distribution
- Progress trends
- Time tracking

### Technical Implementation

**Database**:
- Firestore collections: `goals`, `milestones`, `progress_updates`
- Real-time sync with Firestore
- Composite indexes for efficient queries
- Row-level security with Firebase Auth

**Components**:
- GoalCard with milestone counts
- GoalForm for create/edit
- MilestoneList for milestone management
- ProgressUpdates for tracking
- GoalStats for analytics
- VirtualizedGoalList for performance

**API Endpoints**:
- `/goal` - CRUD operations
- `/goal/:id/milestones` - Milestone management
- `/goal/:id/progress` - Progress tracking

### Related Documentation
- [Goals Feature Details](./features/goals.md)
- [API Reference](./API_REFERENCE.md#goals)

---

## Journal Entries

**Status**: ✅ Complete

### Overview
Full-featured journaling system with rich text support, search, and real-time sync.

### Key Features

#### Entry Management
- Create journal entries with title and content
- Edit existing entries
- Delete entries with confirmation
- Automatic timestamp tracking
- User-specific entry isolation

#### Entry Organization
- List view with previews
- Detail view with full content
- Sort by date (newest first)
- Entry preview truncation
- Pagination support

#### Search Functionality
- Full-text search across title and content
- Case-insensitive search
- Real-time search results
- Search as you type
- Clear search functionality
- Result count display

#### Real-time Sync
- Live updates when entries change
- Firestore real-time subscriptions
- Multi-device sync support
- Auto-refresh on changes

#### Voice Input
- Speech-to-text for title field
- Speech-to-text for content field
- Speech-to-text for mood field
- ElevenLabs integration
- Visual recording indicators

### Technical Implementation

**Database**:
- Firestore collection: `journal_entries`
- Indexed fields: `user_id`, `created_at`
- Real-time subscriptions
- RLS policies for security

**Components**:
- Journal entry list
- Entry detail view
- Entry form (create/edit)
- Search interface
- Voice input controls

**API Endpoints**:
- `/journal` - CRUD operations
- `/journal/search` - Search entries

### Related Documentation
- [Journal Feature Details](./features/journal.md)
- [API Reference](./API_REFERENCE.md#journal)

---

## AI Chat Coach

**Status**: ✅ Complete

### Overview
Context-aware AI coaching powered by Google Gemini with journal entry integration.

### Key Features

#### Chat Interface
- Conversational chat UI with message bubbles
- Distinct styling for user vs AI messages
- Message history display
- Auto-scroll to latest message
- Timestamp for messages
- Loading indicator during AI response
- Streaming responses

#### AI Integration
- Google Gemini 2.5 Pro LLM
- Temperature: 0.7 (balanced creativity)
- LangChain framework
- Context-aware coaching
- Error handling for API failures

#### Context Awareness
- Reads all user's journal entries
- Formats entries with date, title, content
- Provides context-aware coaching
- References specific journal entries
- Identifies patterns and themes

#### Executive Coaching Persona
- Experienced executive coach specialization
- Leadership development focus
- Personal and professional growth guidance
- Empathetic and supportive tone
- Thoughtful questions for self-reflection
- Actionable advice and strategies
- Celebrates wins and progress
- Conversational and authentic

#### Conversation Management
- Conversation history maintained
- Last 20 messages kept in memory
- Context window management
- System prompt with persona and journal context

#### Chat Controls
- Clear chat history button
- Start fresh conversation
- Preserves journal context
- Text-to-speech for AI responses

### Technical Implementation

**AI Stack**:
- Google Gemini 2.5 Pro
- LangChain for orchestration
- Streaming responses via SSE
- Context builder service

**Components**:
- Chat interface with message bubbles
- Message input with voice support
- Streaming message display
- Text-to-speech controls

**API Endpoints**:
- `/chat/stream` - Streaming chat responses
- `/chat/history` - Get conversation history
- `/chat/clear` - Clear conversation

### Related Documentation
- [Chat Feature Details](./features/chat.md)
- [Streaming Architecture](./architecture/web-architecture.md#streaming)
- [API Reference](./API_REFERENCE.md#chat)

---

## Voice AI Coach

**Status**: ✅ Complete

### Overview
Real-time voice coaching with ElevenLabs Conversational AI, featuring multiple coach personalities and dynamic context integration.

### Key Features

#### Voice Interaction
- Real-time voice conversations
- Natural speech recognition
- High-quality voice synthesis
- Low-latency responses
- WebSocket-based communication

#### Coach Personalities
- Multiple coach personalities per user
- Customizable coaching styles:
  - Supportive (warm, encouraging)
  - Direct (straightforward, action-focused)
  - Motivational (high-energy, inspiring)
  - Analytical (data-driven, systematic)
  - Empathetic (compassionate, understanding)
- Custom system prompts per personality
- Voice customization per personality
- Default personality selection

#### Automatic Initialization
- 3 default coaches created on first use:
  - Supportive Coach (default)
  - Motivational Coach
  - Analytical Coach
- ElevenLabs agents auto-generated
- Instant access to multiple coaching styles

#### Dynamic Context
- User goals with milestones and progress
- Recent journal entries (last 5)
- RAG-retrieved relevant entries
- User statistics and insights
- Personality-specific prompts

#### Session Management
- Create voice coaching sessions
- Session history tracking
- Conversation transcripts
- Session analytics

#### Voice Customization
- Voice ID selection
- Voice stability control
- Voice similarity boost
- First message customization
- Language selection

### Technical Implementation

**Integration**:
- ElevenLabs Conversational AI
- WebSocket for real-time communication
- Signed URLs for secure access
- Agent-based architecture

**Database**:
- Firestore collection: `coach_personalities`
- Firestore collection: `voice_sessions`
- Composite indexes for queries
- Security rules for user isolation

**Components**:
- VoiceInterface for conversations
- CoachSessionsSidebar for history
- ConversationTranscript for playback
- AudioControls for playback
**API Endpoints**:
- `/coach-personalities` - Personality CRUD
- `/coach-personalities/:id/link-agent` - Link ElevenLabs agent
- `/voice-coach/session` - Create session
- `/voice-coach/signed-url` - Get signed URL

### Related Documentation
- [Voice Coach Feature Details](./features/voice-coach.md)
- [Coach Personalities](./features/voice-coach.md#personalities)
- [API Reference](./API_REFERENCE.md#voice-coach)
- [ElevenLabs Integration](./integrations/elevenlabs.md)

---

## RAG System

**Status**: ✅ Complete

### Overview
Retrieval-Augmented Generation system for semantic search and context-aware AI responses using Firebase vector store.

### Key Features

#### Semantic Search
- Vector-based similarity search
- Embedding generation with Google Gemini
- Relevance scoring
- Configurable result limits
- Metadata filtering

#### Document Management
- Automatic document embedding
- Document chunking for large entries
- Metadata extraction
- Document updates and deletions
- Batch operations

#### Vector Store
- Firebase Cloud Vector integration
- Efficient similarity search
- Indexed vector columns
- Scalable storage

#### Context Integration
- Relevant journal entries for chat
- Relevant entries for voice coach
- Context-aware responses
- Dynamic context building

#### Performance
- Rate limiting (10 requests/minute)
- Caching for frequent queries
- Batch embedding generation
- Optimized vector search

### Technical Implementation

**Stack**:
- Firebase vector search
- Google Gemini for embeddings
- NestJS service layer
- Firestore for storage

**Database**:
- Firestore collection: `journal_embeddings`
- Vector field with 768 dimensions
- Indexes for performance
- Security rules for data protection

**Components**:
- RAG service for embeddings
- Vector store service for search
- Context builder service
- Migration service for existing data

**API Endpoints**:
- `/rag/embed` - Generate embeddings
- `/rag/search` - Semantic search
- `/rag/migrate` - Migrate existing entries

### Related Documentation
- [RAG System Details](./features/rag-system.md)
- [Firebase Integration](./integrations/firebase.md)
- [API Reference](./API_REFERENCE.md#rag)

---

## Theming System

**Status**: ✅ Complete

### Overview
Comprehensive custom theming system with AI-powered recommendations, allowing full control over colors, typography, spacing, and visual effects.

### Key Features

#### Theme Creation
- Create unlimited custom themes
- Edit all theme properties
- Delete themes with safeguards
- Set default theme
- Switch themes instantly

#### Color Customization
- 19 customizable color properties
- HSL color format
- Color picker interface
- Live preview
- Color psychology integration

#### Typography Control
- Font family selection
- Base font size (10-24px)
- Heading scale (1-2)
- Line height (1-2.5)
- Font weight options

#### Spacing & Layout
- Spacing scale (0.5-2x multiplier)
- Layout density (compact, comfortable, spacious)
- Border radius (0-2rem)
- Shadow intensity (none, subtle, medium, strong)

#### Animations
- Animation duration (0-1000ms)
- Easing function selection
- Consistent motion design

#### AI Recommendations
- Color scheme suggestions
- Mood-based recommendations
- Color psychology explanations
- Typography suggestions
- Powered by Google Gemini

#### Theme Sharing
- Make themes public
- Generate shareable links
- Import themes from JSON
- Export themes to JSON
- Copy theme configurations

### Technical Implementation

**Architecture**:
- CSS variables for instant switching
- localStorage for persistence
- Firestore for cloud storage
- Theme context for state management

**Database**:
- Firestore collection: `user_themes`
- Security rules for user isolation
- Public theme sharing support

**Components**:
- ThemeEditor with tabbed interface
- ThemePreview for live preview
- ThemeLoader for initialization
- Theme settings page

**API Endpoints**:
- `/theme` - Theme CRUD operations
- `/theme/recommend` - AI recommendations
- `/theme/public/:id` - Get public theme

### Related Documentation
- [Theming Feature Details](./features/theming.md)
- [API Reference](./API_REFERENCE.md#themes)

---

## Custom Categories

**Status**: ✅ Complete

### Overview
User-defined goal categories with custom colors and icons, extending beyond default categories.

### Key Features

#### Category Management
- Create custom categories
- Edit category properties
- Delete categories (with goal reassignment)
- Unlimited categories per user

#### Category Customization
- Custom category names (1-50 characters)
- Custom colors (hex codes)
- Custom icons/emojis
- Visual indicators

#### Default Categories
- Career
- Health
- Personal
- Financial
- Relationships
- Learning
- Other

#### Category Usage
- Assign categories to goals
- Filter goals by category
- Category-based organization
- Visual category indicators

#### Category Protection
- Default categories cannot be deleted
- Deleting custom category moves goals to "Other"
- Duplicate name prevention
- User-scoped categories

### Technical Implementation

**Database**:
- Firestore collection: `custom_categories`
- Indexed fields: `user_id`, `name`, `created_at`
- Security rules for user isolation

**Components**:
- CategoryManager for CRUD operations
- Category selector in goal forms
- Category indicators on goal cards

**API Endpoints**:
- `/category` - Category CRUD operations
- `/category/:id` - Specific category operations

### Related Documentation
- [Categories Feature Details](./features/categories.md)
- [API Reference](./API_REFERENCE.md#categories)

---

## Platform Features

### Web Application

**Status**: ✅ Complete

#### Framework & Architecture
- Next.js 14+ with App Router
- TypeScript for type safety
- Server-side rendering (SSR)
- API routes for backend logic
- Middleware for auth and routing

#### UI/UX
- Tailwind CSS + shadcn/ui components
- Modern, clean aesthetic
- Fully responsive design (mobile-first)
- Dark mode support ready
- Accessibility compliant
- Loading states and skeletons
- Error boundaries
- Toast notifications

#### Performance
- Server-side rendering for fast initial load
- Code splitting and lazy loading
- Optimized images
- Virtualized lists for large datasets
- Efficient state management
- Real-time updates with Firestore

#### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive Web App (PWA) ready

### Backend API

**Status**: ✅ Complete

#### Framework
- NestJS with TypeScript
- Modular architecture
- Dependency injection
- Comprehensive error handling

#### Database
- Firestore for primary data
- Firebase for vector storage
- Real-time subscriptions
- Composite indexes
- Row-level security

#### External Integrations
- Firebase Authentication
- Google Gemini AI
- ElevenLabs Voice AI
- Firebase vector search

#### API Features
- RESTful endpoints
- Authentication guards
- Rate limiting
- Request validation
- Error handling
- Logging and monitoring

#### Deployment
- Google Cloud Run
- Docker containerization
- Environment-based configuration
- Automatic scaling
- Health checks

### Security

**Status**: ✅ Complete

#### Authentication Security
- Server-side authentication only
- HTTP-only cookies
- Secure token management
- Session expiry (5 days)
- Token revocation on logout

#### Data Security
- Row-level security (RLS)
- User data isolation
- No cross-user data access
- Encrypted connections (HTTPS)
- Secure API keys

#### API Security
- Authentication required for all endpoints
- Input validation
- Rate limiting
- CORS configuration
- Error message sanitization

---

## Feature Roadmap

### Phase 2 (Planned)

#### Authentication Enhancements
- 📋 Social authentication (Google, GitHub)
- 📋 Two-factor authentication (2FA)
- 📋 Biometric authentication
- 📋 Magic link login

#### Journal Enhancements
- 📋 Rich text formatting
- 📋 Image attachments
- 📋 Entry templates
- 📋 Tags and categories
- 📋 Mood tracking
- 📋 Entry reminders
- 📋 Export to PDF/Markdown

#### AI Coach Enhancements
- 📋 Multiple AI models support
- 📋 Custom coaching personas
- 📋 Goal tracking integration
- 📋 Progress analytics
- 📋 Habit tracking suggestions

#### Voice Coach Enhancements
- 📋 Voice cloning for personalized coaching
- 📋 Multi-language support
- 📋 Voice sample previews
- 📋 Personality effectiveness scoring
- 📋 Adaptive personality switching

### Phase 3 (Future)

#### Collaboration Features
- 📋 Shared journals
- 📋 Comments on entries
- 📋 Coach sharing
- 📋 Community features

#### Analytics & Insights
- 📋 Writing statistics
- 📋 Mood trends
- 📋 Word clouds
- 📋 Writing streaks
- 📋 Personal insights dashboard

#### Platform Features
- 📋 Offline mode with sync
- 📋 Push notifications
- 📋 Calendar integration
- 📋 Cloud backup
- 📋 Data export/import

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context + Hooks
- **Real-time**: Firestore subscriptions

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: Firestore + Firebase
- **AI**: Google Gemini + LangChain
- **Voice**: ElevenLabs Conversational AI

### Infrastructure
- **Hosting**: Google Cloud Run
- **Authentication**: Firebase Auth
- **Database**: Firestore + Firebase
- **Storage**: Firebase Storage
- **CDN**: Google Cloud CDN

### Development
- **Package Manager**: pnpm
- **Version Control**: Git
- **CI/CD**: Google Cloud Build
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Setup Guide](./SETUP.md)
- [API Reference](./API_REFERENCE.md)
- [Feature Details](./features/)
- [Integration Guides](./integrations/)

---

**For detailed information about specific features, see the [features/](./features/) directory.**

