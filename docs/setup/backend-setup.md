# Backend API Setup

**Last Updated**: January 2026

This guide provides detailed instructions for setting up the Journal backend API built with NestJS.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Testing](#testing)
- [CLI Commands](#cli-commands)
- [Troubleshooting](#troubleshooting)

---

## Overview

The backend API provides RESTful endpoints for:
- User authentication and management
- Journal entry CRUD operations
- AI chat coaching with context
- Goal management with milestones
- RAG (Retrieval-Augmented Generation) for semantic search
- Custom categories and themes

**Technology Stack:**
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** Firebase Firestore
- **Authentication:** Firebase Admin SDK
- **AI:** Google Gemini API
- **Validation:** class-validator, class-transformer

---

## Installation

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

Using pnpm (recommended):
```bash
pnpm install
```

---

## Configuration

### 1. Create Environment File

Create `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

### 2. Configure Server Settings

```env
# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Configure Firebase

Add your Firebase configuration:

```env
# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your_project_id",...}'
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_DATABASE_ID=(default)
```

### 4. Configure Gemini API

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

### 5. Configure RAG Settings

```env
# RAG Configuration
RAG_ENABLED=true
RAG_EMBEDDING_MODEL=text-embedding-004
RAG_EMBEDDING_DIMENSIONS=768
RAG_SIMILARITY_THRESHOLD=0.7
RAG_MAX_RETRIEVED_DOCS=5
RAG_CACHE_TTL_SECONDS=3600
RAG_BATCH_SIZE=50
```

### 6. Configure CORS

```env
# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## Development

### Start Development Server

```bash
pnpm start:dev
```

The API will be available at [http://localhost:3001/api/v1](http://localhost:3001/api/v1)

---

## Building for Production

### 1. Build the Application

```bash
pnpm build
```

---

## Testing

### Run Unit Tests

```bash
pnpm test
```

---

## CLI Commands

### RAG Migration

Backfill embeddings for existing content:

```bash
pnpm cli migrate:rag
```

---

## Troubleshooting

### Port Already in Use

**Error:** `Port 3001 is already in use`

**Solutions:**
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9
```

---

## Next Steps

After setting up the backend:

1. **[Database Setup](database-setup.md)** - Configure Firestore collections and indexes
2. **[Deployment](deployment.md)** - Deploy to production
3. **[API Reference](../API_REFERENCE.md)** - Explore API endpoints

---

**Need help?** Check the [Troubleshooting Guide](../guides/troubleshooting.md) or return to [Setup Guide](../SETUP.md).
