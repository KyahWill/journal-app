#!/bin/bash

# Verify Firestore setup for goals feature
# This script checks that security rules and indexes are properly deployed

echo "=========================================="
echo "Firestore Goals Setup Verification"
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

# Check security rules file
echo "🔒 Checking security rules file..."
if [ -f "firestore.rules" ]; then
    echo "  ✅ firestore.rules exists"
    
    # Check for goal-related rules
    if grep -q "match /goals/{goalId}" firestore.rules; then
        echo "  ✅ Goals collection rules found"
    else
        echo "  ❌ Goals collection rules NOT found"
    fi
    
    if grep -q "match /milestones/{milestoneId}" firestore.rules; then
        echo "  ✅ Milestones subcollection rules found"
    else
        echo "  ❌ Milestones subcollection rules NOT found"
    fi
    
    if grep -q "match /progress_updates/{progressId}" firestore.rules; then
        echo "  ✅ Progress updates subcollection rules found"
    else
        echo "  ❌ Progress updates subcollection rules NOT found"
    fi
    
    if grep -q "match /goal_journal_links/{linkId}" firestore.rules; then
        echo "  ✅ Goal-journal links collection rules found"
    else
        echo "  ❌ Goal-journal links collection rules NOT found"
    fi
else
    echo "  ❌ firestore.rules file NOT found"
fi

echo ""

# Check indexes file
echo "📊 Checking indexes file..."
if [ -f "firestore.indexes.json" ]; then
    echo "  ✅ firestore.indexes.json exists"
    
    # Count goal-related indexes
    GOAL_INDEXES=$(grep -c '"collectionGroup": "goals"' firestore.indexes.json)
    MILESTONE_INDEXES=$(grep -c '"collectionGroup": "milestones"' firestore.indexes.json)
    PROGRESS_INDEXES=$(grep -c '"collectionGroup": "progress_updates"' firestore.indexes.json)
    LINK_INDEXES=$(grep -c '"collectionGroup": "goal_journal_links"' firestore.indexes.json)
    
    echo "  ✅ Goals indexes: $GOAL_INDEXES"
    echo "  ✅ Milestones indexes: $MILESTONE_INDEXES"
    echo "  ✅ Progress updates indexes: $PROGRESS_INDEXES"
    echo "  ✅ Goal-journal links indexes: $LINK_INDEXES"
    
    TOTAL_INDEXES=$((GOAL_INDEXES + MILESTONE_INDEXES + PROGRESS_INDEXES + LINK_INDEXES))
    echo "  📈 Total goal-related indexes: $TOTAL_INDEXES"
else
    echo "  ❌ firestore.indexes.json file NOT found"
fi

echo ""

# Check schema documentation
echo "📚 Checking schema documentation..."
if [ -f "../backend/src/firebase/migrations/setup-goal-collections.ts" ]; then
    echo "  ✅ Schema documentation exists"
else
    echo "  ❌ Schema documentation NOT found"
fi

echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Deploy security rules:"
echo "   firebase deploy --only firestore:rules"
echo ""
echo "2. Deploy indexes:"
echo "   ./scripts/deploy-firestore-indexes.sh"
echo "   OR"
echo "   firebase deploy --only firestore:indexes"
echo ""
echo "3. Monitor index creation in Firebase Console:"
echo "   https://console.firebase.google.com/project/$PROJECT/firestore/indexes"
echo ""
echo "4. Test security rules in Firebase Console:"
echo "   https://console.firebase.google.com/project/$PROJECT/firestore/rules"
echo ""
echo "For detailed setup instructions, see:"
echo "   docs/backend/FIRESTORE_GOALS_SETUP.md"
echo ""
