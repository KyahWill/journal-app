# Deployment Guide

**Last Updated**: November 2025

This guide covers deploying the Journal application to various platforms.

## Table of Contents

- [Overview](#overview)
- [Google Cloud Run (Recommended)](#google-cloud-run-recommended)
- [Vercel](#vercel)
- [Docker](#docker)
- [Firebase Hosting](#firebase-hosting)
- [Other Platforms](#other-platforms)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Journal application consists of two deployable components:

1. **Web Application** (Next.js) - Frontend and API routes
2. **Backend API** (NestJS) - RESTful API server

Both can be deployed independently to different platforms.

### Deployment Options

| Platform | Web | Backend | Difficulty | Cost |
|----------|-----|---------|------------|------|
| Google Cloud Run | ✅ | ✅ | Medium | Pay-per-use |
| Vercel | ✅ | ❌ | Easy | Free tier available |
| Docker | ✅ | ✅ | Medium | Infrastructure cost |
| Firebase Hosting | ✅ | ❌ | Easy | Free tier available |
| Heroku | ✅ | ✅ | Easy | Paid plans |

**Recommended:** Google Cloud Run for both web and backend (best integration with Firebase).

---

## Google Cloud Run (Recommended)

Google Cloud Run provides serverless container deployment with automatic scaling.

### Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed and configured
3. **Docker** installed locally
4. **Firebase project** (automatically creates GCP project)

### Install gcloud CLI

**macOS:**
```bash
brew install google-cloud-sdk
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
# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Deploy Web Application

#### 1. Build Docker Image

The web directory includes a `cloudbuild.yaml` for automated builds:

```bash
cd web
gcloud builds submit --config cloudbuild.yaml
```

Or build manually:

```bash
cd web
docker build -t gcr.io/YOUR_PROJECT_ID/journal-web .
docker push gcr.io/YOUR_PROJECT_ID/journal-web
```

#### 2. Deploy to Cloud Run

```bash
gcloud run deploy journal-web \
  --image gcr.io/YOUR_PROJECT_ID/journal-web \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10
```

#### 3. Set Environment Variables

**Option 1 - Command Line:**
```bash
gcloud run services update journal-web \
  --set-env-vars="NEXT_PUBLIC_FIREBASE_API_KEY=your_key,NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project"
```

**Option 2 - Secret Manager (Recommended):**
```bash
# Create secrets
echo -n "your_gemini_api_key" | gcloud secrets create gemini-api-key --data-file=-
echo -n "your_service_account_json" | gcloud secrets create firebase-service-account --data-file=-

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Update service to use secrets
gcloud run services update journal-web \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest,FIREBASE_SERVICE_ACCOUNT_KEY=firebase-service-account:latest"
```

#### 4. Get Deployment URL

```bash
gcloud run services describe journal-web --format='value(status.url)'
```

### Deploy Backend API

#### 1. Create Dockerfile

The backend includes a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .

RUN pnpm build

EXPOSE 8080

CMD ["node", "dist/main"]
```

#### 2. Build and Push Image

```bash
cd backend
docker build -t gcr.io/YOUR_PROJECT_ID/journal-backend .
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/journal-backend
```

#### 3. Deploy to Cloud Run

```bash
gcloud run deploy journal-backend \
  --image gcr.io/YOUR_PROJECT_ID/journal-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --port 8080
```

#### 4. Set Environment Variables

```bash
# Create secrets
echo -n "your_gemini_api_key" | gcloud secrets create backend-gemini-api-key --data-file=-
echo -n "your_service_account_json" | gcloud secrets create backend-firebase-service-account --data-file=-

# Update service
gcloud run services update journal-backend \
  --set-env-vars="PORT=8080,NODE_ENV=production,FIREBASE_PROJECT_ID=your_project" \
  --set-secrets="GEMINI_API_KEY=backend-gemini-api-key:latest,FIREBASE_SERVICE_ACCOUNT_KEY=backend-firebase-service-account:latest"
```

#### 5. Update Web to Use Backend URL

Get backend URL:
```bash
BACKEND_URL=$(gcloud run services describe journal-backend --format='value(status.url)')
```

Update web environment:
```bash
gcloud run services update journal-web \
  --set-env-vars="NEXT_PUBLIC_API_URL=${BACKEND_URL}/api/v1"
```

### Configure Custom Domain (Optional)

```bash
# Map domain to web service
gcloud run domain-mappings create \
  --service journal-web \
  --domain your-domain.com \
  --region us-central1

# Map subdomain to backend
gcloud run domain-mappings create \
  --service journal-backend \
  --domain api.your-domain.com \
  --region us-central1
```

### Set Up CI/CD (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      - run: |
          cd web
          gcloud builds submit --config cloudbuild.yaml

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      - run: |
          cd backend
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/journal-backend
          gcloud run deploy journal-backend --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/journal-backend
```

---

## Vercel

Vercel is ideal for the web application (frontend only).

### Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional) - `npm install -g vercel`

### Deploy Web Application

#### Option 1 - Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Select `web` as root directory
4. Configure environment variables
5. Click "Deploy"

#### Option 2 - Vercel CLI

```bash
cd web

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Configure Environment Variables

In Vercel Dashboard:

1. Go to Project Settings → Environment Variables
2. Add all required variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_SERVICE_ACCOUNT_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_API_URL` (your backend URL)

### Configure Custom Domain

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as instructed

### Automatic Deployments

Vercel automatically deploys:
- **Production:** Pushes to `main` branch
- **Preview:** Pull requests and other branches

---

## Docker

Deploy using Docker and Docker Compose for self-hosting.

### Prerequisites

1. **Docker** and **Docker Compose** installed
2. **Server** with Docker support (VPS, dedicated server, etc.)

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001/api/v1
    env_file:
      - ./web/.env.local
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web
      - backend
    restart: unless-stopped
```

### Create nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream web {
        server web:3000;
    }

    upstream backend {
        server backend:3001;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://web;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### Deploy

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

### Update Deployment

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Clean up old images
docker system prune -a
```

---

## Firebase Hosting

Firebase Hosting is suitable for the web application (static export).

### Prerequisites

1. **Firebase CLI** installed: `npm install -g firebase-tools`
2. **Firebase project** created

### Configure Next.js for Static Export

Update `next.config.ts`:

```typescript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

**Note:** Static export has limitations (no API routes, no server-side rendering).

### Initialize Firebase Hosting

```bash
cd web
firebase init hosting

# Select:
# - Use existing project
# - Public directory: out
# - Single-page app: Yes
# - GitHub Actions: Optional
```

### Build and Deploy

```bash
# Build static export
pnpm build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Configure Custom Domain

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow DNS configuration instructions

---

## Other Platforms

### Heroku

**Web Application:**
```bash
cd web
heroku create journal-web
git push heroku main
heroku config:set NEXT_PUBLIC_FIREBASE_API_KEY=your_key
```

**Backend API:**
```bash
cd backend
heroku create journal-backend
git push heroku main
heroku config:set FIREBASE_SERVICE_ACCOUNT_KEY='...'
```

### AWS (Elastic Beanstalk)

1. Install AWS CLI and EB CLI
2. Initialize Elastic Beanstalk
3. Deploy using `eb deploy`

### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy

---

## Post-Deployment

### Verify Deployment

**Web Application:**
```bash
curl https://your-web-url.com
```

**Backend API:**
```bash
curl https://your-backend-url.com/health
```

### Update CORS Settings

Update backend `.env` with production URLs:
```env
CORS_ORIGINS=https://your-web-url.com
```

### Configure Monitoring

**Google Cloud Monitoring:**
```bash
# Enable monitoring
gcloud services enable monitoring.googleapis.com

# Create uptime check
gcloud monitoring uptime-checks create https://your-web-url.com
```

**Vercel Analytics:**
- Enable in Vercel Dashboard → Analytics

### Set Up Alerts

**Google Cloud:**
```bash
# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05
```

### Configure Backups

**Firestore Backups:**
```bash
# Schedule daily backups
gcloud firestore backups schedules create \
  --database='(default)' \
  --recurrence=daily \
  --retention=7d
```

### Performance Optimization

1. **Enable CDN** for static assets
2. **Configure caching** headers
3. **Optimize images** (use Next.js Image component)
4. **Enable compression** (gzip/brotli)
5. **Monitor performance** (Lighthouse, Web Vitals)

---

## Troubleshooting

### Deployment Fails

**Issue:** Build or deployment errors

**Solutions:**
1. Check build logs for specific errors
2. Verify all environment variables are set
3. Test build locally: `pnpm build`
4. Check Docker image builds: `docker build .`
5. Verify dependencies are installed

### Application Not Starting

**Issue:** Service starts but doesn't respond

**Solutions:**
1. Check application logs
2. Verify port configuration (Cloud Run uses PORT env var)
3. Check health endpoint: `/health`
4. Verify environment variables are loaded
5. Check Firebase connection

### CORS Errors in Production

**Issue:** Frontend can't connect to backend

**Solutions:**
1. Add production URL to `CORS_ORIGINS`
2. Verify backend URL in `NEXT_PUBLIC_API_URL`
3. Check for trailing slashes in URLs
4. Ensure HTTPS is used (not HTTP)

### High Costs

**Issue:** Unexpected cloud costs

**Solutions:**
1. Set up billing alerts
2. Configure auto-scaling limits
3. Optimize cold start times
4. Use caching to reduce requests
5. Monitor usage in Cloud Console

### Slow Performance

**Issue:** Application is slow

**Solutions:**
1. Enable CDN for static assets
2. Optimize database queries
3. Add caching layer (Redis)
4. Increase instance resources
5. Use connection pooling

---

## Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NestJS Deployment](https://docs.nestjs.com/faq/serverless)

---

**Need help?** Check the [Troubleshooting Guide](../guides/troubleshooting.md) or return to [Setup Guide](../SETUP.md).
