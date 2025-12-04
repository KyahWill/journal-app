# Environment Variables Reference

**Last Updated**: November 2025

Complete reference for all environment variables used in the Journal application.

## Table of Contents

- [Web Application Variables](#web-application-variables)
- [Backend API Variables](#backend-api-variables)
- [Security Best Practices](#security-best-practices)
- [Environment-Specific Configuration](#environment-specific-configuration)

---

## Web Application Variables

Environment variables for the Next.js web application (`.env.local` file).

### Firebase Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | Yes | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Yes | `your-project` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Yes | `1:123456789012:web:abcdef123456` |

**Where to find:** Firebase Console → Project Settings → General → Your apps

### Firebase Admin SDK

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase service account JSON (stringified) | Yes | `'{"type":"service_account",...}'` |

**Where to find:** Firebase Console → Project Settings → Service accounts → Generate new private key

**Important:** Must be stringified JSON (no newlines). Server-side only, never exposed to client.

### Google Gemini API

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |

**Where to find:** [Google AI Studio](https://aistudio.google.com/app/apikey)

**Important:** Server-side only, never exposed to client.

### Backend API Configuration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | Yes | - | `http://localhost:3001/api/v1` |

**Development:** `http://localhost:3001/api/v1`  
**Production:** Your deployed backend URL

### Feature Flags

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `NEXT_PUBLIC_FEATURE_VOICE_COACH` | Enable voice coach feature | No | `true` | `true` or `false` |

### Complete Web .env.local Example

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Firebase Admin SDK (server-side only)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com","client_id":"123456789012","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40your-project.iam.gserviceaccount.com","universe_domain":"googleapis.com"}'

# Google Gemini API (server-side only)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Feature Flags (optional)
NEXT_PUBLIC_FEATURE_VOICE_COACH=true
```

---

## Backend API Variables

Environment variables for the NestJS backend API (`.env` file).

### Server Configuration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `PORT` | Server port | No | `3001` | `3001` |
| `NODE_ENV` | Environment | No | `development` | `development` or `production` |

### Firebase Configuration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase service account JSON (stringified) | Yes | - | `'{"type":"service_account",...}'` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes | - | `your-project` |
| `FIREBASE_DATABASE_ID` | Firestore database ID | No | `(default)` | `(default)` |

### Google Gemini API

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |

### ElevenLabs API (Optional)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `ELEVEN_LABS_API_KEY` | ElevenLabs API key | No | - | `your_elevenlabs_api_key` |
| `ELEVENLABS_AGENT_ID` | ElevenLabs agent ID | No | - | `your_elevenlabs_agent_id` |

**Where to find:** [ElevenLabs](https://elevenlabs.io/) → Profile → API Keys

### Voice Coach Configuration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `VOICE_COACH_RATE_LIMIT_PER_HOUR` | Max sessions per hour per user | No | `10` | `10` |
| `VOICE_COACH_SESSION_MAX_DURATION` | Max session duration (seconds) | No | `1800` | `1800` (30 minutes) |

### Google Calendar Integration (Optional)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | No | - | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | No | - | `GOCSPX-xxxxxxxxxxxx` |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | No | - | `http://localhost:3001/api/v1/calendar/callback` |
| `FRONTEND_URL` | Frontend URL for OAuth redirect | No | `http://localhost:3000` | `https://your-app.com` |

**Where to find:** [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client ID

**Setup Steps:**
1. Go to Google Cloud Console
2. Enable Google Calendar API
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI: `{BACKEND_URL}/api/v1/calendar/callback`
5. Copy Client ID and Client Secret to your `.env` file

### RAG Configuration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `RAG_ENABLED` | Enable/disable RAG features | No | `true` | `true` or `false` |
| `RAG_EMBEDDING_MODEL` | Gemini embedding model | No | `text-embedding-004` | `text-embedding-004` |
| `RAG_EMBEDDING_DIMENSIONS` | Vector dimensions | No | `768` | `768` |
| `RAG_SIMILARITY_THRESHOLD` | Min similarity score (0-1) | No | `0.7` | `0.7` |
| `RAG_MAX_RETRIEVED_DOCS` | Max documents per query | No | `5` | `5` |
| `RAG_CACHE_TTL_SECONDS` | Cache TTL in seconds | No | `3600` | `3600` (1 hour) |
| `RAG_BATCH_SIZE` | Batch size for embeddings | No | `50` | `50` |

**RAG Configuration Guide:**

- **RAG_ENABLED:** Feature flag to enable/disable RAG globally
- **RAG_EMBEDDING_MODEL:** Use `text-embedding-004` (recommended)
- **RAG_EMBEDDING_DIMENSIONS:** Must match model (768 for text-embedding-004)
- **RAG_SIMILARITY_THRESHOLD:** Higher = more relevant results (0.6-0.8 recommended)
- **RAG_MAX_RETRIEVED_DOCS:** Balance between context and performance (3-10 recommended)
- **RAG_CACHE_TTL_SECONDS:** Cache embeddings to reduce API calls (1800-7200 recommended)
- **RAG_BATCH_SIZE:** Batch embedding generation for efficiency (25-100 recommended)

### CORS Configuration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | No | `http://localhost:3000` | `http://localhost:3000,https://your-app.com` |

### API Configuration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `API_PREFIX` | API route prefix | No | `api/v1` | `api/v1` |

### Complete Backend .env Example

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

# Google Calendar Integration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/calendar/callback
FRONTEND_URL=http://localhost:3000

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# API Configuration
API_PREFIX=api/v1
```

---

## Security Best Practices

### Never Commit Secrets

**Add to .gitignore:**
```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Service account keys
serviceAccount.json
*-firebase-adminsdk-*.json
```

### Use Different Keys for Environments

- **Development:** Use separate API keys with lower quotas
- **Staging:** Use separate keys for testing
- **Production:** Use production keys with proper quotas and billing

### Rotate Keys Regularly

- Rotate API keys every 90 days
- Rotate service account keys annually
- Immediately rotate if compromised

### Limit Key Permissions

**Firebase Service Account:**
- Only grant necessary roles
- Use separate service accounts for different environments
- Monitor usage in Google Cloud Console

**Gemini API Key:**
- Set up API restrictions in Google Cloud Console
- Limit to specific APIs
- Set up quotas and alerts

### Store Secrets Securely

**Development:**
- Use `.env.local` files (never commit)
- Use environment variable managers (e.g., direnv)

**Production:**
- Use secret management services:
  - Google Cloud Secret Manager
  - AWS Secrets Manager
  - Azure Key Vault
  - HashiCorp Vault

### Monitor Usage

- Set up billing alerts
- Monitor API usage
- Track authentication attempts
- Review security logs regularly

---

## Environment-Specific Configuration

### Development

```env
# Web (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_FEATURE_VOICE_COACH=true

# Backend (.env)
NODE_ENV=development
PORT=3001
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
RAG_ENABLED=true
```

### Staging

```env
# Web (.env.local)
NEXT_PUBLIC_API_URL=https://api-staging.your-app.com/api/v1
NEXT_PUBLIC_FEATURE_VOICE_COACH=true

# Backend (.env)
NODE_ENV=production
PORT=8080
CORS_ORIGINS=https://staging.your-app.com
RAG_ENABLED=true
```

### Production

```env
# Web (.env.local)
NEXT_PUBLIC_API_URL=https://api.your-app.com/api/v1
NEXT_PUBLIC_FEATURE_VOICE_COACH=true

# Backend (.env)
NODE_ENV=production
PORT=8080
CORS_ORIGINS=https://your-app.com
RAG_ENABLED=true
RAG_CACHE_TTL_SECONDS=7200
```

### Docker

Use environment variables in docker-compose.yml:

```yaml
version: '3.8'
services:
  web:
    build: ./web
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    env_file:
      - ./web/.env.local

  backend:
    build: ./backend
    environment:
      - PORT=3001
      - NODE_ENV=production
    env_file:
      - ./backend/.env
```

### Cloud Run

Set environment variables:

```bash
# Set individual variables
gcloud run services update journal-web \
  --set-env-vars="GEMINI_API_KEY=your_key"

# Use Secret Manager
gcloud secrets create gemini-api-key --data-file=-
gcloud run services update journal-web \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest"
```

---

## Troubleshooting

### Variables Not Loading

**Issue:** Environment variables are `undefined`

**Solutions:**
1. Ensure file is named correctly (`.env.local` for web, `.env` for backend)
2. Restart development server after changes
3. Check variables start with `NEXT_PUBLIC_` for client-side access (web only)
4. Verify no syntax errors in env file
5. Check for extra spaces or quotes

### Firebase Configuration Errors

**Issue:** Firebase initialization fails

**Solutions:**
1. Verify all Firebase variables are set
2. Check for typos in API key
3. Ensure service account key is properly stringified
4. Verify no extra spaces or newlines
5. Check project ID matches Firebase Console

### CORS Errors

**Issue:** Frontend can't connect to backend

**Solutions:**
1. Add frontend URL to `CORS_ORIGINS` in backend `.env`
2. Restart backend server
3. Verify `NEXT_PUBLIC_API_URL` is correct
4. Check for trailing slashes in URLs

### RAG Not Working

**Issue:** RAG features not functioning

**Solutions:**
1. Verify `RAG_ENABLED=true`
2. Check Gemini API key is valid
3. Ensure embeddings are generated (run migration)
4. Verify Firestore indexes are deployed
5. Check backend logs for RAG errors

---

**Need help?** Check the [Troubleshooting Guide](../guides/troubleshooting.md) or return to [Setup Guide](../SETUP.md).
