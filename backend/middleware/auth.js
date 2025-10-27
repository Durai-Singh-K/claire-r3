import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import User from '../models/User.js';

// Initialize Firebase Admin SDK
const serviceAccount = {
  // This would normally be loaded from environment variables
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

if (!admin.apps.length && process.env.NODE_ENV === 'production') {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    let decoded;
    let isFirebaseToken = false;
    
    try {
      // First try to verify as Firebase token
      if (process.env.NODE_ENV === 'production') {
        decoded = await admin.auth().verifyIdToken(token);
        isFirebaseToken = true;
      } else {
        throw new Error('Firebase not initialized in development');
      }
    } catch (firebaseError) {
      try {
        // Fallback to JWT token for development or email auth
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        isFirebaseToken = false;
      } catch (jwtError) {
        return res.status(401).json({ message: 'Invalid token.' });
      }
    }
    
    let user;
    
    if (isFirebaseToken) {
      // Firebase token - find user by Firebase UID
      user = await User.findOne({ firebaseUid: decoded.uid }).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found.' });
      }
    } else {
      // JWT token - find user by ID
      user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found.' });
      }
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated.' });
    }
    
    if (user.isBanned) {
      return res.status(401).json({ 
        message: 'Account is banned.', 
        reason: user.banReason 
      });
    }
    
    // Update last active
    user.updateLastActive();
    
    // Add user info to request
    req.user = user;
    req.userId = user._id;
    req.isFirebaseAuth = isFirebaseToken;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token verification failed.' });
  }
};

// Optional auth middleware (doesn't require authentication but adds user info if authenticated)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }
    
    let decoded;
    let isFirebaseToken = false;
    
    try {
      if (process.env.NODE_ENV === 'production') {
        decoded = await admin.auth().verifyIdToken(token);
        isFirebaseToken = true;
      } else {
        throw new Error('Firebase not initialized in development');
      }
    } catch (firebaseError) {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        isFirebaseToken = false;
      } catch (jwtError) {
        return next();
      }
    }
    
    let user;
    
    if (isFirebaseToken) {
      user = await User.findOne({ firebaseUid: decoded.uid }).select('-password');
    } else {
      user = await User.findById(decoded.userId).select('-password');
    }
    
    if (user && user.isActive && !user.isBanned) {
      user.updateLastActive();
      req.user = user;
      req.userId = user._id;
      req.isFirebaseAuth = isFirebaseToken;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Admin only middleware
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Access denied. Authentication required.' });
  }
  
  // Check if user has admin role (you can implement your own admin logic)
  if (req.user.role !== 'admin' && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  
  next();
};

// Community admin middleware
export const communityAdmin = async (req, res, next) => {
  try {
    const communityId = req.params.communityId || req.body.communityId;
    
    if (!communityId) {
      return res.status(400).json({ message: 'Community ID required.' });
    }
    
    const Community = mongoose.model('Community');
    const community = await Community.findById(communityId);
    
    if (!community) {
      return res.status(404).json({ message: 'Community not found.' });
    }
    
    const isAdmin = community.isAdmin(req.userId);
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied. Community admin privileges required.' });
    }
    
    req.community = community;
    next();
  } catch (error) {
    console.error('Community admin middleware error:', error);
    res.status(500).json({ message: 'Error verifying community admin status.' });
  }
};

// Rate limiting middleware for specific actions
export const createRateLimit = (windowMs, max, message) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.userId || req.ip;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    const windowStart = now - windowMs;
    
    // Remove old requests
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= max) {
      return res.status(429).json({ 
        message: message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    
    next();
  };
};

// Validation middleware
export const validateOnboarding = (req, res, next) => {
  if (!req.user.onboardingCompleted) {
    return res.status(403).json({ 
      message: 'Please complete onboarding first.',
      redirectTo: '/onboarding'
    });
  }
  next();
};

export default { auth, optionalAuth, adminOnly, communityAdmin, createRateLimit, validateOnboarding };
