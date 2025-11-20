import { auth as adminAuth, db as adminDb } from './admin'
import { cookies } from 'next/headers'

export class FirebaseServer {
  private async getSessionCookie() {
    const cookieStore = await cookies()
    return cookieStore.get('session')?.value
  }

  async verifySession() {
    try {
      const session = await this.getSessionCookie()
      if (!session) {
        return null
      }
      const decodedToken = await adminAuth.verifySessionCookie(session, true)
      return decodedToken
    } catch (error) {
      return null
    }
  }

  async getCurrentUser() {
    const decodedToken = await this.verifySession()
    if (!decodedToken) {
      return null
    }
    try {
      const user = await adminAuth.getUser(decodedToken.uid)
      return user
    } catch (error) {
      return null
    }
  }

  async createSessionCookie(idToken: string, expiresIn: number = 60 * 60 * 24 * 5 * 1000) {
    try {
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
      return sessionCookie
    } catch (error) {
      throw error
    }
  }

  async revokeSession(sessionCookie: string) {
    try {
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie)
      await adminAuth.revokeRefreshTokens(decodedToken.uid)
    } catch (error) {
      // Session already invalid
    }
  }

  // Firestore methods (server-side)
  async getCollection(collectionName: string, userId?: string) {
    const collectionRef = adminDb.collection(collectionName)
    let query = collectionRef

    if (userId) {
      query = query.where('user_id', '==', userId) as any
    }

    const snapshot = await query.orderBy('created_at', 'desc').get()
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate().toISOString(),
      updated_at: doc.data().updated_at?.toDate().toISOString(),
    }))
  }

  async getDocument(collectionName: string, docId: string) {
    const docRef = adminDb.collection(collectionName).doc(docId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    return {
      id: doc.id,
      ...doc.data(),
      created_at: doc.data()?.created_at?.toDate().toISOString(),
      updated_at: doc.data()?.updated_at?.toDate().toISOString(),
    }
  }

  async addDocument(collectionName: string, data: any) {
    const collectionRef = adminDb.collection(collectionName)
    const docRef = await collectionRef.add({
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    })

    const doc = await docRef.get()
    return {
      id: docRef.id,
      ...doc.data(),
      created_at: doc.data()?.created_at?.toDate().toISOString(),
      updated_at: doc.data()?.updated_at?.toDate().toISOString(),
    }
  }

  async updateDocument(collectionName: string, docId: string, data: any) {
    const docRef = adminDb.collection(collectionName).doc(docId)
    await docRef.update({
      ...data,
      updated_at: new Date(),
    })

    const doc = await docRef.get()
    return {
      id: doc.id,
      ...doc.data(),
      created_at: doc.data()?.created_at?.toDate().toISOString(),
      updated_at: doc.data()?.updated_at?.toDate().toISOString(),
    }
  }

  async deleteDocument(collectionName: string, docId: string) {
    const docRef = adminDb.collection(collectionName).doc(docId)
    await docRef.delete()
  }
}

export const firebaseServer = new FirebaseServer()

