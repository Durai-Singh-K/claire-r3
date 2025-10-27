import { FILE_LIMITS } from '../config/constants';

// Audio validation
export const validateAudio = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('Please select an audio file');
    return { isValid: false, errors };
  }
  
  // Check file type
  if (!FILE_LIMITS.AUDIO.ACCEPTED_TYPES.includes(file.type)) {
    errors.push('Please select a valid audio file (WAV, MP3, MP4, WebM, or OGG)');
  }
  
  // Check file size
  if (file.size > FILE_LIMITS.AUDIO.MAX_SIZE) {
    const maxSizeMB = FILE_LIMITS.AUDIO.MAX_SIZE / (1024 * 1024);
    errors.push(`Audio file size must be less than ${maxSizeMB}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get audio duration
export const getAudioDuration = (file) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio file'));
    });
    
    audio.src = url;
  });
};

// Create audio waveform data
export const createWaveform = (audioBuffer, samples = 100) => {
  const channelData = audioBuffer.getChannelData(0);
  const waveform = [];
  const blockSize = Math.floor(channelData.length / samples);
  
  for (let i = 0; i < samples; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[i * blockSize + j]);
    }
    waveform.push(sum / blockSize);
  }
  
  // Normalize to 0-1 range
  const maxValue = Math.max(...waveform);
  if (maxValue > 0) {
    return waveform.map(value => value / maxValue);
  }
  
  return waveform;
};

// Audio recording class
export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.stream = null;
    this.chunks = [];
    this.isRecording = false;
    this.isPaused = false;
    this.startTime = null;
    this.pauseTime = 0;
  }
  
  async initialize(constraints = { audio: true }) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Determine the best MIME type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  start() {
    if (!this.mediaRecorder) {
      throw new Error('Recorder not initialized');
    }
    
    if (this.isRecording) {
      return;
    }
    
    this.chunks = [];
    this.startTime = Date.now();
    this.pauseTime = 0;
    this.isRecording = true;
    this.isPaused = false;
    
    this.mediaRecorder.start(1000); // Collect data every second
  }
  
  pause() {
    if (!this.mediaRecorder || !this.isRecording || this.isPaused) {
      return;
    }
    
    this.mediaRecorder.pause();
    this.isPaused = true;
    this.pauseTime += Date.now();
  }
  
  resume() {
    if (!this.mediaRecorder || !this.isRecording || !this.isPaused) {
      return;
    }
    
    this.mediaRecorder.resume();
    this.isPaused = false;
    this.pauseTime -= Date.now();
  }
  
  stop() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { 
          type: this.mediaRecorder.mimeType 
        });
        
        const duration = (Date.now() - this.startTime - this.pauseTime) / 1000;
        
        const audioFile = new File(
          [blob], 
          `recording_${Date.now()}.${this.getFileExtension()}`, 
          { 
            type: this.mediaRecorder.mimeType,
            lastModified: Date.now()
          }
        );
        
        this.isRecording = false;
        this.isPaused = false;
        
        resolve({
          file: audioFile,
          duration,
          size: blob.size,
          mimeType: this.mediaRecorder.mimeType
        });
      };
      
      this.mediaRecorder.onerror = reject;
      this.mediaRecorder.stop();
    });
  }
  
  cancel() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.chunks = [];
      this.isRecording = false;
      this.isPaused = false;
    }
  }
  
  getDuration() {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime - this.pauseTime) / 1000;
  }
  
  getFileExtension() {
    const mimeType = this.mediaRecorder?.mimeType || '';
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('wav')) return 'wav';
    return 'webm';
  }
  
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.chunks = [];
    this.isRecording = false;
    this.isPaused = false;
  }
}

// Audio player class
export class AudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.isPlaying = false;
    this.isPaused = false;
    this.duration = 0;
    this.currentTime = 0;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.audio.addEventListener('loadedmetadata', () => {
      this.duration = this.audio.duration;
      this.onMetadataLoaded?.(this.duration);
    });
    
    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio.currentTime;
      this.onTimeUpdate?.(this.currentTime, this.duration);
    });
    
    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.onEnded?.();
    });
    
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.isPaused = false;
      this.onPlay?.();
    });
    
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.isPaused = true;
      this.onPause?.();
    });
    
    this.audio.addEventListener('error', (error) => {
      this.onError?.(error);
    });
  }
  
  async load(source) {
    try {
      if (source instanceof File) {
        this.audio.src = URL.createObjectURL(source);
      } else if (typeof source === 'string') {
        this.audio.src = source;
      } else {
        throw new Error('Invalid audio source');
      }
      
      await new Promise((resolve, reject) => {
        this.audio.addEventListener('loadedmetadata', resolve, { once: true });
        this.audio.addEventListener('error', reject, { once: true });
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  play() {
    if (!this.audio.src) {
      throw new Error('No audio source loaded');
    }
    
    return this.audio.play();
  }
  
  pause() {
    this.audio.pause();
  }
  
  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
  
  seek(time) {
    if (time >= 0 && time <= this.duration) {
      this.audio.currentTime = time;
    }
  }
  
  setVolume(volume) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }
  
  setPlaybackRate(rate) {
    this.audio.playbackRate = Math.max(0.25, Math.min(4, rate));
  }
  
  getProgress() {
    return this.duration > 0 ? this.currentTime / this.duration : 0;
  }
  
  cleanup() {
    this.audio.pause();
    this.audio.src = '';
    this.audio = null;
  }
  
  // Event handlers (to be overridden)
  onMetadataLoaded = null;
  onTimeUpdate = null;
  onEnded = null;
  onPlay = null;
  onPause = null;
  onError = null;
}

// Audio utilities
export const createAudioVisualization = (audioFile, options = {}) => {
  const { 
    canvasWidth = 300, 
    canvasHeight = 100, 
    barCount = 50,
    barColor = '#3B82F6',
    backgroundColor = 'transparent'
  } = options;
  
  return new Promise(async (resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const waveform = createWaveform(audioBuffer, barCount);
      
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      
      // Fill background
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
      
      // Draw bars
      ctx.fillStyle = barColor;
      const barWidth = canvasWidth / barCount;
      
      waveform.forEach((value, index) => {
        const barHeight = value * canvasHeight * 0.8; // 80% of canvas height
        const x = index * barWidth;
        const y = (canvasHeight - barHeight) / 2;
        
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      });
      
      canvas.toBlob(resolve, 'image/png');
      
    } catch (error) {
      reject(error);
    }
  });
};

export const convertAudioFormat = (file, targetFormat = 'mp3') => {
  return new Promise(async (resolve, reject) => {
    try {
      // This is a simplified version - in production, you'd use a service
      // or library like FFmpeg.js for proper audio conversion
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create offline context for rendering
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();
      
      const renderedBuffer = await offlineContext.startRendering();
      
      // Convert to WAV (simplified - only format we can easily create)
      const wavBlob = audioBufferToWav(renderedBuffer);
      
      const convertedFile = new File(
        [wavBlob],
        file.name.replace(/\.[^/.]+$/, '.wav'),
        { type: 'audio/wav' }
      );
      
      resolve(convertedFile);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Convert AudioBuffer to WAV
export const audioBufferToWav = (buffer) => {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

// Trim audio
export const trimAudio = (file, startTime, endTime) => {
  return new Promise(async (resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const newLength = endSample - startSample;
      
      const newBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        newLength,
        sampleRate
      );
      
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const oldData = audioBuffer.getChannelData(channel);
        const newData = newBuffer.getChannelData(channel);
        
        for (let i = 0; i < newLength; i++) {
          newData[i] = oldData[startSample + i];
        }
      }
      
      const trimmedBlob = audioBufferToWav(newBuffer);
      const trimmedFile = new File(
        [trimmedBlob],
        `trimmed_${file.name}`,
        { type: 'audio/wav' }
      );
      
      resolve(trimmedFile);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Get audio metadata
export const getAudioMetadata = async (file) => {
  try {
    const duration = await getAudioDuration(file);
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      duration,
      lastModified: new Date(file.lastModified),
      isShort: duration < 30, // Less than 30 seconds
      isMedium: duration >= 30 && duration < 300, // 30 seconds to 5 minutes
      isLong: duration >= 300 // More than 5 minutes
    };
  } catch (error) {
    throw new Error('Failed to get audio metadata');
  }
};

export default {
  validateAudio,
  getAudioDuration,
  createWaveform,
  AudioRecorder,
  AudioPlayer,
  createAudioVisualization,
  convertAudioFormat,
  audioBufferToWav,
  trimAudio,
  getAudioMetadata
};
