#!/bin/bash

# Deploy RAG-specific Firestore indexes
# This script deploys the indexes required for the RAG embeddings collection

echo "=========================================="
echo "Deploying RAG Firestore Indexes"
echo "=========================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo ""
    echo "To install Firebase CLI, run:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ You are not logged in to Firebase."
    echo ""
    echo "To login, run:"
    echo "  firebase login"
    echo ""
    exit 1
fi

# Get current project
PROJECT=$(firebase use 2>&1 | grep "Active Project" | awk '{print $3}')

if [ -z "$PROJECT" ]; then
    echo "❌ No Firebase project is currently active."
    echo ""
    echo "To set a project, run:"
    echo "  firebase use <project-id>"
    echo ""
    exit 1
fi

echo "📋 Current Firebase Project: $PROJECT"
echo ""

# Show RAG indexes to be deployed
echo "📊 RAG Indexes to be deployed:"
echo ""
echo "  1. embeddings collection:"
echo "     - user_id (ASC) + content_type (ASC) + created_at (DESC)"
echo "     - user_id (ASC) + created_at (DESC)"
echo ""
echo "  These indexes enable:"
echo "  ✓ Efficient filtering by user and content type"
echo "  ✓ Fast retrieval of user embeddings for semantic search"
echo "  ✓ Optimized queries for RAG context retrieval"
echo ""

# Confirm deployment
read -p "Do you want to deploy these indexes? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Deploying indexes..."
echo ""

# Change to web directory where firestore.indexes.json is located
cd "$(dirname "$0")/../../web" || exit 1

# Deploy indexes
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ RAG indexes deployed successfully!"
    echo ""
    echo "📝 Note: Index creation may take several minutes to complete."
    echo "   You can monitor progress in the Firebase Console:"
    echo "   https://console.firebase.google.com/project/$PROJECT/firestore/indexes"
    echo ""
    echo "🔍 To verify indexes are ready, run:"
    echo "   npm run rag:verify-indexes"
    echo ""
else
    echo ""
    echo "❌ Failed to deploy indexes."
    echo "   Check the error message above for details."
    echo ""
    exit 1
fi
