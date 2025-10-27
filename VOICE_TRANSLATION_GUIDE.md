# Tamil Voice-to-English Text Translation Guide

## Overview

The B2B Platform now supports **Tamil voice input with automatic English text translation** using Sarvam AI's speech-to-text-translate API. Users can speak in Tamil (or any of 11 supported Indian languages), and their speech will be automatically transcribed and translated to English text.

## Features

### 🎤 Voice Input
- **Hold-to-Record**: Press and hold the microphone button to record
- **Real-time Feedback**: Visual animations while recording
- **Multi-language Support**: 11 Indian languages supported

### 🌍 Supported Languages
1. Tamil (தமிழ்) - `ta-IN`
2. Hindi (हिंदी) - `hi-IN`
3. Bengali (বাংলা) - `bn-IN`
4. Telugu (తెలుగు) - `te-IN`
5. Gujarati (ગુજરાતી) - `gu-IN`
6. Kannada (ಕನ್ನಡ) - `kn-IN`
7. Malayalam (മലയാളം) - `ml-IN`
8. Marathi (मराठी) - `mr-IN`
9. Punjabi (ਪੰਜਾਬੀ) - `pa-IN`
10. Odia (ଓଡ଼ିଆ) - `or-IN`
11. English - `en-IN`

### ✨ Key Features
- **Automatic Language Detection**: Sarvam AI automatically detects the spoken language
- **Direct Translation**: Speech is converted directly to English text (no intermediate step)
- **Language Selector**: Blue badge on mic button to choose input language
- **Visual Feedback**:
  - Red pulsing animation while recording
  - Blue loading animation while translating
  - Success toast with detected language

## Setup Instructions

### 1. Get Sarvam AI API Key

1. Visit [Sarvam AI](https://www.sarvam.ai/)
2. Sign up for an account
3. Navigate to the API Keys section
4. Generate a new API key

### 2. Configure Environment Variables

Add your Sarvam AI API key to your `.env` file:

```bash
VITE_SARVAM_API_KEY=your-api-key-here
```

### 3. Verify Installation

The application will automatically check if the API key is configured. If missing, you'll see an error toast when trying to use voice input.

## How to Use

### Recording Voice Input

1. **Open a conversation** in the Messages page
2. **Click the blue language badge** on the mic button to select your input language (default: Tamil)
3. **Press and hold the microphone button** to start recording
4. **Speak clearly** in your chosen language
5. **Release the button** to stop recording
6. The app will:
   - Show a loading toast: "Translating Tamil to English..."
   - Process your speech through Sarvam AI
   - Display the translated English text in the input field
   - Show a success toast with the detected language

### Language Selection

1. Click the **blue badge** with the language icon on the top-right of the mic button
2. A popup will appear with all 11 supported languages
3. Click on your desired language
4. The selection will be saved and shown in the status bar

### Visual Indicators

#### Recording State
- **Microphone button**: Red with pulsing animation
- **Status bar**: "Recording... Release to translate"
- **Button text**: Shows recording waves

#### Translating State
- **Microphone button**: Blue with bouncing dots
- **Input field**: Disabled with loading animation
- **Toast**: "Translating Tamil to English..."

#### Success State
- **Input field**: Populated with English translation
- **Toast**: "Translated from Tamil to English!"
- **Language badge**: Shows detected language

## API Integration

### Service: `src/services/sarvamAI.js`

#### Methods

##### `translateSpeechToEnglish(audioBlob, options)`
Main method for Tamil voice-to-English text translation.

```javascript
const result = await sarvamAI.translateSpeechToEnglish(audioBlob, {
  model: 'saaras:v2'
});

if (result.success) {
  console.log('Translated Text:', result.translatedText);
  console.log('Detected Language:', result.detectedLanguage);
}
```

**Parameters:**
- `audioBlob`: Audio blob from MediaRecorder (WebM format)
- `options.model`: Model to use (default: 'saaras:v2')
- `options.prompt`: Optional context prompt

**Returns:**
```javascript
{
  success: true,
  translatedText: "The translated English text",
  detectedLanguage: "ta-IN",
  requestId: "unique-request-id",
  diarizedTranscript: [...] // Optional speaker-separated transcripts
}
```

##### `transcribeSpeech(audioBlob, languageCode)`
Transcribe speech without translation (returns text in original language).

```javascript
const result = await sarvamAI.transcribeSpeech(audioBlob, 'ta-IN');
```

##### `translateText(text, sourceLanguage, targetLanguage)`
Translate text from one language to another.

```javascript
const result = await sarvamAI.translateText(
  'வணக்கம்',
  'ta-IN',
  'en-IN'
);
```

##### `getSupportedLanguages()`
Get list of all supported languages.

```javascript
const languages = sarvamAI.getSupportedLanguages();
// Returns: [{ code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' }, ...]
```

##### `isConfigured()`
Check if API key is configured.

```javascript
if (sarvamAI.isConfigured()) {
  // API is ready to use
}
```

## UI Components

### Voice Input Button

Located in [MessagesPage.jsx:640-675](src/pages/MessagesPage.jsx#L640-L675)

Features:
- Hold-to-record interaction
- Three states: idle, recording, translating
- Animated visual feedback
- Disabled during translation

### Language Selector

Located in [MessagesPage.jsx:687-717](src/pages/MessagesPage.jsx#L687-L717)

Features:
- Popup menu with all 11 languages
- Native name display
- Selection indicator
- Click-outside to close

### Status Bar

Located in [MessagesPage.jsx:762-781](src/pages/MessagesPage.jsx#L762-L781)

Shows:
- Auto-translate settings
- Current voice language
- Recording status

## Technical Details

### Audio Processing Flow

```
1. User holds mic button
   ↓
2. MediaRecorder starts capturing audio
   ↓
3. User releases button
   ↓
4. Audio chunks combined into WebM blob
   ↓
5. Blob sent to Sarvam AI via FormData
   ↓
6. Sarvam AI processes with Saaras v2 model
   ↓
7. Returns English translation + detected language
   ↓
8. Text inserted into message input field
```

### API Endpoint

```
POST https://api.sarvam.ai/speech-to-text-translate
```

**Headers:**
```javascript
{
  'api-subscription-key': VITE_SARVAM_API_KEY,
  'Content-Type': 'multipart/form-data'
}
```

**Body (FormData):**
- `file`: Audio blob (WebM format)
- `model`: 'saaras:v2'
- `prompt`: Optional context

**Response:**
```json
{
  "transcript": "The translated English text",
  "language_code": "ta-IN",
  "request_id": "unique-id",
  "diarized_transcript": [...]
}
```

### Browser Compatibility

Requires browsers with:
- MediaRecorder API support
- getUserMedia API support
- FormData API support

**Supported Browsers:**
- Chrome 49+
- Firefox 65+
- Safari 14+
- Edge 79+

## Error Handling

### Common Errors

#### 1. API Key Not Configured
**Error:** "Sarvam AI is not configured. Please add VITE_SARVAM_API_KEY to your .env file"

**Solution:** Add your Sarvam API key to `.env`:
```bash
VITE_SARVAM_API_KEY=your-api-key-here
```

#### 2. Microphone Access Denied
**Error:** "Microphone access denied or not available"

**Solution:**
- Check browser permissions
- Ensure HTTPS connection (required for mic access)
- Grant microphone permission when prompted

#### 3. Translation Failed
**Error:** "Speech recognition failed. Please try again."

**Possible causes:**
- Poor audio quality
- Background noise
- Network issues
- API rate limits

**Solutions:**
- Speak clearly and close to microphone
- Reduce background noise
- Check internet connection
- Verify API quota

## Performance Optimization

### Best Practices

1. **Audio Quality**
   - Use quiet environment
   - Speak clearly
   - Hold mic button stable

2. **Network**
   - Stable internet connection required
   - Audio files typically 50-500KB
   - API response time: 2-5 seconds

3. **Error Recovery**
   - Auto-retry on network failures
   - Clear error messages
   - Graceful degradation

## Styling & Animations

### CSS Classes

#### Fade In Animation
```css
.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}
```

Applied to:
- Message bubbles
- Language selector popup
- Success notifications

#### Recording Animation
```css
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

#### Bounce Animation
```css
.animate-bounce {
  animation: bounce 1s infinite;
}
```

Used for loading indicators.

### Color Scheme

- **Recording**: Red (#EF4444)
- **Translating**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Idle**: Gray (#6B7280)

## Testing

### Manual Testing Checklist

- [ ] Can select different languages from dropdown
- [ ] Recording starts when holding mic button
- [ ] Recording stops when releasing button
- [ ] Loading state appears during translation
- [ ] English text appears in input field
- [ ] Detected language shown in success toast
- [ ] Language selector closes on click outside
- [ ] Error messages display correctly
- [ ] Works in both light and dark mode
- [ ] Mobile responsive

### Test Scenarios

1. **Happy Path**
   - Select Tamil language
   - Hold mic, speak "வணக்கம்"
   - Release mic
   - Verify "Hello" or "Greetings" appears

2. **Language Detection**
   - Select "auto" or any language
   - Speak in different languages
   - Verify correct language detected

3. **Error Handling**
   - Remove API key
   - Try recording
   - Verify error message

4. **Mobile**
   - Test on mobile device
   - Verify touch events work
   - Check responsive layout

## Troubleshooting

### Issue: No audio captured
**Check:**
- Browser permissions
- Microphone hardware
- HTTPS connection
- Browser compatibility

### Issue: Translation takes too long
**Check:**
- Internet connection speed
- Audio file size
- API response time
- Rate limiting

### Issue: Incorrect translation
**Try:**
- Speaking more clearly
- Reducing background noise
- Using shorter phrases
- Checking language selection

### Issue: Language selector not appearing
**Check:**
- Browser console for errors
- CSS animations enabled
- React component state
- Click handlers

## Future Enhancements

### Potential Features

1. **Voice Messages**
   - Send audio clips with translation
   - Play received voice messages
   - Show both audio and text

2. **Real-time Translation**
   - Stream audio during recording
   - Show live transcription
   - Faster feedback

3. **Speaker Diarization**
   - Multiple speaker detection
   - Separate translations per speaker
   - Conversation context

4. **Custom Vocabulary**
   - Industry-specific terms
   - User dictionary
   - Context-aware translation

5. **Offline Mode**
   - Cache common phrases
   - Local speech recognition fallback
   - Queue for later processing

## Support & Resources

### Documentation
- [Sarvam AI Docs](https://docs.sarvam.ai/)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

### API Limits
- Check your Sarvam AI dashboard for:
  - Rate limits
  - Monthly quota
  - Request statistics

### Getting Help
- GitHub Issues: Report bugs or request features
- Sarvam AI Support: API-related questions
- Community Forum: General discussions

---

**Last Updated:** 2025-10-27
**Version:** 1.0.0
**Author:** B2B Platform Team
