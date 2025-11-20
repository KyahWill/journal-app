# Journal Backend API

NestJS backend for the Journal application with Firebase Admin SDK and Google Gemini AI integration.

## 🚀 Features

- **Firebase Admin SDK**: Server-side Firebase authentication and Firestore operations
- **Google Gemini AI**: AI-powered coaching and insights using Gemini 2.0
- **RESTful API**: Clean, organized endpoints for all operations
- **Authentication**: JWT token-based authentication via Firebase
- **Validation**: Request validation using class-validator
- **TypeScript**: Full type safety throughout the application
- **Modular Architecture**: Organized into feature modules

## 📦 Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK
- **AI**: Google Gemini AI
- **Validation**: class-validator, class-transformer

## 📁 Project Structure

```
backend/
├── src/
│   ├── auth/              # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── journal/           # Journal entries module
│   │   ├── journal.controller.ts
│   │   ├── journal.service.ts
│   │   └── journal.module.ts
│   ├── chat/              # AI Coach chat module
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   │   └── chat.module.ts
│   ├── firebase/          # Firebase Admin SDK module
│   │   ├── firebase.service.ts
│   │   └── firebase.module.ts
│   ├── gemini/            # Google Gemini AI module
│   │   ├── gemini.service.ts
│   │   └── gemini.module.ts
│   ├── common/            # Shared resources
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── guards/        # Auth guards
│   │   ├── decorators/    # Custom decorators
│   │   └── types/         # TypeScript types
│   ├── app.module.ts      # Main application module
│   ├── app.controller.ts  # Health check endpoints
│   └── main.ts            # Application entry point
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ installed
- pnpm (or npm/yarn)
- Firebase project with Firestore enabled
- Google Gemini API key

### 1. Install Dependencies

```bash
cd backend
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Firebase Admin SDK
# Copy the entire JSON content from your service account key file
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'

# Firebase Project ID
FIREBASE_PROJECT_ID=your-project-id

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# API Configuration
API_PREFIX=api/v1
```

### 3. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** → **Service accounts**
4. Click **Generate new private key**
5. Save the JSON file
6. Stringify the JSON and add to `.env`:

**Mac/Linux:**
```bash
cat path/to/serviceAccount.json | jq -c . | pbcopy
```

**Windows:**
```powershell
Get-Content serviceAccount.json | ConvertFrom-Json | ConvertTo-Json -Compress | Set-Clipboard
```

### 4. Get Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy it to your `.env` file

### 5. Run the Application

**Development mode:**
```bash
pnpm start:dev
```

**Production mode:**
```bash
pnpm build
pnpm start:prod
```

The API will be available at `http://localhost:3001/api/v1`

## 📡 API Endpoints

### Health Check

```http
GET /
GET /health
```

Returns API health status.

### Authentication

#### Sign Up
```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

#### Verify Token
```http
POST /api/v1/auth/verify
Content-Type: application/json

{
  "token": "firebase-id-token"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <firebase-id-token>
```

#### Update User
```http
PUT /api/v1/auth/user/:uid
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "displayName": "New Name"
}
```

#### Delete User
```http
DELETE /api/v1/auth/user/:uid
Authorization: Bearer <firebase-id-token>
```

### Journal Entries

All journal endpoints require authentication (Bearer token).

#### Create Entry
```http
POST /api/v1/journal
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "title": "My Day",
  "content": "Today was amazing...",
  "mood": "happy",
  "tags": ["work", "personal"]
}
```

#### Get All Entries
```http
GET /api/v1/journal
Authorization: Bearer <firebase-id-token>
```

#### Get Recent Entries
```http
GET /api/v1/journal/recent?limit=10
Authorization: Bearer <firebase-id-token>
```

#### Search Entries
```http
GET /api/v1/journal/search?q=work
Authorization: Bearer <firebase-id-token>
```

#### Get Single Entry
```http
GET /api/v1/journal/:id
Authorization: Bearer <firebase-id-token>
```

#### Update Entry
```http
PUT /api/v1/journal/:id
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

#### Delete Entry
```http
DELETE /api/v1/journal/:id
Authorization: Bearer <firebase-id-token>
```

### AI Coach Chat

All chat endpoints require authentication (Bearer token).

#### Send Message
```http
POST /api/v1/chat/message
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "message": "How can I improve my productivity?",
  "sessionId": "optional-session-id"
}
```

#### Create Session
```http
POST /api/v1/chat/session
Authorization: Bearer <firebase-id-token>
```

#### Get All Sessions
```http
GET /api/v1/chat/sessions
Authorization: Bearer <firebase-id-token>
```

#### Get Single Session
```http
GET /api/v1/chat/session/:id
Authorization: Bearer <firebase-id-token>
```

#### Delete Session
```http
DELETE /api/v1/chat/session/:id
Authorization: Bearer <firebase-id-token>
```

#### Generate Insights
```http
GET /api/v1/chat/insights
Authorization: Bearer <firebase-id-token>
```

Returns AI-generated insights based on recent journal entries.

#### Get Suggested Prompts
```http
GET /api/v1/chat/prompts
Authorization: Bearer <firebase-id-token>
```

Returns suggested coaching questions based on journal entries.

## 🔐 Authentication

The API uses Firebase ID tokens for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

To get a Firebase ID token, users must authenticate through Firebase Auth (typically done in the web app frontend).

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## 🐳 Docker Support

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .

RUN pnpm build

EXPOSE 3001

CMD ["node", "dist/main"]
```

Build and run:

```bash
docker build -t journal-backend .
docker run -p 3001:3001 --env-file .env journal-backend
```

## 🚀 Deployment

### Deploy to Google Cloud Run

1. Build the Docker image:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/journal-backend
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy journal-backend \
  --image gcr.io/PROJECT_ID/journal-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

3. Set environment variables in Cloud Run console

### Deploy to Heroku

1. Create a `Procfile`:
```
web: node dist/main.js
```

2. Deploy:
```bash
heroku create journal-backend
git push heroku main
heroku config:set FIREBASE_SERVICE_ACCOUNT_KEY='...'
heroku config:set GEMINI_API_KEY='...'
```

## 📝 Development

### Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Format code
pnpm format

# Lint code
pnpm lint
```

### Adding New Modules

```bash
nest generate module feature-name
nest generate controller feature-name
nest generate service feature-name
```

## 🔍 Troubleshooting

### Firebase Admin SDK errors

- Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` is properly stringified JSON
- Check that the service account has proper permissions
- Verify Firebase project ID matches

### Gemini API errors

- Confirm API key is valid
- Check API quota and rate limits
- Ensure network access to Google AI services

### CORS errors

- Add your frontend URL to `CORS_ORIGINS` in `.env`
- Restart the server after changing CORS settings

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google Gemini API](https://ai.google.dev/docs)

## 📄 License

MIT

