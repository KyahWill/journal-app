# Coach Personalities Deployment Checklist

Use this checklist to ensure a smooth deployment of the Coach Personalities feature.

## Pre-Deployment

### Backend Setup
- [ ] All files created in `backend/src/coach-personality/`
- [ ] CoachPersonalityModule imported in `app.module.ts`
- [ ] VoiceCoachModule updated with CoachPersonalityModule dependency
- [ ] No TypeScript compilation errors
- [ ] Environment variables configured:
  - [ ] `ELEVEN_LABS_API_KEY` set
  - [ ] `ELEVENLABS_AGENT_ID` set (for fallback)

### Database Setup
- [ ] Firestore security rules updated
- [ ] Firestore indexes created
- [ ] Test Firestore connection

### ElevenLabs Setup
- [ ] ElevenLabs account active
- [ ] API key has necessary permissions
- [ ] At least one agent created for testing

## Deployment Steps

### 1. Deploy Firestore Configuration

```bash
cd web

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

**Verification:**
- [ ] Rules deployed successfully
- [ ] Indexes are building (check Firebase Console)
- [ ] No deployment errors

### 2. Deploy Backend

```bash
cd backend

# Install dependencies (if needed)
npm install

# Build
npm run build

# Run tests (if available)
npm test

# Start server
npm run start:prod
```

**Verification:**
- [ ] Server starts without errors
- [ ] No module import errors
- [ ] Health check endpoint responds
- [ ] Logs show CoachPersonalityModule loaded

### 3. Test API Endpoints

```bash
# Get auth token
TOKEN="your-firebase-token"

# Test create personality
curl -X POST http://localhost:3000/coach-personalities \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Coach",
    "description": "Test personality",
    "style": "supportive",
    "systemPrompt": "You are a test coach",
    "isDefault": true
  }'

# Test list personalities
curl -X GET http://localhost:3000/coach-personalities \
  -H "Authorization: Bearer $TOKEN"

# Test get default
curl -X GET http://localhost:3000/coach-personalities/default \
  -H "Authorization: Bearer $TOKEN"
```

**Verification:**
- [ ] Create endpoint works
- [ ] List endpoint returns data
- [ ] Default endpoint returns correct personality
- [ ] All responses have correct structure

### 4. Create ElevenLabs Agents

For each personality you want to create:

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Click "Create New Agent"
3. Configure:
   - [ ] Name matches personality
   - [ ] Voice selected
   - [ ] System prompt configured
   - [ ] First message set
   - [ ] Language set to English (or desired language)
4. Save and copy Agent ID

**Agents to Create:**
- [ ] Motivational Mike
- [ ] Analytical Anna
- [ ] Empathetic Emma
- [ ] Direct Dave
- [ ] Supportive Sam

### 5. Link Agents to Personalities

```bash
# For each personality
curl -X POST http://localhost:3000/coach-personalities/PERSONALITY_ID/link-agent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "ELEVENLABS_AGENT_ID"}'
```

**Verification:**
- [ ] All agents linked successfully
- [ ] Agent validation passes
- [ ] No "agent not found" errors

### 6. Test Voice Coach Integration

```bash
# Test signed URL generation
curl -X GET "http://localhost:3000/voice-coach/signed-url?personalityId=PERSONALITY_ID" \
  -H "Authorization: Bearer $TOKEN"

# Test without personalityId (should use default)
curl -X GET "http://localhost:3000/voice-coach/signed-url" \
  -H "Authorization: Bearer $TOKEN"
```

**Verification:**
- [ ] Signed URL generated successfully
- [ ] URL is valid and not expired
- [ ] Default personality used when no ID provided
- [ ] Fallback to env agent works if no personalities exist

### 7. End-to-End Testing

Test complete flow:

1. [ ] Create a personality via API
2. [ ] Create corresponding ElevenLabs agent
3. [ ] Link agent to personality
4. [ ] Get signed URL with personality
5. [ ] Connect to voice coach using signed URL
6. [ ] Have a conversation
7. [ ] Verify personality characteristics in responses
8. [ ] Save conversation
9. [ ] Verify conversation saved with correct personality_id

### 8. Monitor and Verify

Check logs for:
- [ ] No errors in backend logs
- [ ] Personality selection working correctly
- [ ] Agent validation succeeding
- [ ] Context building including personality prompts
- [ ] Voice settings being applied

Check Firestore:
- [ ] `coach_personalities` collection exists
- [ ] Documents have correct structure
- [ ] Indexes are active (not building)
- [ ] Security rules working (test unauthorized access)

Check ElevenLabs:
- [ ] Agents are active
- [ ] API calls succeeding
- [ ] No rate limit errors
- [ ] Voice settings applied correctly

## Post-Deployment

### Documentation
- [ ] Update API documentation
- [ ] Create user guide for personalities
- [ ] Document available coaching styles
- [ ] Add troubleshooting guide

### User Communication
- [ ] Announce new feature
- [ ] Provide examples of personalities
- [ ] Explain how to create custom personalities
- [ ] Share best practices

### Monitoring Setup
- [ ] Set up error tracking
- [ ] Monitor API response times
- [ ] Track personality usage metrics
- [ ] Set up alerts for failures

### Optional: Seed Default Personalities

```bash
# Run seed script for test users
npx ts-node src/coach-personality/seed-personalities.ts
```

- [ ] Seed script runs successfully
- [ ] Default personalities created
- [ ] Agents linked to personalities

## Rollback Plan

If issues occur:

### Quick Rollback
1. [ ] Remove CoachPersonalityModule from app.module.ts
2. [ ] Revert voice-coach.service.ts changes
3. [ ] Revert voice-coach.controller.ts changes
4. [ ] Restart backend server

### Data Rollback
1. [ ] Backup `coach_personalities` collection
2. [ ] Delete collection if needed
3. [ ] Revert Firestore rules
4. [ ] Revert Firestore indexes

### Verification After Rollback
- [ ] Voice coach works with env agent
- [ ] No errors in logs
- [ ] Existing functionality intact

## Success Criteria

Deployment is successful when:

- [ ] All API endpoints respond correctly
- [ ] Personalities can be created, updated, deleted
- [ ] Agents can be linked and validated
- [ ] Voice coach works with personalities
- [ ] Default personality selection works
- [ ] Fallback to env agent works
- [ ] No errors in production logs
- [ ] Firestore security rules enforced
- [ ] Performance is acceptable (< 200ms response times)

## Troubleshooting

### Issue: "Agent not found" error
**Solution:**
- Verify agent ID is correct
- Check API key has access to agent
- Ensure agent is active in ElevenLabs dashboard

### Issue: Default personality not working
**Solution:**
- Check only one personality has `is_default: true`
- Verify personality has `elevenlabs_agent_id` set
- Check Firestore query for default personality

### Issue: Voice settings not applied
**Solution:**
- Verify voice ID is valid
- Check voice settings are within range (0-1)
- Ensure agent supports voice customization

### Issue: Firestore permission denied
**Solution:**
- Verify security rules deployed
- Check user authentication
- Verify user_id matches auth.uid

### Issue: Module import errors
**Solution:**
- Check all imports in module files
- Verify module exports
- Restart TypeScript compiler
- Clear build cache

## Support Contacts

- **Backend Issues**: Check backend logs and error messages
- **ElevenLabs Issues**: Check ElevenLabs dashboard and API status
- **Firestore Issues**: Check Firebase Console and security rules
- **Documentation**: See README.md, QUICKSTART.md, FIRESTORE_SETUP.md

## Next Steps After Deployment

1. [ ] Monitor for 24 hours
2. [ ] Gather user feedback
3. [ ] Analyze usage metrics
4. [ ] Plan improvements based on data
5. [ ] Consider Phase 2 features

## Notes

- Keep this checklist updated as deployment process evolves
- Document any issues encountered and solutions
- Share learnings with team
- Update documentation based on real-world usage
