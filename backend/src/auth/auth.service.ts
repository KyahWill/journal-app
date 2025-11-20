import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { CreateUserDto, SignInDto } from '@/common/dto/auth.dto'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(private readonly firebaseService: FirebaseService) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      const { email, password, displayName } = createUserDto

      // Create user in Firebase Auth
      const userRecord = await this.firebaseService.createUser(email, password, displayName)

      // Create custom token for immediate login
      const customToken = await this.firebaseService.createCustomToken(userRecord.uid)

      this.logger.log(`User created successfully: ${userRecord.uid}`)

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        customToken,
      }
    } catch (error: any) {
      this.logger.error('Error creating user', error)

      if (error.code === 'auth/email-already-exists') {
        throw new BadRequestException('Email already exists')
      }

      throw new BadRequestException('Failed to create user')
    }
  }

  async verifyToken(token: string) {
    try {
      const decodedToken = await this.firebaseService.verifyIdToken(token)
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      }
    } catch (error) {
      this.logger.error('Error verifying token', error)
      throw new UnauthorizedException('Invalid token')
    }
  }

  async getUserById(uid: string) {
    try {
      const user = await this.firebaseService.getUserById(uid)
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime,
      }
    } catch (error) {
      this.logger.error('Error getting user', error)
      throw new BadRequestException('User not found')
    }
  }

  async getUserByEmail(email: string) {
    try {
      const user = await this.firebaseService.getUserByEmail(email)
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      }
    } catch (error) {
      this.logger.error('Error getting user by email', error)
      throw new BadRequestException('User not found')
    }
  }

  async updateUser(uid: string, properties: { displayName?: string; email?: string }) {
    try {
      await this.firebaseService.updateUser(uid, properties)
      return this.getUserById(uid)
    } catch (error) {
      this.logger.error('Error updating user', error)
      throw new BadRequestException('Failed to update user')
    }
  }

  async deleteUser(uid: string) {
    try {
      await this.firebaseService.deleteUser(uid)
      this.logger.log(`User deleted successfully: ${uid}`)
      return { success: true, message: 'User deleted successfully' }
    } catch (error) {
      this.logger.error('Error deleting user', error)
      throw new BadRequestException('Failed to delete user')
    }
  }

  async createCustomToken(uid: string, additionalClaims?: object) {
    try {
      const customToken = await this.firebaseService.createCustomToken(uid, additionalClaims)
      return { customToken }
    } catch (error) {
      this.logger.error('Error creating custom token', error)
      throw new BadRequestException('Failed to create custom token')
    }
  }
}

