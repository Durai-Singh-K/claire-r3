import axios from 'axios';

const SARVAM_API_BASE_URL = 'https://api.sarvam.ai';
const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY || '';

// Create axios instance for Sarvam AI
const sarvamAPI = axios.create({
  baseURL: SARVAM_API_BASE_URL,
  timeout: 60000, // 60 seconds for audio processing
  headers: {
    'api-subscription-key': SARVAM_API_KEY,
  },
});

/**
 * Sarvam AI Service
 * Provides speech-to-text and translation services for Indian languages
 */
class SarvamAIService {
  /**
   * Convert Tamil speech to English text directly
   * Uses Sarvam's Saaras model for automatic language detection and translation
   *
   * @param {Blob} audioBlob - Audio blob from MediaRecorder
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Transcription and translation result
   */
  async translateSpeechToEnglish(audioBlob, options = {}) {
    try {
      // Check if API key is configured
      if (!this.isConfigured()) {
        throw new Error('Sarvam API key is not configured. Add VITE_SARVAM_API_KEY to your .env file.');
      }

      const formData = new FormData();

      // Convert blob to proper audio format if needed
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      formData.append('file', audioFile);

      // Use Saaras v2 model for speech-to-text translation
      formData.append('model', options.model || 'saaras:v2');

      // Optional: Add prompt for better context
      if (options.prompt) {
        formData.append('prompt', options.prompt);
      }

      console.log('Sending audio to Sarvam AI:', {
        size: audioBlob.size,
        type: audioBlob.type,
        model: options.model || 'saaras:v2'
      });

      const response = await sarvamAPI.post('/speech-to-text-translate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Sarvam AI Response:', response.data);

      return {
        success: true,
        translatedText: response.data.transcript,
        detectedLanguage: response.data.language_code,
        requestId: response.data.request_id,
        diarizedTranscript: response.data.diarized_transcript,
      };
    } catch (error) {
      console.error('Sarvam AI Speech Translation Error:', error);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);

      let errorMessage = 'Translation failed';

      if (error.code === 'ERR_NETWORK' || error.message.includes('timeout')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'Invalid API key. Please check your Sarvam AI configuration.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid audio format or request. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        errorDetails: error.response?.data,
        errorCode: error.response?.status,
      };
    }
  }

  /**
   * Transcribe Tamil speech to Tamil text (without translation)
   *
   * @param {Blob} audioBlob - Audio blob from MediaRecorder
   * @param {String} languageCode - Language code (default: 'ta-IN' for Tamil)
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeSpeech(audioBlob, languageCode = 'ta-IN') {
    try {
      const formData = new FormData();

      formData.append('file', audioBlob, 'recording.webm');
      formData.append('language_code', languageCode);
      formData.append('model', 'saaras:v1');

      const response = await sarvamAPI.post('/speech-to-text', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        transcript: response.data.transcript,
        languageCode: response.data.language_code,
        requestId: response.data.request_id,
      };
    } catch (error) {
      console.error('Sarvam AI Speech Transcription Error:', error);

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Transcription failed',
      };
    }
  }

  /**
   * Translate text from Tamil to English
   *
   * @param {String} text - Tamil text to translate
   * @param {String} sourceLanguage - Source language code (default: 'ta-IN')
   * @param {String} targetLanguage - Target language code (default: 'en-IN')
   * @returns {Promise<Object>} Translation result
   */
  async translateText(text, sourceLanguage = 'ta-IN', targetLanguage = 'en-IN') {
    try {
      const response = await sarvamAPI.post('/translate', {
        input: text,
        source_language_code: sourceLanguage,
        target_language_code: targetLanguage,
        speaker_gender: 'Male', // Optional
        mode: 'formal', // or 'informal'
        model: 'mayura:v1',
        enable_preprocessing: true,
      });

      return {
        success: true,
        translatedText: response.data.translated_text,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
      };
    } catch (error) {
      console.error('Sarvam AI Text Translation Error:', error);

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Translation failed',
      };
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!SARVAM_API_KEY && SARVAM_API_KEY !== '';
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return [
      { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी' },
      { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
      { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
      { code: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
      { code: 'en-IN', name: 'English', nativeName: 'English' },
    ];
  }
}

export default new SarvamAIService();
