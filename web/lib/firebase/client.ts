import { getDbInstance } from './config'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore'

/**
 * Firebase Client
 * 
 * DEPRECATED: Client-side Firebase Auth methods have been removed.
 * All authentication is now handled server-side via API routes.
 * 
 * This class now only provides Firestore methods for direct database access.
 * However, it's recommended to use the API client instead for consistency.
 */
export class FirebaseClient {
  // Firestore methods
  async getCollection(collectionName: string, constraints: QueryConstraint[] = []) {
    const collectionRef = collection(getDbInstance(), collectionName)
    const q = query(collectionRef, ...constraints)
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async getDocument(collectionName: string, docId: string) {
    const docRef = doc(getDbInstance(), collectionName, docId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    return null
  }

  async addDocument(collectionName: string, data: any) {
    const collectionRef = collection(getDbInstance(), collectionName)
    const docRef = await addDoc(collectionRef, {
      ...data,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    })
    return { id: docRef.id, ...data }
  }

  async updateDocument(collectionName: string, docId: string, data: any) {
    const docRef = doc(getDbInstance(), collectionName, docId)
    await updateDoc(docRef, {
      ...data,
      updated_at: Timestamp.now(),
    })
  }

  async deleteDocument(collectionName: string, docId: string) {
    const docRef = doc(getDbInstance(), collectionName, docId)
    await deleteDoc(docRef)
  }

  // Real-time listeners
  onCollectionSnapshot(
    collectionName: string,
    callback: (data: any[]) => void,
    constraints: QueryConstraint[] = []
  ) {
    const collectionRef = collection(getDbInstance(), collectionName)
    const q = query(collectionRef, ...constraints)
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      callback(data)
    })
  }

  onDocumentSnapshot(collectionName: string, docId: string, callback: (data: any) => void) {
    const docRef = doc(getDbInstance(), collectionName, docId)
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() })
      }
    })
  }
}

export const firebaseClient = new FirebaseClient()
