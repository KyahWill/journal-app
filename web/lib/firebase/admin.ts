import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let app: App | undefined
let auth: Auth | undefined
let db: Firestore | undefined

/**
 * Lazily initialize Firebase Admin SDK
 * This prevents initialization errors during build time when credentials aren't available
 */
function getApp(): App {
  if (app) return app

  if (getApps().length) {
    app = getApps()[0]
    return app
  }

  // Check for explicit service account key (local development)
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (serviceAccountKey) {
    // Local development with explicit service account
    const serviceAccount = JSON.parse(serviceAccountKey)
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  } else {
    // Firebase App Hosting / Google Cloud - use Application Default Credentials
    // ADC is automatically provided in these environments
    app = initializeApp({
      credential: applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  }

  return app
}

/**
 * Get Firebase Auth instance (lazy initialization)
 */
function getAdminAuth(): Auth {
  if (!auth) {
    auth = getAuth(getApp())
  }
  return auth
}

/**
 * Get Firestore instance (lazy initialization)
 */
function getAdminDb(): Firestore {
  if (!db) {
    db = getFirestore(getApp())
  }
  return db
}

// Export getters that lazily initialize
// Using Proxy to maintain the same API as before (auth.verifyIdToken, db.collection, etc.)
const authProxy = new Proxy({} as Auth, {
  get(_, prop) {
    const adminAuth = getAdminAuth()
    const value = adminAuth[prop as keyof Auth]
    if (typeof value === 'function') {
      return value.bind(adminAuth)
    }
    return value
  },
})

const dbProxy = new Proxy({} as Firestore, {
  get(_, prop) {
    const adminDb = getAdminDb()
    const value = adminDb[prop as keyof Firestore]
    if (typeof value === 'function') {
      return value.bind(adminDb)
    }
    return value
  },
})

export { authProxy as auth, dbProxy as db }
export { getApp as app }

