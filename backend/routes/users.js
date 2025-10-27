import express from 'express';
import { body, query, validationResult } from 'express-validator';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Product from '../models/Product.js';
import Post from '../models/Post.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createRateLimit } from '../middleware/auth.js';
import verificationService from '../services/verificationService.js';
import analyticsService from '../services/analyticsService.js';
import {
  validateBusinessInfo,
  validateBusinessHours,
  validateVacationMode,
  validateSocialMedia,
  validateCertification,
  validateAward
} from '../validators/userValidator.js';
import {
  validateBankDetails,
  validatePaymentMethods,
  validateReturnPolicy
} from '../validators/financialValidator.js';

const router = express.Router();

// Rate limiting for friend requests
const friendRequestLimit = createRateLimit(60 * 60 * 1000, 10, 'Too many friend requests. Please try again later.');

// @desc    Get business profile
// @route   GET /api/users/business-profile
// @access  Private
router.get('/business-profile', asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId)
    .select('-password -firebaseUid')
    .populate('communities.community', 'name memberCount coverImage');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    user: user.toObject()
  });
}));

// @desc    Get business analytics
// @route   GET /api/users/business-analytics
// @access  Private
router.get('/business-analytics', asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Get analytics data
  const [
    profileViews,
    postCount,
    productCount,
    friendCount,
    communityCount
  ] = await Promise.all([
    // You can track views in a separate Analytics collection
    Promise.resolve(user.analytics?.profileViews || 0),
    Post.countDocuments({ author: req.userId }),
    Product.countDocuments({ seller: req.userId, status: 'active' }),
    User.findById(req.userId).then(u => u.friends.length),
    User.findById(req.userId).then(u => u.communities.length)
  ]);

  const analytics = {
    profileViews,
    postCount,
    productCount,
    friendCount,
    communityCount,
    engagement: {
      likes: user.analytics?.totalLikes || 0,
      comments: user.analytics?.totalComments || 0,
      shares: user.analytics?.totalShares || 0
    }
  };

  res.json({
    success: true,
    analytics
  });
}));

// @desc    Get friend requests (sent/received)
// @route   GET /api/users/friend-requests
// @access  Private
router.get('/friend-requests', [
  query('type')
    .optional()
    .isIn(['sent', 'received', 'all'])
    .withMessage('Type must be sent, received, or all')
], asyncHandler(async (req, res) => {
  const { type = 'received' } = req.query;

  let requests = [];

  if (type === 'received' || type === 'all') {
    const receivedRequests = await FriendRequest.getPendingRequests(req.userId, 'received');
    requests.push(...receivedRequests);
  }

  if (type === 'sent' || type === 'all') {
    const sentRequests = await FriendRequest.getPendingRequests(req.userId, 'sent');
    requests.push(...sentRequests);
  }

  res.json({
    success: true,
    requests: requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  });
}));

// @desc    Get user suggestions
// @route   GET /api/users/suggestions
// @access  Private
router.get('/suggestions', asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.userId)
    .populate('friends.user communities.community');

  // Get users from same location
  const locationSuggestions = await User.find({
    'shopLocation.city': currentUser.shopLocation.city,
    _id: { $ne: req.userId },
    isActive: true,
    onboardingCompleted: true
  })
  .select('displayName businessName profilePicture shopLocation categories isVerified')
  .limit(5);

  // Get users with similar categories
  const categorySuggestions = await User.find({
    categories: { $in: currentUser.categories },
    _id: { $ne: req.userId },
    isActive: true,
    onboardingCompleted: true
  })
  .select('displayName businessName profilePicture shopLocation categories isVerified')
  .limit(5);

  // Combine and remove duplicates
  const allSuggestions = [...locationSuggestions, ...categorySuggestions];
  const uniqueSuggestions = allSuggestions.filter((user, index, self) =>
    index === self.findIndex(u => u._id.toString() === user._id.toString())
  );

  // Add suggestion reasons
  const suggestions = uniqueSuggestions.map(user => {
    const reasons = [];
    if (user.shopLocation.city === currentUser.shopLocation.city) {
      reasons.push(`Same location: ${user.shopLocation.city}`);
    }
    const commonCategories = user.categories.filter(cat => currentUser.categories.includes(cat));
    if (commonCategories.length > 0) {
      reasons.push(`Similar business: ${commonCategories.join(', ')}`);
    }

    return {
      ...user.toObject(),
      suggestionReasons: reasons
    };
  });

  res.json({
    success: true,
    suggestions: suggestions.slice(0, 10)
  });
}));

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
router.get('/search', [
  query('q')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { q, page = 1, limit = 20, category, location, sortBy = 'relevance' } = req.query;
  
  // Build search query
  let searchQuery = {
    isActive: true,
    onboardingCompleted: true,
    _id: { $ne: req.userId } // Exclude current user
  };
  
  // Text search
  if (q) {
    searchQuery.$or = [
      { displayName: { $regex: q, $options: 'i' } },
      { businessName: { $regex: q, $options: 'i' } },
      { username: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } }, // Added email search
      { 'shopLocation.city': { $regex: q, $options: 'i' } }
    ];
  }
  
  // Category filter
  if (category) {
    searchQuery.categories = { $in: [category] };
  }
  
  // Location filter
  if (location) {
    searchQuery['shopLocation.city'] = { $regex: location, $options: 'i' };
  }
  
  // Sort options
  let sortOptions = {};
  switch (sortBy) {
    case 'name':
      sortOptions = { displayName: 1 };
      break;
    case 'business':
      sortOptions = { businessName: 1 };
      break;
    case 'location':
      sortOptions = { 'shopLocation.city': 1 };
      break;
    case 'newest':
      sortOptions = { createdAt: -1 };
      break;
    case 'verified':
      sortOptions = { isVerified: -1, displayName: 1 };
      break;
    default:
      sortOptions = { isVerified: -1, lastActive: -1 };
  }
  
  const users = await User.find(searchQuery)
    .select('displayName businessName profilePicture shopLocation categories isVerified lastActive onlineStatus')
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await User.countDocuments(searchQuery);
  
  // Check friend status for each user
  const userResults = await Promise.all(users.map(async (user) => {
    const friendRequest = await FriendRequest.findOne({
      $or: [
        { from: req.userId, to: user._id },
        { from: user._id, to: req.userId }
      ],
      status: { $in: ['pending', 'accepted'] }
    });
    
    let friendStatus = 'none';
    if (friendRequest) {
      if (friendRequest.status === 'accepted') {
        friendStatus = 'friends';
      } else if (friendRequest.from.toString() === req.userId.toString()) {
        friendStatus = 'sent';
      } else {
        friendStatus = 'received';
      }
    }
    
    return {
      ...user.toObject(),
      friendStatus
    };
  }));
  
  res.json({
    success: true,
    users: userResults,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      limit: parseInt(limit)
    }
  });
}));

// @desc    Get user profile by ID or username
// @route   GET /api/users/:identifier
// @access  Private
router.get('/:identifier', asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  
  // Check if identifier is ObjectId or username
  let query = {};
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    query._id = identifier;
  } else {
    query.username = identifier;
  }
  
  query.isActive = true;
  
  const user = await User.findOne(query)
    .populate('communities.community', 'name isPrivate memberCount coverImage')
    .select('-password -firebaseUid');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Check privacy settings
  const canViewProfile = await canViewUserProfile(req.userId, user);
  
  if (!canViewProfile) {
    return res.status(403).json({
      success: false,
      message: 'Profile is private'
    });
  }
  
  // Check friend status
  const friendRequest = await FriendRequest.findOne({
    $or: [
      { from: req.userId, to: user._id },
      { from: user._id, to: req.userId }
    ],
    status: { $in: ['pending', 'accepted'] }
  });
  
  let friendStatus = 'none';
  if (friendRequest) {
    if (friendRequest.status === 'accepted') {
      friendStatus = 'friends';
    } else if (friendRequest.from.toString() === req.userId.toString()) {
      friendStatus = 'sent';
    } else {
      friendStatus = 'received';
    }
  }
  
  // Get mutual friends count
  const mutualFriends = await getMutualFriendsCount(req.userId, user._id);
  
  const userProfile = {
    ...user.toObject(),
    friendStatus,
    mutualFriendsCount: mutualFriends,
    isOwnProfile: req.userId.toString() === user._id.toString()
  };
  
  // Filter sensitive information based on privacy settings
  if (user.privacySettings.showPhone === 'private' || 
      (user.privacySettings.showPhone === 'friends' && friendStatus !== 'friends')) {
    delete userProfile.phone;
    delete userProfile.whatsapp;
  }
  
  if (user.privacySettings.showEmail === 'private' || 
      (user.privacySettings.showEmail === 'friends' && friendStatus !== 'friends')) {
    delete userProfile.email;
  }
  
  res.json({
    success: true,
    user: userProfile
  });
}));

// @desc    Send friend request
// @route   POST /api/users/:userId/friend-request
// @access  Private
router.post('/:userId/friend-request', friendRequestLimit, [
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
], asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { message } = req.body;
  
  if (userId === req.userId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot send friend request to yourself'
    });
  }
  
  // Check if target user exists
  const targetUser = await User.findById(userId);
  if (!targetUser || !targetUser.isActive) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Check if already friends or request exists
  const existingRequest = await FriendRequest.requestExists(req.userId, userId);
  
  if (existingRequest) {
    return res.status(400).json({
      success: false,
      message: 'Friend request already exists or you are already friends'
    });
  }
  
  // Check if users are already friends
  const currentUser = await User.findById(req.userId);
  const isFriend = currentUser.friends.some(friend => 
    friend.user.toString() === userId && friend.status === 'accepted'
  );
  
  if (isFriend) {
    return res.status(400).json({
      success: false,
      message: 'Already friends with this user'
    });
  }
  
  // Get mutual connections for context
  const mutualConnections = await FriendRequest.getMutualConnections(req.userId, userId);
  
  // Create friend request
  const friendRequest = new FriendRequest({
    from: req.userId,
    to: userId,
    message: message || '',
    requestSource: req.body.source || 'profile',
    commonConnections: mutualConnections.map(user => user._id)
  });
  
  await friendRequest.save();
  
  // Populate the friend request for response
  await friendRequest.populate('from', 'displayName businessName profilePicture shopLocation');
  
  res.json({
    success: true,
    message: 'Friend request sent successfully',
    friendRequest
  });
}));

// @desc    Respond to friend request
// @route   PUT /api/users/friend-requests/:requestId
// @access  Private
router.put('/friend-requests/:requestId', [
  body('action')
    .isIn(['accept', 'reject'])
    .withMessage('Action must be accept or reject'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
], asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { action, message } = req.body;
  
  const friendRequest = await FriendRequest.findById(requestId)
    .populate('from', 'displayName businessName profilePicture');
  
  if (!friendRequest) {
    return res.status(404).json({
      success: false,
      message: 'Friend request not found'
    });
  }
  
  // Check authorization - fix comparison
  const toIdString = friendRequest.to.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || toIdString !== userIdString) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to respond to this request'
    });
  }
  
  if (friendRequest.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Request has already been responded to'
    });
  }
  
  if (action === 'accept') {
    await friendRequest.accept(message);
    
    // Add both users to each other's friends list
    await User.findByIdAndUpdate(friendRequest.from._id, {
      $push: {
        friends: {
          user: req.userId,
          status: 'accepted',
          addedAt: new Date()
        }
      }
    });
    
    await User.findByIdAndUpdate(req.userId, {
      $push: {
        friends: {
          user: friendRequest.from._id,
          status: 'accepted',
          addedAt: new Date()
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Friend request accepted',
      friend: friendRequest.from
    });
  } else {
    await friendRequest.reject(message);
    
    res.json({
      success: true,
      message: 'Friend request rejected'
    });
  }
}));

// @desc    Cancel friend request
// @route   DELETE /api/users/friend-requests/:requestId
// @access  Private
router.delete('/friend-requests/:requestId', asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  
  const friendRequest = await FriendRequest.findById(requestId);
  
  if (!friendRequest) {
    return res.status(404).json({
      success: false,
      message: 'Friend request not found'
    });
  }
  
  // Check authorization - fix comparison
  const fromIdString = friendRequest.from.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || fromIdString !== userIdString) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this request'
    });
  }
  
  if (friendRequest.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel a request that has already been responded to'
    });
  }
  
  await friendRequest.cancel();
  
  res.json({
    success: true,
    message: 'Friend request cancelled'
  });
}));

// @desc    Remove friend
// @route   DELETE /api/users/:userId/friend
// @access  Private
router.delete('/:userId/friend', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Remove from current user's friends list
  const currentUser = await User.findById(req.userId);
  currentUser.friends = currentUser.friends.filter(friend => 
    friend.user.toString() !== userId
  );
  await currentUser.save();
  
  // Remove from other user's friends list
  const otherUser = await User.findById(userId);
  if (otherUser) {
    otherUser.friends = otherUser.friends.filter(friend => 
      friend.user.toString() !== req.userId.toString()
    );
    await otherUser.save();
  }
  
  res.json({
    success: true,
    message: 'Friend removed successfully'
  });
}));

// @desc    Get user's friends
// @route   GET /api/users/:userId/friends
// @access  Private
router.get('/:userId/friends', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const user = await User.findById(userId)
    .populate({
      path: 'friends.user',
      select: 'displayName businessName profilePicture shopLocation onlineStatus isVerified',
      options: {
        skip: (page - 1) * limit,
        limit: parseInt(limit)
      }
    });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const friends = user.friends
    .filter(friend => friend.status === 'accepted')
    .map(friend => ({
      ...friend.user.toObject(),
      friendshipDate: friend.addedAt
    }));
  
  res.json({
    success: true,
    friends,
    pagination: {
      currentPage: parseInt(page),
      totalFriends: user.friends.length,
      limit: parseInt(limit)
    }
  });
}));

// Helper functions
async function canViewUserProfile(viewerId, targetUser) {
  // Always allow viewing own profile
  if (viewerId.toString() === targetUser._id.toString()) {
    return true;
  }
  
  // Check if users are friends
  const areFriends = targetUser.friends.some(friend => 
    friend.user.toString() === viewerId.toString() && friend.status === 'accepted'
  );
  
  // Public profile or friends can always view
  if (targetUser.privacySettings.showProfile === 'public' || areFriends) {
    return true;
  }
  
  // Check community membership if privacy is set to communities
  if (targetUser.privacySettings.showProfile === 'communities') {
    const viewerUser = await User.findById(viewerId);
    const commonCommunities = viewerUser.communities.some(vc => 
      targetUser.communities.some(tc => 
        vc.community.toString() === tc.community.toString()
      )
    );
    return commonCommunities;
  }
  
  return false;
}

async function getMutualFriendsCount(userId1, userId2) {
  const user1 = await User.findById(userId1);
  const user2 = await User.findById(userId2);

  if (!user1 || !user2) return 0;

  const user1Friends = user1.friends.map(f => f.user.toString());
  const user2Friends = user2.friends.map(f => f.user.toString());

  const mutual = user1Friends.filter(id => user2Friends.includes(id));
  return mutual.length;
}

// ============ NEW ENHANCED ENDPOINTS ============

// @desc    Update business information
// @route   PUT /api/users/business-info
// @access  Private
router.put('/business-info', validateBusinessInfo, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { businessType, yearEstablished, employeeCount, gst, pan, businessRegistrationNumber } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (businessType) user.businessType = businessType;
  if (yearEstablished) user.yearEstablished = yearEstablished;
  if (employeeCount) user.employeeCount = employeeCount;
  if (gst) user.gst = gst;
  if (pan) user.pan = pan;
  if (businessRegistrationNumber) user.businessRegistrationNumber = businessRegistrationNumber;

  await user.save();

  res.json({
    success: true,
    message: 'Business information updated successfully',
    user: user.toSafeObject()
  });
}));

// @desc    Update financial information
// @route   PUT /api/users/financial-info
// @access  Private
router.put('/financial-info', [...validatePaymentMethods, validateBankDetails], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { bankDetails, paymentMethods, creditTerms, minimumOrderValue, currency } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (bankDetails) user.bankDetails = { ...user.bankDetails, ...bankDetails };
  if (paymentMethods) user.paymentMethods = paymentMethods;
  if (creditTerms !== undefined) user.creditTerms = creditTerms;
  if (minimumOrderValue !== undefined) user.minimumOrderValue = minimumOrderValue;
  if (currency) user.currency = currency;

  await user.save();

  res.json({
    success: true,
    message: 'Financial information updated successfully',
    user: user.toSafeObject()
  });
}));

// @desc    Update business hours
// @route   PUT /api/users/business-hours
// @access  Private
router.put('/business-hours', validateBusinessHours, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { businessHours, timezone } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  await user.updateBusinessHours(businessHours);
  if (timezone) {
    user.timezone = timezone;
    await user.save();
  }

  res.json({
    success: true,
    message: 'Business hours updated successfully',
    businessHours: user.businessHours,
    isCurrentlyOpen: user.isCurrentlyOpen
  });
}));

// @desc    Update social media links
// @route   PUT /api/users/social-media
// @access  Private
router.put('/social-media', validateSocialMedia, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { socialMedia } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.socialMedia = { ...user.socialMedia, ...socialMedia };
  await user.save();

  res.json({
    success: true,
    message: 'Social media links updated successfully',
    socialMedia: user.socialMedia
  });
}));

// @desc    Add certification
// @route   POST /api/users/certifications
// @access  Private
router.post('/certifications', validateCertification, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const certificationData = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.certifications.push(certificationData);
  await user.save();

  res.json({
    success: true,
    message: 'Certification added successfully',
    certification: user.certifications[user.certifications.length - 1]
  });
}));

// @desc    Delete certification
// @route   DELETE /api/users/certifications/:certId
// @access  Private
router.delete('/certifications/:certId', asyncHandler(async (req, res) => {
  const { certId } = req.params;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.certifications = user.certifications.filter(cert => cert._id.toString() !== certId);
  await user.save();

  res.json({
    success: true,
    message: 'Certification deleted successfully'
  });
}));

// @desc    Add award
// @route   POST /api/users/awards
// @access  Private
router.post('/awards', validateAward, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const awardData = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.awards.push(awardData);
  await user.save();

  res.json({
    success: true,
    message: 'Award added successfully',
    award: user.awards[user.awards.length - 1]
  });
}));

// @desc    Delete award
// @route   DELETE /api/users/awards/:awardId
// @access  Private
router.delete('/awards/:awardId', asyncHandler(async (req, res) => {
  const { awardId } = req.params;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.awards = user.awards.filter(award => award._id.toString() !== awardId);
  await user.save();

  res.json({
    success: true,
    message: 'Award deleted successfully'
  });
}));

// @desc    Toggle vacation mode
// @route   PUT /api/users/vacation-mode
// @access  Private
router.put('/vacation-mode', validateVacationMode, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { enabled, from, to, message } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (enabled) {
    await user.enableVacationMode(from, to, message);
  } else {
    await user.disableVacationMode();
  }

  res.json({
    success: true,
    message: `Vacation mode ${enabled ? 'enabled' : 'disabled'} successfully`,
    vacationMode: user.vacationMode
  });
}));

// @desc    Send email verification
// @route   POST /api/users/verify-email/send
// @access  Private
router.post('/verify-email/send', asyncHandler(async (req, res) => {
  const result = await verificationService.sendEmailVerification(req.userId);
  res.json(result);
}));

// @desc    Verify email with token
// @route   POST /api/users/verify-email
// @access  Public
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Token is required')
], asyncHandler(async (req, res) => {
  const { token } = req.body;
  const result = await verificationService.verifyEmail(token);
  res.json(result);
}));

// @desc    Send phone verification code
// @route   POST /api/users/verify-phone/send
// @access  Private
router.post('/verify-phone/send', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number')
], asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const result = await verificationService.sendPhoneVerification(req.userId, phone);
  res.json(result);
}));

// @desc    Verify phone with code
// @route   POST /api/users/verify-phone
// @access  Private
router.post('/verify-phone', [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Invalid verification code')
], asyncHandler(async (req, res) => {
  const { code } = req.body;
  const result = await verificationService.verifyPhone(req.userId, code);
  res.json(result);
}));

// @desc    Submit verification document
// @route   POST /api/users/documents
// @access  Private
router.post('/documents', [
  body('type').isIn(['gst', 'pan', 'business_license', 'address_proof']).withMessage('Invalid document type'),
  body('url').isURL().withMessage('Invalid document URL')
], asyncHandler(async (req, res) => {
  const documentData = req.body;
  const result = await verificationService.submitVerificationDocument(req.userId, documentData);
  res.json(result);
}));

// @desc    Get verification status
// @route   GET /api/users/verification-status
// @access  Private
router.get('/verification-status', asyncHandler(async (req, res) => {
  const status = await verificationService.getVerificationStatus(req.userId);
  res.json({ success: true, ...status });
}));

// @desc    Get detailed business analytics
// @route   GET /api/users/analytics
// @access  Private
router.get('/analytics', asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getBusinessAnalytics(req.userId);
  res.json({
    success: true,
    analytics
  });
}));

// @desc    Increment analytics counter
// @route   POST /api/users/analytics/increment
// @access  Private
router.post('/analytics/increment', [
  body('metric').isIn(['profileViews', 'productViews', 'catalogDownloads']).withMessage('Invalid metric')
], asyncHandler(async (req, res) => {
  const { metric } = req.body;
  await analyticsService.incrementAnalytics(req.userId, metric);
  res.json({ success: true, message: 'Analytics updated' });
}));

// @desc    Update return policy
// @route   PUT /api/users/return-policy
// @access  Private
router.put('/return-policy', validateReturnPolicy, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { returnPolicy } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.returnPolicy = { ...user.returnPolicy, ...returnPolicy };
  await user.save();

  res.json({
    success: true,
    message: 'Return policy updated successfully',
    returnPolicy: user.returnPolicy
  });
}));

export default router;
