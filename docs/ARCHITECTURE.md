# Backend Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│                     (Next.js Web App)                           │
│                      Port: 3000                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTPS/REST API
                           │ Bearer Token Authentication
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    NestJS Backend API                           │
│                      Port: 3001                                 │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │  Auth Module   │  │ Journal Module │  │  Chat Module   │     │
│  │                │  │                │  │                │     │
│  │ • Sign Up      │  │ • Create Entry │  │ • Send Message │     │
│  │ • Verify Token │  │ • Read Entries │  │ • Chat Session │     │
│  │ • Get User     │  │ • Update Entry │  │ • AI Insights  │     │
│  │ • Update User  │  │ • Delete Entry │  │ • Prompts      │     │
│  └────────┬───────┘  └───────┬────────┘  └─────────┬──────┘     │
│           │                  │                     │            │
│           └──────────────────┼─────────────────────┘            │
│                              │                                  │
│  ┌───────────────────────────▼─────────────────────────────┐    │
│  │              Core Services Layer                        │    │
│  │                                                         │    │
│  │  ┌──────────────────┐        ┌──────────────────        │    │
│  │  │ Firebase Service │        │  Gemini Service  │       │    │
│  │  │                  │        │                  │       │    │
│  │  │ • Auth Ops       │        │ • Chat AI        │       │    │
│  │  │ • Firestore CRUD │        │ • Insights       │       │    │
│  │  │ • User Mgmt      │        │ • Prompts        │       │    │
│  │  └────────┬─────────┘        └────────┬─────────┘       │    │
│  └───────────┼───────────────────────────┼─────────────────┘    │
└──────────────┼───────────────────────────┼──────────────────────┘
               │                           │
               │                           │
      ┌────────▼────────┐          ┌───────▼────────┐
      │  Firebase Cloud │          │  Google Gemini │
      │                 │          │       AI       │
      │ • Firestore DB  │          │                │
      │ • Auth          │          │ • Gemini 2.0   │
      │ • Real-time     │          │ • Flash Model  │
      └─────────────────┘          └────────────────┘
```

## 📦 Module Architecture

### 1. Auth Module

**Purpose**: Handle user authentication and authorization

```
auth/
├── auth.controller.ts    → HTTP endpoints
├── auth.service.ts       → Business logic
└── auth.module.ts        → Module configuration

Dependencies:
  → Firebase Service (for auth operations)

Endpoints:
  POST   /auth/signup
  POST   /auth/verify
  GET    /auth/me
  PUT    /auth/user/:uid
  DELETE /auth/user/:uid
```

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

