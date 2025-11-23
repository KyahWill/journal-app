#!/bin/bash

# Deploy Firestore indexes to Firebase
# This script deploys the indexes defined in firestore.indexes.json

echo "=========================================="
echo "Deploying Firestore Indexes"
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

# Show indexes to be deployed
echo "📊 Indexes to be deployed:"
echo ""
cat firestore.indexes.json | grep -A 10 "collectionGroup" | grep "collectionGroup\|fieldPath" | sed 's/^/  /'
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

# Deploy indexes
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Indexes deployed successfully!"
    echo ""
    echo "📝 Note: Index creation may take several minutes to complete."
    echo "   You can monitor progress in the Firebase Console:"
    echo "   https://console.firebase.google.com/project/$PROJECT/firestore/indexes"
    echo ""
else
    echo ""
    echo "❌ Failed to deploy indexes."
    echo "   Check the error message above for details."
    echo ""
    exit 1
fi
