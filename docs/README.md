# 📚 Journal App Documentation

Welcome to the comprehensive documentation for the Journal App - a modern journaling platform with AI-powered executive coaching capabilities.

## 🚀 Quick Start

New to the project? Start here:

1. **[Prerequisites & Setup](SETUP.md)** - Get the app running in 5 minutes
2. **[Architecture Overview](ARCHITECTURE.md)** - Understand the system design
3. **[Feature Reference](FEATURES.md)** - Explore what the app can do
4. **[API Reference](API_REFERENCE.md)** - Integrate with backend services

## 👥 Documentation by Role

### 🆕 New Developer
Start your journey here:
- [Setup Guide](SETUP.md) - Installation and configuration
- [Architecture Overview](ARCHITECTURE.md) - System design and components
- [Feature Reference](FEATURES.md) - What the app does
- [Contributing Guide](guides/contributing.md) - How to contribute
- [Best Practices](guides/best-practices.md) - Code standards and patterns

### 💻 Frontend Developer
Focus on web application development:
- [Web Architecture](architecture/web-architecture.md) - Next.js app structure
- [Web Setup](setup/web-setup.md) - Frontend development environment
- [Component Documentation](../web/components/README_PROGRESS_COMPONENTS.md) - UI components
- [Authentication](features/authentication.md) - Auth implementation
- [Theming System](features/theming.md) - Custom themes
- [Testing Guide](guides/testing.md) - Frontend testing

### ⚙️ Backend Developer
Focus on API and services:
- [Backend Architecture](architecture/backend-architecture.md) - NestJS structure
- [Backend Setup](setup/backend-setup.md) - API development environment
- [API Reference](API_REFERENCE.md) - Complete endpoint documentation
- [Data Models](architecture/data-models.md) - Database schema
- [RAG System](features/rag-system.md) - Retrieval-augmented generation
- [Voice Coach](features/voice-coach.md) - Voice AI implementation

### 🚀 DevOps / Platform Engineer
Focus on deployment and infrastructure:
- [Deployment Guide](setup/deployment.md) - Production deployment
- [Database Setup](setup/database-setup.md) - Firestore and Firebase
- [Environment Variables](setup/environment-variables.md) - Configuration
- [Troubleshooting](guides/troubleshooting.md) - Common issues
- [Security Architecture](architecture/security-architecture.md) - Security patterns

## 📖 Documentation by Topic

### 🏗️ Architecture
Understand the system design:
- **[Master Architecture Document](ARCHITECTURE.md)** - Complete system overview
- [System Overview](architecture/system-overview.md) - High-level architecture
- [Web Architecture](architecture/web-architecture.md) - Frontend design
- [Backend Architecture](architecture/backend-architecture.md) - API design
- [Data Models](architecture/data-models.md) - Database schema
- [Security Architecture](architecture/security-architecture.md) - Auth and security

### ✨ Features
Explore application capabilities:
- **[Master Feature Reference](FEATURES.md)** - All features overview
- [Authentication](features/authentication.md) - User management
- [Goals](features/goals.md) - Goal setting and tracking
- [Journal](features/journal.md) - Journal entries
- [Chat](features/chat.md) - AI chat coach
- [Voice Coach](features/voice-coach.md) - Voice AI coach
- [RAG System](features/rag-system.md) - Context-aware AI
- [Theming](features/theming.md) - Custom themes
- [Categories](features/categories.md) - Custom categories

### 🛠️ Setup & Configuration
Get the app running:
- **[Master Setup Guide](SETUP.md)** - Complete setup instructions
- [Prerequisites](setup/prerequisites.md) - Required tools and accounts
- [Web Setup](setup/web-setup.md) - Frontend setup
- [Backend Setup](setup/backend-setup.md) - API setup
- [Database Setup](setup/database-setup.md) - Firestore and Firebase
- [Environment Variables](setup/environment-variables.md) - Configuration
- [Deployment](setup/deployment.md) - Production deployment

### 🔌 API & Integrations
Work with APIs and external services:
- **[Master API Reference](API_REFERENCE.md)** - Complete API documentation
- [Authentication API](api/authentication-api.md) - Auth endpoints
- [Goals API](api/goals-api.md) - Goal management
- [Journal API](api/journal-api.md) - Journal entries
- [Chat API](api/chat-api.md) - AI chat
- [Voice Coach API](api/voice-coach-api.md) - Voice AI
- [RAG API](api/rag-api.md) - RAG system
- **Integrations:**
  - [Firebase](integrations/firebase.md) - Auth and database
  - [Google Gemini](integrations/gemini.md) - AI models
  - [ElevenLabs](integrations/elevenlabs.md) - Voice synthesis

### 📘 Guides
How-to guides and best practices:
- [Contributing Guide](guides/contributing.md) - How to contribute
- [Testing Guide](guides/testing.md) - Testing strategies
- [Troubleshooting](guides/troubleshooting.md) - Common issues
- [Best Practices](guides/best-practices.md) - Code standards

## 🔍 Search and Navigation Tips

### Finding Information Quickly

1. **Use your browser's search** (Cmd/Ctrl + F) within documentation pages
2. **Check the master documents first**: ARCHITECTURE.md, FEATURES.md, SETUP.md, API_REFERENCE.md
3. **Follow the role-based paths** above based on your focus area
4. **Use the topic-based navigation** to find specific information
5. **Check related documentation links** at the bottom of each document

### Documentation Structure

```
docs/
├── README.md                    # This file - master navigation hub
├── ARCHITECTURE.md              # Complete system architecture
├── FEATURES.md                  # Complete feature reference
├── SETUP.md                     # Complete setup guide
├── API_REFERENCE.md             # Complete API documentation
│
├── architecture/                # Detailed architecture docs
├── features/                    # Feature-specific documentation
├── setup/                       # Setup and configuration
├── api/                         # API endpoint documentation
├── integrations/                # External service integrations
└── guides/                      # How-to guides
```

### Common Tasks

| Task | Documentation |
|------|---------------|
| Set up development environment | [SETUP.md](SETUP.md) |
| Understand system architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Add a new feature | [guides/contributing.md](guides/contributing.md) |
| Debug an issue | [guides/troubleshooting.md](guides/troubleshooting.md) |
| Work with the API | [API_REFERENCE.md](API_REFERENCE.md) |
| Configure environment | [setup/environment-variables.md](setup/environment-variables.md) |
| Deploy to production | [setup/deployment.md](setup/deployment.md) |
| Understand authentication | [features/authentication.md](features/authentication.md) |
| Work with goals | [features/goals.md](features/goals.md) |
| Implement voice features | [features/voice-coach.md](features/voice-coach.md) |

## 📝 Contributing to Documentation

Help us improve the documentation:

1. **Keep it current** - Update docs when you change code
2. **Be clear and concise** - Use simple language and examples
3. **Add diagrams** - Visual aids help understanding
4. **Link related docs** - Help readers find more information
5. **Test examples** - Ensure code examples work

See [Contributing Guide](guides/contributing.md) for detailed guidelines.

## 🆘 Need Help?

- **Can't find what you need?** Check the [Troubleshooting Guide](guides/troubleshooting.md)
- **Found an issue?** Open an issue on GitHub
- **Want to contribute?** See the [Contributing Guide](guides/contributing.md)

## 📅 Documentation Status

**Last Updated**: November 2025

This documentation is actively maintained. If you find outdated information, please let us know!

---

**Quick Links**: [Architecture](ARCHITECTURE.md) | [Features](FEATURES.md) | [Setup](SETUP.md) | [API](API_REFERENCE.md) | [Troubleshooting](guides/troubleshooting.md)
