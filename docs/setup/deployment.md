# Deployment Guide

**Last Updated**: January 2026

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

### Configure gcloud

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID
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
```

### Initial Setup

1. **Enable Firebase App Hosting** in Firebase Console.
2. **Create Secrets in Google Cloud Secret Manager.**

### Deployment

Firebase App Hosting deploys **automatically** when you push to your connected Git branch.

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
# Firebase Service Account
gcloud secrets create FIREBASE_SERVICE_ACCOUNT_KEY --data-file=-

# Gemini API Key
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-

# Firebase Project ID
echo -n "your-project-id" | gcloud secrets create NEXT_PUBLIC_FIREBASE_PROJECT_ID --data-file=-
```

#### 3. Grant Cloud Run Access to Secrets

```bash
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Deploy

```bash
cd backend
./scripts/deploy-app.sh
```

---

## Secret Management

### List All Secrets

```bash
gcloud secrets list
```

### Update a Secret

```bash
echo -n "new_value" | gcloud secrets versions add SECRET_NAME --data-file=-
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
curl https://journal-backend-xxxxx-as.a.run.app/api/v1/health
```

---

## Troubleshooting

### Container Failed to Start

**Error:** `The user-provided container failed to start and listen on the port`

**Solutions:**
1. Check `.gcloudignore` isn't excluding necessary files.
2. Ensure `PORT` is handled correctly (Cloud Run sets it automatically).

### Secrets Not Loading

**Solutions:**
1. Verify secret exists and has a version.
2. Check IAM permissions for the Cloud Run service account.

---

**Need help?** Check the [Environment Variables](./environment-variables.md) guide or return to [Setup Guide](../SETUP.md).
