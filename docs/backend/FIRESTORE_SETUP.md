# Firestore Database Setup Guide

## 🔍 Finding Your Database Configuration

### Where to Find Your Information

1. **Firebase Console**: https://console.firebase.google.com
2. Navigate to your project
3. Go to **Build** → **Firestore Database**

## 📋 Current Configuration

Your backend is configured with:
- **Collection Name**: `journal-entries` (defined in `src/journal/journal.service.ts:9`)
- **Database ID**: `(default)` (unless you set `FIREBASE_DATABASE_ID` in `.env`)
- **Project ID**: Set in your `.env` file as `FIREBASE_PROJECT_ID`

## 🔧 How to Review Your Setup

### Step 1: Check Your Project ID

Run this command to see what project ID is being used:

```bash
cd backend
grep FIREBASE_PROJECT_ID .env
```

### Step 2: Verify Firestore is Enabled in Firebase Console

1. Go to https://console.firebase.google.com
2. Select your project
3. Navigate to **Build** → **Firestore Database** (left sidebar)
4. You should see either:
   - **A database already created** (with data or empty)
   - **"Create database" button** (if Firestore isn't set up yet)

### Step 3: Check Database Exists

If you see **"Create database"** button:
- Click it
- Choose **Production mode** or **Test mode**
- Select a location (cannot be changed later!)
- Click **Enable**

The database will be named `(default)` automatically.

## 🚨 Common Issues & Solutions

### Issue: `5 NOT_FOUND` Error

This error means Firestore can't find the database. Possible causes:

#### Cause 1: Firestore Not Enabled
**Solution**: Enable Firestore in Firebase Console (see Step 2 above)

#### Cause 2: Wrong Project ID
**Solution**: 
1. Check your `.env` file: `FIREBASE_PROJECT_ID=your-project-id`
2. Compare with Firebase Console URL: `https://console.firebase.google.com/project/YOUR-PROJECT-ID`
3. They must match exactly!

#### Cause 3: Service Account Lacks Permissions
**Solution**:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click on the service account email
3. It will open Google Cloud Console
4. Go to **IAM & Admin** → **IAM**
5. Find your service account
6. Ensure it has these roles:
   - **Firebase Admin SDK Administrator Service Agent**
   - **Cloud Datastore User** (or **Owner**)

#### Cause 4: Custom Database Name
If you're using a custom Firestore database (not the default):

**Solution**: Add to your `.env` file:
```env
FIREBASE_DATABASE_ID=your-custom-database-name
```

## 🔍 Debugging Steps

### Step 1: Check Startup Logs

When you restart your backend, look for these logs:

```
[FirebaseService] ============================================================
[FirebaseService] Firebase Configuration:
[FirebaseService]   Project ID: your-project-id
[FirebaseService]   Database ID: (default)
[FirebaseService]   Collection: journal-entries (will be created automatically)
[FirebaseService] ============================================================
[FirebaseService] Firebase Admin SDK initialized successfully
[FirebaseService] Please verify:
[FirebaseService]   1. Firestore is enabled in Firebase Console
[FirebaseService]   2. Database "(default)" exists
[FirebaseService]   3. Service account has Firestore permissions
[FirebaseService]   Firebase Console: https://console.firebase.google.com/project/...
[FirebaseService] ============================================================
```

### Step 2: Verify Direct Link

The logs will show a direct link to your Firestore console. Click it to verify:
- The database exists
- You can see the Firestore interface
- Collections will appear (after first document is created)

### Step 3: Test Connection

Try creating a journal entry through the API. The collection `journal-entries` will be created automatically on first write.

## 📝 Environment Variables Reference

Your `.env` file should contain:

```env
# Firebase Project ID (REQUIRED)
FIREBASE_PROJECT_ID=your-project-id

# Firebase Service Account Key (REQUIRED)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Firestore Database ID (OPTIONAL - defaults to "(default)")
# Only needed if using a custom database
FIREBASE_DATABASE_ID=(default)
```

## 🆘 Still Having Issues?

1. **Restart your backend** after any configuration changes
2. **Check the startup logs** for the Firebase configuration section
3. **Visit the direct Firestore Console link** shown in the logs
4. **Verify service account permissions** in Google Cloud Console
5. **Ensure Firestore is in Production/Test mode**, not Firestore Realtime Database mode

## 📚 Resources

- Firebase Console: https://console.firebase.google.com
- Firestore Documentation: https://firebase.google.com/docs/firestore
- Service Account Setup: https://firebase.google.com/docs/admin/setup

