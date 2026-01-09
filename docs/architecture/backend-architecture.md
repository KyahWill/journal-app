# Backend API Architecture

**NestJS backend architecture and implementation details**

---

**Last Updated**: January 2026  
**Status**: Current

---

## Table of Contents

1. [Overview](#overview)
2. [Module Architecture](#module-architecture)
3. [Core Services](#core-services)
4. [Request Flow](#request-flow)
5. [Dependency Injection](#dependency-injection)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Testing Strategy](#testing-strategy)

---

## Overview

The backend API is built with NestJS, a progressive Node.js framework that provides a solid architectural foundation with TypeScript, dependency injection, and modular design.

**Key Technologies**:
- NestJS 10.x
- TypeScript 5.x
- Firebase Admin SDK
- Google Generative AI

**Hosting**: Google Cloud Run  
**Port**: 3001

---

## Module Architecture

### Directory Structure

```
backend/src/
├── app.module.ts              # Root module
├── main.ts                    # Application entry point
│
├── auth/                      # Authentication
├── journal/                   # Journal entries
├── goal/                      # Goal and habit tracking
├── chat/                      # AI chat coach & personalities
├── rag/                       # RAG system
├── theme/                     # Theme customization
├── category/                  # Custom categories
├── firebase/                  # Firebase Admin SDK
├── gemini/                    # Google Gemini AI
└── common/                    # Shared resources
```

### Module Pattern

Each feature module follows the NestJS standard pattern with controllers, services, and DTOs.

---

## Core Services

### Firebase Service

**Purpose**: Provide Firebase Admin SDK functionality for Firestore and Auth.

### Gemini Service

**Purpose**: Provide Google Gemini AI functionality for chat, insights, and embeddings.

---

## Request Flow

1. **Client Request**: Standard RESTful calls with Bearer tokens.
2. **Guards**: `AuthGuard` verifies Firebase ID tokens.
3. **Controllers**: Handle routing and input validation.
4. **Services**: Business logic and data manipulation.
5. **Persistence**: Firestore database operations.

---

## Dependency Injection

The application heavily utilizes NestJS's dependency injection for loose coupling and testability.

---

## Error Handling

Global exception filters provide consistent error responses across the API.

---

## Rate Limiting

Custom rate limiting services protect AI and database resources from abuse.

---

## Testing Strategy

- **Unit Tests**: Using Jest for service-level logic.
- **E2E Tests**: testing complete request/response cycles.

---

## Related Documentation

- **[Architecture Overview](../ARCHITECTURE.md)** - Complete architecture
- **[Web Architecture](web-architecture.md)** - Frontend details
- **[Security Architecture](security-architecture.md)** - Security details
- **[System Overview](system-overview.md)** - High-level design

---

**Last Updated**: January 2026
