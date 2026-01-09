import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { RequestWithEncryption } from '@/common/types/encryption.types'

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithEncryption>()
    return request.user
  },
)

/**
 * Get the encryption key from the request
 * Returns undefined if encryption is disabled or key derivation failed
 */
export const EncryptionKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Buffer | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithEncryption>()
    return request.encryptionKey
  },
)

/**
 * Get the user key factors from the request
 */
export const UserKeyFactors = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithEncryption>()
    return request.userKeyFactors
  },
)

