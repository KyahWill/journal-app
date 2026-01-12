import { Request } from 'express'

/**
 * User key factors used for encryption key derivation
 */
export interface UserKeyFactors {
  userId: string
  createdAt: Date
  authProvider: string
}

/**
 * Extended request with user encryption context
 */
export interface RequestWithEncryption extends Request {
  user: {
    uid: string
    email?: string
    email_verified?: boolean
    [key: string]: any
  }
  encryptionKey?: Buffer
  userKeyFactors?: UserKeyFactors
}

/**
 * User profile with encryption metadata
 */
export interface UserProfile {
  user_id: string
  encryption_version?: number
  created_at: Date
  auth_provider: string
  [key: string]: any
}



