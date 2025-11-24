# Web Application Architecture

**Next.js frontend architecture and implementation details**

---

**Last Updated**: November 2024  
**Status**: Current

---

## Table of Contents

1. [Overview](#overview)
2. [Next.js App Router](#nextjs-app-router)
3. [Server vs Client Components](#server-vs-client-components)
4. [Streaming Architecture](#streaming-architecture)
5. [State Management](#state-management)
6. [Authentication](#authentication)
7. [Real-time Features](#real-time-features)
8. [Performance Optimization](#performance-optimization)

---

## Overview

The web application is built with Next.js 14 using the App Router architecture. It combines server-side rendering (SSR) for optimal performance with client-side interactivity for rich user experiences.

**Key Technologies**:
- Next.js 16.0.3
- React 19.2.0
- TypeScript 5.x
- Tailwind CSS 4.x
- shadcn/ui components

**Hosting**: Google Cloud Run

---

## Next.js App Router

### Directory Structure

```
web/app/
├── layout.tsx                 # Root layout
├── page.tsx                   # Landing page
│
├── api/                       # Server-side API routes
│   └── auth/                  # Authentication endpoints
│       ├── login/route.ts
│       ├── signup/route.ts
│       ├── logout/route.ts
│       ├── user/route.ts
│       └── token/route.ts
│
├── auth/                      # Public auth pages
│   ├── login/page.tsx
│   └── signup/page.tsx
│
├── app/                       # Protected application
│   ├── layout.tsx             # App layout with nav
│   ├── page.tsx               # Dashboard
│   ├── journal/               # Journal pages
│   ├── goals/                 # Goal pages
│   ├── coach/page.tsx         # Text coach
│   ├── ai-agent/page.tsx      # Voice coach
│   └── settings/              # Settings pages
│
└── middleware.ts              # Route protection
```

### Routing Patterns

**File-based Routing**:
- `page.tsx` - Page component
- `layout.tsx` - Shared layout
- `loading.tsx` - Loading UI
- `error.tsx` - Error boundary
- `not-found.tsx` - 404 page

**Dynamic Routes**:
- `[id]/page.tsx` - Dynamic segment
- `[...slug]/page.tsx` - Catch-all segment

**Route Groups**:
- `(auth)/` - Grouped routes without URL segment
- `(app)/` - Protected app routes

### API Routes

Server-side API routes handle authentication and backend communication:

```typescript
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json()
  
  // Authenticate with Firebase
  const idToken = await signInWithFirebase(email, password)
  
  // Create session cookie
  const sessionCookie = await createSessionCookie(idToken)
  
  // Set HTTP-only cookie
  const response = NextResponse.json({ success: true })
  response.cookies.set('session', sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 5, // 5 days
    path: '/',
  })
  
  return response
}
```

---

## Server vs Client Components

### Server Components (Default)

**Benefits**:
- Zero JavaScript sent to client
- Direct database access
- Secure API calls
- Better SEO
- Faster initial load

**Use Cases**:
- Layouts and static content
- Data fetching
- SEO-critical pages
- Authentication checks

**Example**:
```typescript
// app/app/journal/page.tsx (Server Component)
import { firebaseServer } from '@/lib/firebase/server'
import { redirect } from 'next/navigation'

export default async function JournalPage() {
  // Server-side auth check
  const user = await firebaseServer.getCurrentUser()
  if (!user) redirect('/auth/login')
  
  // Server-side data fetching
  const entries = await fetchEntries(user.uid)
  
  return <JournalList entries={entries} />
}
```

### Client Components

**Benefits**:
- Interactive UI
- State management
- Event handlers
- Browser APIs
- Real-time updates

**Use Cases**:
- Forms and inputs
- Interactive widgets
- Real-time features
- Client-side routing

**Example**:
```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, loading } = useAuth()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn(email, password)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### Composition Pattern

Combine server and client components for optimal performance:

```typescript
// Server Component (page.tsx)
export default async function Page() {
  const data = await fetchData() // Server-side
  
  return (
    <div>
      <StaticHeader data={data} /> {/* Server */}
      <InteractiveWidget data={data} /> {/* Client */}
    </div>
  )
}
```

---

## Streaming Architecture

The application uses Server-Sent Events (SSE) for real-time AI response streaming, providing a better user experience by showing responses as they're generated.

### Architecture Flow

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│   React     │      │  API Client  │      │   NestJS    │      │   Gemini AI  │
│  Component  │─────▶│  (Frontend)  │─────▶│  Backend    │─────▶│   Service    │
│ (page.tsx)  │      │ (client.ts)  │      │(controller) │      │(gemini.svc)  │
└─────────────┘      └──────────────┘      └─────────────┘      └──────────────┘
      │                     │                      │                     │
      │  1. sendMessage()   │                      │                     │
      ├────────────────────▶│                      │                     │
      │                     │  2. POST /stream     │                     │
      │                     ├─────────────────────▶│                     │
      │                     │                      │  3. Generate stream │
      │                     │                      ├────────────────────▶│
      │                     │                      │                     │
      │                     │  4. SSE: session     │◀────────────────────┤
      │  5. Update state    │◀─────────────────────┤                     │
      │◀────────────────────┤                      │                     │
      │                     │                      │                     │
      │                     │  6. SSE: chunk       │◀────────────────────┤
      │  7. Update UI       │◀─────────────────────┤                     │
      │◀────────────────────┤                      │                     │
      │                     │  (repeat chunks...)  │                     │
      │                     │                      │                     │
      │                     │  8. SSE: done        │                     │
      │  9. Finalize        │◀─────────────────────┤                     │
      │◀────────────────────┤                      │                     │
      │ 10. loading=false   │                      │                     │
```

### Frontend Implementation

**API Client** (`lib/api/client.ts`):
```typescript
async *sendChatMessageStream(message: string, sessionId?: string) {
  const response = await fetch(`${this.baseUrl}/chat/message/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await this.getToken()}`,
    },
    body: JSON.stringify({ message, sessionId }),
  })
  
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        yield data
      }
    }
  }
}
```

**useChat Hook** (`lib/hooks/useChat.ts`):
```typescript
const sendMessage = async (message: string, promptId?: string) => {
  setLoading(true)
  
  // Add user message immediately
  const userMessage = {
    id: `temp-${Date.now()}`,
    role: 'user' as const,
    content: message,
    timestamp: new Date(),
  }
  setMessages(prev => [...prev, userMessage])
  
  // Add empty assistant message for streaming
  const assistantMessage = {
    id: `temp-assistant-${Date.now()}`,
    role: 'assistant' as const,
    content: '',
    timestamp: new Date(),
  }
  setMessages(prev => [...prev, assistantMessage])
  
  try {
    // Stream response
    for await (const event of apiClient.sendChatMessageStream(message, sessionId, promptId)) {
      if (event.type === 'session') {
        setSessionId(event.sessionId)
        // Replace temp user message with real one
        setMessages(prev => prev.map(m => 
          m.id === userMessage.id ? event.userMessage : m
        ))
      } else if (event.type === 'chunk') {
        // Append chunk to assistant message
        setMessages(prev => prev.map(m =>
          m.id === assistantMessage.id
            ? { ...m, content: m.content + event.content }
            : m
        ))
      } else if (event.type === 'done') {
        // Replace temp assistant message with final one
        setMessages(prev => prev.map(m =>
          m.id === assistantMessage.id ? event.assistantMessage : m
        ))
      }
    }
  } catch (error) {
    // Remove temp messages on error
    setMessages(prev => prev.filter(m => 
      m.id !== userMessage.id && m.id !== assistantMessage.id
    ))
    setError(error.message)
  } finally {
    setLoading(false)
  }
}
```

### SSE Event Types

**Session Event**:
```typescript
{
  type: 'session',
  sessionId: string,
  userMessage: ChatMessage,
  usageInfo: UsageInfo
}
```

**Chunk Event**:
```typescript
{
  type: 'chunk',
  content: string  // Partial text to append
}
```

**Done Event**:
```typescript
{
  type: 'done',
  assistantMessage: ChatMessage  // Complete message
}
```

### Benefits

1. **Better UX**: Users see responses immediately
2. **Perceived Performance**: Feels faster even if total time is similar
3. **Progressive Rendering**: Content appears naturally
4. **Graceful Degradation**: Falls back to non-streaming if needed

---

## State Management

### Context Providers

**AuthContext** (`lib/contexts/auth-context.tsx`):
```typescript
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Fetch current user on mount
    fetchCurrentUser()
  }, [])
  
  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    setUser(data.user)
  }
  
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**ThemeContext** (`lib/contexts/ThemeContext.tsx`):
```typescript
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<UserTheme | null>(null)
  
  const applyTheme = (theme: UserTheme) => {
    // Set CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value)
    })
    
    // Save to localStorage
    localStorage.setItem('activeTheme', JSON.stringify(theme))
    setActiveTheme(theme)
  }
  
  return (
    <ThemeContext.Provider value={{ activeTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

### Custom Hooks

**useAuth**:
```typescript
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

**useChat**:
```typescript
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  const sendMessage = async (message: string) => {
    // Implementation
  }
  
  return { messages, loading, sessionId, sendMessage }
}
```

---

## Authentication

### Session-Based Authentication

The web app uses HTTP-only session cookies for authentication:

**Login Flow**:
1. User submits credentials
2. Next.js API route authenticates with Firebase
3. Session cookie created (5-day expiry)
4. Cookie set as HTTP-only, secure
5. User redirected to app

**Route Protection**:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  const { pathname } = request.nextUrl
  
  // Redirect unauthenticated users from protected routes
  if (pathname.startsWith('/app') && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  // Redirect authenticated users from auth pages
  if (pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/app/journal', request.url))
  }
  
  return NextResponse.next()
}
```

**Session Verification**:
```typescript
// app/api/auth/user/route.ts
export async function GET(request: Request) {
  const sessionCookie = request.cookies.get('session')?.value
  
  if (!sessionCookie) {
    return NextResponse.json({ user: null })
  }
  
  try {
    const decodedToken = await firebaseAdmin.auth().verifySessionCookie(sessionCookie, true)
    const user = await firebaseAdmin.auth().getUser(decodedToken.uid)
    
    return NextResponse.json({ user })
  } catch (error) {
    // Invalid or expired session
    const response = NextResponse.json({ user: null })
    response.cookies.delete('session')
    return response
  }
}
```

---

## Real-time Features

### Firestore Listeners

Real-time updates for journal entries and goals:

```typescript
useEffect(() => {
  if (!user) return
  
  const unsubscribe = onSnapshot(
    query(
      collection(db, 'journal_entries'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    ),
    (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setEntries(entries)
    }
  )
  
  return () => unsubscribe()
}, [user])
```

### Optimistic Updates

Immediate UI feedback before server confirmation:

```typescript
const createEntry = async (entry: NewEntry) => {
  // Add optimistic entry
  const tempId = `temp-${Date.now()}`
  const optimisticEntry = { id: tempId, ...entry, created_at: new Date() }
  setEntries(prev => [optimisticEntry, ...prev])
  
  try {
    // Create on server
    const created = await apiClient.createEntry(entry)
    
    // Replace optimistic entry with real one
    setEntries(prev => prev.map(e => 
      e.id === tempId ? created : e
    ))
  } catch (error) {
    // Remove optimistic entry on error
    setEntries(prev => prev.filter(e => e.id !== tempId))
    throw error
  }
}
```

---

## Performance Optimization

### Code Splitting

Automatic code splitting with dynamic imports:

```typescript
import dynamic from 'next/dynamic'

const VoiceInterface = dynamic(() => import('@/components/voice-interface'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Disable SSR for client-only components
})
```

### Image Optimization

Next.js Image component for automatic optimization:

```typescript
import Image from 'next/image'

<Image
  src="/profile.jpg"
  alt="Profile"
  width={200}
  height={200}
  priority // Load immediately for above-fold images
/>
```

### Font Optimization

Local font loading with next/font:

```typescript
import { GeistSans } from 'geist/font/sans'

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>{children}</body>
    </html>
  )
}
```

### Caching Strategy

```typescript
// Revalidate every hour
export const revalidate = 3600

// Static generation with ISR
export async function generateStaticParams() {
  const entries = await fetchAllEntries()
  return entries.map(entry => ({ id: entry.id }))
}
```

---

## Related Documentation

- **[Architecture Overview](../ARCHITECTURE.md)** - Complete architecture
- **[Backend Architecture](backend-architecture.md)** - Backend details
- **[Security Architecture](security-architecture.md)** - Security details
- **[System Overview](system-overview.md)** - High-level design

---

**Last Updated**: November 2024  
**Status**: Current
