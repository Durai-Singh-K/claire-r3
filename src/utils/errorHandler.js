import toast from 'react-hot-toast';

// Error code to user-friendly message mapping
export const ERROR_MESSAGES = {
  // Authentication Errors
  AUTHENTICATION_ERROR: 'Please login to continue',
  INVALID_TOKEN: 'Your session has expired. Please login again.',
  TOKEN_EXPIRED: 'Your session has expired. Please login again.',
  FIREBASE_AUTH_ERROR: 'Authentication failed. Please try again.',

  // Authorization Errors
  AUTHORIZATION_ERROR: 'You do not have permission to perform this action',
  ACCESS_DENIED: 'Access denied. Please check your permissions.',

  // Validation Errors
  VALIDATION_ERROR: 'Please check your input and try again',
  INVALID_ID: 'Invalid identifier provided',
  DUPLICATE_FIELD: 'This value already exists',

  // Resource Errors
  NOT_FOUND: 'The requested resource was not found',
  CONFLICT: 'This resource already exists',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please slow down and try again.',

  // File Upload Errors
  FILE_TOO_LARGE: 'File size exceeds the maximum limit of 50MB',
  INVALID_FILE_FIELD: 'Invalid file upload',
  INVALID_FILE_TYPE: 'File type not supported',

  // Payment Errors
  PAYMENT_FAILED: 'Payment failed. Please check your payment details.',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  CARD_DECLINED: 'Card declined. Please try another payment method.',

  // Subscription Errors
  SUBSCRIPTION_REQUIRED: 'This feature requires an active subscription',
  SUBSCRIPTION_EXPIRED: 'Your subscription has expired. Please renew to continue.',
  UPGRADE_REQUIRED: 'Please upgrade your plan to access this feature',

  // Network Errors
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  DATABASE_ERROR: 'Service temporarily unavailable. Please try again later.',

  // Server Errors
  INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service is currently unavailable. Please try again later.',

  // Default
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
};

// Get user-friendly error message
export const getErrorMessage = (errorCode, defaultMessage = null) => {
  return ERROR_MESSAGES[errorCode] || defaultMessage || ERROR_MESSAGES.UNKNOWN_ERROR;
};

// Parse API error response
export const parseApiError = (error) => {
  // Network error (no response)
  if (!error.response) {
    return {
      message: error.message === 'Network Error'
        ? ERROR_MESSAGES.NETWORK_ERROR
        : ERROR_MESSAGES.UNKNOWN_ERROR,
      code: 'NETWORK_ERROR',
      statusCode: null,
      details: null
    };
  }

  // API error response
  const { data, status } = error.response;

  // If response has our error format
  if (data && data.error) {
    return {
      message: data.error.message || getErrorMessage(data.error.code),
      code: data.error.code || 'UNKNOWN_ERROR',
      statusCode: data.error.statusCode || status,
      details: data.error.details || null,
      field: data.error.field || null
    };
  }

  // Fallback for non-standard responses
  return {
    message: data?.message || ERROR_MESSAGES.UNKNOWN_ERROR,
    code: 'UNKNOWN_ERROR',
    statusCode: status,
    details: null
  };
};

// Handle API error with toast notification
export const handleApiError = (error, options = {}) => {
  const {
    showToast = true,
    customMessage = null,
    onError = null,
    logToConsole = true
  } = options;

  const parsedError = parseApiError(error);

  // Log to console in development
  if (logToConsole && process.env.NODE_ENV === 'development') {
    console.error('API Error:', {
      original: error,
      parsed: parsedError
    });
  }

  // Show toast notification
  if (showToast) {
    const message = customMessage || parsedError.message;

    // Different toast types based on error code
    if (parsedError.statusCode === 401) {
      toast.error(message, {
        duration: 5000,
        icon: '🔒'
      });
    } else if (parsedError.statusCode === 403) {
      toast.error(message, {
        duration: 4000,
        icon: '⛔'
      });
    } else if (parsedError.statusCode === 404) {
      toast.error(message, {
        duration: 3000,
        icon: '🔍'
      });
    } else if (parsedError.statusCode >= 500) {
      toast.error(message, {
        duration: 5000,
        icon: '⚠️'
      });
    } else {
      toast.error(message, {
        duration: 4000
      });
    }
  }

  // Call custom error handler if provided
  if (onError && typeof onError === 'function') {
    onError(parsedError);
  }

  return parsedError;
};

// Validation error formatter
export const formatValidationErrors = (errors) => {
  if (!errors || !Array.isArray(errors)) return {};

  return errors.reduce((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
};

// Check if error is authentication error
export const isAuthError = (error) => {
  const parsed = parseApiError(error);
  return parsed.statusCode === 401 ||
         ['AUTHENTICATION_ERROR', 'INVALID_TOKEN', 'TOKEN_EXPIRED'].includes(parsed.code);
};

// Check if error requires page reload
export const requiresReload = (error) => {
  const parsed = parseApiError(error);
  return ['DATABASE_ERROR', 'SERVICE_UNAVAILABLE'].includes(parsed.code) ||
         parsed.statusCode === 503;
};

// Check if error is temporary (retry recommended)
export const isTemporaryError = (error) => {
  const parsed = parseApiError(error);
  return ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'DATABASE_ERROR', 'RATE_LIMIT_EXCEEDED'].includes(parsed.code);
};

// Get retry delay for temporary errors
export const getRetryDelay = (error, attemptNumber = 1) => {
  const parsed = parseApiError(error);

  if (parsed.code === 'RATE_LIMIT_EXCEEDED') {
    return 60000; // 1 minute
  }

  if (parsed.code === 'NETWORK_ERROR' || parsed.code === 'TIMEOUT_ERROR') {
    return Math.min(1000 * Math.pow(2, attemptNumber), 10000); // Exponential backoff, max 10s
  }

  return 3000; // Default 3 seconds
};

// Create error object for form validation
export const createFormError = (field, message) => {
  return { [field]: message };
};

// Merge multiple validation errors
export const mergeValidationErrors = (...errorObjects) => {
  return Object.assign({}, ...errorObjects);
};

export default {
  ERROR_MESSAGES,
  getErrorMessage,
  parseApiError,
  handleApiError,
  formatValidationErrors,
  isAuthError,
  requiresReload,
  isTemporaryError,
  getRetryDelay,
  createFormError,
  mergeValidationErrors
};
