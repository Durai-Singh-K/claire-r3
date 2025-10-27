import { VALIDATION_RULES } from '../config/constants';

// Basic validation functions
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== '';
};

export const minLength = (value, min) => {
  if (!value) return false;
  return value.toString().length >= min;
};

export const maxLength = (value, max) => {
  if (!value) return true;
  return value.toString().length <= max;
};

export const isEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

export const isPhone = (phone) => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

export const isURL = (url) => {
  if (!url) return false;
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

export const isNumber = (value) => {
  return !isNaN(value) && !isNaN(parseFloat(value));
};

export const isInteger = (value) => {
  return Number.isInteger(Number(value));
};

export const isPositive = (value) => {
  return isNumber(value) && parseFloat(value) > 0;
};

export const isNonNegative = (value) => {
  return isNumber(value) && parseFloat(value) >= 0;
};

export const isBetween = (value, min, max) => {
  if (!isNumber(value)) return false;
  const num = parseFloat(value);
  return num >= min && num <= max;
};

export const matches = (value, pattern) => {
  if (!value) return false;
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  return regex.test(value);
};

// Specific field validators
export const validateUsername = (username) => {
  const errors = [];
  
  if (!isRequired(username)) {
    errors.push('Username is required');
  } else {
    if (!minLength(username, VALIDATION_RULES.USERNAME.MIN_LENGTH)) {
      errors.push(`Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`);
    }
    
    if (!maxLength(username, VALIDATION_RULES.USERNAME.MAX_LENGTH)) {
      errors.push(`Username must be no more than ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`);
    }
    
    if (!matches(username, VALIDATION_RULES.USERNAME.PATTERN)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEmail = (email) => {
  const errors = [];
  
  if (!isRequired(email)) {
    errors.push('Email is required');
  } else if (!isEmail(email)) {
    errors.push('Please enter a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePassword = (password) => {
  const errors = [];
  
  if (!isRequired(password)) {
    errors.push('Password is required');
  } else {
    if (!minLength(password, VALIDATION_RULES.PASSWORD.MIN_LENGTH)) {
      errors.push(`Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`);
    }
    
    if (!maxLength(password, VALIDATION_RULES.PASSWORD.MAX_LENGTH)) {
      errors.push(`Password must be no more than ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters`);
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for at least one number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePasswordConfirm = (password, confirmPassword) => {
  const errors = [];
  
  if (!isRequired(confirmPassword)) {
    errors.push('Please confirm your password');
  } else if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhone = (phone) => {
  const errors = [];
  
  if (!isRequired(phone)) {
    errors.push('Phone number is required');
  } else {
    if (!isPhone(phone)) {
      errors.push('Please enter a valid phone number');
    }
    
    if (!matches(phone, VALIDATION_RULES.PHONE.PATTERN)) {
      errors.push('Phone number contains invalid characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateBusinessName = (businessName) => {
  const errors = [];
  
  if (!isRequired(businessName)) {
    errors.push('Business name is required');
  } else {
    if (!minLength(businessName, VALIDATION_RULES.BUSINESS_NAME.MIN_LENGTH)) {
      errors.push(`Business name must be at least ${VALIDATION_RULES.BUSINESS_NAME.MIN_LENGTH} characters`);
    }
    
    if (!maxLength(businessName, VALIDATION_RULES.BUSINESS_NAME.MAX_LENGTH)) {
      errors.push(`Business name must be no more than ${VALIDATION_RULES.BUSINESS_NAME.MAX_LENGTH} characters`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePostContent = (content) => {
  const errors = [];
  
  if (!isRequired(content)) {
    errors.push('Post content is required');
  } else if (!maxLength(content, VALIDATION_RULES.POST_CONTENT.MAX_LENGTH)) {
    errors.push(`Post content must be no more than ${VALIDATION_RULES.POST_CONTENT.MAX_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCommentContent = (content) => {
  const errors = [];
  
  if (!isRequired(content)) {
    errors.push('Comment content is required');
  } else if (!maxLength(content, VALIDATION_RULES.COMMENT_CONTENT.MAX_LENGTH)) {
    errors.push(`Comment must be no more than ${VALIDATION_RULES.COMMENT_CONTENT.MAX_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateMessageContent = (content) => {
  const errors = [];
  
  if (!isRequired(content)) {
    errors.push('Message content is required');
  } else if (!maxLength(content, VALIDATION_RULES.MESSAGE_CONTENT.MAX_LENGTH)) {
    errors.push(`Message must be no more than ${VALIDATION_RULES.MESSAGE_CONTENT.MAX_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePrice = (price) => {
  const errors = [];
  
  if (!isRequired(price)) {
    errors.push('Price is required');
  } else {
    if (!isNumber(price)) {
      errors.push('Price must be a valid number');
    } else if (!isPositive(price)) {
      errors.push('Price must be greater than 0');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateQuantity = (quantity) => {
  const errors = [];
  
  if (!isRequired(quantity)) {
    errors.push('Quantity is required');
  } else {
    if (!isInteger(quantity)) {
      errors.push('Quantity must be a whole number');
    } else if (!isPositive(quantity)) {
      errors.push('Quantity must be greater than 0');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePincode = (pincode) => {
  const errors = [];
  
  if (!isRequired(pincode)) {
    errors.push('Pincode is required');
  } else {
    const cleanPincode = pincode.replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      errors.push('Pincode must be exactly 6 digits');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateGST = (gst) => {
  const errors = [];
  
  if (gst) { // GST is optional but if provided, should be valid
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!matches(gst, gstRegex)) {
      errors.push('Please enter a valid GST number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePAN = (pan) => {
  const errors = [];
  
  if (pan) { // PAN is optional but if provided, should be valid
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!matches(pan, panRegex)) {
      errors.push('Please enter a valid PAN number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// File validation
export const validateFileType = (file, allowedTypes) => {
  if (!file) return { isValid: false, errors: ['File is required'] };
  
  const errors = [];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateFileSize = (file, maxSize) => {
  if (!file) return { isValid: false, errors: ['File is required'] };
  
  const errors = [];
  
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Form validation helper
export const validateForm = (formData, rules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const fieldValue = formData[field];
    const fieldErrors = [];
    
    fieldRules.forEach(rule => {
      if (typeof rule === 'function') {
        const result = rule(fieldValue, formData);
        if (result && !result.isValid) {
          fieldErrors.push(...result.errors);
        }
      } else if (typeof rule === 'object') {
        const { validator, message, ...params } = rule;
        if (!validator(fieldValue, params)) {
          fieldErrors.push(message || 'Invalid value');
        }
      }
    });
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
      isValid = false;
    }
  });
  
  return {
    isValid,
    errors
  };
};

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required') => ({
    validator: isRequired,
    message
  }),
  
  email: (message = 'Please enter a valid email address') => ({
    validator: isEmail,
    message
  }),
  
  phone: (message = 'Please enter a valid phone number') => ({
    validator: isPhone,
    message
  }),
  
  minLength: (min, message) => ({
    validator: (value) => minLength(value, min),
    message: message || `Must be at least ${min} characters`
  }),
  
  maxLength: (max, message) => ({
    validator: (value) => maxLength(value, max),
    message: message || `Must be no more than ${max} characters`
  }),
  
  number: (message = 'Must be a valid number') => ({
    validator: isNumber,
    message
  }),
  
  positive: (message = 'Must be greater than 0') => ({
    validator: isPositive,
    message
  }),
  
  pattern: (regex, message = 'Invalid format') => ({
    validator: (value) => matches(value, regex),
    message
  })
};

export default {
  isRequired,
  minLength,
  maxLength,
  isEmail,
  isPhone,
  isURL,
  isNumber,
  isInteger,
  isPositive,
  isNonNegative,
  isBetween,
  matches,
  validateUsername,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
  validateBusinessName,
  validatePostContent,
  validateCommentContent,
  validateMessageContent,
  validatePrice,
  validateQuantity,
  validatePincode,
  validateGST,
  validatePAN,
  validateFileType,
  validateFileSize,
  validateForm,
  validationRules
};
