# Database Setup Guide

**Last Updated**: January 2026

This guide explains how to set up Firebase Firestore for the Journal application, including collections, security rules, and indexes.

## Table of Contents

- [Overview](#overview)
- [Firestore Setup](#firestore-setup)
- [Collections Schema](#collections-schema)
- [Security Rules](#security-rules)
- [Indexes](#indexes)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Journal application uses Firebase Firestore as its primary database. Firestore is a NoSQL document database that provides:
- Real-time synchronization
- Offline support
- Automatic scaling
- Security rules
- Composite indexes

### Database Structure

The application uses the following collections:

- **profiles** - User profiles
- **journal_entries** - Journal entries
- **goals** - User goals
- **progress_updates** (subcollection) - Progress tracking
- **goal_journal_links** - Links between goals and journal entries
- **chat_sessions** - AI coach chat sessions
- **coach_personalities** - Coach personality configurations
- **custom_categories** - User-defined categories
- **themes** - User theme preferences
- **rag_embeddings** - Vector embeddings for RAG (if enabled)

---

## Firestore Setup

### 1. Enable Firestore

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Build** → **Firestore Database** (left sidebar)
4. Click **"Create database"**

### 2. Choose Database Mode

**Production Mode (Recommended):**
- Secure by default
- Requires security rules
- Best for production applications

---

## Collections Schema

### Profiles Collection

**Path:** `profiles/{userId}`

### Journal Entries Collection

**Path:** `journal_entries/{entryId}`

### Goals Collection

**Path:** `goals/{goalId}`

### Progress Updates Subcollection

**Path:** `goals/{goalId}/progress_updates/{progressId}`

### Goal-Journal Links Collection

**Path:** `goal_journal_links/{linkId}`

### Chat Sessions Collection

**Path:** `chat_sessions/{sessionId}`

### Coach Personalities Collection

**Path:** `coach_personalities/{personalityId}`

### Custom Categories Collection

**Path:** `custom_categories/{categoryId}`

### Themes Collection

**Path:** `themes/{themeId}`

### RAG Embeddings Collection

**Path:** `rag_embeddings/{embeddingId}`

---

## Security Rules

Security rules ensure users can only access their own data.

### Deploy Security Rules

```bash
cd web
firebase deploy --only firestore:rules
```

---

## Indexes

Composite indexes optimize query performance.

### Deploy Indexes

```bash
cd web
firebase deploy --only firestore:indexes
```

---

## Verification

### Verify Firestore Setup

```bash
cd web
./scripts/verify-firestore-setup.sh
```

---

**Need help?** Check the [Troubleshooting Guide](../guides/troubleshooting.md) or return to [Setup Guide](../SETUP.md).
