/**
 * Authentication Hook - Backward Compatibility
 * 
 * This file now re-exports from the AuthContext for backward compatibility.
 * The authentication logic has been moved to a shared context to avoid
 * multiple API calls across components.
 * 
 * @deprecated Import from '@/lib/contexts/auth-context' instead
 */

export { useAuth, type User } from '@/lib/contexts/auth-context'
