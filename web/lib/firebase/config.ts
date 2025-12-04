import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase - CLIENT SIDE ONLY
// Note: Client-side Firebase Auth is used only for Google Sign-in popup.
// Session management is still handled server-side via cookies.
let app: FirebaseApp | undefined
let db: Firestore | undefined
let auth: Auth | undefined

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  db = getFirestore(app)
  auth = getAuth(app)
}

// Export with proper typing
export { app, db, auth }

// Helper to ensure firestore is initialized
export function getDbInstance(): Firestore {
  if (!db) {
    throw new Error('Firestore not initialized. Make sure this is called client-side only.')
  }
  return db
}

// Helper to get auth instance for Google Sign-in
export function getAuthInstance(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Make sure this is called client-side only.')
  }
  return auth
}
