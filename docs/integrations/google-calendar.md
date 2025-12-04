# Google Calendar Integration

**Last Updated**: December 2025

## Overview

The Google Calendar integration allows users to sync their goals and habits with their Google Calendar. When connected, goals appear as all-day events on their target date, and habits create recurring events based on their frequency (daily, weekly, or monthly).

## Features

### Goal Sync
- **One-time Events**: Goals create all-day events on their target date
- **Smart Reminders**: Automatic reminders 3 days and 1 day before the target date
- **Visual Indicators**: Events prefixed with 🎯 emoji for easy identification
- **Live Updates**: Calendar events update when goal details change
- **Automatic Cleanup**: Events deleted when goals are removed

### Habit Sync
- **Recurring Events**: Habits create recurring calendar events
- **Frequency Support**: Daily, weekly, or monthly recurrence
- **Visual Indicators**: Events prefixed with 🔥 emoji
- **Immediate Reminders**: Notifications at the time of the habit

## Setup

### Prerequisites

1. A Google Cloud Platform project
2. Google Calendar API enabled
3. OAuth 2.0 credentials configured

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### Step 2: Enable Google Calendar API

1. Navigate to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Select "Web application"
4. Set a name (e.g., "Journal App Calendar")
5. Add authorized redirect URI:
   - Development: `http://localhost:3001/api/v1/calendar/callback`
   - Production: `https://your-api-domain.com/api/v1/calendar/callback`
6. Click "Create"
7. Copy the Client ID and Client Secret

### Step 4: Configure Environment Variables

Add to your backend `.env` file:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/calendar/callback
FRONTEND_URL=http://localhost:3000
```

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `GOOGLE_REDIRECT_URI` | Full URL to the OAuth callback endpoint |
| `FRONTEND_URL` | Frontend URL for post-OAuth redirect |

### Step 5: Restart the Backend

```bash
cd backend
pnpm start:dev
```

## API Reference

### Check Connection Status

Check if the user has connected their Google Calendar.

**Endpoint**: `GET /calendar/status`

**Authentication**: Required

**Response**:
```json
{
  "connected": true
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/calendar/status \
  -H "Authorization: Bearer <token>"
```

---

### Get OAuth Authorization URL

Get the URL to initiate Google Calendar OAuth flow.

**Endpoint**: `GET /calendar/connect`

**Authentication**: Required

**Response**:
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Usage**:
1. Call this endpoint to get the authorization URL
2. Redirect user to the URL (or open in new window)
3. User grants permission in Google
4. Google redirects to callback endpoint
5. User is redirected back to frontend with status

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/calendar/connect \
  -H "Authorization: Bearer <token>"
```

---

### OAuth Callback Handler

Handles the OAuth callback from Google. **Not called directly by frontend.**

**Endpoint**: `GET /calendar/callback`

**Query Parameters**:
| Parameter | Description |
|-----------|-------------|
| `code` | Authorization code from Google |
| `state` | User ID (passed through OAuth flow) |
| `error` | Error message if OAuth failed |

**Redirects to**:
- Success: `{FRONTEND_URL}/app/settings?calendar_connected=true`
- Error: `{FRONTEND_URL}/app/settings?calendar_error={error}`

---

### Disconnect Calendar

Disconnect Google Calendar and revoke access.

**Endpoint**: `DELETE /calendar/disconnect`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Google Calendar disconnected"
}
```

**Actions**:
1. Revokes OAuth tokens with Google
2. Removes tokens from database
3. Sets connection status to false

**Example**:
```bash
curl -X DELETE https://api.example.com/api/v1/calendar/disconnect \
  -H "Authorization: Bearer <token>"
```

## Database Schema

### Users Collection Fields

When a user connects Google Calendar, these fields are added to their user document:

| Field | Type | Description |
|-------|------|-------------|
| `google_calendar_connected` | boolean | Whether calendar is connected |
| `google_calendar_access_token` | string | OAuth access token |
| `google_calendar_refresh_token` | string | OAuth refresh token |
| `google_calendar_expiry_date` | number | Token expiration timestamp |

### Goals Collection Field

| Field | Type | Description |
|-------|------|-------------|
| `calendar_event_id` | string | Google Calendar event ID |

## Calendar Event Format

### Goal Events

```json
{
  "summary": "🎯 Goal Title",
  "description": "Goal description text",
  "start": {
    "date": "2025-12-31"
  },
  "end": {
    "date": "2025-12-31"
  },
  "reminders": {
    "useDefault": false,
    "overrides": [
      { "method": "popup", "minutes": 1440 },
      { "method": "popup", "minutes": 4320 }
    ]
  }
}
```

### Habit Events

```json
{
  "summary": "🔥 Habit Title",
  "description": "Habit description text",
  "start": {
    "date": "2025-01-01"
  },
  "end": {
    "date": "2025-01-01"
  },
  "recurrence": ["RRULE:FREQ=DAILY"],
  "reminders": {
    "useDefault": false,
    "overrides": [
      { "method": "popup", "minutes": 0 }
    ]
  }
}
```

### Recurrence Rules

| Frequency | RRULE |
|-----------|-------|
| Daily | `RRULE:FREQ=DAILY` |
| Weekly | `RRULE:FREQ=WEEKLY` |
| Monthly | `RRULE:FREQ=MONTHLY` |

## Frontend Integration

### Checking Connection Status

```typescript
import { apiClient } from '@/lib/api/client'

const { connected } = await apiClient.getCalendarStatus()
console.log('Calendar connected:', connected)
```

### Initiating Connection

```typescript
const { url } = await apiClient.getCalendarConnectUrl()
window.location.href = url  // or window.open(url, '_blank')
```

### Handling Callback

After OAuth, the user is redirected to `/app/settings` with query parameters:

```typescript
// In settings page
const params = new URLSearchParams(window.location.search)

if (params.get('calendar_connected') === 'true') {
  toast.success('Google Calendar connected!')
}

if (params.get('calendar_error')) {
  toast.error(`Calendar error: ${params.get('calendar_error')}`)
}
```

### Disconnecting

```typescript
await apiClient.disconnectCalendar()
toast.success('Google Calendar disconnected')
```

## Token Management

### Automatic Token Refresh

The integration automatically handles token refresh:

1. Access tokens expire after ~1 hour
2. When making API calls, the OAuth client checks expiration
3. If expired, uses refresh token to get new access token
4. New tokens are stored in Firestore
5. Process is transparent to the user

### Token Revocation

When disconnecting:

1. Access token is revoked with Google
2. All tokens are removed from database
3. User must re-authenticate to reconnect

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `missing_params` | OAuth callback missing required parameters | Retry connection |
| `connection_failed` | Failed to exchange code for tokens | Check credentials |
| `token_refresh_failed` | Unable to refresh expired token | Reconnect calendar |
| `No refresh token` | User denied offline access | Reconnect with prompt=consent |

### Error Responses

Connection status when not connected:
```json
{
  "connected": false
}
```

API errors return appropriate HTTP status codes with messages.

## Security Considerations

### OAuth Scopes

The integration requests minimal scopes:
- `https://www.googleapis.com/auth/calendar.events` - Create/modify calendar events

This does NOT grant access to:
- Read all calendar events
- Access other Google services
- User profile information

### Token Storage

- Tokens stored encrypted in Firestore
- Access controlled by Firebase security rules
- Tokens scoped to individual users
- Refresh tokens allow long-term access

### Best Practices

1. **Use HTTPS in production** for OAuth redirects
2. **Keep credentials secret** - never commit to version control
3. **Rotate credentials** if compromised
4. **Monitor usage** in Google Cloud Console

## Troubleshooting

### "Invalid redirect URI"

**Cause**: Redirect URI doesn't match Google Cloud Console configuration

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add the exact redirect URI including path
4. Ensure protocol matches (http vs https)

### "Access denied" Error

**Cause**: User denied calendar access

**Solution**: User needs to re-initiate connection and approve access

### Events Not Appearing

**Cause**: Calendar sync happens asynchronously

**Solutions**:
1. Wait a few seconds for sync to complete
2. Check goal has `calendar_event_id` field
3. Verify user's calendar connection status
4. Check backend logs for errors

### Token Refresh Failing

**Cause**: Refresh token may be invalid or revoked

**Solutions**:
1. Have user disconnect and reconnect calendar
2. Ensure `prompt: 'consent'` in OAuth URL
3. Check Google Cloud Console for API errors

## Related Documentation

- [Goals Feature](../features/goals.md)
- [Environment Variables](../setup/environment-variables.md)
- [Features Overview](../FEATURES.md#google-calendar-integration)
- [API Reference](../API_REFERENCE.md)

---

[← Back to Integrations](../ARCHITECTURE.md#integrations)

