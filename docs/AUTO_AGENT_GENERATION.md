# Automatic ElevenLabs Agent Generation

## Overview

The system now automatically creates real ElevenLabs Conversational AI agents via API for coach personalities, eliminating the need for manual agent creation in the ElevenLabs dashboard.

## How It Works

### 1. First-Time User Experience

When a user first accesses the voice coach:

1. **No personality exists** → System creates a default "Your AI Coach" personality
2. **No agent linked** → System automatically generates an ElevenLabs agent via API
3. **Agent linked** → Personality is ready to use immediately

### 2. Creating New Personalities

When creating a new personality via API:

```bash
POST /coach-personalities
{
  "name": "Motivational Mike",
  "style": "motivational",
  "systemPrompt": "You are an energetic coach...",
  "voiceId": "pNInz6obpgDQGcFmaJgB"
}
```

The agent is **not** created immediately. Instead:

1. Personality is saved to Firestore without `elevenlabs_agent_id`
2. When user first uses this personality, agent is auto-generated
3. Agent ID is saved to personality document

### 3. Manual Agent Generation

You can also manually trigger agent generation:

```bash
POST /coach-personalities/:id/generate-agent
```

This immediately creates the ElevenLabs agent and links it.

## Implementation Details

### ElevenLabs Service

**New Method: `createAgent()`**

```typescript
async createAgent(config: CreateAgentConfig): Promise<string>
```

- Calls ElevenLabs REST API: `POST /v1/convai/agents/create`
- Configures agent with:
  - Name
  - System prompt
  - First message
  - Language
  - Voice settings (ID, stability, similarity boost)
- Returns the generated `agent_id`

**Updated Method: `getAgentDetails()`**

```typescript
async getAgentDetails(agentId: string): Promise<AgentDetails>
```

- Now calls ElevenLabs REST API: `GET /v1/convai/agents/{agentId}`
- Returns actual agent configuration from ElevenLabs
- Used for validation and debugging

### Coach Personality Service

**Updated Method: `generateAgent()`**

```typescript
async generateAgent(userId: string, personalityId: string): Promise<CoachPersonality>
```

- No longer throws "not implemented" error
- Calls `elevenLabsService.createAgent()` with personality configuration
- Automatically links created agent to personality
- Returns updated personality with `elevenlabs_agent_id`

### Voice Coach Service

**Auto-Generation Logic**

Both `createSession()` and `getSignedUrl()` now:

1. Check if personality has an agent
2. If no agent → automatically generate one
3. If generation fails → fall back to environment variable agent

**Default Personality Creation**

New method: `createDefaultPersonality()`

- Creates a "Your AI Coach" personality
- Supportive coaching style
- Professional voice (Adam)
- Comprehensive system prompt
- Set as default

## API Endpoints

### Generate Agent for Personality

```http
POST /coach-personalities/:id/generate-agent
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "personality-id",
  "name": "Motivational Mike",
  "elevenLabsAgentId": "newly-generated-agent-id",
  ...
}
```

### All Other Endpoints Unchanged

Creating, updating, and using personalities works the same way. Agent generation happens automatically when needed.

## ElevenLabs API Configuration

### Agent Creation Payload

The system uses the official ElevenLabs API endpoint to create agents:

**Endpoint**: `POST https://api.elevenlabs.io/v1/convai/agents/create`

**Payload**:
```json
{
  "name": "Personality Name",
  "conversation_config": {
    "agent": {
      "prompt": {
        "prompt": "System prompt text..."
      },
      "first_message": "Hello! How can I help?",
      "language": "en",
      "tts": {
        "voice_id": "pNInz6obpgDQGcFmaJgB",
        "model_id": "eleven_turbo_v2_5",
        "stability": 0.6,
        "similarity_boost": 0.75
      }
    }
  }
}
```

**Response**:
```json
{
  "agent_id": "newly-created-agent-id"
}
```

### API Endpoints Used

- **Create Agent**: `POST https://api.elevenlabs.io/v1/convai/agents/create`
- **Get Agent**: `GET https://api.elevenlabs.io/v1/convai/agents/{agent_id}`
- **Get Signed URL**: SDK method `conversationalAi.getSignedUrl()`

## Error Handling

### Agent Creation Failures

If agent creation fails:

1. Error is logged with full details
2. System falls back to environment variable `ELEVENLABS_AGENT_ID`
3. User can still use voice coach with default agent
4. Can retry agent generation later

### Common Errors

**401 Unauthorized**
- API key invalid or missing
- Check `ELEVEN_LABS_API_KEY` in `.env`

**429 Rate Limit**
- Too many agent creations
- Wait and retry
- Consider caching agents

**400 Bad Request**
- Invalid configuration
- Check voice ID is valid
- Verify prompt is not empty

## Benefits

### For Users
- ✅ Instant setup - no manual configuration
- ✅ Seamless experience - works immediately
- ✅ No ElevenLabs dashboard access needed
- ✅ Automatic agent management

### For Developers
- ✅ No manual agent creation steps
- ✅ Programmatic agent management
- ✅ Easier testing and development
- ✅ Scalable to many users

### For Operations
- ✅ Reduced support burden
- ✅ Consistent agent configuration
- ✅ Automated provisioning
- ✅ Better error handling

## Migration from Manual Agents

### Existing Personalities

Personalities with manually created agents continue to work:
- `elevenlabs_agent_id` is already set
- No auto-generation triggered
- No changes needed

### New Personalities

All new personalities get auto-generated agents:
- No manual steps required
- Agent created on first use
- Linked automatically

## Testing

### Test Auto-Generation

```bash
# 1. Create personality without agent
curl -X POST http://localhost:3000/coach-personalities \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test","style":"supportive","systemPrompt":"Test prompt"}'

# 2. Use voice coach (triggers auto-generation)
curl -X GET "http://localhost:3000/voice-coach/signed-url?personalityId=PERSONALITY_ID" \
  -H "Authorization: Bearer $TOKEN"

# 3. Verify agent was created
curl -X GET http://localhost:3000/coach-personalities/PERSONALITY_ID \
  -H "Authorization: Bearer $TOKEN"
# Should now have elevenlabs_agent_id field
```

### Test Manual Generation

```bash
# Manually trigger agent generation
curl -X POST http://localhost:3000/coach-personalities/PERSONALITY_ID/generate-agent \
  -H "Authorization: Bearer $TOKEN"
```

## Monitoring

### Metrics to Track

- Agent creation success rate
- Agent creation latency
- Fallback to default agent frequency
- Agent validation failures

### Logs to Monitor

```
[VoiceCoachService] No default personality found for user X, creating one...
[VoiceCoachService] Default personality has no agent, generating one...
[ElevenLabsService] Creating agent: Your AI Coach
[ElevenLabsService] Agent created successfully: agent_abc123
[CoachPersonalityService] Agent agent_abc123 generated and linked to personality: pers_xyz789
```

## Troubleshooting

### Agent Not Created

**Check logs for:**
- ElevenLabs API errors
- Network connectivity issues
- Invalid API key
- Rate limiting

**Solutions:**
- Verify `ELEVEN_LABS_API_KEY` is set
- Check ElevenLabs API status
- Retry agent generation
- Use fallback agent temporarily

### Agent Creation Slow

**Causes:**
- ElevenLabs API latency
- Network issues
- First-time user setup

**Solutions:**
- Pre-generate agents for common personalities
- Cache agent IDs
- Show loading state to users

### Wrong Agent Configuration

**Fix:**
- Delete agent in ElevenLabs dashboard
- Remove `elevenlabs_agent_id` from personality
- Trigger regeneration

## Future Enhancements

### Phase 2
- [ ] Batch agent creation for multiple personalities
- [ ] Agent update API (modify existing agents)
- [ ] Agent deletion when personality deleted
- [ ] Agent configuration validation

### Phase 3
- [ ] Agent analytics and usage tracking
- [ ] A/B testing different agent configurations
- [ ] Agent performance optimization
- [ ] Cost tracking per agent

### Phase 4
- [ ] Agent templates library
- [ ] Community-shared agent configurations
- [ ] AI-powered agent optimization
- [ ] Multi-language agent support

## Cost Considerations

### ElevenLabs Pricing

- Agent creation: Check ElevenLabs pricing
- Agent storage: May have limits per account
- Conversation usage: Billed separately

### Optimization

- Reuse agents when possible
- Delete unused agents
- Monitor agent count per user
- Set reasonable limits

## Security

### API Key Protection

- Never expose API key to frontend
- Store securely in environment variables
- Rotate keys regularly
- Monitor for unauthorized usage

### Agent Access Control

- Agents are user-scoped
- Cannot access other users' agents
- Firestore rules enforce ownership
- Agent IDs are not guessable

## Conclusion

Automatic agent generation eliminates manual setup, provides a seamless user experience, and scales effortlessly. The system gracefully handles failures and provides clear error messages for debugging.

Users can now start using the voice coach immediately without any configuration, while developers can programmatically manage agents at scale.
