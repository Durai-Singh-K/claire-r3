import { body, param, query } from 'express-validator';

// Profile validation
export const validateProfileUpdate = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters'),

  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),

  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid phone number format'),

  body('whatsapp')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid WhatsApp number format'),

  body('website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),

  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),

  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array')
];

// Business information validation
export const validateBusinessInfo = [
  body('businessType')
    .optional()
    .isIn(['manufacturer', 'wholesaler', 'retailer', 'distributor', 'supplier', 'trader'])
    .withMessage('Invalid business type'),

  body('yearEstablished')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('Invalid year established'),

  body('employeeCount')
    .optional()
    .isIn(['1-10', '11-50', '51-200', '201-500', '500+', 'not-disclosed'])
    .withMessage('Invalid employee count range'),

  body('gst')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GST number format'),

  body('pan')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN card format'),

  body('businessRegistrationNumber')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Business registration number must be between 3 and 50 characters')
];

// Location validation
export const validateLocation = [
  body('shopLocation.address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),

  body('shopLocation.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),

  body('shopLocation.state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),

  body('shopLocation.pincode')
    .optional()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Invalid pincode format'),

  body('shopLocation.coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),

  body('shopLocation.coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude')
];

// Delivery areas validation
export const validateDeliveryAreas = [
  body('deliveryAreas')
    .optional()
    .isArray()
    .withMessage('Delivery areas must be an array'),

  body('deliveryAreas.*.name')
    .trim()
    .notEmpty()
    .withMessage('Delivery area name is required'),

  body('deliveryAreas.*.city')
    .trim()
    .notEmpty()
    .withMessage('Delivery area city is required'),

  body('deliveryAreas.*.distance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number')
];

// Business hours validation
export const validateBusinessHours = [
  body('businessHours')
    .isArray()
    .withMessage('Business hours must be an array'),

  body('businessHours.*.day')
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day'),

  body('businessHours.*.openTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Invalid time format. Use HH:MM (24-hour)'),

  body('businessHours.*.closeTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Invalid time format. Use HH:MM (24-hour)'),

  body('businessHours.*.isClosed')
    .optional()
    .isBoolean()
    .withMessage('isClosed must be a boolean')
];

// Social media validation
export const validateSocialMedia = [
  body('socialMedia.instagram')
    .optional()
    .isURL()
    .withMessage('Invalid Instagram URL'),

  body('socialMedia.facebook')
    .optional()
    .isURL()
    .withMessage('Invalid Facebook URL'),

  body('socialMedia.linkedin')
    .optional()
    .isURL()
    .withMessage('Invalid LinkedIn URL'),

  body('socialMedia.twitter')
    .optional()
    .isURL()
    .withMessage('Invalid Twitter URL'),

  body('socialMedia.youtube')
    .optional()
    .isURL()
    .withMessage('Invalid YouTube URL')
];

// Certification validation
export const validateCertification = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Certification name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),

  body('issuedBy')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Issued by cannot exceed 100 characters'),

  body('issuedDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid issued date'),

  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date'),

  body('documentUrl')
    .optional()
    .isURL()
    .withMessage('Invalid document URL')
];

// Award validation
export const validateAward = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Award title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('issuedBy')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Issued by cannot exceed 100 characters'),

  body('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('Invalid year'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

// Vacation mode validation
export const validateVacationMode = [
  body('enabled')
    .isBoolean()
    .withMessage('Enabled must be a boolean'),

  body('from')
    .optional()
    .isISO8601()
    .withMessage('Invalid from date'),

  body('to')
    .optional()
    .isISO8601()
    .withMessage('Invalid to date'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
];

// Privacy settings validation
export const validatePrivacySettings = [
  body('privacySettings.showPhone')
    .optional()
    .isIn(['public', 'friends', 'communities', 'private'])
    .withMessage('Invalid privacy setting for phone'),

  body('privacySettings.showEmail')
    .optional()
    .isIn(['public', 'friends', 'communities', 'private'])
    .withMessage('Invalid privacy setting for email'),

  body('privacySettings.showLocation')
    .optional()
    .isIn(['public', 'friends', 'communities', 'private'])
    .withMessage('Invalid privacy setting for location')
];

// Query parameter validation
export const validateUserSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  query('businessType')
    .optional()
    .isIn(['manufacturer', 'wholesaler', 'retailer', 'distributor', 'supplier', 'trader'])
    .withMessage('Invalid business type'),

  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),

  query('subscriptionTier')
    .optional()
    .isIn(['free', 'basic', 'premium', 'enterprise'])
    .withMessage('Invalid subscription tier')
];

// User ID parameter validation
export const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
];
