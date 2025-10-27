import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import admin from 'firebase-admin';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// @desc    Register user with email/password
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('displayName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be 2-50 characters long'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('businessName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be 2-100 characters long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { email, password, displayName, phone, businessName } = req.body;
  
  // Check if user exists
  const existingUser = await User.findOne({ email });
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered'
    });
  }
  
  // Generate unique username from email
  const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(7);
  
  // Create user
  const user = new User({
    email,
    password,
    username,
    displayName,
    phone: phone || undefined,
    businessName: businessName || displayName,
    whatsapp: phone || undefined,
    authProvider: 'email',
    onboardingCompleted: false
  });
  
  await user.save();
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: '7d' }
  );
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: user.toSafeObject(),
    requiresOnboarding: true
  });
}));

// @desc    Login user with email/password
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { email, password } = req.body;
  
  console.log('Login attempt for email:', email);
  
  // Find user
  const user = await User.findOne({ email }).select('+password');
  
  console.log('User found:', user ? 'Yes' : 'No', user ? `(ID: ${user._id})` : '');
  
  if (!user || user.authProvider !== 'email') {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  // Check password
  console.log('Comparing password...');
  const isMatch = await user.comparePassword(password);
  console.log('Password match:', isMatch);
  
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact support.'
    });
  }
  
  if (user.isBanned) {
    return res.status(401).json({
      success: false,
      message: 'Account is banned.',
      reason: user.banReason
    });
  }
  
  // Update last active
  user.updateLastActive();
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: '7d' }
  );
  
  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: user.toSafeObject(),
    requiresOnboarding: !user.onboardingCompleted
  });
}));

// @desc    Google OAuth callback
// @route   POST /api/auth/google
// @access  Public
router.post('/google', asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: 'ID token is required'
    });
  }
  
  try {
    // Verify Google ID token
    let decodedToken;
    
    if (process.env.NODE_ENV === 'production' && admin.apps.length > 0) {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } else {
      // For development, we'll decode without verification
      console.log('Development mode: Decoding token without Firebase verification');
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format:', idToken.substring(0, 50));
        throw new Error('Invalid token format');
      }
      decodedToken = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('Decoded token:', { uid: decodedToken.sub, email: decodedToken.email });
    }
    
    // Extract user data from token (Firebase uses 'sub' for uid in JWT)
    const uid = decodedToken.uid || decodedToken.sub || decodedToken.user_id;
    const email = decodedToken.email;
    const name = decodedToken.name || decodedToken.displayName;
    const picture = decodedToken.picture || decodedToken.photoURL;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not found in Google account'
      });
    }
    
    // Check if user exists
    let user = await User.findOne({
      $or: [
        { firebaseUid: uid },
        { email: email }
      ]
    });
    
    let isNewUser = false;
    
    if (!user) {
      // Create new user
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(7);
      
      user = new User({
        firebaseUid: uid,
        email: email,
        username: username,
        displayName: name || email.split('@')[0],
        profilePicture: picture,
        authProvider: 'google',
        onboardingCompleted: false
      });
      
      await user.save();
      isNewUser = true;
    } else if (!user.firebaseUid && user.authProvider === 'email') {
      // Link existing email account with Google
      user.firebaseUid = uid;
      user.authProvider = 'google';
      if (picture && !user.profilePicture) {
        user.profilePicture = picture;
      }
      await user.save();
    }
    
    // Update last active
    user.updateLastActive();
    
    // Generate JWT token (as fallback)
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      token,
      firebaseToken: idToken, // Return Firebase token for frontend use
      user: user.toSafeObject(),
      requiresOnboarding: !user.onboardingCompleted,
      isNewUser
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack?.split('\n')[0]
    });
    res.status(401).json({
      success: false,
      message: 'Invalid Google token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// @desc    Complete onboarding
// @route   POST /api/auth/onboarding
// @access  Private
router.post('/onboarding', auth, [
  body('businessName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be 2-100 characters long'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('shopLocation.address')
    .optional()
    .notEmpty()
    .withMessage('Shop address is required'),
  body('shopLocation.city')
    .optional()
    .notEmpty()
    .withMessage('Shop city is required'),
  body('categories')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one category must be selected'),
  body('deliveryAreas')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one delivery area must be specified'),
  body('preferredLanguage')
    .optional()
    .isIn(['hindi', 'english', 'tamil', 'telugu', 'kannada', 'malayalam', 'marathi', 'gujarati', 'bengali', 'punjabi'])
    .withMessage('Please select a valid language')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const {
    businessName,
    phone,
    whatsapp,
    website,
    shopLocation,
    deliveryAreas,
    categories,
    preferredLanguage,
    languages,
    bio
  } = req.body;
  
  // Update user profile
  const user = await User.findById(req.userId);

  if (businessName) user.businessName = businessName;
  if (phone) user.phone = phone;
  if (whatsapp || phone) user.whatsapp = whatsapp || phone;
  if (website) user.website = website;
  if (shopLocation) {
    user.shopLocation = {
      address: shopLocation.address,
      city: shopLocation.city,
      state: shopLocation.state,
      country: shopLocation.country || 'India',
      pincode: shopLocation.pincode,
      coordinates: shopLocation.coordinates
    };
  }
  if (deliveryAreas) {
    user.deliveryAreas = deliveryAreas.map(area => ({
      name: area.name,
      city: area.city,
      state: area.state,
      distance: area.distance,
      deliveryTime: area.deliveryTime
    }));
  }
  if (categories) user.categories = categories;
  if (preferredLanguage) user.preferredLanguage = preferredLanguage;
  if (languages) user.languages = languages;
  else if (preferredLanguage) user.languages = [preferredLanguage];
  if (bio) user.bio = bio;
  user.onboardingCompleted = true;
  user.onboardingStep = 100;
  
  await user.save();
  
  res.json({
    success: true,
    message: 'Onboarding completed successfully',
    user: user.toSafeObject()
  });
}));

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId)
    .populate('communities.community', 'name isPrivate memberCount')
    .populate('friends.user', 'displayName businessName profilePicture onlineStatus');
  
  res.json({
    success: true,
    user: user.toSafeObject()
  });
}));

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', auth, [
  body('displayName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be 2-50 characters long'),
  body('businessName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be 2-100 characters long'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const allowedUpdates = [
    'displayName', 'businessName', 'bio', 'phone', 'whatsapp', 'website',
    'shopLocation', 'deliveryAreas', 'categories', 'languages', 'preferredLanguage',
    'privacySettings', 'notificationSettings'
  ];
  
  const updates = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: updates },
    { new: true, runValidators: true }
  );
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: user.toSafeObject()
  });
}));

// @desc    Change password (email auth only)
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  if (req.user.authProvider !== 'email') {
    return res.status(400).json({
      success: false,
      message: 'Password change not available for Google accounts'
    });
  }
  
  const { currentPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await User.findById(req.userId).select('+password');
  
  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  res.json({
    success: true,
    message: 'Password updated successfully'
  });
}));

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
router.post('/refresh', auth, asyncHandler(async (req, res) => {
  // Generate new JWT token
  const token = jwt.sign(
    { userId: req.user._id, email: req.user.email },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: '7d' }
  );
  
  res.json({
    success: true,
    token,
    user: req.user.toSafeObject()
  });
}));

// @desc    Update online status
// @route   PUT /api/auth/status
// @access  Private
router.put('/status', auth, [
  body('status')
    .isIn(['online', 'away', 'busy', 'offline'])
    .withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.userId,
    { onlineStatus: status, lastActive: new Date() },
    { new: true }
  );
  
  res.json({
    success: true,
    message: 'Status updated',
    onlineStatus: user.onlineStatus
  });
}));

// @desc    Deactivate account
// @route   DELETE /api/auth/account
// @access  Private
router.delete('/account', auth, [
  body('password')
    .if((value, { req }) => req.user.authProvider === 'email')
    .notEmpty()
    .withMessage('Password is required for email accounts')
], asyncHandler(async (req, res) => {
  const { password, reason } = req.body;
  
  // Verify password for email accounts
  if (req.user.authProvider === 'email') {
    const user = await User.findById(req.userId).select('+password');
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }
  }
  
  // Deactivate account (soft delete)
  await User.findByIdAndUpdate(req.userId, {
    isActive: false,
    deactivatedAt: new Date(),
    deactivationReason: reason
  });
  
  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
}));

export default router;
