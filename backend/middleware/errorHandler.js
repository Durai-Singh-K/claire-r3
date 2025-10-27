import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'b2b-textile-platform' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Custom Error Classes
export class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  // Log error with context
  logger.error({
    message: err.message,
    statusCode: error.statusCode,
    errorCode: error.errorCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.userId,
    stack: err.stack
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = `Invalid ${err.path}: ${err.value}`;
    error.statusCode = 404;
    error.errorCode = 'INVALID_ID';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    error.message = `${field} '${value}' already exists`;
    error.statusCode = 409;
    error.errorCode = 'DUPLICATE_FIELD';
    error.field = field;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    error.message = 'Validation failed';
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    error.errors = errors;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid authentication token';
    error.statusCode = 401;
    error.errorCode = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Authentication token expired. Please login again.';
    error.statusCode = 401;
    error.errorCode = 'TOKEN_EXPIRED';
  }

  // Firebase auth errors
  if (err.code && err.code.startsWith('auth/')) {
    const firebaseErrors = {
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Invalid credentials',
      'auth/email-already-in-use': 'Email already registered',
      'auth/weak-password': 'Password is too weak',
      'auth/invalid-email': 'Invalid email format',
      'auth/user-disabled': 'Account has been disabled'
    };
    error.message = firebaseErrors[err.code] || 'Authentication failed';
    error.statusCode = 401;
    error.errorCode = 'FIREBASE_AUTH_ERROR';
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File size exceeds maximum limit (50MB)';
    error.statusCode = 400;
    error.errorCode = 'FILE_TOO_LARGE';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Unexpected file field in upload';
    error.statusCode = 400;
    error.errorCode = 'INVALID_FILE_FIELD';
  }

  // Payment gateway errors
  if (err.type === 'StripeCardError' || err.type === 'RazorpayError') {
    error.message = 'Payment processing failed. Please check your payment details.';
    error.statusCode = 402;
    error.errorCode = 'PAYMENT_FAILED';
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    error.message = 'Database connection failed. Please try again.';
    error.statusCode = 503;
    error.errorCode = 'DATABASE_ERROR';
  }

  // Build response object
  const response = {
    success: false,
    error: {
      message: error.message || 'An unexpected error occurred',
      code: error.errorCode,
      statusCode: error.statusCode
    }
  };

  // Add additional error details
  if (error.errors) response.error.details = error.errors;
  if (error.field) response.error.field = error.field;

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
    response.error.fullError = err;
  }

  // Send response
  res.status(error.statusCode).json(response);
};

// Async error handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found middleware
export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Validation error formatter
export const formatValidationErrors = (errors) => {
  return errors.array().map(error => ({
    field: error.param,
    message: error.msg,
    value: error.value
  }));
};

export default { errorHandler, asyncHandler, notFound, formatValidationErrors };
