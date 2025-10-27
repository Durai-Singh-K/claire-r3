import { useState, useEffect, useRef, useCallback } from 'react';
import { validateImage, validateAudio } from '../utils/imageUtils';
import { AudioRecorder } from '../utils/audioUtils';

// Hook for file upload with drag and drop
export const useFileUpload = (options = {}) => {
  const {
    accept = '*/*',
    multiple = false,
    maxSize = 10 * 1024 * 1024, // 10MB
    onFileSelect,
    onError,
    validator
  } = options;

  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const validateFile = useCallback((file) => {
    // Basic validation
    if (maxSize && file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
    }

    // Check accept types
    if (accept !== '*/*' && accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type.replace('*', '.*'));
      });

      if (!isAccepted) {
        return { isValid: false, error: 'File type not allowed' };
      }
    }

    // Custom validator
    if (validator) {
      return validator(file);
    }

    return { isValid: true };
  }, [accept, maxSize, validator]);

  const processFiles = useCallback((fileList) => {
    const newFiles = Array.from(fileList);
    const validFiles = [];
    const errors = [];

    newFiles.forEach((file, index) => {
      const validation = validateFile(file);
      if (validation.isValid) {
        const fileWithId = {
          ...file,
          id: Date.now() + index,
          preview: null,
          progress: 0
        };
        validFiles.push(fileWithId);
      } else {
        errors.push({ file: file.name, error: validation.error });
      }
    });

    if (multiple) {
      setFiles(prev => [...prev, ...validFiles]);
    } else {
      setFiles(validFiles.slice(0, 1));
    }

    if (validFiles.length > 0 && onFileSelect) {
      onFileSelect(multiple ? validFiles : validFiles[0]);
    }

    if (errors.length > 0 && onError) {
      onError(errors);
    }
  }, [multiple, validateFile, onFileSelect, onError]);

  const selectFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setUploadProgress({});
  }, []);

  const handleFileInputChange = useCallback((event) => {
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      processFiles(fileList);
    }
    // Clear input value to allow selecting the same file again
    event.target.value = '';
  }, [processFiles]);

  // Drag and drop handlers
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);

    const fileList = event.dataTransfer.files;
    if (fileList && fileList.length > 0) {
      processFiles(fileList);
    }
  }, [processFiles]);

  // Upload progress tracking
  const updateProgress = useCallback((fileId, progress) => {
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: progress
    }));
  }, []);

  return {
    files,
    isDragging,
    isUploading,
    uploadProgress,
    fileInputRef,
    selectFiles,
    removeFile,
    clearFiles,
    updateProgress,
    setIsUploading,
    dragHandlers: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop
    },
    inputProps: {
      ref: fileInputRef,
      type: 'file',
      accept,
      multiple,
      onChange: handleFileInputChange,
      style: { display: 'none' }
    }
  };
};

// Hook for image upload with preview
export const useImageUpload = (options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    onImageSelect,
    onError,
    generatePreview = true
  } = options;

  const fileUpload = useFileUpload({
    accept: 'image/*',
    maxSize,
    validator: validateImage,
    onFileSelect: onImageSelect,
    onError
  });

  const [previews, setPreviews] = useState({});

  // Generate preview URLs for images
  useEffect(() => {
    if (!generatePreview) return;

    const generatePreviews = async () => {
      const newPreviews = {};

      for (const file of fileUpload.files) {
        if (file.type.startsWith('image/') && !previews[file.id]) {
          try {
            const previewUrl = URL.createObjectURL(file);
            newPreviews[file.id] = previewUrl;
          } catch (error) {
            console.error('Error generating preview:', error);
          }
        }
      }

      if (Object.keys(newPreviews).length > 0) {
        setPreviews(prev => ({ ...prev, ...newPreviews }));
      }
    };

    generatePreviews();
  }, [fileUpload.files, generatePreview, previews]);

  // Cleanup preview URLs when files are removed
  useEffect(() => {
    const fileIds = new Set(fileUpload.files.map(file => file.id));
    const previewIds = Object.keys(previews);

    previewIds.forEach(id => {
      if (!fileIds.has(parseInt(id))) {
        URL.revokeObjectURL(previews[id]);
        setPreviews(prev => {
          const { [id]: removed, ...rest } = prev;
          return rest;
        });
      }
    });
  }, [fileUpload.files, previews]);

  const getPreview = useCallback((fileId) => {
    return previews[fileId];
  }, [previews]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  return {
    ...fileUpload,
    previews,
    getPreview
  };
};

// Hook for audio recording
export const useAudioRecorder = (options = {}) => {
  const {
    onRecordingComplete,
    onError,
    maxDuration = 300, // 5 minutes
    visualize = false
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);

  const recorderRef = useRef(null);
  const intervalRef = useRef(null);

  // Initialize recorder
  const initializeRecorder = useCallback(async () => {
    try {
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorder();
      }

      const result = await recorderRef.current.initialize();
      if (!result.success) {
        throw new Error(result.error);
      }

      setError(null);
      return true;
    } catch (err) {
      const errorMessage = err.name === 'NotAllowedError' 
        ? 'Microphone access denied'
        : err.message || 'Failed to initialize recorder';
      
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    }
  }, [onError]);

  // Start recording
  const startRecording = useCallback(async () => {
    const initialized = await initializeRecorder();
    if (!initialized) return;

    try {
      recorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setAudioBlob(null);

      // Update duration timer
      intervalRef.current = setInterval(() => {
        const currentDuration = recorderRef.current.getDuration();
        setDuration(currentDuration);

        // Auto-stop at max duration
        if (currentDuration >= maxDuration) {
          stopRecording();
        }
      }, 100);

    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    }
  }, [initializeRecorder, maxDuration, onError]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (recorderRef.current && isRecording && !isPaused) {
      recorderRef.current.pause();
      setIsPaused(true);
      clearInterval(intervalRef.current);
    }
  }, [isRecording, isPaused]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (recorderRef.current && isRecording && isPaused) {
      recorderRef.current.resume();
      setIsPaused(false);

      // Resume duration timer
      intervalRef.current = setInterval(() => {
        const currentDuration = recorderRef.current.getDuration();
        setDuration(currentDuration);

        if (currentDuration >= maxDuration) {
          stopRecording();
        }
      }, 100);
    }
  }, [isRecording, isPaused, maxDuration]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || !isRecording) return;

    try {
      const result = await recorderRef.current.stop();
      
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(intervalRef.current);

      if (result && result.file) {
        setAudioBlob(result.file);
        onRecordingComplete?.(result);
      }

    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    }
  }, [isRecording, onRecordingComplete, onError]);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.cancel();
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      setAudioBlob(null);
      clearInterval(intervalRef.current);
    }
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cleanup();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    canRecord: !error,
    isActive: isRecording && !isPaused,
    durationFormatted: `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`
  };
};

// Hook for audio playback
export const useAudioPlayer = (audioSource) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleError = (e) => setError(e.target.error?.message || 'Playback error');

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Update audio source
  useEffect(() => {
    if (audioRef.current && audioSource) {
      const audio = audioRef.current;
      
      if (audioSource instanceof File || audioSource instanceof Blob) {
        audio.src = URL.createObjectURL(audioSource);
      } else if (typeof audioSource === 'string') {
        audio.src = audioSource;
      }

      return () => {
        if (audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audio.src);
        }
      };
    }
  }, [audioSource]);

  // Control functions
  const play = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current && time >= 0 && time <= duration) {
      audioRef.current.currentTime = time;
    }
  }, [duration]);

  const changeVolume = useCallback((newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  const changePlaybackRate = useCallback((rate) => {
    const clampedRate = Math.max(0.25, Math.min(4, rate));
    setPlaybackRate(clampedRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = clampedRate;
    }
  }, []);

  // Apply volume and playback rate changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    error,
    play,
    pause,
    stop,
    seek,
    changeVolume,
    changePlaybackRate,
    progress: duration > 0 ? currentTime / duration : 0,
    formattedCurrentTime: `${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}`,
    formattedDuration: `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`,
    canPlay: Boolean(audioSource && !error)
  };
};

export default useFileUpload;
