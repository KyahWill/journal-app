# Web Application Setup

**Last Updated**: November 2025

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
- User authentication (signup/login)
- Journal entry management
- AI chat coaching
- Voice AI coaching
- Goal setting and tracking
- Custom categories and theming

**Technology Stack:**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Authentication:** Firebase Auth (server-side)
- **Database:** Firebase Firestore
- **AI:** Google Gemini API
- **Voice:** ElevenLabs API (optional)

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

Or create manually:

```bash
touch .env.local
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

**Where to find these values:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Scroll to "Your apps" section
5. Copy the configuration values

### 3. Configure Firebase Admin SDK

Add your Firebase service account key:

```env
# Firebase Admin SDK (for server-side operations)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your_project_id",...}'
```

**How to get service account key:**
1. Go to **Project Settings** → **Service accounts**
2. Click "Generate new private key"
3. Save the JSON file
4. Stringify the JSON (remove newlines):

**macOS/Linux:**
```bash
cat serviceAccount.json | jq -c . | pbcopy
```

**Manual:** Copy the entire JSON content and remove all newlines.

### 4. Configure Gemini API

Add your Gemini API key:

```env
# Google Gemini API (from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key
```

**How to get API key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API key"
3. Copy the key

### 5. Configure Backend API URL

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**For production:** Update this to your deployed backend URL.

### 6. Configure Feature Flags (Optional)

```env
# Feature Flags
NEXT_PUBLIC_FEATURE_VOICE_COACH=true
```

### Complete .env.local Example

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com","client_id":"123456789012","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40your-project.iam.gserviceaccount.com","universe_domain":"googleapis.com"}'

# Google Gemini API
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Feature Flags
NEXT_PUBLIC_FEATURE_VOICE_COACH=true
```

---

## Development

### Start Development Server

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

**Options:**
```bash
# Use different port
PORT=3002 pnpm dev

# Enable turbopack (faster)
pnpm dev --turbo
```

### Development Features

- **Hot Module Replacement (HMR):** Changes reflect immediately
- **Fast Refresh:** React components update without losing state
- **TypeScript:** Type checking in real-time
- **ESLint:** Code linting on save

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
├── .env.local              # Environment variables
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

### Key Files

**app/layout.tsx:**
- Root layout with providers
- Theme configuration
- Font loading

**app/app/layout.tsx:**
- Protected app layout
- Authentication check
- Navigation header

**lib/firebase/clientApp.ts:**
- Firebase client initialization
- Used in client components

**lib/firebase/admin.ts:**
- Firebase Admin SDK
- Used in server components and API routes

**middleware.ts:**
- Authentication middleware
- Route protection
- Session verification

---

## Building for Production

### 1. Build the Application

```bash
pnpm build
```

This will:
- Compile TypeScript
- Bundle JavaScript
- Optimize images
- Generate static pages
- Create production build in `.next` directory

### 2. Test Production Build Locally

```bash
pnpm start
```

The production build will run at [http://localhost:3000](http://localhost:3000)

### 3. Analyze Bundle Size

```bash
# Install analyzer
pnpm add -D @next/bundle-analyzer

# Analyze bundle
ANALYZE=true pnpm build
```

### Build Output

```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         95.3 kB
├ ○ /api/auth/[...nextauth]              0 B                0 B
├ ƒ /app                                 142 B          90.2 kB
├ ƒ /app/goals                           8.3 kB        156.4 kB
├ ƒ /app/journal                         6.1 kB        142.3 kB
└ ○ /auth/login                          3.8 kB         93.9 kB

○  (Static)  automatically rendered as static HTML
ƒ  (Dynamic) server-rendered on demand
```

**Legend:**
- **○ Static:** Pre-rendered at build time
- **ƒ Dynamic:** Rendered on each request
- **Size:** Page-specific JavaScript
- **First Load JS:** Total JavaScript loaded on first visit

---

## Testing

### Run Linting

```bash
pnpm lint
```

Fix linting issues automatically:
```bash
pnpm lint --fix
```

### Type Checking

```bash
# Check types
pnpm tsc --noEmit

# Watch mode
pnpm tsc --noEmit --watch
```

### Format Code

```bash
# Check formatting
pnpm prettier --check .

# Fix formatting
pnpm prettier --write .
```

### Run Tests (if configured)

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

---

## Troubleshooting

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solutions:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3002 pnpm dev
```

### Module Not Found

**Error:** `Cannot find module 'xyz'`

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next pnpm-lock.yaml
pnpm install

# Clear Next.js cache only
rm -rf .next
pnpm dev
```

### Firebase Configuration Errors

**Error:** `Firebase: Error (auth/invalid-api-key)`

**Solutions:**
1. Verify all Firebase environment variables are set
2. Check for typos in API key
3. Ensure no extra spaces or quotes
4. Restart development server after changes

### Environment Variables Not Loading

**Error:** Variables are `undefined`

**Solutions:**
1. Ensure file is named `.env.local` (not `.env`)
2. Restart development server after changes
3. Check variables start with `NEXT_PUBLIC_` for client-side access
4. Verify no syntax errors in `.env.local`

### Build Errors

**Error:** Type errors during build

**Solutions:**
```bash
# Check TypeScript errors
pnpm tsc --noEmit

# Fix common issues
pnpm lint --fix

# Clear cache and rebuild
rm -rf .next
pnpm build
```

### Hydration Errors

**Error:** `Hydration failed because the initial UI does not match`

**Solutions:**
1. Ensure server and client render the same content
2. Don't use browser-only APIs in server components
3. Use `'use client'` directive for client-only components
4. Check for date/time formatting differences

### CORS Errors

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solutions:**
1. Ensure backend is running
2. Check `NEXT_PUBLIC_API_URL` is correct
3. Verify backend CORS configuration includes frontend URL
4. For development, backend should allow `http://localhost:3000`

### Authentication Issues

**Error:** "Unauthorized" or session errors

**Solutions:**
1. Clear browser cookies
2. Check Firebase Auth is enabled
3. Verify service account key is correct
4. Check middleware.ts is configured correctly
5. Ensure session cookies are being set

### Slow Development Server

**Solutions:**
```bash
# Use turbopack (experimental but faster)
pnpm dev --turbo

# Reduce file watching
# Add to next.config.ts:
experimental: {
  optimizePackageImports: ['@/components/ui']
}

# Clear cache
rm -rf .next
```

---

## Next Steps

After setting up the web application:

1. **[Backend Setup](backend-setup.md)** - Set up the backend API
2. **[Database Setup](database-setup.md)** - Configure Firestore
3. **[Deployment](deployment.md)** - Deploy to production

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

**Need help?** Check the [Troubleshooting Guide](../guides/troubleshooting.md) or return to [Setup Guide](../SETUP.md).
