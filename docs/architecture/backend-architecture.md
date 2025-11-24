# Backend API Architecture

**NestJS backend architecture and implementation details**

---

**Last Updated**: November 2025  
**Status**: Current

---

## Table of Contents

1. [Overview](#overview)
2. [Module Architecture](#module-architecture)
3. [Core Services](#core-services)
4. [Request Flow](#request-flow)
5. [Dependency Injection](#dependency-injection)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Testing Strategy](#testing-strategy)

---

## Overview

The backend API is built with NestJS, a progressive Node.js framework that provides a solid architectural foundation with TypeScript, dependency injection, and modular design.

**Key Technologies**:
- NestJS 10.3.0
- TypeScript 5.3.3
- Firebase Admin SDK 13.0.1
- Google Generative AI 0.21.0
- ElevenLabs 1.59.0

**Hosting**: Google Cloud Run  
**Port**: 3001

---

## Module Architecture

### Directory Structure

```
backend/src/
├── app.module.ts              # Root module
├── main.ts                    # Application entry point
│
├── auth/                      # Authentication
├── journal/                   # Journal entries
├── goal/                      # Goal tracking
├── chat/                      # AI text coach
├── voice-coach/               # Voice AI coach
├── coach-personality/         # Coach personalities
├── rag/                       # RAG system
├── theme/                     # Theme customization
├── category/                  # Custom categories
├── prompt/                    # AI prompts
│
├── firebase/                  # Firebase Admin SDK
├── gemini/                    # Google Gemini AI
├── elevenlabs/                # Voice synthesis
│
└── common/                    # Shared resources
    ├── dto/                   # Data Transfer Objects
    ├── guards/                # Auth guards
    ├── decorators/            # Custom decorators
    ├── services/              # Shared services
    └── types/                 # TypeScript types
```

### Module Pattern

Each feature module follows this structure:

```
feature/
├── feature.controller.ts      # HTTP endpoints
├── feature.service.ts         # Business logic
├── feature.module.ts          # Module configuration
└── feature.dto.ts             # Data validation (optional)
```

**Example - Journal Module**:
```typescript
// journal.module.ts
@Module({
  imports: [FirebaseModule],
  controllers: [JournalController],
  providers: [JournalService],
  exports: [JournalService],
})
export class JournalModule {}

// journal.controller.ts
@Controller('journal')
@UseGuards(AuthGuard)
export class JournalController {
  constructor(private readonly journalService: JournalService) {}
  
  @Get()
  async getEntries(@CurrentUser() user: any) {
    return this.journalService.getEntries(user.uid)
  }
  
  @Post()
  async createEntry(
    @CurrentUser() user: any,
    @Body() dto: CreateEntryDto,
  ) {
    return this.journalService.createEntry(user.uid, dto)
  }
}

// journal.service.ts
@Injectable()
export class JournalService {
  constructor(private readonly firebaseService: FirebaseService) {}
  
  async getEntries(userId: string) {
    return this.firebaseService.getDocuments('journal_entries', {
      where: [['user_id', '==', userId]],
      orderBy: [['created_at', 'desc']],
    })
  }
  
  async createEntry(userId: string, dto: CreateEntryDto) {
    const entry = {
      ...dto,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    }
    return this.firebaseService.addDocument('journal_entries', entry)
  }
}
```

---

## Core Services

### Firebase Service

**Purpose**: Provide Firebase Admin SDK functionality

**Capabilities**:
- User management (create, verify, delete)
- Firestore CRUD operations
- Session cookie management
- Batch operations
- Transactions

**Implementation**:
```typescript
@Injectable()
export class FirebaseService {
  private readonly auth: Auth
  private readonly firestore: Firestore
  
  constructor(private readonly configService: ConfigService) {
    const serviceAccount = JSON.parse(
      this.configService.get('FIREBASE_SERVICE_ACCOUNT_KEY')
    )
    
    const app = initializeApp({
      credential: cert(serviceAccount),
    })
    
    this.auth = getAuth(app)
    this.firestore = getFirestore(app)
  }
  
  // Auth operations
  async createUser(email: string, password: string, displayName?: string) {
    return this.auth.createUser({ email, password, displayName })
  }
  
  async verifyIdToken(token: string) {
    return this.auth.verifyIdToken(token)
  }
  
  async verifySessionCookie(cookie: string, checkRevoked = true) {
    return this.auth.verifySessionCookie(cookie, checkRevoked)
  }
  
  // Firestore operations
  async addDocument(collection: string, data: any) {
    const ref = await this.firestore.collection(collection).add(data)
    return { id: ref.id, ...data }
  }
  
  async getDocument(collection: string, id: string) {
    const doc = await this.firestore.collection(collection).doc(id).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  }
  
  async updateDocument(collection: string, id: string, data: any) {
    await this.firestore.collection(collection).doc(id).update(data)
    return { id, ...data }
  }
  
  async deleteDocument(collection: string, id: string) {
    await this.firestore.collection(collection).doc(id).delete()
  }
  
  async getDocuments(collection: string, options?: QueryOptions) {
    let query: Query = this.firestore.collection(collection)
    
    // Apply filters
    if (options?.where) {
      options.where.forEach(([field, op, value]) => {
        query = query.where(field, op, value)
      })
    }
    
    // Apply ordering
    if (options?.orderBy) {
      options.orderBy.forEach(([field, direction]) => {
        query = query.orderBy(field, direction)
      })
    }
    
    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    const snapshot = await query.get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
}
```

### Gemini Service

**Purpose**: Provide Google Gemini AI functionality

**Capabilities**:
- Text generation
- Streaming responses
- Embeddings generation
- Context-aware coaching

**Implementation**:
```typescript
@Injectable()
export class GeminiService {
  private readonly model: GenerativeModel
  private readonly embeddingModel: GenerativeModel
  
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('GEMINI_API_KEY')
    const genAI = new GoogleGenerativeAI(apiKey)
    
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    this.embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })
  }
  
  async sendMessage(prompt: string, context?: string) {
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
    const result = await this.model.generateContent(fullPrompt)
    return result.response.text()
  }
  
  async *sendMessageStream(prompt: string, context?: string) {
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
    const result = await this.model.generateContentStream(fullPrompt)
    
    for await (const chunk of result.stream) {
      yield chunk.text()
    }
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.embeddingModel.embedContent(text)
    return result.embedding.values
  }
  
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const results = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    )
    return results
  }
}
```

### ElevenLabs Service

**Purpose**: Provide voice synthesis functionality

**Capabilities**:
- Text-to-speech conversion
- Voice selection
- Streaming audio

**Implementation**:
```typescript
@Injectable()
export class ElevenLabsService {
  private readonly client: ElevenLabsClient
  
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('ELEVENLABS_API_KEY')
    this.client = new ElevenLabsClient({ apiKey })
  }
  
  async *textToSpeechStream(text: string, voiceId: string) {
    const audioStream = await this.client.textToSpeech.convertAsStream(voiceId, {
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    })
    
    for await (const chunk of audioStream) {
      yield chunk
    }
  }
  
  async getVoices() {
    const response = await this.client.voices.getAll()
    return response.voices
  }
}
```

---

## Request Flow

### Complete Request Lifecycle

```
1. Client Request
   POST /api/v1/journal
   Headers:
     Authorization: Bearer <token>
     Content-Type: application/json
   Body:
     { "title": "My Entry", "content": "..." }

2. Middleware Layer
   ├─ CORS Check (validate origin)
   ├─ Request Validation (parse body)
   └─ Logging (log request)

3. Auth Guard
   ├─ Extract token from Authorization header
   ├─ Verify token with Firebase Admin
   ├─ Add user info to request object
   └─ Continue or throw UnauthorizedException

4. Controller (journal.controller.ts)
   ├─ Receive request
   ├─ Extract user from @CurrentUser decorator
   ├─ Validate DTO with class-validator
   └─ Call service method

5. Service (journal.service.ts)
   ├─ Prepare data (add user_id, timestamps)
   ├─ Apply business logic
   └─ Call Firebase service

6. Firebase Service (firebase.service.ts)
   ├─ Connect to Firestore
   ├─ Add document to collection
   └─ Return result

7. Response
   ├─ Format response
   ├─ Set HTTP status code (201 Created)
   └─ Return JSON to client
```

### Error Handling Flow

```
Error Occurs
     │
     ▼
Exception Filter
     │
     ├─ Known Error (HttpException)
     │  └─ Return formatted error response
     │
     └─ Unknown Error
        ├─ Log error details
        ├─ Return generic 500 error
        └─ Alert monitoring system
```

---

## Dependency Injection

### Module Hierarchy

```
AppModule (Root)
│
├─ ConfigModule (Global)
│  └─ Environment variables
│
├─ FirebaseModule (Global)
│  └─ FirebaseService
│
├─ GeminiModule (Global)
│  └─ GeminiService
│
├─ ElevenLabsModule (Global)
│  └─ ElevenLabsService
│
├─ AuthModule
│  ├─ AuthController
│  └─ AuthService
│     └─ uses: FirebaseService
│
├─ JournalModule
│  ├─ JournalController
│  │  └─ uses: AuthGuard
│  └─ JournalService
│     └─ uses: FirebaseService
│
├─ ChatModule
│  ├─ ChatController
│  │  └─ uses: AuthGuard
│  └─ ChatService
│     ├─ uses: FirebaseService
│     ├─ uses: GeminiService
│     └─ uses: JournalService
│
└─ VoiceCoachModule
   ├─ VoiceCoachController
   │  └─ uses: AuthGuard
   └─ VoiceCoachService
      ├─ uses: FirebaseService
      ├─ uses: GeminiService
      ├─ uses: ElevenLabsService
      └─ uses: ContextBuilderService
```

### Injection Example

```typescript
@Injectable()
export class ChatService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly geminiService: GeminiService,
    private readonly journalService: JournalService,
    private readonly rateLimitService: RateLimitService,
  ) {}
  
  async sendMessage(userId: string, message: string) {
    // Check rate limit
    await this.rateLimitService.checkLimit(userId, 'chat')
    
    // Get context from journal
    const entries = await this.journalService.getRecentEntries(userId, 20)
    const context = this.buildContext(entries)
    
    // Generate AI response
    const response = await this.geminiService.sendMessage(message, context)
    
    // Save to session
    await this.firebaseService.addDocument('chat_sessions', {
      user_id: userId,
      messages: [
        { role: 'user', content: message },
        { role: 'assistant', content: response },
      ],
    })
    
    return response
  }
}
```

---

## Error Handling

### Exception Filters

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()
    
    let status = 500
    let message = 'Internal server error'
    
    if (exception instanceof HttpException) {
      status = exception.getStatus()
      message = exception.message
    }
    
    // Log error
    console.error({
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    })
    
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
```

### Custom Exceptions

```typescript
export class RateLimitExceededException extends HttpException {
  constructor() {
    super('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS)
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string) {
    super(`${resource} not found`, HttpStatus.NOT_FOUND)
  }
}
```

---

## Rate Limiting

### Implementation

```typescript
@Injectable()
export class RateLimitService {
  private readonly limits = new Map<string, number[]>()
  
  async checkLimit(userId: string, action: string): Promise<void> {
    const key = `${userId}:${action}`
    const now = Date.now()
    const windowMs = 60 * 60 * 1000 // 1 hour
    
    // Get timestamps within window
    const timestamps = this.limits.get(key) || []
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs)
    
    // Check limit
    const limit = this.getLimitForAction(action)
    if (validTimestamps.length >= limit) {
      throw new RateLimitExceededException()
    }
    
    // Add new timestamp
    validTimestamps.push(now)
    this.limits.set(key, validTimestamps)
  }
  
  private getLimitForAction(action: string): number {
    const limits = {
      chat: 50,
      insights: 10,
      voice: 20,
      rag: 100,
    }
    return limits[action] || 100
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('JournalService', () => {
  let service: JournalService
  let firebaseService: FirebaseService
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JournalService,
        {
          provide: FirebaseService,
          useValue: {
            addDocument: jest.fn(),
            getDocuments: jest.fn(),
          },
        },
      ],
    }).compile()
    
    service = module.get<JournalService>(JournalService)
    firebaseService = module.get<FirebaseService>(FirebaseService)
  })
  
  it('should create entry', async () => {
    const userId = 'user123'
    const dto = { title: 'Test', content: 'Content' }
    
    jest.spyOn(firebaseService, 'addDocument').mockResolvedValue({
      id: 'entry123',
      ...dto,
      user_id: userId,
    })
    
    const result = await service.createEntry(userId, dto)
    
    expect(result.id).toBe('entry123')
    expect(firebaseService.addDocument).toHaveBeenCalledWith(
      'journal_entries',
      expect.objectContaining({ user_id: userId })
    )
  })
})
```

### Integration Tests

```typescript
describe('JournalController (e2e)', () => {
  let app: INestApplication
  let token: string
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()
    
    app = moduleFixture.createNestApplication()
    await app.init()
    
    // Get auth token
    token = await getTestToken()
  })
  
  it('/journal (POST)', () => {
    return request(app.getHttpServer())
      .post('/journal')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test', content: 'Content' })
      .expect(201)
      .expect(res => {
        expect(res.body.id).toBeDefined()
        expect(res.body.title).toBe('Test')
      })
  })
})
```

---

## Related Documentation

- **[Architecture Overview](../ARCHITECTURE.md)** - Complete architecture
- **[Web Architecture](web-architecture.md)** - Frontend details
- **[Security Architecture](security-architecture.md)** - Security details
- **[System Overview](system-overview.md)** - High-level design

---

**Last Updated**: November 2025
**Status**: Current
