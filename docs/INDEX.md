# Documentation Index

Complete documentation for the Journal application.

## 📋 Quick Navigation

> **Note**: See [DOCUMENTATION_STRUCTURE.md](DOCUMENTATION_STRUCTURE.md) for a complete overview of all documentation files.  
> **Recent**: All documentation has been reorganized into the `docs/` directory. See [REORGANIZATION_SUMMARY.md](REORGANIZATION_SUMMARY.md) for details.

### 🔐 Authentication

- **[Authentication Architecture](AUTHENTICATION_ARCHITECTURE.md)** ⭐ - Complete authentication guide
  - System-wide architecture overview
  - Web application (Next.js) authentication
  - Backend API (NestJS) authentication
  - Quick reference code examples
  - Troubleshooting and best practices

### 🏗️ Architecture & Features
- **[System Architecture](ARCHITECTURE.md)** - Overall system design
- **[Feature Set](FEATURE_SET.md)** - Complete feature reference

### 🛠️ Setup & Configuration
- **[Backend README](backend/BACKEND_README.md)** - Backend setup and API documentation
- **[Web README](web/WEB_README.md)** - Web app setup and deployment
- **[Firestore Setup](backend/FIRESTORE_SETUP.md)** - Database configuration

### 📝 Implementation & Development
- **[Implementation Summary](web/IMPLEMENTATION_SUMMARY.md)** - Web app implementation details
- **[Theming Implementation](THEMING_IMPLEMENTATION.md)** - Theme system and customization
- **[ElevenLabs Integration](ELEVENLABS_INTEGRATION_SUMMARY.md)** - Voice/audio integration

### 🐛 Troubleshooting & Analysis
- **[Bugs to be Fixed](BUGS_TO_BE_FIXED.md)** - Known issues and planned fixes
- **[Authentication Issues Analysis](AUTHENTICATION_ISSUES_ANALYSIS.md)** - Auth problem analysis
- **[Authentication Fixes](AUTHENTICATION_FIXES.md)** - Implemented auth fixes
- **[Auth Analysis README](AUTH_ANALYSIS_README.md)** - Detailed auth analysis
- **[Auth Edge Cases Summary](AUTH_EDGE_CASES_SUMMARY.md)** - Edge case handling
- **[Auth Problem Examples](AUTH_PROBLEM_EXAMPLES.md)** - Common auth problems

## 📚 Documentation by Topic

### Authentication

| Document | Purpose | Audience |
|----------|---------|----------|
| [Authentication Architecture](AUTHENTICATION_ARCHITECTURE.md) | Complete authentication guide covering web & backend | **All developers** |

**Covers:**
- System-wide architecture
- Web application (Next.js) with HTTP-only cookies
- Backend API (NestJS) with Bearer tokens
- Quick reference code examples
- Common issues and troubleshooting
- Best practices and security

**Key Concepts:**
- Server-side authentication only
- Firebase Admin SDK for verification
- HTTP-only cookies (Web) & Bearer tokens (Backend)
- Middleware & Guard-based route protection

### Architecture

| Document | Purpose | Audience |
|----------|---------|----------|
| [Documentation Structure](DOCUMENTATION_STRUCTURE.md) | Complete docs organization | All developers |
| [System Architecture](ARCHITECTURE.md) | Overall system design | All developers |
| [Feature Set](FEATURE_SET.md) | Available features | Product/Dev |

**Key Components:**
- Next.js 14 with App Router
- Firebase (Firestore + Auth)
- Google Gemini AI
- NestJS backend (optional)

### Backend

| Document | Purpose | Audience |
|----------|---------|----------|
| [Backend README](backend/BACKEND_README.md) | Backend setup & API docs | Backend developers |
| [Firestore Setup](backend/FIRESTORE_SETUP.md) | Database configuration | Backend developers |

**Technologies:**
- NestJS framework
- Firestore for data storage
- Firebase Admin SDK
- Security rules
- Google Gemini AI

**Key Features:**
- RESTful API endpoints
- Guard-based route protection
- Token verification with Firebase Admin SDK

### Frontend

| Document | Purpose | Audience |
|----------|---------|----------|
| [Web README](web/WEB_README.md) | Web app setup & deployment | Frontend developers |
| [Implementation Summary](web/IMPLEMENTATION_SUMMARY.md) | Web implementation details | Frontend developers |
| [Contexts README](web/CONTEXTS_README.md) | React context usage guide | Frontend developers |
| [Theming Implementation](THEMING_IMPLEMENTATION.md) | Theme system | Frontend developers |

**Technologies:**
- Next.js 14
- React Server Components
- Tailwind CSS + shadcn/ui
- TypeScript

**Key Features:**
- Server-side rendering
- API route handlers
- Middleware route protection
- Session-based authentication

### Integrations

| Document | Purpose | Audience |
|----------|---------|----------|
| [ElevenLabs Integration](ELEVENLABS_INTEGRATION_SUMMARY.md) | Voice/audio integration | All developers |

**Features:**
- Text-to-speech
- Voice synthesis
- Audio streaming

### Troubleshooting

| Document | Purpose | Audience |
|----------|---------|----------|
| [Bugs to be Fixed](BUGS_TO_BE_FIXED.md) | Known issues | All developers |

## 🎯 Documentation by Role

### New Developers
Start here to understand the system:
1. [Feature Set](FEATURE_SET.md) - What the app does
2. [Authentication Summary](AUTHENTICATION_SUMMARY.md) - Quick auth overview (5 min)
3. [System Architecture](ARCHITECTURE.md) - How it's built
4. [Quick Reference](web/AUTH_QUICK_REFERENCE.md) - Start coding

### Frontend Developers
Working on UI and client-side code:
1. [Quick Reference](web/AUTH_QUICK_REFERENCE.md) - Auth patterns
2. [Implementation Summary](web/IMPLEMENTATION_SUMMARY.md) - Web app details
3. [Authentication Architecture](AUTHENTICATION_ARCHITECTURE.md) - Full auth picture

### Backend Developers
Working on APIs and server-side code:
1. [Server-Side Auth Details](web/SERVER_SIDE_AUTH.md) - Auth implementation
2. [Firestore Setup](backend/FIRESTORE_SETUP.md) - Database config
3. [Authentication Architecture](AUTHENTICATION_ARCHITECTURE.md) - Auth overview

### DevOps/Infrastructure
Setting up and deploying:
1. [System Architecture](ARCHITECTURE.md) - System overview
2. [Firestore Setup](backend/FIRESTORE_SETUP.md) - Database setup
3. [Server-Side Auth Details](web/SERVER_SIDE_AUTH.md) - Auth configuration

### Security Reviewers
Understanding security implementation:
1. [Authentication Architecture](AUTHENTICATION_ARCHITECTURE.md) - Complete security model
2. [Server-Side Auth Details](web/SERVER_SIDE_AUTH.md) - Implementation specifics
3. [Firestore Setup](backend/FIRESTORE_SETUP.md) - Security rules

## 🔍 Find by Task

### I want to...

#### Get a quick overview of authentication (5 min)
→ [Authentication Summary](AUTHENTICATION_SUMMARY.md)

#### Understand how authentication works in detail
→ [Authentication Architecture](AUTHENTICATION_ARCHITECTURE.md)

#### Quick lookup while coding
→ [Auth Cheat Sheet](AUTH_CHEAT_SHEET.md)

#### Add authentication to a component
→ [Quick Reference - Component Development](web/AUTH_QUICK_REFERENCE.md#for-component-development)

#### Create a protected route
→ [Quick Reference - Protected Routes](web/AUTH_QUICK_REFERENCE.md#protected-api-route)

#### Handle login/signup
→ [Quick Reference - Common Patterns](web/AUTH_QUICK_REFERENCE.md#common-patterns)

#### Configure Firebase
→ [Firestore Setup](backend/FIRESTORE_SETUP.md)

#### Understand the system architecture
→ [System Architecture](ARCHITECTURE.md)

#### See all available features
→ [Feature Set](FEATURE_SET.md)

#### Debug authentication issues
→ [Quick Reference - Debugging](web/AUTH_QUICK_REFERENCE.md#debugging-tips)

#### Migrate from client-side auth
→ [Migration Guide](web/AUTH_MIGRATION_GUIDE.md)

#### Set up environment variables
→ [Server-Side Auth - Environment Variables](web/SERVER_SIDE_AUTH.md#environment-variables)

#### Test authentication
→ [Quick Reference - Testing](web/AUTH_QUICK_REFERENCE.md#testing)

## 📖 Reading Order

### For Understanding the System
1. [Feature Set](FEATURE_SET.md) - What it does
2. [System Architecture](ARCHITECTURE.md) - How it works
3. [Authentication Architecture](AUTHENTICATION_ARCHITECTURE.md) - Security & auth

### For Development
1. [Quick Reference](web/AUTH_QUICK_REFERENCE.md) - Common patterns
2. [Authentication Architecture](AUTHENTICATION_ARCHITECTURE.md) - Deep dive
3. [Implementation Summary](web/IMPLEMENTATION_SUMMARY.md) - Details

### For Setup
1. [Firestore Setup](backend/FIRESTORE_SETUP.md) - Database
2. [Server-Side Auth Details](web/SERVER_SIDE_AUTH.md) - Auth config
3. [System Architecture](ARCHITECTURE.md) - Overview

## 📂 File Organization

```
docs/
├── INDEX.md                           # This file - Main navigation
│
├── Core Documentation
│   ├── ARCHITECTURE.md                # System architecture
│   ├── FEATURE_SET.md                 # Feature reference
│   └── AUTHENTICATION_ARCHITECTURE.md # Complete auth guide (web & backend)
│
├── Implementation & Integration
│   ├── THEMING_IMPLEMENTATION.md      # Theme system
│   └── ELEVENLABS_INTEGRATION_SUMMARY.md # Voice integration
│
├── Troubleshooting
│   └── BUGS_TO_BE_FIXED.md           # Known issues
│
├── web/                               # Web app documentation
│   ├── WEB_README.md                 # Web app setup & deploy
│   ├── CONTEXTS_README.md            # Context usage guide
│   └── IMPLEMENTATION_SUMMARY.md     # Web implementation
│
└── backend/                           # Backend documentation
    ├── BACKEND_README.md             # Backend setup & API
    └── FIRESTORE_SETUP.md            # Database setup
```

## 🆘 Need Help?

### Can't find what you're looking for?

1. **Search**: Use Ctrl+F / Cmd+F in your IDE to search across all docs
2. **Check**: Root [README.md](../README.md) for quick start guide
3. **Browse**: Look through this index for related topics

### Common Questions

**Q: How does authentication work?**  
A: See [Authentication Architecture](AUTHENTICATION_ARCHITECTURE.md)

**Q: How do I add auth to my component?**  
A: See [Quick Reference](web/AUTH_QUICK_REFERENCE.md)

**Q: What features does the app have?**  
A: See [Feature Set](FEATURE_SET.md)

**Q: How is the system structured?**  
A: See [System Architecture](ARCHITECTURE.md)

**Q: How do I set up Firestore?**  
A: See [Firestore Setup](backend/FIRESTORE_SETUP.md)

## 🔄 Documentation Updates

| Document | Last Updated | Status |
|----------|--------------|--------|
| Authentication Summary | Nov 2024 | ✅ Current |
| Auth Cheat Sheet | Nov 2024 | ✅ Current |
| Authentication Architecture | Nov 2024 | ✅ Current |
| Quick Reference | Nov 2024 | ✅ Current |
| Server-Side Auth | Nov 2024 | ✅ Current |
| Migration Guide | Nov 2024 | ✅ Current |
| Documentation Index | Nov 2024 | ✅ Current |
| System Architecture | - | 📝 To Review |
| Feature Set | - | 📝 To Review |

## 📋 Documentation Standards

### For Contributors

When updating documentation:

1. **Keep it current** - Update after code changes
2. **Be specific** - Include code examples
3. **Be concise** - Get to the point quickly
4. **Link related docs** - Help readers navigate
5. **Update this index** - Keep navigation current

### Document Format

All documentation should include:

- Clear title and overview
- Table of contents (for longer docs)
- Code examples with syntax highlighting
- Links to related documentation
- Last updated date

---

**Quick Links:**
- [Main README](../README.md)
- [Project Root](../)
- [Web App](../web/)
- [Backend](../backend/)

**Last Updated**: November 2024

