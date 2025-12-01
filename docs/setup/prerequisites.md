# Prerequisites

**Last Updated**: November 2025

This guide covers all prerequisites needed to set up and run the Journal application.

## Table of Contents

- [Required Software](#required-software)
- [Required Accounts](#required-accounts)
- [API Keys and Credentials](#api-keys-and-credentials)
- [Optional Services](#optional-services)
- [Verification](#verification)

---

## Required Software

### Node.js 18+

The application requires Node.js version 18 or higher.

**Installation:**

**macOS (using Homebrew):**
```bash
brew install node@18
```

**Linux (using nvm):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/)

**Verify installation:**
```bash
node --version  # Should show v18.x.x or higher
npm --version
```

### pnpm (Package Manager)

pnpm is the recommended package manager for this project.

**Installation:**
```bash
npm install -g pnpm
```

**Verify installation:**
```bash
pnpm --version  # Should show 8.x.x or higher
```

**Alternative:** You can use npm or yarn, but pnpm is recommended for faster installs and better disk space usage.

### Git

Git is required for version control.

**Installation:**

**macOS:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt-get install git  # Debian/Ubuntu
sudo yum install git      # CentOS/RHEL
```

**Windows:**
Download from [git-scm.com](https://git-scm.com/)

**Verify installation:**
```bash
git --version
```

### Firebase CLI (Optional but Recommended)

The Firebase CLI is needed for deploying security rules and indexes.

**Installation:**
```bash
npm install -g firebase-tools
```

**Login:**
```bash
firebase login
```

**Verify installation:**
```bash
firebase --version
```

### Docker (Optional)

Docker is needed for containerized deployment.

**Installation:**
- **macOS/Windows:** Download [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux:** Follow [Docker Engine installation](https://docs.docker.com/engine/install/)

**Verify installation:**
```bash
docker --version
docker-compose --version
```

---

## Required Accounts

### Firebase Project

Firebase provides authentication, database, and hosting services.

**Setup Steps:**

1. **Create Firebase Account**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Add project"
   - Enter project name (e.g., "journal-app")
   - Enable Google Analytics (optional)
   - Click "Create project"

3. **Enable Firestore Database**
   - In Firebase Console, go to **Build** → **Firestore Database**
   - Click "Create database"
   - Choose **Production mode** (recommended) or **Test mode**
   - Select a location (cannot be changed later!)
   - Click "Enable"

4. **Enable Authentication**
   - Go to **Build** → **Authentication**
   - Click "Get started"
   - Enable **Email/Password** provider:
     - Click on "Email/Password"
     - Toggle "Enable"
     - Click "Save"

5. **Create Web App**
   - Go to **Project Settings** (gear icon)
   - Scroll to "Your apps"
   - Click web icon (</>) to add web app
   - Register app with nickname (e.g., "journal-web")
   - Copy the Firebase configuration (you'll need this later)

6. **Generate Service Account Key**
   - Go to **Project Settings** → **Service accounts**
   - Click "Generate new private key"
   - Click "Generate key"
   - Save the JSON file securely (you'll need this later)
   - **Important:** Never commit this file to version control!

### Google Cloud Project

Your Firebase project automatically creates a Google Cloud project.

**Setup Steps:**

1. **Access Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Select your Firebase project

2. **Enable Required APIs**
   - Go to **APIs & Services** → **Library**
   - Search and enable:
     - Firestore API (should already be enabled)
     - Firebase Admin SDK API
     - Cloud Functions API (if using Cloud Functions)

3. **Set Up Billing (for Production)**
   - Go to **Billing**
   - Link a billing account
   - **Note:** Firebase has a generous free tier, but production usage may require billing

---

## API Keys and Credentials

### Google Gemini API Key

Required for AI coaching features.

**Setup Steps:**

1. **Get API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API key"
   - Select your Google Cloud project (or create new one)
   - Copy the API key

2. **Enable Gemini API**
   - The API should be automatically enabled
   - If not, go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to **APIs & Services** → **Library**
   - Search for "Generative Language API"
   - Click "Enable"

3. **Set Up Billing (Required for Production)**
   - Gemini API requires billing for production usage
   - Free tier: 15 requests per minute, 1500 requests per day
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Set up billing account

**API Key Security:**
- Store in environment variables (never in code)
- Use different keys for development and production
- Rotate keys periodically
- Monitor usage in Google Cloud Console

### Firebase Configuration

You'll need the following Firebase configuration values:

**From Firebase Console → Project Settings → General:**
- API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID

**Example:**
```javascript
{
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
}
```

### Firebase Service Account Key

**From Firebase Console → Project Settings → Service Accounts:**

1. Click "Generate new private key"
2. Save the JSON file
3. For environment variables, stringify the JSON:

**macOS/Linux:**
```bash
cat serviceAccount.json | jq -c .
```

**Or manually:** Remove all newlines and extra spaces from the JSON.

**Example (stringified):**
```json
{"type":"service_account","project_id":"your-project","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com",...}
```

---

## Optional Services

### ElevenLabs (Voice Coach Feature)

Required only if you want to enable voice coaching features.

**Setup Steps:**

1. **Create Account**
   - Go to [ElevenLabs](https://elevenlabs.io/)
   - Sign up for an account

2. **Get API Key**
   - Go to Profile → API Keys
   - Copy your API key

3. **Create Agent (Optional)**
   - Go to Conversational AI
   - Create a new agent
   - Copy the agent ID

**Pricing:**
- Free tier: 10,000 characters/month
- Paid plans available for higher usage

### Firebase Vector Search (RAG Storage)

Firebase Firestore with vector search capabilities for embeddings.

**Setup Steps:**

1. **Enable Firestore**
   - Already included in Firebase setup above
   - No additional account needed

2. **Configure Vector Search**
   - Create appropriate indexes
   - Set up security rules
   - Wait for project to be provisioned

3. **Get Credentials**
   - Go to Project Settings → API
   - Copy:
     - Project URL
     - Anon/Public key
     - Service role key (for backend)

4. **Enable Vector Extension**
   - Go to Database → Extensions
   - Enable `pgvector` extension

**Pricing:**
- Free tier: 500MB database, 2GB bandwidth
- Paid plans for production usage

---

## Verification

### Verify Node.js and pnpm

```bash
node --version   # Should be v18.x.x or higher
pnpm --version   # Should be 8.x.x or higher
```

### Verify Firebase CLI

```bash
firebase --version
firebase login
firebase projects:list  # Should show your project
```

### Verify Firebase Project

1. **Check Firestore:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Go to **Firestore Database**
   - Should see database interface (may be empty)

2. **Check Authentication:**
   - Go to **Authentication**
   - Should see "Email/Password" enabled under Sign-in methods

3. **Check Service Account:**
   - Go to **Project Settings** → **Service accounts**
   - Should see service account email
   - Should have generated private key

### Verify Gemini API

Test your API key:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
```

Should return a list of available models.

### Test Firebase Connection

Create a test script:

```javascript
// test-firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

db.collection('test').add({ message: 'Hello' })
  .then(() => console.log('✅ Firebase connection successful!'))
  .catch(err => console.error('❌ Firebase connection failed:', err));
```

Run:
```bash
npm install firebase-admin
node test-firebase.js
```

---

## Next Steps

Once you have all prerequisites installed and configured:

1. **[Web Setup](web-setup.md)** - Set up the web application
2. **[Backend Setup](backend-setup.md)** - Set up the backend API
3. **[Database Setup](database-setup.md)** - Configure Firestore
4. **[Environment Variables](environment-variables.md)** - Configure all environment variables

---

## Troubleshooting

### Firebase CLI Login Issues

**Error:** "Cannot open browser"

**Solution:**
```bash
firebase login --no-localhost
```
Follow the URL and paste the authorization code.

### Service Account Permission Issues

**Error:** "Permission denied"

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **IAM & Admin** → **IAM**
3. Find your service account
4. Ensure it has these roles:
   - Firebase Admin SDK Administrator Service Agent
   - Cloud Datastore User

### Gemini API Not Working

**Error:** "API key invalid"

**Solutions:**
1. Verify API key is correct (no extra spaces)
2. Check API is enabled in Google Cloud Console
3. Ensure billing is set up for production usage
4. Check API quota hasn't been exceeded

### Node Version Issues

**Error:** "Unsupported engine"

**Solution:**
```bash
# Use nvm to switch Node versions
nvm install 18
nvm use 18
```

---

**Need help?** Check the [Troubleshooting Guide](../guides/troubleshooting.md) or return to [Setup Guide](../SETUP.md).
