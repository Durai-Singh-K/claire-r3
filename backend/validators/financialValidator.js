import { body } from 'express-validator';

// Bank details validation
export const validateBankDetails = [
  body('bankDetails.accountNumber')
    .trim()
    .notEmpty()
    .withMessage('Account number is required')
    .isLength({ min: 9, max: 18 })
    .withMessage('Account number must be between 9 and 18 digits')
    .matches(/^\d+$/)
    .withMessage('Account number must contain only digits'),

  body('bankDetails.ifscCode')
    .trim()
    .notEmpty()
    .withMessage('IFSC code is required')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code format'),

  body('bankDetails.accountHolderName')
    .trim()
    .notEmpty()
    .withMessage('Account holder name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Account holder name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Account holder name must contain only letters and spaces'),

  body('bankDetails.bankName')
    .trim()
    .notEmpty()
    .withMessage('Bank name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be between 2 and 100 characters'),

  body('bankDetails.branch')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Branch name cannot exceed 100 characters')
];

// Payment methods validation
export const validatePaymentMethods = [
  body('paymentMethods')
    .isArray({ min: 1 })
    .withMessage('At least one payment method is required'),

  body('paymentMethods.*')
    .isIn(['upi', 'cash', 'card', 'netbanking', 'cheque', 'bank_transfer', 'cod'])
    .withMessage('Invalid payment method')
];

// Credit terms validation
export const validateCreditTerms = [
  body('creditTerms')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Credit terms cannot exceed 50 characters')
];

// Minimum order value validation
export const validateMinimumOrderValue = [
  body('minimumOrderValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order value must be a positive number')
];

// Supply capacity validation
export const validateSupplyCapacity = [
  body('supplyCapacity.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),

  body('supplyCapacity.unit')
    .optional()
    .isIn(['pieces', 'kg', 'meters', 'dozens', 'boxes'])
    .withMessage('Invalid unit'),

  body('supplyCapacity.period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Invalid period')
];

// Shipping methods validation
export const validateShippingMethods = [
  body('shippingMethods')
    .optional()
    .isArray()
    .withMessage('Shipping methods must be an array'),

  body('shippingMethods.*')
    .isIn(['own_delivery', 'third_party', 'courier', 'pickup', 'shipping'])
    .withMessage('Invalid shipping method')
];

// Return policy validation
export const validateReturnPolicy = [
  body('returnPolicy.accepted')
    .isBoolean()
    .withMessage('Accepted must be a boolean'),

  body('returnPolicy.duration')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Duration must be between 0 and 365 days'),

  body('returnPolicy.conditions')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Conditions cannot exceed 500 characters')
];

// Complete financial info validation (combines all)
export const validateCompleteFinancialInfo = [
  ...validatePaymentMethods,
  ...validateMinimumOrderValue,
  ...validateCreditTerms
];
