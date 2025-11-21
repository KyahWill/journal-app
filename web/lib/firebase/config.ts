import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase - CLIENT SIDE ONLY
// Note: Client-side Firebase Auth is no longer used.
// Authentication is now handled entirely server-side.
let app: FirebaseApp | undefined
let db: Firestore | undefined

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  db = getFirestore(app)
}

// Export with proper typing
// Note: 'auth' is no longer exported as it's not used
export { app, db }

// Helper to ensure firestore is initialized
export function getDbInstance(): Firestore {
  if (!db) {
    throw new Error('Firestore not initialized. Make sure this is called client-side only.')
  }
  return db
}
