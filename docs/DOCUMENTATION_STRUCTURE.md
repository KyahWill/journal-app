# Documentation Structure

This document describes the complete organization of all project documentation.

## Overview

All project documentation has been consolidated into the `docs/` directory, with only the main `README.md` remaining at the project root.

## Root Level

- **README.md** - Main project overview, quick start guide, and entry point

## Documentation Directory (`docs/`)

### Core Documentation

| File | Description |
|------|-------------|
| [INDEX.md](INDEX.md) | Main documentation index and navigation guide |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture overview |
| [FEATURE_SET.md](FEATURE_SET.md) | Complete feature reference |

### Authentication Documentation

| File | Description |
|------|-------------|
| [AUTHENTICATION_ARCHITECTURE.md](AUTHENTICATION_ARCHITECTURE.md) | Complete auth system overview |
| [AUTHENTICATION_SUMMARY.md](AUTHENTICATION_SUMMARY.md) | 5-minute auth overview (start here!) |
| [AUTH_CHEAT_SHEET.md](AUTH_CHEAT_SHEET.md) | Quick reference card |
| [AUTHENTICATION_FIXES.md](AUTHENTICATION_FIXES.md) | Implemented authentication fixes |
| [AUTHENTICATION_ISSUES_ANALYSIS.md](AUTHENTICATION_ISSUES_ANALYSIS.md) | Auth problem analysis |
| [AUTH_ANALYSIS_README.md](AUTH_ANALYSIS_README.md) | Detailed auth analysis |
| [AUTH_EDGE_CASES_SUMMARY.md](AUTH_EDGE_CASES_SUMMARY.md) | Edge case handling |
| [AUTH_PROBLEM_EXAMPLES.md](AUTH_PROBLEM_EXAMPLES.md) | Common auth problems and solutions |

### Implementation & Integration

| File | Description |
|------|-------------|
| [THEMING_IMPLEMENTATION.md](THEMING_IMPLEMENTATION.md) | Theme system and customization |
| [ELEVENLABS_INTEGRATION_SUMMARY.md](ELEVENLABS_INTEGRATION_SUMMARY.md) | Voice/audio integration |

### Troubleshooting

| File | Description |
|------|-------------|
| [BUGS_TO_BE_FIXED.md](BUGS_TO_BE_FIXED.md) | Known issues and planned fixes |

## Web Documentation (`docs/web/`)

Frontend-specific documentation for the Next.js web application.

| File | Description |
|------|-------------|
| [WEB_README.md](web/WEB_README.md) | Web app setup, deployment, and overview |
| [IMPLEMENTATION_SUMMARY.md](web/IMPLEMENTATION_SUMMARY.md) | Web implementation details |
| [CONTEXTS_README.md](web/CONTEXTS_README.md) | React context usage guide |
| [AUTH_QUICK_REFERENCE.md](web/AUTH_QUICK_REFERENCE.md) | Quick auth reference for developers |
| [SERVER_SIDE_AUTH.md](web/SERVER_SIDE_AUTH.md) | Server-side auth implementation |
| [AUTH_MIGRATION_GUIDE.md](web/AUTH_MIGRATION_GUIDE.md) | Client to server auth migration |
| [AUTH_CONTEXT.md](web/AUTH_CONTEXT.md) | Auth context details |
| [AUTHENTICATION_CHANGES.md](web/AUTHENTICATION_CHANGES.md) | Auth change log |

## Backend Documentation (`docs/backend/`)

Backend-specific documentation for the NestJS API server.

| File | Description |
|------|-------------|
| [BACKEND_README.md](backend/BACKEND_README.md) | Backend setup, API docs, and overview |
| [FIRESTORE_SETUP.md](backend/FIRESTORE_SETUP.md) | Firestore configuration and setup |

## Documentation by Purpose

### For New Developers
1. Start with [README.md](../README.md)
2. Read [docs/INDEX.md](INDEX.md) for navigation
3. Review [FEATURE_SET.md](FEATURE_SET.md)
4. Understand [ARCHITECTURE.md](ARCHITECTURE.md)

### For Frontend Development
1. [docs/web/WEB_README.md](web/WEB_README.md)
2. [docs/web/IMPLEMENTATION_SUMMARY.md](web/IMPLEMENTATION_SUMMARY.md)
3. [docs/web/CONTEXTS_README.md](web/CONTEXTS_README.md)
4. [docs/THEMING_IMPLEMENTATION.md](THEMING_IMPLEMENTATION.md)

### For Backend Development
1. [docs/backend/BACKEND_README.md](backend/BACKEND_README.md)
2. [docs/backend/FIRESTORE_SETUP.md](backend/FIRESTORE_SETUP.md)

### For Authentication
1. [AUTHENTICATION_SUMMARY.md](AUTHENTICATION_SUMMARY.md) - Start here
2. [AUTH_CHEAT_SHEET.md](AUTH_CHEAT_SHEET.md) - Quick reference
3. [AUTHENTICATION_ARCHITECTURE.md](AUTHENTICATION_ARCHITECTURE.md) - Complete guide
4. [docs/web/AUTH_QUICK_REFERENCE.md](web/AUTH_QUICK_REFERENCE.md) - Code examples

### For Troubleshooting
1. [BUGS_TO_BE_FIXED.md](BUGS_TO_BE_FIXED.md)
2. [AUTHENTICATION_ISSUES_ANALYSIS.md](AUTHENTICATION_ISSUES_ANALYSIS.md)
3. [AUTH_PROBLEM_EXAMPLES.md](AUTH_PROBLEM_EXAMPLES.md)

## Maintenance

When adding new documentation:
1. Place it in the appropriate `docs/` subdirectory
2. Update [docs/INDEX.md](INDEX.md) with a reference
3. Update this file (DOCUMENTATION_STRUCTURE.md) if needed
4. Link related documentation together

## Navigation

- **Root**: [../README.md](../README.md)
- **Documentation Index**: [INDEX.md](INDEX.md)
- **Web App**: [web/WEB_README.md](web/WEB_README.md)
- **Backend**: [backend/BACKEND_README.md](backend/BACKEND_README.md)

---

**Last Updated**: November 2024
