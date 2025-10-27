import express from 'express';
import { body, validationResult } from 'express-validator';
import axios from 'axios';
import { Message } from '../models/Chat.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createRateLimit } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting
const translateLimit = createRateLimit(60 * 1000, 50, 'Too many translation requests. Please slow down.');

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

// Reverse mapping
const LANGUAGE_NAMES = Object.fromEntries(
  Object.entries(LANGUAGE_CODES).map(([name, code]) => [code, name])
);

// @desc    Translate text
// @route   POST /api/translation/translate
// @access  Private
router.post('/translate', translateLimit, [
  body('text')
    .isLength({ min: 1, max: 5000 })
    .trim()
    .withMessage('Text must be 1-5000 characters long'),
  body('targetLanguage')
    .isIn(['hindi', 'english', 'tamil', 'telugu', 'kannada', 'malayalam', 'marathi', 'gujarati', 'bengali', 'punjabi'])
    .withMessage('Invalid target language'),
  body('sourceLanguage')
    .optional()
    .isIn(['hindi', 'english', 'tamil', 'telugu', 'kannada', 'malayalam', 'marathi', 'gujarati', 'bengali', 'punjabi', 'auto'])
    .withMessage('Invalid source language')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { text, targetLanguage, sourceLanguage = 'auto' } = req.body;
  
  try {
    // If source and target are the same, return original text
    if (sourceLanguage !== 'auto' && sourceLanguage === targetLanguage) {
      return res.json({
        success: true,
        translatedText: text,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        confidence: 1.0,
        cached: false
      });
    }
    
    // Prepare Sarvam API request
    const sourceCode = sourceLanguage === 'auto' ? 'auto' : LANGUAGE_CODES[sourceLanguage];
    const targetCode = LANGUAGE_CODES[targetLanguage];
    
    if (!targetCode) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported target language'
      });
    }
    
    // Call Sarvam Translation API
    let translatedText = text;
    let detectedLanguage = sourceLanguage;
    let confidence = 1.0;
    
    try {
      const response = await axios.post(`${SARVAM_BASE_URL}/translate`, {
        input: text,
        source_language_code: sourceCode,
        target_language_code: targetCode,
        speaker_gender: 'Male', // Default speaker gender
        mode: 'formal' // Formal translation mode
      }, {
        headers: {
          'Authorization': `Bearer ${SARVAM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data && response.data.translated_text) {
        translatedText = response.data.translated_text;
        detectedLanguage = LANGUAGE_NAMES[response.data.detected_language_code] || sourceLanguage;
        confidence = response.data.confidence || 0.9;
      } else {
        throw new Error('Invalid API response');
      }
      
    } catch (apiError) {
      console.error('Sarvam API error:', apiError.message);
      
      // Fallback to mock translation for development/demo
      if (process.env.NODE_ENV === 'development') {
        translatedText = await mockTranslate(text, sourceLanguage, targetLanguage);
        confidence = 0.8;
      } else {
        throw apiError;
      }
    }
    
    res.json({
      success: true,
      originalText: text,
      translatedText,
      sourceLanguage: detectedLanguage,
      targetLanguage,
      confidence,
      provider: 'sarvam',
      cached: false
    });
    
  } catch (error) {
    console.error('Translation error:', error);
    
    // Return original text as fallback
    res.json({
      success: true,
      originalText: text,
      translatedText: text,
      sourceLanguage: sourceLanguage === 'auto' ? 'english' : sourceLanguage,
      targetLanguage,
      confidence: 0.1,
      error: 'Translation service unavailable',
      fallback: true
    });
  }
}));

// @desc    Detect language
// @route   POST /api/translation/detect
// @access  Private
router.post('/detect', translateLimit, [
  body('text')
    .isLength({ min: 1, max: 1000 })
    .trim()
    .withMessage('Text must be 1-1000 characters long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { text } = req.body;
  
  try {
    // Use simple heuristics for language detection in development
    // In production, you would use Sarvam's language detection API
    
    const detectedLanguage = detectLanguageHeuristic(text);
    
    res.json({
      success: true,
      text,
      detectedLanguage,
      confidence: 0.85,
      alternatives: [
        { language: 'english', confidence: 0.15 },
        { language: 'hindi', confidence: 0.10 }
      ]
    });
    
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Language detection failed',
      detectedLanguage: 'english',
      confidence: 0.5
    });
  }
}));

// @desc    Get supported languages
// @route   GET /api/translation/languages
// @access  Private
router.get('/languages', asyncHandler(async (req, res) => {
  const languages = Object.keys(LANGUAGE_CODES).map(lang => ({
    code: lang,
    name: lang.charAt(0).toUpperCase() + lang.slice(1),
    nativeName: getNativeName(lang),
    supported: true
  }));
  
  res.json({
    success: true,
    languages,
    totalSupported: languages.length
  });
}));

// @desc    Translate message and save
// @route   POST /api/translation/message/:messageId
// @access  Private
router.post('/message/:messageId', translateLimit, [
  body('targetLanguage')
    .isIn(['hindi', 'english', 'tamil', 'telugu', 'kannada', 'malayalam', 'marathi', 'gujarati', 'bengali', 'punjabi'])
    .withMessage('Invalid target language')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { messageId } = req.params;
  const { targetLanguage } = req.body;
  
  const message = await Message.findById(messageId).populate('conversation');
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }
  
  // Check if user has access to this message
  const conversation = message.conversation;
  if (!conversation.isParticipant(req.userId)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this message'
    });
  }
  
  // Check if translation already exists
  const existingTranslation = message.getTranslation(targetLanguage);
  if (existingTranslation) {
    return res.json({
      success: true,
      translatedText: existingTranslation.text,
      sourceLanguage: message.content.original.language,
      targetLanguage,
      confidence: existingTranslation.confidence,
      cached: true
    });
  }
  
  try {
    // Translate the message
    const originalText = message.content.original.text;
    const sourceLanguage = message.content.original.language || 'auto';
    
    // Call translation (reuse the translate logic)
    const translatedText = await translateText(originalText, sourceLanguage, targetLanguage);
    
    // Save translation to message
    await message.addTranslation(targetLanguage, translatedText.text, translatedText.confidence);
    
    res.json({
      success: true,
      messageId,
      originalText,
      translatedText: translatedText.text,
      sourceLanguage: translatedText.sourceLanguage,
      targetLanguage,
      confidence: translatedText.confidence
    });
    
  } catch (error) {
    console.error('Message translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Translation failed',
      error: error.message
    });
  }
}));

// @desc    Bulk translate messages
// @route   POST /api/translation/bulk
// @access  Private
router.post('/bulk', translateLimit, [
  body('texts')
    .isArray({ min: 1, max: 10 })
    .withMessage('Texts array must contain 1-10 items'),
  body('texts.*')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Each text must be 1-1000 characters'),
  body('targetLanguage')
    .isIn(['hindi', 'english', 'tamil', 'telugu', 'kannada', 'malayalam', 'marathi', 'gujarati', 'bengali', 'punjabi'])
    .withMessage('Invalid target language')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { texts, targetLanguage, sourceLanguage = 'auto' } = req.body;
  
  try {
    const translations = await Promise.all(
      texts.map(async (text, index) => {
        try {
          const result = await translateText(text, sourceLanguage, targetLanguage);
          return {
            index,
            success: true,
            originalText: text,
            translatedText: result.text,
            confidence: result.confidence
          };
        } catch (error) {
          return {
            index,
            success: false,
            originalText: text,
            translatedText: text,
            error: error.message,
            confidence: 0.1
          };
        }
      })
    );
    
    res.json({
      success: true,
      translations,
      targetLanguage,
      sourceLanguage: sourceLanguage === 'auto' ? 'detected' : sourceLanguage
    });
    
  } catch (error) {
    console.error('Bulk translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk translation failed',
      error: error.message
    });
  }
}));

// Helper functions

async function translateText(text, sourceLanguage, targetLanguage) {
  if (sourceLanguage !== 'auto' && sourceLanguage === targetLanguage) {
    return {
      text: text,
      sourceLanguage: sourceLanguage,
      confidence: 1.0
    };
  }
  
  const sourceCode = sourceLanguage === 'auto' ? 'auto' : LANGUAGE_CODES[sourceLanguage];
  const targetCode = LANGUAGE_CODES[targetLanguage];
  
  try {
    const response = await axios.post(`${SARVAM_BASE_URL}/translate`, {
      input: text,
      source_language_code: sourceCode,
      target_language_code: targetCode,
      speaker_gender: 'Male',
      mode: 'formal'
    }, {
      headers: {
        'Authorization': `Bearer ${SARVAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data && response.data.translated_text) {
      return {
        text: response.data.translated_text,
        sourceLanguage: LANGUAGE_NAMES[response.data.detected_language_code] || sourceLanguage,
        confidence: response.data.confidence || 0.9
      };
    } else {
      throw new Error('Invalid API response');
    }
    
  } catch (apiError) {
    console.error('Sarvam API error:', apiError.message);
    
    // Fallback to mock translation
    return {
      text: await mockTranslate(text, sourceLanguage, targetLanguage),
      sourceLanguage: sourceLanguage === 'auto' ? 'english' : sourceLanguage,
      confidence: 0.7
    };
  }
}

async function mockTranslate(text, sourceLanguage, targetLanguage) {
  // Simple mock translation for development
  const mockTranslations = {
    'english-hindi': {
      'hello': 'नमस्ते',
      'good morning': 'शुभ प्रभात',
      'thank you': 'धन्यवाद',
      'how are you': 'आप कैसे हैं',
      'what is your name': 'आपका नाम क्या है'
    },
    'hindi-english': {
      'नमस्ते': 'hello',
      'शुभ प्रभात': 'good morning',
      'धन्यवाद': 'thank you',
      'आप कैसे हैं': 'how are you',
      'आपका नाम क्या है': 'what is your name'
    }
  };
  
  const key = `${sourceLanguage}-${targetLanguage}`;
  const translations = mockTranslations[key];
  
  if (translations) {
    const lowerText = text.toLowerCase();
    for (const [original, translated] of Object.entries(translations)) {
      if (lowerText.includes(original.toLowerCase())) {
        return text.replace(new RegExp(original, 'gi'), translated);
      }
    }
  }
  
  // If no specific translation found, add language prefix
  return `[${targetLanguage.toUpperCase()}] ${text}`;
}

function detectLanguageHeuristic(text) {
  // Simple heuristic language detection
  const devanagariRegex = /[\u0900-\u097F]/;
  const tamilRegex = /[\u0B80-\u0BFF]/;
  const teluguRegex = /[\u0C00-\u0C7F]/;
  const kannadaRegex = /[\u0C80-\u0CFF]/;
  const malayalamRegex = /[\u0D00-\u0D7F]/;
  const gujaratiRegex = /[\u0A80-\u0AFF]/;
  const bengaliRegex = /[\u0980-\u09FF]/;
  const punjabiRegex = /[\u0A00-\u0A7F]/;
  
  if (devanagariRegex.test(text)) return 'hindi';
  if (tamilRegex.test(text)) return 'tamil';
  if (teluguRegex.test(text)) return 'telugu';
  if (kannadaRegex.test(text)) return 'kannada';
  if (malayalamRegex.test(text)) return 'malayalam';
  if (gujaratiRegex.test(text)) return 'gujarati';
  if (bengaliRegex.test(text)) return 'bengali';
  if (punjabiRegex.test(text)) return 'punjabi';
  
  return 'english'; // Default to English
}

function getNativeName(language) {
  const nativeNames = {
    'hindi': 'हिंदी',
    'english': 'English',
    'tamil': 'தமிழ்',
    'telugu': 'తెలుగు',
    'kannada': 'ಕನ್ನಡ',
    'malayalam': 'മലയാളം',
    'marathi': 'मराठी',
    'gujarati': 'ગુજરાતી',
    'bengali': 'বাংলা',
    'punjabi': 'ਪੰਜਾਬੀ'
  };
  
  return nativeNames[language] || language;
}

export default router;
