# 11Labs TTS & STT Integration Summary

## Implementation Complete ✅

Successfully integrated 11Labs.ai text-to-speech and speech-to-text capabilities into the journal application.

## What Was Implemented

### Backend (NestJS)

1. **ElevenLabs Module** (`backend/src/elevenlabs/`)
   - `elevenlabs.service.ts` - Core service with TTS and STT logic
   - `elevenlabs.controller.ts` - REST API endpoints
   - `elevenlabs.module.ts` - Module definition
   - `elevenlabs.dto.ts` - Data transfer objects

2. **API Endpoints**
   - `POST /api/v1/elevenlabs/text-to-speech` - Convert text to audio
   - `POST /api/v1/elevenlabs/speech-to-text` - Convert audio to text
   - `POST /api/v1/elevenlabs/voices` - Get available voices (optional)

3. **Features**
   - Secure API key management (server-side only)
   - Audio streaming for TTS
   - Multi-format support for STT (MP3, WAV, WebM, FLAC, OGG)
   - File size limit: 25MB
   - Error handling and logging

### Frontend (Next.js/React)

1. **API Client Updates** (`web/lib/api/client.ts`)
   - `textToSpeech()` - Fetch audio from backend
   - `speechToText()` - Upload audio for transcription

2. **Custom Hooks**
   - `useTextToSpeech.ts` - Manage audio playback
     - Play/stop controls
     - Loading and playing states
     - Automatic cleanup
   - `useSpeechToText.ts` - Manage audio recording
     - Start/stop recording with MediaRecorder API
     - Processing states
     - Automatic transcription upload

3. **Coach Page** (`web/app/app/coach/page.tsx`)
   - **Text-to-Speech**: Speaker button next to each coach message
     - Click to play coach response aloud
     - Visual feedback (loading, playing states)
     - Auto-stop previous audio when playing new
   - **Speech-to-Text**: Microphone button in input area
     - Record voice messages
     - Visual recording indicator (pulsing red button)
     - Auto-populate textarea with transcription

4. **Journal Entry Forms**
   - **New Entry** (`web/app/app/journal/new/page.tsx`)
     - Microphone buttons for title, content, and mood fields
     - Record directly into any field
     - Visual feedback during recording/processing
   - **Edit Entry** (`web/app/app/journal/[id]/page.tsx`)
     - Same microphone functionality when editing
     - Separate recording for each field

## User Experience Features

### Text-to-Speech (TTS)
- 🔊 Click speaker icon to hear coach responses
- 📢 High-quality voice synthesis (Adam voice - professional, clear)
- ⏹️ Click again to stop playback
- ⏳ Loading indicator while fetching audio
- 🎵 Visual indicator when audio is playing

### Speech-to-Text (STT)
- 🎤 Click microphone to start recording
- 🔴 Pulsing red button shows recording is active
- ⏹️ Click square button to stop recording
- ⏳ Processing indicator while transcribing
- ✍️ Auto-append transcription to text field
- ✏️ Edit transcribed text before saving/sending

## Technical Decisions

### Architecture
- **Backend Proxy**: All 11Labs API calls go through NestJS backend for security
- **Streaming**: Audio is streamed from backend to reduce memory usage
- **Format**: MP3/MPEG for TTS (broad browser support)
- **Recording**: WebM format with Opus codec for STT (best browser support)

### Security
- API key stored server-side only in `.env`
- Firebase authentication required for all endpoints
- File upload validation and size limits

### Browser Compatibility
- TTS: All modern browsers (Audio API)
- STT: Chrome, Edge, Safari, Firefox (MediaRecorder API)
- Graceful error handling for unsupported browsers

## Setup Requirements

### Backend
1. Install the 11Labs SDK:
   ```bash
   cd backend
   npm install elevenlabs
   ```

2. Add API key to `.env`:
   ```
   ELEVEN_LABS_API_KEY=your_api_key_here
   ```

3. Restart the backend server

### Frontend
- No additional packages required (uses built-in browser APIs)

## API Usage

### Text-to-Speech Example
```typescript
const audioBlob = await apiClient.textToSpeech("Hello, how can I help you today?")
const audioUrl = URL.createObjectURL(audioBlob)
const audio = new Audio(audioUrl)
audio.play()
```

### Speech-to-Text Example
```typescript
// Start recording
await startRecording()

// Stop recording (transcription happens automatically)
await stopRecording()

// Transcription appears in `transcription` state variable
```

## Testing Checklist

- [ ] Backend: Test TTS endpoint with sample text
- [ ] Backend: Test STT endpoint with audio file upload
- [ ] Frontend: Test playing coach message audio
- [ ] Frontend: Test recording voice in coach chat
- [ ] Frontend: Test recording in journal title field
- [ ] Frontend: Test recording in journal content field
- [ ] Frontend: Test recording in journal mood field
- [ ] Frontend: Test editing existing entry with voice
- [ ] Browser compatibility: Test in Chrome, Safari, Firefox, Edge
- [ ] Error handling: Test without microphone permission
- [ ] Error handling: Test with invalid audio format

## Future Enhancements

Potential improvements for later:

1. **Voice Selection**: Allow users to choose different 11Labs voices
2. **Playback Speed**: Add speed control for TTS playback
3. **Recording Limit**: Show visual timer during recording (current: unlimited)
4. **Audio Visualization**: Show waveform during recording
5. **Multiple Languages**: Support transcription in different languages
6. **Offline Fallback**: Use Web Speech API as fallback when offline
7. **Streaming STT**: Real-time transcription using 11Labs Scribe Realtime
8. **Voice Commands**: Implement voice commands for navigation
9. **Batch Operations**: Convert multiple entries to audio at once
10. **Audio Archive**: Save and replay previous TTS generations

## Files Created/Modified

### Backend
- ✅ `backend/src/elevenlabs/elevenlabs.service.ts`
- ✅ `backend/src/elevenlabs/elevenlabs.controller.ts`
- ✅ `backend/src/elevenlabs/elevenlabs.module.ts`
- ✅ `backend/src/common/dto/elevenlabs.dto.ts`
- ✅ `backend/src/app.module.ts` (updated)

### Frontend
- ✅ `web/lib/api/client.ts` (updated)
- ✅ `web/lib/hooks/useTextToSpeech.ts`
- ✅ `web/lib/hooks/useSpeechToText.ts`
- ✅ `web/app/app/coach/page.tsx` (updated)
- ✅ `web/app/app/journal/new/page.tsx` (updated)
- ✅ `web/app/app/journal/[id]/page.tsx` (updated)

## Support

If you encounter issues:

1. **TTS not working**: Check backend logs for 11Labs API errors
2. **STT not working**: Ensure microphone permissions are granted
3. **No audio playback**: Check browser console for errors
4. **Recording fails**: Verify MediaRecorder API support in browser
5. **API errors**: Verify `ELEVEN_LABS_API_KEY` is set correctly in `.env`

---

**Implementation Date**: November 22, 2025
**Status**: ✅ Complete and Ready for Testing

