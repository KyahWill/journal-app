# Journal App

A modern web application for journaling with AI-powered executive coaching.

## 🚀 Quick Start

```bash
# Navigate to web directory
cd web

# Install dependencies
pnpm install

# Create .env.local file with your Gemini API key
# (See docs/SETUP_GUIDE.md for details)

# Run development server
pnpm dev

# Open http://localhost:3000
```

## 📚 Documentation

- **[SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** - Local development setup
- **[WEB_SETUP.md](docs/WEB_SETUP.md)** - Google Cloud Run deployment
- **[FEATURE_SET.md](docs/FEATURE_SET.md)** - Complete feature reference
- **[PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)** - Project overview

## ✨ Features

- 📝 **Journal Management** - Create, edit, search, and delete entries
- 🤖 **AI Executive Coach** - Get personalized insights from Google Gemini
- 🔄 **Real-time Sync** - Live updates across all devices
- 🔒 **Secure** - Firebase security rules
- 🎨 **Modern UI** - Tailwind CSS + shadcn/ui components
- 📱 **Responsive** - Works on mobile, tablet, and desktop

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Firebase** - Backend (Auth, Firestore, Real-time)
- **Google Gemini** - AI coaching via LangChain
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautifully designed components

## 📦 Project Structure

```
journal/
├── docs/               # Documentation
├── web/               # Next.js application
│   ├── app/          # Pages and API routes
│   ├── components/   # UI components
│   ├── lib/          # Utilities and integrations
│   └── ...
└── README.md         # This file
```

## 🚢 Deployment

Deploy to Google Cloud Run:

```bash
cd web
gcloud builds submit --config cloudbuild.yaml
```

See [WEB_SETUP.md](docs/WEB_SETUP.md) for detailed deployment instructions.

## 📝 Environment Variables

Create `web/.env.local`:

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
```

Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).
Get your Firebase credentials from [Firebase Console](https://console.firebase.google.com).

## 🤝 Contributing

This is a personal project, but feel free to fork and customize for your own use!

## 📄 License

MIT License - feel free to use this project as you wish.

---

**Need help?** Check the [documentation](docs/) or open an issue.

