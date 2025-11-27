# System Architecture

**Complete architecture documentation for the Journal application**

---

**Last Updated**: November 2024  
**Version**: 2.0  
**Status**: Current

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Web Application Architecture](#web-application-architecture)
4. [Backend API Architecture](#backend-api-architecture)
5. [Data Architecture](#data-architecture)
6. [Security Architecture](#security-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Scaling Considerations](#scaling-considerations)
9. [Related Documentation](#related-documentation)

---

## System Overview

The Journal application is a full-stack web application for personal journaling with AI-powered coaching capabilities. The system consists of a Next.js web frontend and a NestJS backend API, both integrated with Firebase services and Google Gemini AI.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Client Layer (Browser)                          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 14 Web Application                    │   │
│  │                          Port: 3000                              │   │
│  │                                                                  │   │
│  │  • App Router (Server & Client Components)                       │   │
│  │  • Server-Side Rendering (SSR)                                   │   │
│  │  • Real-time Streaming (SSE)                                     │   │
│  │  • HTTP-only Session Cookies                                     │   │
│  │  • Tailwind CSS + shadcn/ui                                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
         HTTPS/REST API    Session Cookies   WebSocket/SSE
         Bearer Tokens                        (Streaming)
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                         Backend API Layer                               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    NestJS Backend API                            │   │
│  │                      Port: 3001                                  │   │
│  │                                                                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │   │
│  │  │   Auth   │ │ Journal  │ │   Chat   │ │   Goal   │ │  RAG   │  │   │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │ Module │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘  │   │
│  │                                                                  │   │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │   │
│  │  │  Voice   │ │  Coach    │ │  Theme   │ │ Category │ │ Prompt │ │   │
│  │  │  Coach   │ │Personality│ │  Module  │ │  Module  │ │ Module │ │   │
│  │  └──────────┘ └───────────┘ └──────────┘ └──────────┘ └────────┘ │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐    │   │
│  │  │              Core Services Layer                         │    │   │
│  │  │                                                          │    │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │    │   │
│  │  │  │ Firebase │ │  Gemini  │ │ElevenLabs│ │   Rate   │     │    │   │
│  │  │  │ Service  │ │ Service  │ │ Service  │ │  Limit   │     │    │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │    │   │
│  │  └──────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
         ┌──────────────┐  ┌──────────┐  ┌──────────────┐
         │   Firebase   │  │  Google  │  │  ElevenLabs  │
         │    Cloud     │  │  Gemini  │  │  Voice API   │
         │              │  │    AI    │  │              │
         │ • Firestore  │  │          │  │ • Text-to-   │
         │ • Auth       │  │ • Gemini │  │   Speech     │
         │ • Storage    │  │   2.0    │  │ • Voice      │
         │ • Real-time  │  │ • Flash  │  │   Cloning    │
         └──────────────┘  │ • Embed  │  └──────────────┘
                           └──────────┘
```

### Component Interactions

- **Web App → Backend API**: REST API calls with Bearer token authentication
- **Web App → Firebase**: Direct client SDK for real-time listeners (optional)
- **Backend → Firebase**: Firebase Admin SDK for all database operations
- **Backend → Gemini AI**: AI coaching, insights, embeddings, and recommendations
- **Backend → ElevenLabs**: Voice synthesis for voice coach feature
- **Streaming**: Server-Sent Events (SSE) for real-time AI response streaming

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.3 | React framework with App Router |
| **React** | 19.2.0 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **shadcn/ui** | Latest | Component library |
| **Radix UI** | Latest | Accessible component primitives |
| **React Markdown** | 9.0.1 | Markdown rendering |
| **date-fns** | 4.1.0 | Date manipulation |
| **Lucide React** | 0.554.0 | Icon library |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 10.3.0 | Node.js framework |
| **TypeScript** | 5.3.3 | Type safety |
| **Firebase Admin** | 13.0.1 | Firebase server SDK |
| **Google Generative AI** | 0.21.0 | Gemini AI integration |
| **ElevenLabs** | 1.59.0 | Voice synthesis |
| **class-validator** | 0.14.0 | DTO validation |
| **class-transformer** | 0.5.1 | Object transformation |
| **RxJS** | 7.8.1 | Reactive programming |
| **UUID** | 9.0.1 | Unique ID generation |

### Infrastructure & Services

| Service | Purpose |
|---------|---------|
| **Firebase Firestore** | NoSQL database |
| **Firebase Authentication** | User authentication |
| **Firebase Storage** | File storage |
| **Google Gemini AI** | AI coaching and embeddings |
| **ElevenLabs** | Voice synthesis |
| **Google Cloud Run** | Container hosting |
| **Docker** | Containerization |

### Development Tools

| Tool | Purpose |
|------|---------|
| **pnpm** | Package manager |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Jest** | Testing framework |
| **ts-node** | TypeScript execution |

---

## Web Application Architecture

### Next.js App Router Structure

The web application uses Next.js 14's App Router with a mix of server and client components for optimal performance.

```
web/app/
├── layout.tsx                 # Root layout with ThemeProvider
├── page.tsx                   # Landing page (public)
│
├── api/                       # Server-side API routes
│   ├── auth/                  # Authentication endpoints
│   │   ├── login/route.ts     # POST /api/auth/login
│   │   ├── signup/route.ts    # POST /api/auth/signup
│   │   ├── logout/route.ts    # POST /api/auth/logout
│   │   ├── user/route.ts      # GET /api/auth/user
│   │   └── token/route.ts     # GET /api/auth/token
│   └── ...                    # Other API routes
│
├── auth/                      # Authentication pages (public)
│   ├── login/page.tsx
│   └── signup/page.tsx
│
├── app/                       # Protected application
│   ├── layout.tsx             # App layout with navigation
│   ├── page.tsx               # Dashboard/home
│   │
│   ├── journal/               # Journal management
│   │   ├── page.tsx           # Journal list
│   │   ├── new/page.tsx       # Create entry
│   │   └── [id]/page.tsx      # View/edit entry
│   │
│   ├── goals/                 # Goal tracking
│   │   ├── page.tsx           # Goals list
│   │   ├── [id]/page.tsx      # Goal details
│   │   └── settings/page.tsx  # Goal categories
│   │
│   ├── coach/page.tsx         # AI text coach
│   ├── ai-agent/page.tsx      # Voice AI coach
│   │
│   └── settings/              # User settings
│       ├── page.tsx           # Settings home
│       └── themes/page.tsx    # Theme customization
│
└── middleware.ts              # Route protection
```

### Server vs Client Components

**Server Components** (default):
- Layouts and pages
- Data fetching components
- Static content
- SEO-critical content

**Client Components** (`'use client'`):
- Interactive UI elements
- State management
- Event handlers
- Real-time updates
- Forms with validation

### Authentication Flow

The application uses **100% server-side authentication** with Firebase Admin SDK:

1. **Session Creation**: User logs in → Server creates session cookie (5-day expiry)
2. **Session Storage**: HTTP-only, secure cookie stored in browser
3. **Route Protection**: Middleware checks cookie presence on protected routes
4. **Token Verification**: API routes verify session with Firebase Admin SDK
5. **Session Revocation**: Logout revokes refresh tokens and deletes cookie

**Key Security Features**:
- No client-side token exposure
- HTTP-only cookies prevent XSS attacks
- Secure flag for HTTPS-only transmission
- SameSite attribute for CSRF protection
- Server-side verification on every request

See [Security Architecture](#security-architecture) for detailed authentication flows.

### Streaming Architecture

The application uses Server-Sent Events (SSE) for real-time AI response streaming:

**Flow**:
1. User sends message → Frontend calls streaming endpoint
2. Backend starts generating AI response
3. Backend yields chunks via SSE as they're generated
4. Frontend receives and displays chunks in real-time
5. Complete message saved when stream ends

**Benefits**:
- Better perceived performance
- Progressive content rendering
- Natural conversation feel
- Graceful error handling

**Event Types**:
- `session`: Initial metadata (session ID, user message)
- `chunk`: Partial AI response text
- `done`: Complete message with full content

### State Management

**Context Providers**:
- `AuthContext`: User authentication state
- `ThemeContext`: Theme customization
- `GoalContext`: Goal tracking state

**Custom Hooks**:
- `useAuth()`: Authentication operations
- `useChat()`: AI coach interactions
- `useGoalChat()`: Goal-specific AI coaching
- `useThemes()`: Theme management
- `useMilestoneCounts()`: Goal progress tracking

### Real-time Features

- **Firestore Listeners**: Real-time updates for journal entries and goals
- **SSE Streaming**: Live AI response generation
- **Optimistic Updates**: Immediate UI feedback before server confirmation

---

## Backend API Architecture

### NestJS Module Architecture

The backend follows NestJS's modular architecture with clear separation of concerns:

```
backend/src/
├── app.module.ts              # Root module
├── main.ts                    # Application entry point
│
├── auth/                      # Authentication
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
│
├── journal/                   # Journal entries
│   ├── journal.controller.ts
│   ├── journal.service.ts
│   └── journal.module.ts
│
├── goal/                      # Goal tracking
│   ├── goal.controller.ts
│   ├── goal.service.ts
│   └── goal.module.ts
│
├── chat/                      # AI text coach
│   ├── chat.controller.ts
│   ├── chat.service.ts
│   └── chat.module.ts
│
├── voice-coach/               # Voice AI coach
│   ├── voice-coach.controller.ts
│   ├── voice-coach.service.ts
│   ├── context-builder.service.ts
│   ├── metrics.service.ts
│   └── voice-coach.module.ts
│
├── coach-personality/         # Coach personalities
│   ├── coach-personality.controller.ts
│   ├── coach-personality.service.ts
│   └── coach-personality.module.ts
│
├── rag/                       # RAG system
│   ├── rag.controller.ts
│   ├── rag.service.ts
│   ├── vector-store.service.ts
│   └── rag.module.ts
│
├── theme/                     # Theme customization
│   ├── theme.controller.ts
│   ├── theme.service.ts
│   └── theme.module.ts
│
├── category/                  # Custom categories
│   ├── category.controller.ts
│   ├── category.service.ts
│   └── category.module.ts
│
├── prompt/                    # AI prompts
│   ├── prompt.controller.ts
│   ├── prompt.service.ts
│   └── prompt.module.ts
│
├── firebase/                  # Firebase Admin SDK
│   ├── firebase.service.ts
│   └── firebase.module.ts
│
├── gemini/                    # Google Gemini AI
│   ├── gemini.service.ts
│   └── gemini.module.ts
│
├── elevenlabs/                # Voice synthesis
│   ├── elevenlabs.service.ts
│   └── elevenlabs.module.ts
│
└── common/                    # Shared resources
    ├── dto/                   # Data Transfer Objects
    ├── guards/                # Auth guards
    ├── decorators/            # Custom decorators
    ├── services/              # Shared services
    └── types/                 # TypeScript types
```

### Module Descriptions

#### 1. Auth Module
**Purpose**: User authentication and authorization

**Endpoints**:
- `POST /auth/signup` - Create new user
- `POST /auth/verify` - Verify Firebase token
- `GET /auth/me` - Get current user
- `PUT /auth/user/:uid` - Update user
- `DELETE /auth/user/:uid` - Delete user

**Dependencies**: Firebase Service

### 2. Journal Module

**Purpose**: Manage journal entries (CRUD operations)

```
journal/
├── journal.controller.ts → HTTP endpoints
├── journal.service.ts    → Business logic
└── journal.module.ts     → Module configuration

Dependencies:
  → Firebase Service (for Firestore operations)
  → Auth Guard (for authentication)

Endpoints:
  GET    /journal
  POST   /journal
  GET    /journal/:id
  PUT    /journal/:id
  DELETE /journal/:id
  GET    /journal/search?q=term
  GET    /journal/recent?limit=10
```

### 3. Chat Module

**Purpose**: AI coaching conversations and insights

```
chat/
├── chat.controller.ts    → HTTP endpoints
├── chat.service.ts       → Business logic
└── chat.module.ts        → Module configuration

Dependencies:
  → Firebase Service (for session storage)
  → Gemini Service (for AI operations)
  → Journal Service (for context)
  → Auth Guard (for authentication)

Endpoints:
  POST   /chat/message
  POST   /chat/session
  GET    /chat/sessions
  GET    /chat/session/:id
  DELETE /chat/session/:id
  GET    /chat/insights
  GET    /chat/prompts
```

### 4. Firebase Module

**Purpose**: Provide Firebase Admin SDK functionality

```
firebase/
├── firebase.service.ts   → Firebase operations
└── firebase.module.ts    → Module configuration

Provides:
  • Auth operations (create, verify, delete users)
  • Firestore CRUD (add, get, update, delete)
  • Custom token generation
  • Batch operations
  • Transaction support

Global Module: Available to all other modules
```

### 5. Gemini Module

**Purpose**: Provide Google Gemini AI functionality

```
gemini/
├── gemini.service.ts     → AI operations
└── gemini.module.ts      → Module configuration

Provides:
  • Send AI messages
  • Generate insights
  • Suggest prompts
  • Context-aware coaching

Global Module: Available to all other modules
```

## 🔐 Authentication Flow

```
┌─────────┐                                ┌──────────┐
│ Client  │                                │ Firebase │
│         │                                │   Auth   │
└────┬────┘                                └────┬─────┘
     │                                          │
     │ 1. Sign in with email/password           │
     ├─────────────────────────────────────────►│
     │                                          │
     │ 2. Return Firebase ID Token              │
     │◄─────────────────────────────────────────┤
     │                                          │
     │                                          │
┌────▼────┐                              ┌──────▼────┐
│ Client  │                              │  Backend  │
│         │                              │    API    │
└────┬────┘                              └─────┬─────┘
     │                                         │
     │ 3. Request with Bearer Token            │
     │    Authorization: Bearer <token>        │
     ├────────────────────────────────────────►│
     │                                         │
     │                         4. Verify Token │
     │                         with Firebase   │
     │                                    ┌────┴────┐
     │                                    │Firebase │
     │                                    │ Admin   │
     │                                    └────┬────┘
     │                                         │
     │ 5. Return Protected Resource            │
     │◄────────────────────────────────────────┤
     │                                         │
```

## 🔄 Request Flow

### Example: Create Journal Entry

```
1. Client Request
   POST /api/v1/journal
   Headers:
     Authorization: Bearer <firebase-id-token>
     Content-Type: application/json
   Body:
     { "title": "My Entry", "content": "..." }

2. Middleware Layer
   ├─ CORS Check
   ├─ Request Validation
   └─ Parse JSON Body

3. Auth Guard
   ├─ Extract token from Authorization header
   ├─ Verify token with Firebase Admin
   ├─ Add user info to request object
   └─ Continue or throw UnauthorizedException

4. Controller (journal.controller.ts)
   ├─ Receive request
   ├─ Extract user from @CurrentUser decorator
   ├─ Validate DTO with class-validator
   └─ Call service method

5. Service (journal.service.ts)
   ├─ Prepare data
   ├─ Add user_id, timestamps
   └─ Call Firebase service

6. Firebase Service (firebase.service.ts)
   ├─ Connect to Firestore
   ├─ Add document to collection
   └─ Return result

7. Response
   ├─ Format response
   ├─ Set HTTP status code
   └─ Return JSON to client
```

## 🗄️ Data Models

### User (Firebase Auth)
```typescript
{
  uid: string
  email: string
  displayName?: string
  emailVerified: boolean
  createdAt: string
}
```

### Journal Entry (Firestore)
```typescript
{
  id: string
  user_id: string
  title: string
  content: string
  mood?: string
  tags?: string[]
  created_at: Timestamp
  updated_at: Timestamp
}
```

### Chat Session (Firestore)
```typescript
{
  id: string
  user_id: string
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
  created_at: Timestamp
  updated_at: Timestamp
}
```

## 🛡️ Security Layers

```
┌─────────────────────────────────────────┐
│         Request from Client             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Layer 1: CORS Policy                │
│     ✓ Origin validation                 │
│     ✓ Allowed methods                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Layer 2: Request Validation         │
│     ✓ DTO validation                    │
│     ✓ Type checking                     │
│     ✓ Required fields                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Layer 3: Authentication (Guard)     │
│     ✓ Token verification                │
│     ✓ User identification               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Layer 4: Authorization (Service)    │
│     ✓ Resource ownership check          │
│     ✓ User permissions                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Layer 5: Firebase Rules             │
│     ✓ Server-side validation            │
│     ✓ Data access rules                 │
└──────────────┬──────────────────────────┘
               │
               ▼
          [Resource Access]
```

## 📊 Dependency Injection

```
AppModule (Root)
│
├─ ConfigModule (Global)
│  └─ Environment variables
│
├─ FirebaseModule (Global)
│  └─ FirebaseService
│     ├─ Firebase Admin SDK
│     ├─ Auth operations
│     └─ Firestore operations
│
├─ GeminiModule
│  └─ GeminiService
│     └─ Google Gemini AI
│
├─ AuthModule
│  ├─ AuthController
│  └─ AuthService
│     └─ uses: FirebaseService
│
├─ JournalModule
│  ├─ JournalController
│  │  └─ uses: AuthGuard
│  └─ JournalService
│     └─ uses: FirebaseService
│
└─ ChatModule
   ├─ ChatController
   │  └─ uses: AuthGuard
   └─ ChatService
      ├─ uses: FirebaseService
      ├─ uses: GeminiService
      └─ uses: JournalService
```

## 🚀 Scaling Strategy

### Horizontal Scaling
```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     ▼
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
       ├─────────┬─────────┬─────────┐
       ▼         ▼         ▼         ▼
   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
   │Backend│  │Backend│  │Backend│  │Backend│
   │  #1  │  │  #2  │  │  #3  │  │  #4  │
   └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘
      │         │         │         │
      └─────────┴─────────┴─────────┘
                │
                ▼
         ┌─────────────┐
         │  Firebase   │
         │  (Shared)   │
         └─────────────┘
```

### Caching Layer (Optional)
```
Backend → Redis Cache → Firebase
         (Fast)        (Persistent)
```

## 🧪 Testing Architecture

```
Unit Tests
├─ Services (Business Logic)
│  ├─ AuthService.spec.ts
│  ├─ JournalService.spec.ts
│  └─ ChatService.spec.ts
│
Integration Tests
├─ Controllers (API Endpoints)
│  ├─ AuthController.spec.ts
│  ├─ JournalController.spec.ts
│  └─ ChatController.spec.ts
│
E2E Tests
└─ Complete user flows
   ├─ Sign up → Create Entry → Chat
   └─ Authentication flow
```

## 📈 Performance Considerations

1. **Connection Pooling**: Firebase Admin SDK reuses connections
2. **Response Caching**: Can add Redis for frequently accessed data
3. **Lazy Loading**: Modules loaded on demand
4. **Stream Processing**: Large responses can be streamed
5. **Rate Limiting**: Can add throttling middleware
6. **Compression**: Enable gzip for responses

## 🔍 Monitoring & Logging

```
Application Layer
├─ Request/Response logging
├─ Error tracking
└─ Performance metrics

Service Layer
├─ Firebase operation logs
├─ AI API call logs
└─ Database query logs

Infrastructure Layer
├─ CPU/Memory usage
├─ Network traffic
└─ Response times
```

## 🎯 Best Practices Implemented

1. ✅ **Separation of Concerns**: Each module handles specific domain
2. ✅ **Dependency Injection**: Loose coupling, easy testing
3. ✅ **DTO Validation**: Type-safe request validation
4. ✅ **Error Handling**: Consistent error responses
5. ✅ **Authentication**: JWT token-based auth
6. ✅ **Authorization**: Resource ownership checks
7. ✅ **Logging**: Comprehensive logging strategy
8. ✅ **Documentation**: Complete API documentation
9. ✅ **Type Safety**: Full TypeScript coverage
10. ✅ **Modular Design**: Easy to extend and maintain

---

This architecture provides a solid foundation that can scale with your application's growth!


## Data Architecture

### Firestore Collections

The application uses Firebase Firestore with the following collection structure:

```
firestore/
├── profiles/                          # User profiles
│   └── {userId}/
│       ├── email: string
│       ├── full_name: string
│       ├── created_at: Timestamp
│       └── updated_at: Timestamp
│
├── journal_entries/                   # Journal entries
│   └── {entryId}/
│       ├── user_id: string
│       ├── title: string
│       ├── content: string
│       ├── mood?: string
│       ├── tags?: string[]
│       ├── created_at: Timestamp
│       └── updated_at: Timestamp
│
├── goals/                             # User goals
│   └── {goalId}/
│       ├── user_id: string
│       ├── title: string
│       ├── description: string
│       ├── category: string
│       ├── target_date?: Timestamp
│       ├── status: string
│       ├── created_at: Timestamp
│       └── updated_at: Timestamp
│
├── milestones/                        # Goal milestones
│   └── {milestoneId}/
│       ├── goal_id: string
│       ├── user_id: string
│       ├── title: string
│       ├── description: string
│       ├── completed: boolean
│       ├── completed_at?: Timestamp
│       ├── created_at: Timestamp
│       └── updated_at: Timestamp
│
├── progress_updates/                  # Goal progress
│   └── {updateId}/
│       ├── goal_id: string
│       ├── user_id: string
│       ├── content: string
│       ├── created_at: Timestamp
│       └── updated_at: Timestamp
│
├── chat_sessions/                     # AI coach sessions
│   └── {sessionId}/
│       ├── user_id: string
│       ├── messages: Message[]
│       ├── created_at: Timestamp
│       └── updated_at: Timestamp
│
├── voice_sessions/                    # Voice coach sessions
│   └── {sessionId}/
│       ├── user_id: string
│       ├── personality_id: string
│       ├── conversation: Conversation[]
│       ├── metrics: SessionMetrics
│       ├── created_at: Timestamp
│       └── updated_at: Timestamp
│
├── coach_personalities/               # Coach personalities
│   └── {personalityId}/
│       ├── name: string
│       ├── description: string
│       ├── voice_id: string
│       ├── system_prompt: string
│       ├── is_default: boolean
│       ├── created_at: Timestamp
│       └── updated_at: Timestamp
│
├── user_themes/                       # Custom themes
│   └── {themeId}/
│       ├── user_id: string
│       ├── name: string
│       ├── is_default: boolean
│       ├── is_public: boolean
│       ├── colors: ThemeColors
│       ├── typography: ThemeTypography
│       ├── spacing: ThemeSpacing
│       ├── created_at: Timestamp
│       └── updated_at: Timestamp
│
├── custom_categories/                 # Goal categories
│   └── {categoryId}/
│       ├── user_id: string
│       ├── name: string
│       ├── icon: string
│       ├── color: string
│       ├── created_at: Timestamp
│       └── updated_at: Timestamp
│
├── rag_embeddings/                    # RAG vector embeddings
│   └── {embeddingId}/
│       ├── user_id: string
│       ├── content_type: string
│       ├── content_id: string
│       ├── content_text: string
│       ├── embedding: number[]
│       ├── metadata: object
│       ├── created_at: Timestamp
│       └── updated_at: Timestamp
│
└── prompts/                           # AI prompts
    └── {promptId}/
        ├── category: string
        ├── text: string
        ├── is_active: boolean
        ├── created_at: Timestamp
        └── updated_at: Timestamp
```

### Data Relationships

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
  │
  ├─► user_themes (1:many)
  │
  ├─► custom_categories (1:many)
  │
  └─► rag_embeddings (1:many)
```

### Indexes

**Composite Indexes** (defined in `firestore.indexes.json`):

1. **journal_entries**: `user_id` (ASC) + `created_at` (DESC)
2. **goals**: `user_id` (ASC) + `status` (ASC) + `created_at` (DESC)
3. **milestones**: `goal_id` (ASC) + `completed` (ASC)
4. **chat_sessions**: `user_id` (ASC) + `updated_at` (DESC)
5. **rag_embeddings**: `user_id` (ASC) + `content_type` (ASC) + `created_at` (DESC)

### RAG Vector Store

The RAG (Retrieval-Augmented Generation) system uses Firestore to store vector embeddings:

**Embedding Generation**:
- Content is converted to embeddings using Gemini's `text-embedding-004` model
- Embeddings are 768-dimensional vectors
- Stored alongside original content and metadata

**Semantic Search**:
- Query is converted to embedding
- Cosine similarity calculated against stored embeddings
- Top-k most similar documents retrieved
- Results filtered by similarity threshold (default: 0.7)

**Supported Content Types**:
- Journal entries
- Goals
- Milestones
- Progress updates

---

## Security Architecture

### Authentication System

The application uses **100% server-side authentication** with Firebase Admin SDK.

#### Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                        │
│                                                                 │
│  ┌──────────────┐    ┌────────────┐    ┌──────────────────┐     │
│  │  Login Page  │    │  useAuth   │    │  App Components  │     │
│  │  Signup Page │───▶│    Hook    │◀───│   (Protected)    │     │
│  └──────────────┘    └────────────┘    └──────────────────┘     │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    Fetch API (HTTP)
                    with credentials
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                   Next.js Server (API Routes)                    │
│                            │                                     │
│  ┌─────────────────────────▼────────────────────────────────┐    │
│  │               Middleware (middleware.ts)                 │    │
│  │  - Check session cookie presence                         │    │
│  │  - Redirect unauthenticated users to /auth/login         │    │
│  │  - Redirect authenticated users away from auth pages     │    │
│  └────────────────────────┬─────────────────────────────────┘    │
│                            │                                     │
│  ┌─────────────────────────▼──────────────────────────────────┐  │
│  │              API Routes (/app/api/auth/)                   │  │
│  │                                                            │  │
│  │  POST /api/auth/login     - Authenticate user              │  │
│  │  POST /api/auth/signup    - Create new user                │  │
│  │  POST /api/auth/logout    - Revoke session                 │  │
│  │  GET  /api/auth/user      - Get current user               │  │
│  │  GET  /api/auth/token     - Get session token for backend  │  │
│  │                                                            │  │
│  └─────────────────────────┬──────────────────────────────────┘  │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                    Firebase Admin SDK
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                    Firebase Authentication                       │
│                                                                  │
│  - User Management                                               │
│  - Session Cookie Creation/Verification                          │
│  - Token Management                                              │
│  - Refresh Token Revocation                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### Session Management

**Session Cookie Properties**:

| Property | Value | Purpose |
|----------|-------|---------|
| Name | `session` | Cookie identifier |
| Type | HTTP-only | Prevents JavaScript access (XSS protection) |
| Secure | `true` in production | HTTPS-only transmission |
| SameSite | `lax` | CSRF protection |
| Max Age | 5 days (432,000 seconds) | Session duration |
| Path | `/` | Available to all routes |

**Session Lifecycle**:
1. **Creation**: When user signs in or signs up
2. **Validation**: On every API request and page navigation
3. **Refresh**: Not automatic - user must re-login after 5 days
4. **Revocation**: On logout or when refresh tokens are revoked
5. **Expiration**: Automatically after 5 days

### Security Layers

1. **HTTP-Only Cookies**: JavaScript cannot access session cookie
2. **Secure Flag (Production)**: Cookie only sent over HTTPS
3. **SameSite Attribute**: Cookie not sent with cross-site requests
4. **Server-Side Verification**: Every request verified with Firebase Admin
5. **Token Revocation**: Refresh tokens revoked on logout
6. **Short Session Duration**: 5-day maximum session life
7. **No Client-Side Tokens**: All tokens stay server-side

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Profiles
    match /profiles/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Journal entries
    match /journal_entries/{entryId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // Goals
    match /goals/{goalId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // Milestones
    match /milestones/{milestoneId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // Progress updates
    match /progress_updates/{updateId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // Chat sessions
    match /chat_sessions/{sessionId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // Voice sessions
    match /voice_sessions/{sessionId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // User themes
    match /user_themes/{themeId} {
      allow read: if isOwner(resource.data.user_id) || resource.data.is_public == true;
      allow write: if isOwner(resource.data.user_id);
    }
    
    // Custom categories
    match /custom_categories/{categoryId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // RAG embeddings
    match /rag_embeddings/{embeddingId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    // Coach personalities (read-only for users)
    match /coach_personalities/{personalityId} {
      allow read: if isAuthenticated();
      allow write: if false; // Admin only
    }
    
    // Prompts (read-only for users)
    match /prompts/{promptId} {
      allow read: if isAuthenticated();
      allow write: if false; // Admin only
    }
  }
}
```

### Rate Limiting

The backend implements rate limiting to prevent abuse:

**Limits**:
- **Chat Messages**: 50 per hour per user
- **Insights Generation**: 10 per hour per user
- **Voice Sessions**: 20 per hour per user
- **RAG Queries**: 100 per hour per user

**Implementation**:
- In-memory rate limiting using NestJS guards
- Can be upgraded to Redis for distributed systems
- Returns 429 (Too Many Requests) when exceeded

---

## Deployment Architecture

### Google Cloud Run Deployment

Both web and backend applications are deployed as containerized services on Google Cloud Run.

```
┌─────────────────────────────────────────────────────────────┐
│                     Google Cloud Platform                   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Cloud Run (Web App)                     │   │
│  │                                                      │   │
│  │  • Next.js 14 Application                            │   │
│  │  • Auto-scaling (0-100 instances)                    │   │
│  │  • HTTPS with managed SSL                            │   │
│  │  • Custom domain support                             │   │
│  │  • Environment variables from Secret Manager         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Cloud Run (Backend API)                   │   │
│  │                                                      │   │
│  │  • NestJS Application                                │   │
│  │  • Auto-scaling (0-100 instances)                    │   │
│  │  • HTTPS with managed SSL                            │   │
│  │  • Environment variables from Secret Manager         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Container Registry                      │   │
│  │                                                      │   │
│  │  • Docker images for web and backend                 │   │
│  │  • Versioned image tags                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Secret Manager                          │   │
│  │                                                      │   │
│  │  • Firebase service account keys                     │   │
│  │  • API keys (Gemini, ElevenLabs)                     │   │
│  │  • Environment variables                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                             │
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Firebase   │  │    Gemini    │  │  ElevenLabs  │      │
│  │    Cloud     │  │      AI      │  │   Voice API  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Docker Configuration

**Web Application Dockerfile**:
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY . .
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

**Backend API Dockerfile**:
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY . .
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main"]
```

### CI/CD Pipeline

**Deployment Steps**:
1. Code pushed to repository
2. Cloud Build triggered
3. Docker images built
4. Images pushed to Container Registry
5. Cloud Run services updated
6. Health checks performed
7. Traffic routed to new version

**Environment Variables**:
- Stored in Google Secret Manager
- Injected at runtime
- Separate configs for dev/staging/production

---

## Scaling Considerations

### Horizontal Scaling

**Cloud Run Auto-Scaling**:
- Automatically scales based on request volume
- Scales to zero when idle (cost-effective)
- Can handle sudden traffic spikes
- Configurable min/max instances

**Stateless Design**:
- No server-side session storage (uses Firebase)
- Each request is independent
- Can scale horizontally without issues

### Database Scaling

**Firestore**:
- Automatically scales with usage
- No manual sharding required
- Handles millions of operations per second
- Global distribution available

**Optimization Strategies**:
1. **Composite Indexes**: Optimize complex queries
2. **Denormalization**: Reduce read operations
3. **Batch Operations**: Group writes for efficiency
4. **Caching**: Add Redis for frequently accessed data

### Performance Optimization

**Frontend**:
- Server-side rendering (SSR) for fast initial load
- Code splitting and lazy loading
- Image optimization
- CDN for static assets

**Backend**:
- Connection pooling (Firebase Admin SDK)
- Response compression (gzip)
- Streaming for large responses
- Rate limiting to prevent abuse

**Monitoring**:
- Cloud Monitoring for metrics
- Error tracking and alerting
- Performance profiling
- Cost monitoring

---

## Related Documentation

### Detailed Architecture Documentation

For more detailed information on specific architectural components, see:

- **[System Overview](architecture/system-overview.md)** - High-level system design
- **[Web Architecture](architecture/web-architecture.md)** - Next.js application details
- **[Backend Architecture](architecture/backend-architecture.md)** - NestJS API details
- **[Data Models](architecture/data-models.md)** - Database schema and relationships
- **[Security Architecture](architecture/security-architecture.md)** - Authentication and authorization

### Feature Documentation

- **[Features Overview](FEATURES.md)** - Complete feature catalog
- **[Authentication](features/authentication.md)** - Auth system details
- **[Goals](features/goals.md)** - Goal tracking system
- **[Voice Coach](features/voice-coach.md)** - Voice AI coach
- **[RAG System](features/rag-system.md)** - Semantic search and embeddings
- **[Theming](features/theming.md)** - Custom theme system

### Setup and Deployment

- **[Setup Guide](SETUP.md)** - Complete setup instructions
- **[Backend Setup](backend/BACKEND_README.md)** - Backend-specific setup
- **[Web Setup](web/WEB_README.md)** - Frontend-specific setup
- **[Database Setup](setup/database-setup.md)** - Firestore configuration

### API Documentation

- **[API Reference](API_REFERENCE.md)** - Complete API documentation
- **[Authentication API](api/authentication-api.md)** - Auth endpoints
- **[Goals API](api/goals-api.md)** - Goal management endpoints
- **[Chat API](api/chat-api.md)** - AI coach endpoints

---

**Last Updated**: November 2024  
**Version**: 2.0  
**Status**: Current

This architecture documentation provides a comprehensive overview of the Journal application's system design, technology stack, and implementation details. For specific implementation guidance, refer to the related documentation links above.
