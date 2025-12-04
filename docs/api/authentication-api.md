# Authentication API

**Last Updated**: December 2025

## Overview

The Authentication API provides endpoints for user account management and authentication using Firebase Authentication. All endpoints except signup and verify require a valid Firebase ID token.

**Base Path**: `/api/v1/auth`

## Endpoints

### Create User Account

Create a new user account with email and password.

**Endpoint**: `POST /auth/signup`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Password (minimum 6 characters) |
| displayName | string | No | User's display name |

**Response** (201 Created):
```json
{
  "uid": "user_abc123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "created_at": "2025-11-24T10:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid email or password too short
- `409 Conflict` - Email already exists

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "displayName": "John Doe"
  }'
```

---

### Sign In with Google (Web)

Authenticate a user with Google OAuth. This endpoint is used by the web application after the client-side Google Sign-in popup.

**Endpoint**: `POST /api/auth/google`

**Authentication**: Not required

**Request Body**:
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| idToken | string | Yes | Firebase ID token from Google Sign-in popup |

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "uid": "user_abc123",
    "email": "user@gmail.com",
    "displayName": "John Doe",
    "emailVerified": true
  }
}
```

**Error Responses**:
- `400 Bad Request` - ID token is missing
- `500 Internal Server Error` - Token verification failed

**Notes**:
- If the user doesn't exist, a new account is automatically created
- Creates a session cookie (5-day duration) upon successful authentication
- The client must first complete Google Sign-in popup flow using Firebase Client SDK

**Example Flow**:
```typescript
// Client-side: Initiate Google Sign-in
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const auth = getAuth()
const provider = new GoogleAuthProvider()
const result = await signInWithPopup(auth, provider)
const idToken = await result.user.getIdToken()

// Send to server
const response = await fetch('/api/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ idToken })
})
```

---

### Verify Token

Verify a Firebase ID token and get user information.

**Endpoint**: `POST /auth/verify`

**Authentication**: Not required

**Request Body**:
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | Yes | Firebase ID token |

**Response** (200 OK):
```json
{
  "uid": "user_abc123",
  "email": "user@example.com",
  "email_verified": true,
  "displayName": "John Doe"
}
```

**Error Responses**:
- `401 Unauthorized` - Invalid or expired token

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

### Get Current User

Get the profile of the currently authenticated user.

**Endpoint**: `GET /auth/me`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "uid": "user_abc123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "email_verified": true,
  "created_at": "2025-11-24T10:00:00Z",
  "last_login": "2025-11-24T15:30:00Z"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/auth/me \
  -H "Authorization: Bearer <firebase-token>"
```

---

### Get User by ID

Get a user's profile by their user ID.

**Endpoint**: `GET /auth/user/:uid`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| uid | string | User ID |

**Response** (200 OK):
```json
{
  "uid": "user_abc123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "email_verified": true,
  "created_at": "2025-11-24T10:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/auth/user/user_abc123 \
  -H "Authorization: Bearer <firebase-token>"
```

---

### Update User Profile

Update the authenticated user's profile information.

**Endpoint**: `PUT /auth/user/:uid`

**Authentication**: Required

**Authorization**: Users can only update their own profile

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| uid | string | User ID (must match authenticated user) |

**Request Body**:
```json
{
  "displayName": "Jane Doe",
  "email": "newemail@example.com"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| displayName | string | No | New display name |
| email | string | No | New email address |

**Response** (200 OK):
```json
{
  "uid": "user_abc123",
  "email": "newemail@example.com",
  "displayName": "Jane Doe",
  "updated_at": "2025-11-24T16:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Attempting to update another user's profile
- `400 Bad Request` - Invalid email format

**Example**:
```bash
curl -X PUT https://api.example.com/api/v1/auth/user/user_abc123 \
  -H "Authorization: Bearer <firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Jane Doe"
  }'
```

---

### Delete User Account

Delete the authenticated user's account and all associated data.

**Endpoint**: `DELETE /auth/user/:uid`

**Authentication**: Required

**Authorization**: Users can only delete their own account

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| uid | string | User ID (must match authenticated user) |

**Response** (200 OK):
```json
{
  "message": "User account deleted successfully",
  "uid": "user_abc123"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Attempting to delete another user's account
- `404 Not Found` - User not found

**Example**:
```bash
curl -X DELETE https://api.example.com/api/v1/auth/user/user_abc123 \
  -H "Authorization: Bearer <firebase-token>"
```

**Warning**: This action is irreversible and will delete all user data including goals, journal entries, and chat history.

---

### Create Custom Token

Create a custom Firebase token with optional claims.

**Endpoint**: `POST /auth/token/:uid`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| uid | string | User ID |

**Request Body**:
```json
{
  "role": "admin",
  "permissions": ["read", "write"]
}
```

**Response** (200 OK):
```json
{
  "customToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/auth/token/user_abc123 \
  -H "Authorization: Bearer <firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

---

## Authentication Flow

### Email/Password Authentication Flow

1. **Sign Up**: User creates account via `POST /auth/signup`
2. **Client-Side Login**: User logs in via Firebase SDK on client
3. **Get Token**: Client obtains Firebase ID token
4. **API Requests**: Include token in Authorization header for all requests
5. **Token Refresh**: Client refreshes token before expiration (1 hour)

### Google Authentication Flow (Web)

1. **Initiate Popup**: Client triggers Google Sign-in popup via Firebase Client SDK
2. **User Consent**: User selects Google account and grants permissions
3. **Get ID Token**: Firebase returns ID token after successful authentication
4. **Server Verification**: Client sends ID token to `POST /api/auth/google`
5. **Session Creation**: Server verifies token and creates session cookie
6. **Redirect**: User is redirected to the application

### Token Verification Flow

1. Client sends request with Authorization header
2. API validates token with Firebase Admin SDK
3. API extracts user ID from token
4. API processes request with user context

## Security Considerations

### Password Requirements

- Minimum 6 characters
- Recommended: Mix of uppercase, lowercase, numbers, and symbols
- Firebase handles password hashing and security

### Token Security

- Tokens expire after 1 hour
- Never expose tokens in URLs or logs
- Store tokens securely on client (e.g., httpOnly cookies)
- Refresh tokens automatically before expiration

### Account Deletion

- Deletes all user data across all collections
- Irreversible operation
- Requires user to be authenticated as the account owner

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Validation failed | Invalid request data |
| 401 | Invalid or expired token | Authentication failed |
| 403 | Unauthorized | User not authorized for this action |
| 404 | User not found | User ID does not exist |
| 409 | Email already exists | Email is already registered |

## Rate Limiting

Authentication endpoints have the following rate limits:

- **Signup**: 10 requests per hour per IP
- **Verify**: 100 requests per minute per IP
- **Other endpoints**: 100 requests per minute per user

## Related Documentation

- [Security Architecture](../architecture/security-architecture.md)
- [Authentication Feature](../features/authentication.md)
- [Setup Guide](../SETUP.md)

---

[← Back to API Reference](../API_REFERENCE.md)
