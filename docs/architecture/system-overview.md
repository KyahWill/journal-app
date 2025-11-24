# System Overview

**High-level system design and component interactions**

---

**Last Updated**: November 2025  
**Status**: Current

---

## Introduction

The Journal application is a modern full-stack web application that combines personal journaling with AI-powered executive coaching. The system is built on a microservices-inspired architecture with clear separation between frontend and backend concerns.

## System Components

### 1. Web Application (Frontend)

**Technology**: Next.js 14 with App Router  
**Port**: 3000  
**Hosting**: Google Cloud Run

**Responsibilities**:
- User interface and experience
- Server-side rendering (SSR)
- Client-side interactivity
- Session management
- Real-time updates

### 2. Backend API

**Technology**: NestJS  
**Port**: 3001  
**Hosting**: Google Cloud Run

**Responsibilities**:
- Business logic
- Data validation
- Authentication/authorization
- External service integration
- Rate limiting

### 3. Firebase Cloud

**Services Used**:
- **Firestore**: NoSQL database
- **Authentication**: User management
- **Storage**: File storage (future)

**Responsibilities**:
- Data persistence
- User authentication
- Real-time synchronization

### 4. Google Gemini AI

**Model**: Gemini 2.0 Flash  
**Capabilities**:
- Text generation
- Embeddings (text-embedding-004)
- Streaming responses

**Responsibilities**:
- AI coaching conversations
- Insight generation
- Semantic embeddings for RAG
- Theme recommendations

### 5. ElevenLabs Voice API

**Capabilities**:
- Text-to-speech synthesis
- Voice cloning
- Multiple voice options

**Responsibilities**:
- Voice coach audio generation
- Natural-sounding speech
- Personality-matched voices

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                           User/Browser                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                      Next.js Web App                             │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐   │
│  │   Pages    │  │    API     │  │Components  │  │  Hooks   │   │
│  │ (Routes)   │  │  Routes    │  │   (UI)     │  │ (Logic)  │   │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘   │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         REST API      Session      Firestore
         (Backend)     Cookies      (Direct)
                │            │            │
                └────────────┼────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                      NestJS Backend API                          │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Controllers│  │ Services │  │  Guards  │  │   DTOs   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Core Services                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │   │
│  │  │ Firebase │  │  Gemini  │  │ElevenLabs│               │   │
│  │  └──────────┘  └──────────┘  └──────────┘               │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │ Firebase │  │  Gemini  │  │ElevenLabs│
         │  Cloud   │  │    AI    │  │   API    │
         └──────────┘  └──────────┘  └──────────┘
```

## Data Flow Patterns

### 1. User Authentication Flow

```
User → Web App → Next.js API Route → Firebase Auth → Session Cookie → User
```

1. User submits credentials
2. Web app calls Next.js API route
3. API route authenticates with Firebase
4. Session cookie created and stored
5. User redirected to app

### 2. Journal Entry Creation Flow

```
User → Web App → Backend API → Firebase Firestore → RAG Service → Response
```

1. User creates journal entry
2. Web app sends to backend API
3. Backend validates and stores in Firestore
4. RAG service generates embedding
5. Embedding stored for semantic search
6. Success response returned

### 3. AI Coach Conversation Flow

```
User → Web App → Backend API → RAG Search → Gemini AI → Streaming Response
```

1. User sends message
2. Backend performs RAG search for context
3. Context + message sent to Gemini
4. Gemini streams response chunks
5. Chunks forwarded to web app via SSE
6. Web app displays in real-time

### 4. Voice Coach Interaction Flow

```
User → Web App → Backend API → Context Builder → Gemini AI → ElevenLabs → Audio
```

1. User starts voice session
2. Backend builds context from user data
3. Gemini generates text response
4. ElevenLabs converts to speech
5. Audio streamed to web app
6. User hears response

## Technology Decisions

### Why Next.js?

- **Server-side rendering**: Fast initial page loads
- **App Router**: Modern routing with layouts
- **API routes**: Backend-for-frontend pattern
- **TypeScript**: Type safety
- **React 19**: Latest features

### Why NestJS?

- **Modular architecture**: Clean code organization
- **Dependency injection**: Testable code
- **TypeScript**: Type safety
- **Decorators**: Clean API design
- **Built-in validation**: Request validation

### Why Firebase?

- **Managed service**: No database administration
- **Real-time**: Live data synchronization
- **Scalable**: Handles growth automatically
- **Authentication**: Built-in user management
- **Security rules**: Declarative access control

### Why Gemini AI?

- **Latest model**: Gemini 2.0 Flash
- **Streaming**: Real-time responses
- **Embeddings**: Semantic search capability
- **Cost-effective**: Competitive pricing
- **Google integration**: Easy setup

### Why ElevenLabs?

- **Voice quality**: Natural-sounding speech
- **Voice cloning**: Custom personalities
- **Streaming**: Real-time audio generation
- **Multiple voices**: Variety of options
- **API simplicity**: Easy integration

## Scalability Considerations

### Horizontal Scaling

Both web and backend applications are stateless and can scale horizontally:

- **Cloud Run auto-scaling**: Scales based on traffic
- **No server-side state**: All state in Firebase
- **Load balancing**: Automatic with Cloud Run
- **Zero downtime**: Rolling deployments

### Database Scaling

Firebase Firestore scales automatically:

- **Automatic sharding**: No manual intervention
- **Global distribution**: Low latency worldwide
- **Unlimited storage**: Grows with usage
- **Consistent performance**: Maintained at scale

### Caching Strategy

Future caching layers can be added:

- **Redis**: For frequently accessed data
- **CDN**: For static assets
- **Service worker**: For offline support
- **Query caching**: For expensive operations

## Security Architecture

### Defense in Depth

Multiple security layers protect the system:

1. **HTTPS**: All traffic encrypted
2. **Session cookies**: HTTP-only, secure
3. **Firebase Auth**: Token verification
4. **Firestore rules**: Database-level security
5. **Rate limiting**: Prevent abuse
6. **Input validation**: Prevent injection attacks

### Authentication Flow

```
User Credentials → Firebase Auth → Session Cookie → Protected Routes
```

- No client-side token exposure
- Server-side verification only
- 5-day session expiry
- Refresh token revocation on logout

## Monitoring and Observability

### Logging

- **Application logs**: Request/response logging
- **Error logs**: Exception tracking
- **Performance logs**: Slow query detection
- **Security logs**: Failed auth attempts

### Metrics

- **Request rate**: Requests per second
- **Response time**: P50, P95, P99
- **Error rate**: 4xx and 5xx responses
- **Resource usage**: CPU, memory, network

### Alerting

- **Error spikes**: Sudden increase in errors
- **Performance degradation**: Slow responses
- **Resource exhaustion**: High CPU/memory
- **Security events**: Multiple failed logins

## Future Enhancements

### Planned Improvements

1. **Caching layer**: Redis for performance
2. **CDN integration**: Faster static asset delivery
3. **Offline support**: Service worker implementation
4. **Mobile apps**: Native iOS/Android apps
5. **Analytics**: User behavior tracking
6. **A/B testing**: Feature experimentation
7. **Multi-region**: Global deployment
8. **Backup automation**: Automated backups

### Scalability Roadmap

1. **Phase 1** (Current): Single-region deployment
2. **Phase 2**: Add caching layer (Redis)
3. **Phase 3**: Multi-region deployment
4. **Phase 4**: CDN integration
5. **Phase 5**: Mobile app launch

---

## Related Documentation

- **[Architecture Overview](../ARCHITECTURE.md)** - Complete architecture documentation
- **[Web Architecture](web-architecture.md)** - Frontend details
- **[Backend Architecture](backend-architecture.md)** - Backend details
- **[Data Models](data-models.md)** - Database schema
- **[Security Architecture](security-architecture.md)** - Security details

---

**Last Updated**: November 2025  
**Status**: Current
