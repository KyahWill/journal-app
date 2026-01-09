# Web Application Setup

**Last Updated**: January 2026

This guide provides detailed instructions for setting up the Journal web application built with Next.js 14.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

The web application provides the user interface for:
- User authentication (signup/login with email or Google)
- Journal entry management
- AI chat coaching
- Goal setting and tracking
- Custom categories and theming

**Technology Stack:**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Authentication:** Firebase Auth (server-side)
- **Database:** Firebase Firestore
- **AI:** Google Gemini API

---

## Installation

### 1. Navigate to Web Directory

```bash
cd web
```

### 2. Install Dependencies

Using pnpm (recommended):
```bash
pnpm install
```

### 3. Verify Installation

```bash
# Check for node_modules directory
ls -la node_modules

# Verify Next.js is installed
pnpm next --version
```

---

## Configuration

### 1. Create Environment File

Create `.env.local` file in the `web` directory:

```bash
cp .env.example .env.local
```

### 2. Configure Firebase

Add your Firebase configuration to `.env.local`:

```env
# Firebase Configuration (from Firebase Console → Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

### 3. Configure Firebase Admin SDK

Add your Firebase service account key:

```env
# Firebase Admin SDK (for server-side operations)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your_project_id",...}'
```

### 4. Enable Google Sign-in (Optional)

To enable Google Sign-in authentication:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Click **Enable**
6. Set your **Project support email**
7. Click **Save**

### 5. Configure Gemini API

Add your Gemini API key:

```env
# Google Gemini API (from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key
```

### 6. Configure Backend API URL

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**For production:** Update this to your deployed backend URL.

---

## Development

### Start Development Server

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Project Structure

```
web/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   ├── app/                 # Protected app pages
│   ├── auth/                # Authentication pages
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   └── *.tsx                # Feature components
├── lib/                     # Utilities and integrations
│   ├── api/                 # API client
│   ├── config/              # Configuration
│   ├── contexts/            # React contexts
│   ├── firebase/            # Firebase clients
│   ├── hooks/               # Custom hooks
│   └── utils.ts             # Utility functions
├── public/                  # Static assets
│   ├── icons/              # PWA icons (generated)
│   ├── screenshots/        # PWA screenshots
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker (generated)
├── scripts/                 # Build scripts
│   └── generate-pwa-icons.js   # PWA icon generator
├── .env.local              # Environment variables
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

---

## Building for Production

### 1. Build the Application

```bash
pnpm build
```

### 2. Test Production Build Locally

```bash
pnpm start
```

---

## Progressive Web App (PWA)

The application is configured as a PWA, enabling installation on mobile and desktop devices.

### Generating PWA Icons

```bash
pnpm run generate-pwa-icons
```

---

## Testing

### Run Linting

```bash
pnpm lint
```

### Type Checking

```bash
pnpm tsc --noEmit
```

---

## Troubleshooting

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solutions:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

### Module Not Found

**Error:** `Cannot find module 'xyz'`

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next pnpm-lock.yaml
pnpm install
```

### Firebase Configuration Errors

**Error:** `Firebase: Error (auth/invalid-api-key)`

**Solutions:**
1. Verify all Firebase environment variables are set
2. Check for typos in API key
3. Restart development server after changes

---

## Next Steps

After setting up the web application:

1. **[Backend Setup](backend-setup.md)** - Set up the backend API
2. **[Database Setup](database-setup.md)** - Configure Firestore
3. **[Deployment](deployment.md)** - Deploy to production

---

**Need help?** Check the [Troubleshooting Guide](../guides/troubleshooting.md) or return to [Setup Guide](../SETUP.md).
