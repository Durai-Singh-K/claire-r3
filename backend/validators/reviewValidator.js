import { body, param, query } from 'express-validator';

// Create review validation
export const validateCreateReview = [
  body('reviewee')
    .notEmpty()
    .withMessage('Reviewee user ID is required')
    .isMongoId()
    .withMessage('Invalid reviewee user ID'),

  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),

  body('ratings.quality')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Quality rating must be between 1 and 5'),

  body('ratings.communication')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Communication rating must be between 1 and 5'),

  body('ratings.delivery')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Delivery rating must be between 1 and 5'),

  body('ratings.professionalism')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Professionalism rating must be between 1 and 5'),

  body('orderId')
    .optional()
    .isMongoId()
    .withMessage('Invalid order ID'),

  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID cannot exceed 100 characters'),

  body('images')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 images allowed'),

  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL')
];

// Update review validation
export const validateUpdateReview = [
  param('reviewId')
    .isMongoId()
    .withMessage('Invalid review ID'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),

  body('ratings.quality')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Quality rating must be between 1 and 5'),

  body('ratings.communication')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Communication rating must be between 1 and 5'),

  body('ratings.delivery')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Delivery rating must be between 1 and 5'),

  body('ratings.professionalism')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Professionalism rating must be between 1 and 5')
];

// Add response validation
export const validateAddResponse = [
  param('reviewId')
    .isMongoId()
    .withMessage('Invalid review ID'),

  body('response')
    .trim()
    .notEmpty()
    .withMessage('Response is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Response must be between 10 and 500 characters')
];

// Flag review validation
export const validateFlagReview = [
  param('reviewId')
    .isMongoId()
    .withMessage('Invalid review ID'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters')
];

// Get reviews query validation
export const validateGetReviews = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  query('minRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),

  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'rating', '-rating', 'helpfulCount', '-helpfulCount'])
    .withMessage('Invalid sort parameter')
];

// Review ID parameter validation
export const validateReviewId = [
  param('reviewId')
    .isMongoId()
    .withMessage('Invalid review ID')
];
