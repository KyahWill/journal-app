# Deployment Guide

**Last Updated**: December 2025

This guide covers deploying the Journal application to production.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Frontend Deployment (Firebase App Hosting)](#frontend-deployment-firebase-app-hosting)
- [Backend Deployment (Google Cloud Run)](#backend-deployment-google-cloud-run)
- [Secret Management](#secret-management)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Journal application consists of two deployable components:

| Component | Technology | Deployment Platform | Region |
|-----------|------------|---------------------|--------|
| **Web Frontend** | Next.js | Firebase App Hosting | Auto-managed |
| **Backend API** | NestJS | Google Cloud Run | asia-southeast1 |

### Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   Firebase App      │     │   Google Cloud      │
│     Hosting         │────▶│      Run            │
│   (Next.js Web)     │     │   (NestJS API)      │
└─────────────────────┘     └─────────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────────────────────────────────────┐
│              Firebase / Firestore                │
│           (Database & Authentication)            │
└─────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Accounts & Tools

1. **Google Cloud Account** with billing enabled
2. **Firebase Project** (creates associated GCP project)
3. **Google Cloud SDK (gcloud CLI)** installed

### Install Google Cloud SDK

**macOS (Recommended - Official Installer):**
```bash
curl -sSL https://sdk.cloud.google.com | bash -s -- --disable-prompts --install-dir=$HOME
source $HOME/google-cloud-sdk/path.zsh.inc
```

**macOS (Homebrew - May have Python issues):**
```bash
brew install --cask google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Windows:**
Download from [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)

### Configure gcloud

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Verify configuration
gcloud config list
```

---

## Frontend Deployment (Firebase App Hosting)

The web frontend is deployed using **Firebase App Hosting**, which provides automatic builds, CDN distribution, and seamless Firebase integration.

### Configuration File

The deployment is configured via `web/apphosting.yaml`:

```yaml
# Settings for Cloud Run backend
runConfig:
  minInstances: 0
  maxInstances: 1

# Environment variables and secrets
env:
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    secret: NEXT_PUBLIC_FIREBASE_APP_ID 
  - variable: FIREBASE_SERVICE_ACCOUNT_KEY
    secret: FIREBASE_SERVICE_ACCOUNT_KEY
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    secret: NEXT_PUBLIC_FIREBASE_API_KEY 
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    secret: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN 
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    secret: NEXT_PUBLIC_FIREBASE_PROJECT_ID 
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    secret: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET 
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    secret: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID 
  - variable: GEMINI_API_KEY
    secret: GEMINI_API_KEY
  - variable: NEXT_PUBLIC_API_URL
    secret: NEXT_PUBLIC_API_URL
  - variable: NEXT_PUBLIC_FEATURE_VOICE_COACH
    value: false
```

### Initial Setup

1. **Enable Firebase App Hosting** in Firebase Console:
   - Go to Firebase Console → Hosting → App Hosting
   - Click "Get Started" and follow the setup wizard
   - Connect your GitHub repository

2. **Create Secrets in Google Cloud Secret Manager:**
   ```bash
   # Set your project
   gcloud config set project YOUR_PROJECT_ID
   
   # Create each secret (repeat for all required secrets)
   echo -n "your_value" | gcloud secrets create SECRET_NAME --data-file=-
   ```

   Required secrets:
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_SERVICE_ACCOUNT_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_API_URL` (your Cloud Run backend URL)

3. **Grant Secret Access:**
   Firebase App Hosting automatically grants access to secrets referenced in `apphosting.yaml`.

### Deployment

Firebase App Hosting deploys **automatically** when you push to your connected Git branch.

**Manual Rollback:**
```bash
cd web
firebase apphosting:rollouts:list
firebase apphosting:rollouts:rollback ROLLOUT_ID
```

### View Deployment Status

- **Firebase Console:** Hosting → App Hosting → View builds
- **CLI:** `firebase apphosting:rollouts:list`

---

## Backend Deployment (Google Cloud Run)

The backend API is deployed to **Google Cloud Run** in the `asia-southeast1` region.

### Configuration

| Setting | Value |
|---------|-------|
| Service Name | `journal-backend` |
| Region | `asia-southeast1` |
| Memory | 512Mi |
| CPU | 1 |
| Max Instances | 1 |
| Port | 3001 |

### Initial Setup

#### 1. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com
```

#### 2. Create Secrets in Secret Manager

```bash
# Firebase Service Account (paste JSON, then Ctrl+D)
gcloud secrets create FIREBASE_SERVICE_ACCOUNT_KEY --data-file=-

# Gemini API Key
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-

# ElevenLabs API Key
echo -n "YOUR_ELEVENLABS_API_KEY" | gcloud secrets create ELEVEN_LABS_API_KEY --data-file=-

# Firebase Project ID (reuse from frontend)
echo -n "your-project-id" | gcloud secrets create NEXT_PUBLIC_FIREBASE_PROJECT_ID --data-file=-

# Firebase Storage Bucket
echo -n "your-project.appspot.com" | gcloud secrets create NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET --data-file=-

# Firebase Messaging Sender ID
echo -n "123456789012" | gcloud secrets create NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --data-file=-

# Firebase App ID
echo -n "1:123456789:web:abc123" | gcloud secrets create NEXT_PUBLIC_FIREBASE_APP_ID --data-file=-
```

#### 3. Grant Cloud Run Access to Secrets

```bash
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

# Grant access to the compute service account
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Deploy Script

The backend includes a deployment script at `backend/scripts/deploy-app.sh`:

```bash
#!/bin/bash
set -e

gcloud run deploy journal-backend --source=. \
  --region=asia-southeast1 \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=1 \
  --port=3001 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT_KEY=FIREBASE_SERVICE_ACCOUNT_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,ELEVEN_LABS_API_KEY=ELEVEN_LABS_API_KEY:latest,FIREBASE_PROJECT_ID=NEXT_PUBLIC_FIREBASE_PROJECT_ID:latest,FIREBASE_STORAGE_BUCKET=NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:latest,FIREBASE_MESSAGING_SENDER_ID=NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:latest,FIREBASE_APP_ID=NEXT_PUBLIC_FIREBASE_APP_ID:latest"
```

### Deploy

```bash
cd backend
./scripts/deploy-app.sh
```

Or run the command directly:

```bash
cd backend
gcloud run deploy journal-backend --source=. \
  --region=asia-southeast1 \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=1 \
  --port=3001 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT_KEY=FIREBASE_SERVICE_ACCOUNT_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,ELEVEN_LABS_API_KEY=ELEVEN_LABS_API_KEY:latest,FIREBASE_PROJECT_ID=NEXT_PUBLIC_FIREBASE_PROJECT_ID:latest"
```

### Get Service URL

```bash
gcloud run services describe journal-backend \
  --region=asia-southeast1 \
  --format='value(status.url)'
```

### View Logs

```bash
# Stream logs
gcloud run services logs read journal-backend --region=asia-southeast1

# Tail logs
gcloud run services logs tail journal-backend --region=asia-southeast1
```

### Update Backend URL in Frontend

After deploying the backend, update the `NEXT_PUBLIC_API_URL` secret with the Cloud Run URL:

```bash
BACKEND_URL=$(gcloud run services describe journal-backend --region=asia-southeast1 --format='value(status.url)')

echo -n "${BACKEND_URL}/api/v1" | gcloud secrets versions add NEXT_PUBLIC_API_URL --data-file=-
```

Then redeploy the frontend (push to trigger Firebase App Hosting, or manually roll out).

---

## Secret Management

### List All Secrets

```bash
gcloud secrets list --filter="labels.app=journal" 
# or
gcloud secrets list
```

### Update a Secret

```bash
# Add new version
echo -n "new_value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Verify
gcloud secrets versions list SECRET_NAME
```

### View Secret Value (for debugging)

```bash
gcloud secrets versions access latest --secret=SECRET_NAME
```

### Delete Old Secret Versions

```bash
# List versions
gcloud secrets versions list SECRET_NAME

# Disable old version
gcloud secrets versions disable VERSION_ID --secret=SECRET_NAME

# Destroy old version (irreversible)
gcloud secrets versions destroy VERSION_ID --secret=SECRET_NAME
```

---

## Post-Deployment

### Verify Deployments

**Frontend:**
```bash
curl https://your-firebase-app-url.web.app
```

**Backend:**
```bash
# Health check
curl https://journal-backend-xxxxx-as.a.run.app/api/v1/health

# Root endpoint
curl https://journal-backend-xxxxx-as.a.run.app/api/v1
```

### Update CORS (if needed)

If you encounter CORS errors, update the backend's `CORS_ORIGINS`:

```bash
gcloud run services update journal-backend \
  --region=asia-southeast1 \
  --set-env-vars="CORS_ORIGINS=https://your-frontend-url.web.app"
```

### Configure Custom Domain

**Backend (Cloud Run):**
```bash
gcloud run domain-mappings create \
  --service=journal-backend \
  --domain=api.your-domain.com \
  --region=asia-southeast1
```

**Frontend (Firebase):**
1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow DNS configuration instructions

### Set Up Monitoring

```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com

# View metrics in console
# https://console.cloud.google.com/run/detail/asia-southeast1/journal-backend/metrics
```

---

## Troubleshooting

### Container Failed to Start

**Error:** `The user-provided container failed to start and listen on the port`

**Causes & Solutions:**

1. **Missing source files in build context**
   - Check `.gcloudignore` isn't excluding `src/` directory
   - The `src/` folder is needed for building the TypeScript application

2. **Missing dependencies**
   - Ensure `pnpm-lock.yaml` is committed
   - Check Dockerfile installs dependencies correctly

3. **Port mismatch**
   - Ensure `--port=3001` matches the port in `main.ts`
   - Cloud Run sets `PORT` env var automatically

**Debug Steps:**
```bash
# View deployment logs
gcloud run services logs read journal-backend --region=asia-southeast1 --limit=50

# Check recent revisions
gcloud run revisions list --service=journal-backend --region=asia-southeast1
```

### Secrets Not Loading

**Error:** Environment variables are undefined

**Solutions:**
1. Verify secret exists: `gcloud secrets list`
2. Check secret has a version: `gcloud secrets versions list SECRET_NAME`
3. Verify service account has access to secrets
4. Redeploy after creating/updating secrets

### Build Failures

**Error:** Cloud Build fails

**Solutions:**
```bash
# View build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID

# Test Docker build locally
cd backend
docker build -t test-backend .
docker run -p 3001:3001 test-backend
```

### Firebase App Hosting Build Fails

**Solutions:**
1. Check build logs in Firebase Console → App Hosting
2. Verify `apphosting.yaml` syntax
3. Ensure all referenced secrets exist
4. Check Node.js version compatibility

### High Latency / Cold Starts

**Solutions:**
1. Increase `minInstances` to 1 (increases cost)
2. Optimize application startup time
3. Use Cloud Run's CPU boost feature

```bash
gcloud run services update journal-backend \
  --region=asia-southeast1 \
  --min-instances=1 \
  --cpu-boost
```

---

## Quick Reference

### Deploy Commands

```bash
# Backend deployment
cd backend && ./scripts/deploy-app.sh

# Frontend deployment
# Automatic on git push, or manually:
cd web && firebase apphosting:rollouts:create
```

### Useful Commands

```bash
# List Cloud Run services
gcloud run services list

# Describe service
gcloud run services describe journal-backend --region=asia-southeast1

# View logs
gcloud run services logs read journal-backend --region=asia-southeast1

# List secrets
gcloud secrets list

# Update secret
echo -n "value" | gcloud secrets versions add SECRET_NAME --data-file=-
```

### URLs

| Service | URL Pattern |
|---------|-------------|
| Backend API | `https://journal-backend-HASH-as.a.run.app/api/v1` |
| Backend Health | `https://journal-backend-HASH-as.a.run.app/api/v1/health` |
| Frontend | `https://your-project.web.app` |

---

## Additional Resources

- [Firebase App Hosting Documentation](https://firebase.google.com/docs/app-hosting)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)

---

**Need help?** Check the [Environment Variables](./environment-variables.md) guide or return to [Setup Guide](../SETUP.md).
