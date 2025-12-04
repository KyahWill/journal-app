# Setup and Configuration Guide

**Last Updated**: December 2025

This guide provides comprehensive instructions for setting up and configuring the Journal application, including both the web frontend and backend API.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Web Application Setup](#web-application-setup)
- [Backend API Setup](#backend-api-setup)
- [Database Configuration](#database-configuration)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Detailed Documentation](#detailed-documentation)

---

## Prerequisites

Before you begin, ensure you have the following installed and configured:

### Required Software

- **Node.js 18+** - JavaScript runtime
- **pnpm** - Package manager (recommended) or npm/yarn
- **Git** - Version control

### Required Accounts and API Keys

- **Firebase Project** - For authentication and database
  - Firestore enabled
  - Authentication enabled (Email/Password provider)
  - Service account key generated
- **Google Gemini API Key** - For AI coaching features
- **ElevenLabs API Key** (Optional) - For voice coaching features
- **Firebase Account** - For database and vector storage

**→ [Detailed Prerequisites Guide](setup/prerequisites.md)**

---

## Quick Start

Get the application running in 5 minutes:

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd journal

# Install web dependencies
cd web
pnpm install

# Install backend dependencies
cd ../backend
pnpm install
```

### 2. Configure Environment Variables

**Web (.env.local):**
```bash
cd web
cp .env.example .env.local
# Edit .env.local with your Firebase and Gemini credentials
```

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env with your Firebase and Gemini credentials
```

### 3. Start Development Servers

**Terminal 1 - Web:**
```bash
cd web
pnpm dev
# Opens at http://localhost:3000
```

**Terminal 2 - Backend:**
```bash
cd backend
pnpm start:dev
# Runs at http://localhost:3001
```

### 4. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser and create an account!

---

## Web Application Setup

The web application is built with Next.js 14 and provides the user interface for journaling, AI coaching, and goal tracking.

### Installation

```bash
cd web
pnpm install
```

### Configuration

Create `.env.local` file:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Firebase Admin SDK (for server-side operations)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Feature Flags (optional)
NEXT_PUBLIC_FEATURE_VOICE_COACH=true
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

### Database Setup

Deploy Firestore security rules and indexes:

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Or use the deployment script
./scripts/deploy-firestore-indexes.sh
```

**→ [Detailed Web Setup Guide](setup/web-setup.md)**

---

## Backend API Setup

The backend API is built with NestJS and provides RESTful endpoints for all application features.

### Installation

```bash
cd backend
pnpm install
```

### Configuration

Create `.env` file:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_DATABASE_ID=(default)

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# ElevenLabs API (Optional - for voice features)
ELEVEN_LABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id

# Voice Coach Configuration
VOICE_COACH_RATE_LIMIT_PER_HOUR=10
VOICE_COACH_SESSION_MAX_DURATION=1800

# RAG Configuration
RAG_ENABLED=true
RAG_EMBEDDING_MODEL=text-embedding-004
RAG_EMBEDDING_DIMENSIONS=768
RAG_SIMILARITY_THRESHOLD=0.7
RAG_MAX_RETRIEVED_DOCS=5
RAG_CACHE_TTL_SECONDS=3600
RAG_BATCH_SIZE=50

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# API Configuration
API_PREFIX=api/v1
```

### Development

```bash
# Start development server
pnpm start:dev

# Build for production
pnpm build

# Start production server
pnpm start:prod

# Run tests
pnpm test

# Run linting
pnpm lint
```

### RAG Migration (Optional)

If enabling RAG features, backfill embeddings for existing content:

```bash
# Migrate all users
pnpm cli migrate:rag

# Migrate specific user
pnpm cli migrate:rag --userId=user123

# Dry run (test without making changes)
pnpm cli migrate:rag --dryRun
```

### Weekly Insights Migration (Optional)

Generate weekly insights for past weeks based on existing journal entries:

```bash
# View statistics for a user
pnpm cli migrate-weekly-insights --userId=user123 --stats

# Dry run (preview without generating)
pnpm cli migrate-weekly-insights --userId=user123 --dry-run

# Generate insights for all past weeks
pnpm cli migrate-weekly-insights --userId=user123

# Generate for all users
pnpm cli migrate-weekly-insights
```

**→ [Detailed Backend Setup Guide](setup/backend-setup.md)**

---

## Database Configuration

The application uses Firebase Firestore for data storage with the following collections:

### Collections

- **profiles** - User profiles
- **journal_entries** - Journal entries
- **goals** - User goals with subcollections:
  - **milestones** - Goal milestones
  - **progress_updates** - Progress tracking
- **goal_journal_links** - Links between goals and journal entries
- **chat_sessions** - AI coach chat sessions
- **weekly_insights** - AI-generated weekly journal analysis
- **voice_sessions** - Voice coach sessions
- **coach_personalities** - Coach personality configurations
- **custom_categories** - User-defined categories
- **themes** - User theme preferences
- **rag_embeddings** - Vector embeddings for RAG (if enabled)

### Security Rules

Security rules ensure users can only access their own data. Deploy rules:

```bash
cd web
firebase deploy --only firestore:rules
```

### Indexes

Composite indexes optimize query performance. Deploy indexes:

```bash
cd web
firebase deploy --only firestore:indexes
```

### Verification

Verify your Firestore setup:

```bash
cd web
./scripts/verify-firestore-setup.sh
```

**→ [Detailed Database Setup Guide](setup/database-setup.md)**

---

## Environment Variables

### Web Application Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase service account JSON (stringified) | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_FEATURE_VOICE_COACH` | Enable voice coach feature | No |

### Backend API Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase service account JSON | Yes | - |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes | - |
| `FIREBASE_DATABASE_ID` | Firestore database ID | No | (default) |
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `ELEVEN_LABS_API_KEY` | ElevenLabs API key | No | - |
| `ELEVENLABS_AGENT_ID` | ElevenLabs agent ID | No | - |
| `VOICE_COACH_RATE_LIMIT_PER_HOUR` | Voice coach rate limit | No | 10 |
| `VOICE_COACH_SESSION_MAX_DURATION` | Max session duration (seconds) | No | 1800 |
| `RAG_ENABLED` | Enable RAG features | No | true |
| `RAG_EMBEDDING_MODEL` | Gemini embedding model | No | text-embedding-004 |
| `RAG_EMBEDDING_DIMENSIONS` | Vector dimensions | No | 768 |
| `RAG_SIMILARITY_THRESHOLD` | Minimum similarity score (0-1) | No | 0.7 |
| `RAG_MAX_RETRIEVED_DOCS` | Max documents per query | No | 5 |
| `RAG_CACHE_TTL_SECONDS` | Cache TTL in seconds | No | 3600 |
| `RAG_BATCH_SIZE` | Batch size for embeddings | No | 50 |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | No | http://localhost:3000 |
| `API_PREFIX` | API route prefix | No | api/v1 |

**→ [Complete Environment Variables Reference](setup/environment-variables.md)**

---

## Deployment

### Google Cloud Run (Recommended)

Both web and backend can be deployed to Google Cloud Run:

**Web Deployment:**
```bash
cd web
gcloud builds submit --config cloudbuild.yaml
```

**Backend Deployment:**
```bash
cd backend
docker build -t gcr.io/PROJECT_ID/journal-backend .
gcloud builds submit --tag gcr.io/PROJECT_ID/journal-backend
gcloud run deploy journal-backend \
  --image gcr.io/PROJECT_ID/journal-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Variables in Production

Set environment variables in Cloud Run:

```bash
# Set individual variables
gcloud run services update journal-web \
  --set-env-vars="GEMINI_API_KEY=your_key"

# Or use Secret Manager for sensitive data
gcloud secrets create gemini-api-key --data-file=-
gcloud run services update journal-web \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest"
```

### Other Deployment Options

- **Vercel** - Web application only
- **Heroku** - Both web and backend
- **Docker** - Self-hosted deployment
- **Firebase Hosting** - Web application only

**→ [Detailed Deployment Guide](setup/deployment.md)**

---

## Troubleshooting

### Common Issues

#### Firebase Connection Errors

**Error:** `5 NOT_FOUND` or "Database not found"

**Solutions:**
1. Verify Firestore is enabled in Firebase Console
2. Check `FIREBASE_PROJECT_ID` matches your project
3. Ensure service account has proper permissions
4. Verify database ID is correct (default: `(default)`)

#### Authentication Errors

**Error:** "Invalid credentials" or "Unauthorized"

**Solutions:**
1. Verify Firebase Auth is enabled
2. Check Email/Password provider is enabled
3. Ensure service account key is valid
4. Verify token is being sent in Authorization header

#### Gemini API Errors

**Error:** "API key invalid" or rate limit errors

**Solutions:**
1. Verify API key is correct
2. Check API quota in Google AI Studio
3. Ensure billing is enabled for production usage
4. Implement rate limiting in your application

#### CORS Errors

**Error:** "CORS policy blocked"

**Solutions:**
1. Add frontend URL to `CORS_ORIGINS` in backend `.env`
2. Restart backend server after changes
3. Verify `NEXT_PUBLIC_API_URL` points to correct backend

#### Port Already in Use

**Error:** "Port 3000/3001 already in use"

**Solutions:**
```bash
# Find and kill process using port
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Or use different ports
PORT=3002 pnpm dev
```

#### Module Not Found Errors

**Error:** "Cannot find module"

**Solutions:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Next.js cache
rm -rf .next
pnpm dev
```

### Getting Help

1. Check the [detailed troubleshooting guide](guides/troubleshooting.md)
2. Review [architecture documentation](ARCHITECTURE.md) for system understanding
3. Check [API reference](API_REFERENCE.md) for endpoint details
4. Review Firebase Console logs for backend errors
5. Check browser console for frontend errors

---

## Detailed Documentation

For more detailed information, see:

- **[Prerequisites Guide](setup/prerequisites.md)** - Detailed prerequisites and account setup
- **[Web Setup Guide](setup/web-setup.md)** - Complete web application setup
- **[Backend Setup Guide](setup/backend-setup.md)** - Complete backend API setup
- **[Database Setup Guide](setup/database-setup.md)** - Firestore configuration and migration
- **[Environment Variables Reference](setup/environment-variables.md)** - Complete variable documentation
- **[Deployment Guide](setup/deployment.md)** - Production deployment instructions

### Related Documentation

- **[Architecture Overview](ARCHITECTURE.md)** - System architecture and design
- **[Features Reference](FEATURES.md)** - Complete feature documentation
- **[API Reference](API_REFERENCE.md)** - API endpoint documentation
- **[Troubleshooting Guide](guides/troubleshooting.md)** - Common issues and solutions

---

**Need help?** Visit the [Documentation Hub](README.md) for complete navigation.
