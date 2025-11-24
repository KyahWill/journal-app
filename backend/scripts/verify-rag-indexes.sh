#!/bin/bash

# Verify RAG Firestore indexes are created and ready
# This script checks the status of indexes required for the RAG embeddings collection

echo "=========================================="
echo "Verifying RAG Firestore Indexes"
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

echo "🔍 Checking RAG indexes status..."
echo ""

# Change to web directory where firestore.indexes.json is located
cd "$(dirname "$0")/../../web" || exit 1

# Get index status
firebase firestore:indexes 2>&1 | tee /tmp/firebase_indexes.txt

# Check if embeddings indexes are present
if grep -q "embeddings" /tmp/firebase_indexes.txt; then
    echo ""
    echo "✅ Embeddings collection indexes found!"
    echo ""
    
    # Check for specific indexes
    echo "📊 Required indexes for RAG:"
    echo ""
    echo "  1. user_id + content_type + created_at"
    echo "     Status: $(grep -A 5 "embeddings" /tmp/firebase_indexes.txt | grep -q "user_id.*content_type.*created_at" && echo "✅ Found" || echo "⚠️  Not found or building")"
    echo ""
    echo "  2. user_id + created_at"
    echo "     Status: $(grep -A 5 "embeddings" /tmp/firebase_indexes.txt | grep -q "user_id.*created_at" && echo "✅ Found" || echo "⚠️  Not found or building")"
    echo ""
    
    # Check for building status
    if grep -q "CREATING" /tmp/firebase_indexes.txt; then
        echo "⏳ Some indexes are still building. This may take several minutes."
        echo "   Check status in Firebase Console:"
        echo "   https://console.firebase.google.com/project/$PROJECT/firestore/indexes"
        echo ""
    else
        echo "✅ All indexes appear to be ready!"
        echo ""
    fi
else
    echo ""
    echo "⚠️  No embeddings indexes found!"
    echo ""
    echo "To deploy RAG indexes, run:"
    echo "  npm run rag:deploy-indexes"
    echo ""
    exit 1
fi

# Clean up temp file
rm -f /tmp/firebase_indexes.txt

echo "📝 For detailed index information, visit:"
echo "   https://console.firebase.google.com/project/$PROJECT/firestore/indexes"
echo ""
