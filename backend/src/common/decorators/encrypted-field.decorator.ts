import 'reflect-metadata'

/**
 * Metadata key for storing encrypted field configuration
 */
export const ENCRYPTED_FIELDS_KEY = 'encryptedFields'

/**
 * Interface for encrypted field configuration
 */
export interface EncryptedFieldConfig {
  propertyKey: string
  isArray?: boolean
  isNestedArray?: boolean
  nestedContentField?: string
}

/**
 * Decorator to mark a field as encrypted
 * Can be used on DTOs to indicate which fields should be encrypted/decrypted
 * 
 * @param options Configuration options
 * @param options.isArray Whether the field is an array of strings
 * @param options.isNestedArray Whether the field is an array of objects
 * @param options.nestedContentField For nested arrays, the field name containing content to encrypt
 */
export function EncryptedField(options?: {
  isArray?: boolean
  isNestedArray?: boolean
  nestedContentField?: string
}): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existingFields: EncryptedFieldConfig[] = 
      Reflect.getMetadata(ENCRYPTED_FIELDS_KEY, target.constructor) || []
    
    const config: EncryptedFieldConfig = {
      propertyKey: propertyKey.toString(),
      isArray: options?.isArray,
      isNestedArray: options?.isNestedArray,
      nestedContentField: options?.nestedContentField,
    }
    
    existingFields.push(config)
    Reflect.defineMetadata(ENCRYPTED_FIELDS_KEY, existingFields, target.constructor)
  }
}

/**
 * Get all encrypted field configurations for a class
 */
export function getEncryptedFields(target: Function): EncryptedFieldConfig[] {
  return Reflect.getMetadata(ENCRYPTED_FIELDS_KEY, target) || []
}



