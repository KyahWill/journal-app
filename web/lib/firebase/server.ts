import { auth as adminAuth, db as adminDb } from './admin'
import { cookies } from 'next/headers'

export class FirebaseServer {
  private async getSessionCookie() {
    try {
      const cookieStore = await cookies()
      return cookieStore.get('session')?.value
    } catch (error) {
      console.error('Error getting session cookie:', error)
      return null
    }
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
      // Session invalid or expired - return null gracefully
      return null
    }
  }

  async getCurrentUser() {
    try {
      const decodedToken = await this.verifySession()
      if (!decodedToken) {
        return null
      }
      
      const user = await adminAuth.getUser(decodedToken.uid)
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
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
    try {
      const collectionRef = adminDb.collection(collectionName)
      let query = collectionRef

      if (userId) {
        query = query.where('user_id', '==', userId) as any
      }

      let snapshot
      try {
        // Try with orderBy first (requires composite index if using where)
        snapshot = await query.orderBy('created_at', 'desc').get()
      } catch (indexError: any) {
        // If index doesn't exist, fetch without orderBy and sort in memory
        console.log('Composite index not found, sorting in memory')
        snapshot = await query.get()
      }

      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate().toISOString(),
        updated_at: doc.data().updated_at?.toDate().toISOString(),
      }))

      // Sort in memory if we couldn't use orderBy
      return docs.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA // Descending order
      })
    } catch (error: any) {
      console.error('Error fetching collection:', error)
      // Return empty array instead of throwing
      return []
    }
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
