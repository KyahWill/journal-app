# Backend API Setup

**Last Updated**: November 2025

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
- Voice AI coaching sessions
- Goal management with milestones
- RAG (Retrieval-Augmented Generation) for semantic search
- Custom categories and themes

**Technology Stack:**
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** Firebase Firestore
- **Authentication:** Firebase Admin SDK
- **AI:** Google Gemini API
- **Voice:** ElevenLabs API (optional)
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

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

### 3. Verify Installation

```bash
# Check for node_modules directory
ls -la node_modules

# Verify NestJS CLI is available
pnpm nest --version
```

---

## Configuration

### 1. Create Environment File

Create `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Or create manually:

```bash
touch .env
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

**How to get service account key:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** → **Service accounts**
4. Click "Generate new private key"
5. Save the JSON file
6. Stringify the JSON:

**macOS/Linux:**
```bash
cat serviceAccount.json | jq -c .
```

**Manual:** Copy the entire JSON and remove all newlines.

### 4. Configure Gemini API

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

**How to get API key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API key"
3. Copy the key

### 5. Configure ElevenLabs (Optional)

Only needed if using voice coaching features:

```env
# ElevenLabs API (Optional)
ELEVEN_LABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
```

**How to get credentials:**
1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up and go to Profile → API Keys
3. Copy your API key
4. Create an agent in Conversational AI section
5. Copy the agent ID

### 6. Configure Voice Coach Settings

```env
# Voice Coach Configuration
VOICE_COACH_RATE_LIMIT_PER_HOUR=10
VOICE_COACH_SESSION_MAX_DURATION=1800
```

### 7. Configure RAG Settings

```env
# RAG Configuration (Retrieval-Augmented Generation)
RAG_ENABLED=true
RAG_EMBEDDING_MODEL=text-embedding-004
RAG_EMBEDDING_DIMENSIONS=768
RAG_SIMILARITY_THRESHOLD=0.7
RAG_MAX_RETRIEVED_DOCS=5
RAG_CACHE_TTL_SECONDS=3600
RAG_BATCH_SIZE=50
```

**RAG Configuration Guide:**

| Variable | Description | Default | Recommended |
|----------|-------------|---------|-------------|
| `RAG_ENABLED` | Enable/disable RAG features | `true` | `true` for production |
| `RAG_EMBEDDING_MODEL` | Gemini embedding model | `text-embedding-004` | Use default |
| `RAG_EMBEDDING_DIMENSIONS` | Vector dimensions | `768` | Must match model |
| `RAG_SIMILARITY_THRESHOLD` | Min similarity score (0-1) | `0.7` | 0.6-0.8 range |
| `RAG_MAX_RETRIEVED_DOCS` | Max docs per query | `5` | 3-10 range |
| `RAG_CACHE_TTL_SECONDS` | Cache TTL | `3600` | 1800-7200 range |
| `RAG_BATCH_SIZE` | Batch size for embeddings | `50` | 25-100 range |

### 8. Configure CORS

```env
# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**For production:** Add your production frontend URL.

### 9. Configure API Settings

```env
# API Configuration
API_PREFIX=api/v1
```

### Complete .env Example

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com","client_id":"123456789012","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40your-project.iam.gserviceaccount.com","universe_domain":"googleapis.com"}'
FIREBASE_PROJECT_ID=your-project
FIREBASE_DATABASE_ID=(default)

# Google Gemini API
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ElevenLabs API (Optional)
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

---

## Development

### Start Development Server

```bash
pnpm start:dev
```

The API will be available at [http://localhost:3001/api/v1](http://localhost:3001/api/v1)

**Development Features:**
- **Hot Reload:** Changes reflect immediately
- **Watch Mode:** Automatic recompilation
- **Debug Mode:** Detailed error messages
- **Logging:** Request/response logging

### Verify Server is Running

```bash
# Health check
curl http://localhost:3001/health

# Should return:
# {"status":"ok","timestamp":"2025-11-24T..."}
```

### Project Structure

```
backend/
├── src/
│   ├── auth/                # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── journal/             # Journal entries module
│   ├── chat/                # AI chat module
│   ├── voice-coach/         # Voice coaching module
│   ├── goal/                # Goals module
│   ├── rag/                 # RAG module
│   ├── category/            # Categories module
│   ├── theme/               # Themes module
│   ├── firebase/            # Firebase Admin SDK
│   ├── gemini/              # Gemini AI service
│   ├── elevenlabs/          # ElevenLabs service
│   ├── common/              # Shared resources
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── guards/          # Auth guards
│   │   ├── decorators/      # Custom decorators
│   │   └── services/        # Shared services
│   ├── app.module.ts        # Main application module
│   ├── app.controller.ts    # Health check endpoints
│   ├── main.ts              # Application entry point
│   └── cli.ts               # CLI commands
├── dist/                    # Compiled output
├── .env                     # Environment variables
├── nest-cli.json            # NestJS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

### Key Files

**src/main.ts:**
- Application bootstrap
- CORS configuration
- Global pipes and filters
- Port configuration

**src/app.module.ts:**
- Module imports
- Global providers
- Configuration

**src/common/guards/auth.guard.ts:**
- Firebase token verification
- Request authentication

**src/firebase/firebase.service.ts:**
- Firebase Admin SDK initialization
- Firestore client
- Auth client

---

## Building for Production

### 1. Build the Application

```bash
pnpm build
```

This will:
- Compile TypeScript to JavaScript
- Output to `dist/` directory
- Generate source maps
- Optimize for production

### 2. Test Production Build

```bash
pnpm start:prod
```

### 3. Verify Build

```bash
# Check dist directory
ls -la dist/

# Should contain:
# - main.js
# - All module files
# - Source maps (.map files)
```

---

## Testing

### Run Unit Tests

```bash
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm test:watch
```

### Run E2E Tests

```bash
pnpm test:e2e
```

### Generate Coverage Report

```bash
pnpm test:cov
```

Coverage report will be in `coverage/` directory.

### Run Linting

```bash
pnpm lint
```

Fix linting issues:
```bash
pnpm lint --fix
```

### Format Code

```bash
pnpm format
```

---

## CLI Commands

The backend includes CLI commands for administrative tasks.

### RAG Migration

Backfill embeddings for existing content:

```bash
# Migrate all users
pnpm cli migrate:rag

# Migrate specific user
pnpm cli migrate:rag --userId=user123

# Dry run (test without making changes)
pnpm cli migrate:rag --dryRun

# Verbose output
pnpm cli migrate:rag --verbose
```

### Seed Coach Personalities

Seed default coach personalities:

```bash
pnpm cli seed:personalities
```

### Verify RAG Indexes

Verify RAG indexes are deployed:

```bash
./scripts/verify-rag-indexes.sh
```

### Deploy RAG Indexes

Deploy RAG indexes to Firestore:

```bash
./scripts/deploy-rag-indexes.sh
```

---

## Troubleshooting

### Port Already in Use

**Error:** `Port 3001 is already in use`

**Solutions:**
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 pnpm start:dev
```

### Firebase Connection Errors

**Error:** `5 NOT_FOUND: Database not found`

**Solutions:**
1. Verify Firestore is enabled in Firebase Console
2. Check `FIREBASE_PROJECT_ID` matches your project
3. Ensure service account has proper permissions
4. Verify `FIREBASE_DATABASE_ID` is correct

**Check startup logs:**
```
[FirebaseService] ============================================================
[FirebaseService] Firebase Configuration:
[FirebaseService]   Project ID: your-project-id
[FirebaseService]   Database ID: (default)
[FirebaseService] ============================================================
```

### Service Account Permission Errors

**Error:** `Permission denied`

**Solutions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **IAM & Admin** → **IAM**
3. Find your service account
4. Ensure it has these roles:
   - Firebase Admin SDK Administrator Service Agent
   - Cloud Datastore User

### Gemini API Errors

**Error:** `API key invalid` or rate limit errors

**Solutions:**
1. Verify API key is correct
2. Check API quota in Google AI Studio
3. Ensure billing is enabled for production
4. Implement rate limiting

### Module Not Found

**Error:** `Cannot find module 'xyz'`

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules dist pnpm-lock.yaml
pnpm install

# Rebuild
pnpm build
```

### TypeScript Compilation Errors

**Error:** Type errors during build

**Solutions:**
```bash
# Check TypeScript errors
pnpm tsc --noEmit

# Fix common issues
pnpm lint --fix

# Clear cache and rebuild
rm -rf dist
pnpm build
```

### CORS Errors

**Error:** Frontend can't connect to backend

**Solutions:**
1. Add frontend URL to `CORS_ORIGINS` in `.env`
2. Restart backend server
3. Verify frontend is using correct `NEXT_PUBLIC_API_URL`
4. Check browser console for specific CORS error

### RAG Errors

**Error:** RAG features not working

**Solutions:**
1. Verify `RAG_ENABLED=true` in `.env`
2. Check Gemini API key is valid
3. Ensure embeddings are generated (run migration)
4. Verify Firestore indexes are deployed
5. Check logs for specific RAG errors

### ElevenLabs Errors

**Error:** Voice coach not working

**Solutions:**
1. Verify `ELEVEN_LABS_API_KEY` is set
2. Check `ELEVENLABS_AGENT_ID` is correct
3. Ensure ElevenLabs account has sufficient credits
4. Check ElevenLabs API status

### Memory Issues

**Error:** `JavaScript heap out of memory`

**Solutions:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm start:dev

# Or add to package.json scripts:
"start:dev": "NODE_OPTIONS='--max-old-space-size=4096' nest start --watch"
```

---

## Next Steps

After setting up the backend:

1. **[Database Setup](database-setup.md)** - Configure Firestore collections and indexes
2. **[Deployment](deployment.md)** - Deploy to production
3. **[API Reference](../API_REFERENCE.md)** - Explore API endpoints

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google Gemini API](https://ai.google.dev/docs)
- [ElevenLabs API](https://elevenlabs.io/docs)
- [RAG Configuration Guide](../../backend/src/rag/CONFIGURATION.md)

---

**Need help?** Check the [Troubleshooting Guide](../guides/troubleshooting.md) or return to [Setup Guide](../SETUP.md).
