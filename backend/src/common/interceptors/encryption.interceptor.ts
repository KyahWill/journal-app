import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { EncryptionService } from '@/common/services/encryption.service'
import { RequestWithEncryption } from '@/common/types/encryption.types'

/**
 * Configuration for which fields to encrypt/decrypt
 */
export interface EncryptionFieldConfig {
  /** Simple string fields to encrypt */
  fields?: string[]
  /** Array fields containing strings to encrypt */
  arrayFields?: string[]
  /** Nested array fields (array of objects) */
  nestedArrayFields?: {
    field: string
    contentKey: string
  }[]
}

/**
 * Interceptor that automatically encrypts response data
 * Use with @UseInterceptors(new EncryptionInterceptor(config))
 */
@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EncryptionInterceptor.name)

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly config: EncryptionFieldConfig,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithEncryption>()
    const encryptionKey = request.encryptionKey

    // If no encryption key, pass through without modification
    if (!encryptionKey || !this.encryptionService.isEnabled()) {
      return next.handle()
    }

    return next.handle().pipe(
      map(data => {
        if (!data) return data
        return this.processData(data, encryptionKey, 'encrypt')
      }),
    )
  }

  private processData(
    data: any,
    key: Buffer,
    operation: 'encrypt' | 'decrypt',
  ): any {
    if (!data) return data

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.processData(item, key, operation))
    }

    // Handle objects
    if (typeof data === 'object') {
      const result = { ...data }

      // Process simple string fields
      if (this.config.fields) {
        for (const field of this.config.fields) {
          if (result[field] !== undefined && typeof result[field] === 'string') {
            try {
              if (operation === 'encrypt') {
                if (!this.encryptionService.isEncrypted(result[field])) {
                  result[field] = this.encryptionService.encrypt(result[field], key)
                }
              } else {
                if (this.encryptionService.isEncrypted(result[field])) {
                  result[field] = this.encryptionService.decrypt(result[field], key)
                }
              }
            } catch (error) {
              this.logger.error(`Failed to ${operation} field ${field}: ${error.message}`)
            }
          }
        }
      }

      // Process array fields (arrays of strings)
      if (this.config.arrayFields) {
        for (const field of this.config.arrayFields) {
          if (Array.isArray(result[field])) {
            result[field] = result[field].map((item: any) => {
              if (typeof item === 'string') {
                try {
                  if (operation === 'encrypt') {
                    return this.encryptionService.isEncrypted(item) 
                      ? item 
                      : this.encryptionService.encrypt(item, key)
                  } else {
                    return this.encryptionService.isEncrypted(item)
                      ? this.encryptionService.decrypt(item, key)
                      : item
                  }
                } catch (error) {
                  this.logger.error(`Failed to ${operation} array item in ${field}: ${error.message}`)
                  return item
                }
              }
              return item
            })
          }
        }
      }

      // Process nested array fields (arrays of objects with content)
      if (this.config.nestedArrayFields) {
        for (const nestedConfig of this.config.nestedArrayFields) {
          if (Array.isArray(result[nestedConfig.field])) {
            result[nestedConfig.field] = result[nestedConfig.field].map((item: any) => {
              if (item && typeof item[nestedConfig.contentKey] === 'string') {
                try {
                  const content = item[nestedConfig.contentKey]
                  if (operation === 'encrypt') {
                    return {
                      ...item,
                      [nestedConfig.contentKey]: this.encryptionService.isEncrypted(content)
                        ? content
                        : this.encryptionService.encrypt(content, key),
                    }
                  } else {
                    return {
                      ...item,
                      [nestedConfig.contentKey]: this.encryptionService.isEncrypted(content)
                        ? this.encryptionService.decrypt(content, key)
                        : content,
                    }
                  }
                } catch (error) {
                  this.logger.error(`Failed to ${operation} nested content: ${error.message}`)
                  return item
                }
              }
              return item
            })
          }
        }
      }

      return result
    }

    return data
  }
}

/**
 * Interceptor that automatically decrypts response data
 * Use when returning encrypted data from storage to API response
 */
@Injectable()
export class DecryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DecryptionInterceptor.name)

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly config: EncryptionFieldConfig,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithEncryption>()
    const encryptionKey = request.encryptionKey

    // If no encryption key, pass through without modification
    if (!encryptionKey || !this.encryptionService.isEnabled()) {
      return next.handle()
    }

    return next.handle().pipe(
      map(data => {
        if (!data) return data
        return this.decryptData(data, encryptionKey)
      }),
    )
  }

  private decryptData(data: any, key: Buffer): any {
    if (!data) return data

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.decryptData(item, key))
    }

    // Handle objects
    if (typeof data === 'object') {
      const result = { ...data }

      // Process simple string fields
      if (this.config.fields) {
        for (const field of this.config.fields) {
          if (result[field] !== undefined && typeof result[field] === 'string') {
            if (this.encryptionService.isEncrypted(result[field])) {
              try {
                result[field] = this.encryptionService.decrypt(result[field], key)
              } catch (error) {
                this.logger.error(`Failed to decrypt field ${field}: ${error.message}`)
              }
            }
          }
        }
      }

      // Process array fields
      if (this.config.arrayFields) {
        for (const field of this.config.arrayFields) {
          if (Array.isArray(result[field])) {
            result[field] = result[field].map((item: any) => {
              if (typeof item === 'string' && this.encryptionService.isEncrypted(item)) {
                try {
                  return this.encryptionService.decrypt(item, key)
                } catch (error) {
                  this.logger.error(`Failed to decrypt array item: ${error.message}`)
                  return item
                }
              }
              return item
            })
          }
        }
      }

      // Process nested array fields
      if (this.config.nestedArrayFields) {
        for (const nestedConfig of this.config.nestedArrayFields) {
          if (Array.isArray(result[nestedConfig.field])) {
            result[nestedConfig.field] = result[nestedConfig.field].map((item: any) => {
              if (item && typeof item[nestedConfig.contentKey] === 'string') {
                if (this.encryptionService.isEncrypted(item[nestedConfig.contentKey])) {
                  try {
                    return {
                      ...item,
                      [nestedConfig.contentKey]: this.encryptionService.decrypt(
                        item[nestedConfig.contentKey],
                        key,
                      ),
                    }
                  } catch (error) {
                    this.logger.error(`Failed to decrypt nested content: ${error.message}`)
                    return item
                  }
                }
              }
              return item
            })
          }
        }
      }

      return result
    }

    return data
  }
}



