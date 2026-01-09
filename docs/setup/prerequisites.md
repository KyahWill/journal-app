# Prerequisites

**Last Updated**: January 2026

This guide covers all prerequisites needed to set up and run the Journal application.

## Table of Contents

- [Required Software](#required-software)
- [Required Accounts](#required-accounts)
- [API Keys and Credentials](#api-keys-and-credentials)
- [Verification](#verification)

---

## Required Software

### Node.js 18+

The application requires Node.js version 18 or higher.

### pnpm (Package Manager)

pnpm is the recommended package manager for this project.

### Git

Git is required for version control.

### Firebase CLI (Optional but Recommended)

The Firebase CLI is needed for deploying security rules and indexes.

---

## Required Accounts

### Firebase Project

Firebase provides authentication, database, and hosting services.

**Setup Steps:**

1. **Create Firebase Account**
2. **Create New Project**
3. **Enable Firestore Database**
4. **Enable Authentication** (Email/Password provider)
5. **Create Web App**
6. **Generate Service Account Key**

---

## API Keys and Credentials

### Google Gemini API Key

Required for AI coaching features.

### Firebase Configuration

You'll need the following Firebase configuration values:
- API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID

### Firebase Service Account Key

Required for backend operations and server-side authentication.

---

## Verification

### Verify Node.js and pnpm

```bash
node --version
pnpm --version
```

### Verify Firebase Project

1. **Check Firestore**
2. **Check Authentication**
3. **Check Service Account**

---

## Next Steps

Once you have all prerequisites installed and configured:

1. **[Web Setup](web-setup.md)** - Set up the web application
2. **[Backend Setup](backend-setup.md)** - Set up the backend API
3. **[Database Setup](database-setup.md)** - Configure Firestore
4. **[Environment Variables](environment-variables.md)** - Configure all environment variables

---

**Need help?** Check the [Troubleshooting Guide](../guides/troubleshooting.md) or return to [Setup Guide](../SETUP.md).
