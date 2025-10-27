import { body, param } from 'express-validator';

// Subscription upgrade validation
export const validateSubscriptionUpgrade = [
  body('tier')
    .notEmpty()
    .withMessage('Subscription tier is required')
    .isIn(['basic', 'premium', 'enterprise'])
    .withMessage('Invalid subscription tier'),

  body('billingCycle')
    .notEmpty()
    .withMessage('Billing cycle is required')
    .isIn(['monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid billing cycle'),

  body('autoRenew')
    .optional()
    .isBoolean()
    .withMessage('Auto renew must be a boolean')
];

// Payment validation
export const validatePayment = [
  body('subscriptionId')
    .notEmpty()
    .withMessage('Subscription ID is required')
    .isMongoId()
    .withMessage('Invalid subscription ID'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['card', 'upi', 'netbanking', 'wallet'])
    .withMessage('Invalid payment method'),

  body('gatewayTransactionId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Gateway transaction ID cannot be empty')
];

// Cancellation validation
export const validateCancellation = [
  param('subscriptionId')
    .isMongoId()
    .withMessage('Invalid subscription ID'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

// Discount code validation
export const validateDiscountCode = [
  body('discountCode')
    .trim()
    .notEmpty()
    .withMessage('Discount code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Discount code must be between 3 and 20 characters')
    .isAlphanumeric()
    .withMessage('Discount code must be alphanumeric')
];
