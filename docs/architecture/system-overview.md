# System Overview

**High-level system design and component interactions**

---

**Last Updated**: January 2026  
**Status**: Current

---

## Introduction

The Journal application is a modern full-stack web application that combines personal journaling with AI-powered executive coaching. The system is built on a modular architecture with clear separation between frontend and backend concerns.

## System Components

### 1. Web Application (Frontend)

**Technology**: Next.js 14 with App Router  
**Responsibilities**:
- User interface and experience
- Server-side rendering (SSR)
- Client-side interactivity
- Session management
- Real-time updates

### 2. Backend API

**Technology**: NestJS  
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
- **Storage**: File storage

**Responsibilities**:
- Data persistence
- User authentication
- Real-time synchronization

### 4. Google Gemini AI

**Responsibilities**:
- AI coaching conversations
- Insight generation
- Semantic embeddings for RAG
- Theme recommendations

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
│  │  ┌──────────┐  ┌──────────┐                              │   │
│  │  │ Firebase │  │  Gemini  │                              │   │
│  │  └──────────┘  └──────────┘                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌──────────┐  ┌──────────┐
         │ Firebase │  │  Gemini  │
         │  Cloud   │  │    AI    │
         └──────────┘  └──────────┘
```

## Data Flow Patterns

### 1. User Authentication Flow

```
User → Web App → Next.js API Route → Firebase Auth → Session Cookie → User
```

### 2. Journal Entry Creation Flow

```
User → Web App → Backend API → Firebase Firestore → RAG Service → Response
```

### 3. AI Coach Conversation Flow

```
User → Web App → Backend API → RAG Search → Gemini AI → Streaming Response
```

## Technology Decisions

### Next.js
- Server-side rendering for performance
- App Router for modern layouts
- API routes for backend-for-frontend pattern

### NestJS
- Modular architecture for clean code
- Dependency injection for testability
- Strong TypeScript support

### Firebase
- Managed service reduces maintenance
- Real-time sync for better UX
- Built-in authentication

### Gemini AI
- Latest AI capabilities
- Native streaming support
- Efficient embeddings for semantic search

---

## Related Documentation

- **[Architecture Overview](../ARCHITECTURE.md)** - Complete architecture documentation
- **[Web Architecture](web-architecture.md)** - Frontend details
- **[Backend Architecture](backend-architecture.md)** - Backend details
- **[Data Models](data-models.md)** - Database schema
- **[Security Architecture](security-architecture.md)** - Security details

---

**Last Updated**: January 2026
