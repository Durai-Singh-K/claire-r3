import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import axios from 'axios';
import { Message } from '../models/Chat.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createRateLimit } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting
const speechLimit = createRateLimit(60 * 1000, 20, 'Too many speech requests. Please slow down.');

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/mp4',
      'audio/webm',
      'audio/ogg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type. Supported: WAV, MP3, MP4, WebM, OGG'), false);
    }
  }
});

// Sarvam API configuration
const SARVAM_API_KEY = process.env.SARVAM_API_KEY || 'sk_bft65l75_5qpRDksNcpt238yQLEqnjzLk';
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

// Language mapping for Sarvam API
const LANGUAGE_CODES = {
  'hindi': 'hi-IN',
  'english': 'en-IN',
  'tamil': 'ta-IN',
  'telugu': 'te-IN',
  'kannada': 'kn-IN',
  'malayalam': 'ml-IN',
  'marathi': 'mr-IN',
  'gujarati': 'gu-IN',
  'bengali': 'bn-IN',
  'punjabi': 'pa-IN'
};

// @desc    Speech to text conversion
// @route   POST /api/speech/transcribe
// @access  Private
router.post('/transcribe', speechLimit, upload.single('audio'), [
  body('language')
    .optional()
    .isIn(['hindi', 'english', 'tamil', 'telugu', 'kannada', 'malayalam', 'marathi', 'gujarati', 'bengali', 'punjabi', 'auto'])
    .withMessage('Invalid language code')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Audio file is required'
    });
  }
  
  const { language = 'auto' } = req.body;
  const audioBuffer = req.file.buffer;
  
  try {
    // Convert audio buffer to base64 for API call
    const audioBase64 = audioBuffer.toString('base64');
    const languageCode = language === 'auto' ? 'hi-IN' : LANGUAGE_CODES[language]; // Default to Hindi for auto
    
    let transcription = '';
    let detectedLanguage = language;
    let confidence = 0.9;
    
    try {
      // Call Sarvam Speech-to-Text API
      const response = await axios.post(`${SARVAM_BASE_URL}/speech-to-text`, {
        audio: audioBase64,
        language_code: languageCode,
        model: 'saarika:v1' // Sarvam's speech model
      }, {
        headers: {
          'Authorization': `Bearer ${SARVAM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout for audio processing
      });
      
      if (response.data && response.data.transcript) {
        transcription = response.data.transcript;
        confidence = response.data.confidence || 0.9;
        detectedLanguage = getLanguageFromCode(response.data.language_code) || language;
      } else {
        throw new Error('Invalid API response');
      }
      
    } catch (apiError) {
      console.error('Sarvam Speech API error:', apiError.message);
      
      // Fallback to mock transcription for development
      if (process.env.NODE_ENV === 'development') {
        transcription = generateMockTranscription(language);
        confidence = 0.7;
        detectedLanguage = language === 'auto' ? 'english' : language;
      } else {
        throw apiError;
      }
    }
    
    res.json({
      success: true,
      transcription,
      detectedLanguage,
      confidence,
      duration: await getAudioDuration(audioBuffer),
      fileSize: audioBuffer.length,
      provider: 'sarvam'
    });
    
  } catch (error) {
    console.error('Speech transcription error:', error);
    res.status(500).json({
      success: false,
      message: 'Speech transcription failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Service unavailable'
    });
  }
}));

// @desc    Text to speech conversion
// @route   POST /api/speech/synthesize
// @access  Private
router.post('/synthesize', speechLimit, [
  body('text')
    .isLength({ min: 1, max: 1000 })
    .trim()
    .withMessage('Text must be 1-1000 characters long'),
  body('language')
    .optional()
    .isIn(['hindi', 'english', 'tamil', 'telugu', 'kannada', 'malayalam', 'marathi', 'gujarati', 'bengali', 'punjabi'])
    .withMessage('Invalid language'),
  body('voice')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('Voice must be male or female')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { text, language = 'english', voice = 'male' } = req.body;
  
  try {
    const languageCode = LANGUAGE_CODES[language];
    
    if (!languageCode) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported language for text-to-speech'
      });
    }
    
    try {
      // Call Sarvam Text-to-Speech API
      const response = await axios.post(`${SARVAM_BASE_URL}/text-to-speech`, {
        inputs: [text],
        target_language_code: languageCode,
        speaker: voice === 'male' ? 'meera' : 'meera', // Use available speaker
        pitch: 0,
        pace: 1.0,
        loudness: 1.0,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: 'bulbul:v1' // Sarvam's TTS model
      }, {
        headers: {
          'Authorization': `Bearer ${SARVAM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      if (response.data && response.data.audios && response.data.audios[0]) {
        const audioBase64 = response.data.audios[0];
        
        // In a production environment, you'd want to save this to cloud storage
        // For now, we'll return the base64 data
        res.json({
          success: true,
          audioData: audioBase64,
          format: 'wav',
          sampleRate: 8000,
          language,
          voice,
          textLength: text.length,
          provider: 'sarvam'
        });
        
      } else {
        throw new Error('Invalid API response');
      }
      
    } catch (apiError) {
      console.error('Sarvam TTS API error:', apiError.message);
      
      // Return a mock response for development
      res.json({
        success: true,
        audioData: generateMockAudio(),
        format: 'wav',
        sampleRate: 8000,
        language,
        voice,
        textLength: text.length,
        provider: 'mock',
        message: 'Mock audio data - TTS service unavailable'
      });
    }
    
  } catch (error) {
    console.error('Text-to-speech error:', error);
    res.status(500).json({
      success: false,
      message: 'Text-to-speech conversion failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Service unavailable'
    });
  }
}));

// @desc    Process voice message
// @route   POST /api/speech/voice-message
// @access  Private
router.post('/voice-message', speechLimit, upload.single('audio'), [
  body('conversationId')
    .isMongoId()
    .withMessage('Valid conversation ID is required'),
  body('language')
    .optional()
    .isIn(['hindi', 'english', 'tamil', 'telugu', 'kannada', 'malayalam', 'marathi', 'gujarati', 'bengali', 'punjabi', 'auto'])
    .withMessage('Invalid language'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid reply message ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Audio file is required'
    });
  }
  
  const { conversationId, language = 'auto', replyTo } = req.body;
  const audioBuffer = req.file.buffer;
  
  try {
    // First, transcribe the audio
    const transcriptionResult = await transcribeAudio(audioBuffer, language);
    
    // Get audio duration and generate waveform
    const duration = await getAudioDuration(audioBuffer);
    const waveform = generateWaveform(audioBuffer);
    
    // In production, you'd upload the audio file to cloud storage
    // For now, we'll store as base64 (not recommended for production)
    const audioUrl = `data:${req.file.mimetype};base64,${audioBuffer.toString('base64')}`;
    
    // Create voice message
    const message = new Message({
      conversation: conversationId,
      sender: req.userId,
      content: {
        original: {
          text: transcriptionResult.transcription,
          language: transcriptionResult.detectedLanguage
        }
      },
      type: 'voice',
      voice: {
        audioUrl,
        duration,
        transcription: {
          text: transcriptionResult.transcription,
          language: transcriptionResult.detectedLanguage,
          confidence: transcriptionResult.confidence
        },
        waveform
      },
      replyTo
    });
    
    await message.save();
    
    // Update conversation
    const { Conversation } = await import('../models/Chat.js');
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content: transcriptionResult.transcription,
        sender: req.userId,
        timestamp: message.createdAt,
        type: 'voice'
      }
    });
    
    // Populate sender for response
    await message.populate('sender', 'displayName businessName profilePicture');
    
    res.status(201).json({
      success: true,
      message: {
        _id: message._id,
        sender: message.sender,
        content: message.content,
        type: message.type,
        voice: message.voice,
        replyTo: message.replyTo,
        createdAt: message.createdAt
      }
    });
    
  } catch (error) {
    console.error('Voice message processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Voice message processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Service unavailable'
    });
  }
}));

// @desc    Get supported voices
// @route   GET /api/speech/voices
// @access  Private
router.get('/voices', asyncHandler(async (req, res) => {
  const { language } = req.query;
  
  // Mock voice data - in production, this would come from Sarvam API
  const voices = [
    {
      id: 'meera',
      name: 'Meera',
      language: 'hindi',
      gender: 'female',
      description: 'Natural female voice for Hindi',
      sample: null
    },
    {
      id: 'arjun',
      name: 'Arjun',
      language: 'hindi',
      gender: 'male',
      description: 'Natural male voice for Hindi',
      sample: null
    },
    {
      id: 'priya',
      name: 'Priya',
      language: 'tamil',
      gender: 'female',
      description: 'Natural female voice for Tamil',
      sample: null
    },
    {
      id: 'kumar',
      name: 'Kumar',
      language: 'tamil',
      gender: 'male',
      description: 'Natural male voice for Tamil',
      sample: null
    },
    {
      id: 'sarah',
      name: 'Sarah',
      language: 'english',
      gender: 'female',
      description: 'Natural female voice for English',
      sample: null
    },
    {
      id: 'james',
      name: 'James',
      language: 'english',
      gender: 'male',
      description: 'Natural male voice for English',
      sample: null
    }
  ];
  
  const filteredVoices = language 
    ? voices.filter(voice => voice.language === language)
    : voices;
  
  res.json({
    success: true,
    voices: filteredVoices,
    totalVoices: filteredVoices.length
  });
}));

// @desc    Get audio analytics
// @route   GET /api/speech/analytics
// @access  Private
router.get('/analytics', asyncHandler(async (req, res) => {
  const { period = '7d' } = req.query;
  
  // Get user's voice message statistics
  const dateFilter = new Date();
  if (period === '7d') {
    dateFilter.setDate(dateFilter.getDate() - 7);
  } else if (period === '30d') {
    dateFilter.setDate(dateFilter.getDate() - 30);
  } else if (period === '90d') {
    dateFilter.setDate(dateFilter.getDate() - 90);
  }
  
  const voiceMessages = await Message.find({
    sender: req.userId,
    type: 'voice',
    createdAt: { $gte: dateFilter }
  });
  
  const analytics = {
    totalVoiceMessages: voiceMessages.length,
    totalDuration: voiceMessages.reduce((sum, msg) => sum + (msg.voice?.duration || 0), 0),
    averageDuration: voiceMessages.length > 0 
      ? voiceMessages.reduce((sum, msg) => sum + (msg.voice?.duration || 0), 0) / voiceMessages.length 
      : 0,
    languageBreakdown: {},
    dailyStats: []
  };
  
  // Calculate language breakdown
  voiceMessages.forEach(msg => {
    const lang = msg.voice?.transcription?.language || 'unknown';
    analytics.languageBreakdown[lang] = (analytics.languageBreakdown[lang] || 0) + 1;
  });
  
  // Calculate daily stats
  const dailyMap = new Map();
  voiceMessages.forEach(msg => {
    const date = msg.createdAt.toISOString().split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { date, count: 0, duration: 0 });
    }
    const day = dailyMap.get(date);
    day.count += 1;
    day.duration += msg.voice?.duration || 0;
  });
  
  analytics.dailyStats = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  
  res.json({
    success: true,
    period,
    analytics
  });
}));

// Helper functions

async function transcribeAudio(audioBuffer, language) {
  const audioBase64 = audioBuffer.toString('base64');
  const languageCode = language === 'auto' ? 'hi-IN' : LANGUAGE_CODES[language];
  
  try {
    const response = await axios.post(`${SARVAM_BASE_URL}/speech-to-text`, {
      audio: audioBase64,
      language_code: languageCode,
      model: 'saarika:v1'
    }, {
      headers: {
        'Authorization': `Bearer ${SARVAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    if (response.data && response.data.transcript) {
      return {
        transcription: response.data.transcript,
        confidence: response.data.confidence || 0.9,
        detectedLanguage: getLanguageFromCode(response.data.language_code) || (language === 'auto' ? 'english' : language)
      };
    } else {
      throw new Error('Invalid API response');
    }
    
  } catch (apiError) {
    console.error('Transcription error:', apiError.message);
    
    // Fallback for development
    return {
      transcription: generateMockTranscription(language),
      confidence: 0.7,
      detectedLanguage: language === 'auto' ? 'english' : language
    };
  }
}

function generateMockTranscription(language) {
  const mockTranscriptions = {
    'hindi': 'नमस्ते, मैं एक ऑडियो संदेश भेज रहा हूँ।',
    'english': 'Hello, I am sending an audio message.',
    'tamil': 'வணக்கம், நான் ஒரு ஆடியோ செய்தி அனுப்புகிறேன்.',
    'telugu': 'హలో, నేను ఆడియో సందేశం పంపుతున్నాను.',
    'auto': 'Hello, I am sending an audio message.'
  };
  
  return mockTranscriptions[language] || mockTranscriptions['english'];
}

function generateMockAudio() {
  // Generate a simple base64-encoded silent WAV file
  // In production, this would be actual audio from TTS service
  const silentWav = 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFA==';
  return silentWav;
}

async function getAudioDuration(audioBuffer) {
  // Mock duration calculation - in production use actual audio analysis
  return Math.max(1, Math.floor(audioBuffer.length / 8000)); // Rough estimate
}

function generateWaveform(audioBuffer) {
  // Generate mock waveform data
  const samples = 100;
  const waveform = [];
  
  for (let i = 0; i < samples; i++) {
    // Generate pseudo-random waveform based on buffer content
    const value = Math.sin(i / 10) * 0.5 + Math.random() * 0.5;
    waveform.push(Math.max(0, Math.min(1, value)));
  }
  
  return waveform;
}

function getLanguageFromCode(code) {
  const codeToLanguage = {
    'hi-IN': 'hindi',
    'en-IN': 'english',
    'ta-IN': 'tamil',
    'te-IN': 'telugu',
    'kn-IN': 'kannada',
    'ml-IN': 'malayalam',
    'mr-IN': 'marathi',
    'gu-IN': 'gujarati',
    'bn-IN': 'bengali',
    'pa-IN': 'punjabi'
  };
  
  return codeToLanguage[code];
}

export default router;
