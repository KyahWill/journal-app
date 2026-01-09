# Environment Variables Reference

**Last Updated**: January 2026

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

### Google Calendar Integration (Optional)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | No | - | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | No | - | `GOCSPX-xxxxxxxxxxxx` |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | No | - | `http://localhost:3001/api/v1/calendar/callback` |
| `FRONTEND_URL` | Frontend URL for OAuth redirect | No | `http://localhost:3000` | `https://your-app.com` |

**Where to find:** [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client ID

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

### CORS Configuration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | No | `http://localhost:3000` | `http://localhost:3000,https://your-app.com` |

### API Configuration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `API_PREFIX` | API route prefix | No | `api/v1` | `api/v1` |

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

**Production:**
- Use secret management services:
  - Google Cloud Secret Manager

---

## Environment-Specific Configuration

### Development

```env
# Web (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Backend (.env)
NODE_ENV=development
PORT=3001
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
RAG_ENABLED=true
```

### Production

```env
# Web (.env.local)
NEXT_PUBLIC_API_URL=https://api.your-app.com/api/v1

# Backend (.env)
NODE_ENV=production
PORT=8080
CORS_ORIGINS=https://your-app.com
RAG_ENABLED=true
RAG_CACHE_TTL_SECONDS=7200
```

---

**Need help?** Check the [Troubleshooting Guide](../guides/troubleshooting.md) or return to [Setup Guide](../SETUP.md).
