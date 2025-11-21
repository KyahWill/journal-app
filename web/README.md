# Journal Web App

A modern web application for journaling with AI-powered executive coaching, built with Next.js 14, Firebase, and Google Gemini.

## Features

- 📝 **Journal Management**: Create, read, update, and delete journal entries
- 🔍 **Search**: Full-text search across all your entries
- 🤖 **AI Executive Coach**: Get personalized insights and coaching based on your journal
- 🔄 **Real-time Sync**: Live updates across all your devices
- 🔒 **Secure**: Firebase security rules
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Firestore, Auth, Real-time)
- **AI**: Google Gemini via LangChain
- **Deployment**: Google Cloud Run

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)
- Firebase project
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
cd web
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file (see `.env.example`):
```env
# Firebase Configuration (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Firebase Admin SDK (stringified service account JSON)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your_project_id",...}'

# Google Gemini API Key (from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here
```

See [FIREBASE_SETUP.md](../docs/FIREBASE_SETUP.md) for detailed setup instructions.

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
app/
├── api/                    # API routes
│   ├── auth/              # Server-side auth API
│   ├── chat/              # AI coach API
│   └── journal/           # Journal CRUD API
├── auth/                  # Authentication pages
│   ├── login/
│   └── signup/
├── dashboard/             # Protected dashboard
│   ├── journal/          # Journal pages
│   └── coach/            # AI coach chat
├── page.tsx              # Landing page
└── layout.tsx            # Root layout

lib/
├── firebase/             # Firebase clients and config
├── ai/                   # AI coach logic
├── types.ts              # TypeScript types
└── utils.ts              # Utility functions

components/
└── ui/                   # shadcn/ui components
```

## Deployment to Google Cloud Run

See [WEB_SETUP.md](../docs/WEB_SETUP.md) for detailed deployment instructions.

Quick deployment:
```bash
# Build and push Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/journal-web .
docker push gcr.io/YOUR_PROJECT_ID/journal-web

# Deploy to Cloud Run
gcloud run deploy journal-web \
  --image gcr.io/YOUR_PROJECT_ID/journal-web \
  --platform managed \
  --region us-west1 \
  --allow-unauthenticated
```

## Environment Variables

### Development (.env.local)
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Firebase service account key (stringified JSON)
- `GEMINI_API_KEY`: Google Gemini API key (server-side only)

### Production (Cloud Run)
Same variables configured via Cloud Run environment variables and Secret Manager.

See [FIREBASE_SETUP.md](../docs/FIREBASE_SETUP.md) for detailed configuration.

## Database Schema

The app uses Firebase Firestore with the following collections:

### profiles (collection)
```typescript
{
  id: string              // Document ID (matches user UID)
  email: string
  full_name: string | null
  created_at: Timestamp
  updated_at: Timestamp
}
```

### journal_entries (collection)
```typescript
{
  id: string              // Auto-generated document ID
  user_id: string         // User UID
  title: string
  content: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

Both collections are protected by Firebase Security Rules (see `firestore.rules`).

## Development

### Running Tests
```bash
pnpm test
```

### Building for Production
```bash
pnpm build
pnpm start
```

### Linting
```bash
pnpm lint
```

## Features Overview

### Authentication
- **100% Server-Side Authentication** with Firebase
- Email/password signup and login (server-side)
- HTTP-only secure session cookies
- Protected routes with middleware verification
- Automatic redirects
- No client-side token exposure

See [Server-Side Auth Documentation](./docs/SERVER_SIDE_AUTH.md) and [Migration Guide](./docs/AUTH_MIGRATION_GUIDE.md) for details.

### Journal
- Create entries with title and content
- View all entries in card layout
- Search entries in real-time
- Edit entries with inline editing
- Delete with confirmation dialog
- Real-time updates via Firestore listeners

### AI Coach
- Context-aware coaching using all journal entries
- Conversation history (last 20 messages)
- Executive coaching persona
- Powered by Google Gemini 2.0 Flash
- Clear chat history option

## Performance

- Server-side rendering (SSR) for fast initial load
- Automatic code splitting
- Optimized images and assets
- Real-time subscriptions for live updates
- Standalone output for minimal Docker image size

## Security

- Firebase Security Rules on all collections
- **Server-side authentication** with Firebase Admin SDK
- HTTP-only, secure session cookies (no client-side token exposure)
- Middleware verification on every protected route
- Session revocation on logout
- Environment variables for sensitive data
- HTTPS enforcement in production

See [Server-Side Auth Documentation](./docs/SERVER_SIDE_AUTH.md) for security details.

## Support

For issues or questions, please refer to:
- [Server-Side Auth Documentation](./docs/SERVER_SIDE_AUTH.md) - Authentication implementation details
- [Auth Migration Guide](./docs/AUTH_MIGRATION_GUIDE.md) - Migration from client-side auth
- [Firebase Setup Guide](../docs/FIREBASE_SETUP.md)
- [Feature Set Documentation](../docs/FEATURE_SET.md)
- [Deployment Guide](../docs/WEB_SETUP.md)
- [Project Summary](../docs/PROJECT_SUMMARY.md)

## License

MIT
