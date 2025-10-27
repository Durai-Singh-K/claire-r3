import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Community from '../models/Community.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { communityAdmin, createRateLimit } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting for community creation
const createCommunityLimit = createRateLimit(60 * 60 * 1000, 3, 'Too many communities created. Please try again later.');

// @desc    Get all public communities
// @route   GET /api/communities
// @access  Private
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('category')
    .optional()
    .isString(),
  query('location')
    .optional()
    .isString(),
  query('sortBy')
    .optional()
    .isIn(['popular', 'newest', 'active'])
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, location, sortBy = 'popular', search } = req.query;
  
  let communities;
  
  if (search) {
    // Text search
    const searchQuery = {
      $text: { $search: search },
      isPrivate: false,
      isActive: true
    };
    
    if (category) searchQuery.categories = category;
    if (location) searchQuery['targetLocations.city'] = new RegExp(location, 'i');
    
    communities = await Community.find(searchQuery)
      .populate('creator', 'displayName businessName profilePicture')
      .sort({ score: { $meta: 'textScore' } })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
  } else if (category) {
    communities = await Community.findByCategory(category, page, limit);
  } else if (location) {
    communities = await Community.findByLocation(location, page, limit);
  } else {
    communities = await Community.findPublic(page, limit);
  }
  
  // Add membership status for current user
  const communitiesWithStatus = await Promise.all(communities.map(async (community) => {
    const isMember = community.isMember(req.userId);
    const isAdmin = community.isAdmin(req.userId);
    
    return {
      ...community.toObject(),
      isMember,
      isAdmin,
      memberCount: community.memberCount
    };
  }));
  
  const total = await Community.countDocuments({
    isPrivate: false,
    isActive: true,
    ...(category && { categories: category }),
    ...(location && { 'targetLocations.city': new RegExp(location, 'i') })
  });
  
  res.json({
    success: true,
    communities: communitiesWithStatus,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalCommunities: total,
      limit: parseInt(limit)
    }
  });
}));

// @desc    Create new community
// @route   POST /api/communities
// @access  Private
router.post('/', createCommunityLimit, [
  body('name')
    .isLength({ min: 3, max: 100 })
    .trim()
    .withMessage('Community name must be 3-100 characters long'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage('Description cannot exceed 1000 characters'),
  body('categories')
    .isArray({ min: 1 })
    .withMessage('At least one category must be selected'),
  body('targetLocations')
    .isArray({ min: 1 })
    .withMessage('At least one target location must be specified')
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
    name,
    description,
    isPrivate = false,
    categories,
    targetLocations,
    coverImage,
    icon,
    rules = []
  } = req.body;
  
  // Check if user has completed onboarding
  if (!req.user.onboardingCompleted) {
    return res.status(403).json({
      success: false,
      message: 'Complete onboarding before creating communities'
    });
  }
  
  // Create community
  const community = new Community({
    name,
    description,
    isPrivate,
    categories,
    targetLocations,
    coverImage,
    icon,
    rules,
    creator: req.userId,
    admins: [{
      user: req.userId,
      permissions: ['manage_members', 'manage_posts', 'manage_settings', 'make_announcements', 'moderate_content'],
      assignedBy: req.userId
    }],
    members: [{
      user: req.userId,
      role: 'member',
      status: 'active'
    }]
  });
  
  if (isPrivate) {
    await community.generateInviteCode();
    await community.generateInviteLink();
  }
  
  await community.save();
  
  // Add community to user's communities list
  await User.findByIdAndUpdate(req.userId, {
    $push: {
      communities: {
        community: community._id,
        role: 'admin',
        joinedAt: new Date()
      }
    }
  });
  
  await community.populate('creator', 'displayName businessName profilePicture');
  
  res.status(201).json({
    success: true,
    message: 'Community created successfully',
    community: {
      ...community.toObject(),
      isMember: true,
      isAdmin: true
    }
  });
}));

// @desc    Get user's communities
// @route   GET /api/communities/my
// @access  Private
router.get('/my', asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId)
    .populate({
      path: 'communities.community',
      populate: {
        path: 'creator',
        select: 'displayName businessName profilePicture'
      }
    });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const communities = user.communities
    .filter(uc => uc.community) // Filter out null communities
    .map(uc => ({
      ...uc.community.toObject(),
      userRole: uc.role,
      joinedAt: uc.joinedAt,
      isMember: true,
      isAdmin: uc.role === 'admin' || uc.community.creator._id.toString() === req.userId.toString()
    }));

  res.json({
    success: true,
    communities
  });
}));

// @desc    Get community by ID
// @route   GET /api/communities/:id
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const community = await Community.findById(id)
    .populate('creator', 'displayName businessName profilePicture')
    .populate('admins.user', 'displayName businessName profilePicture')
    .populate('members.user', 'displayName businessName profilePicture shopLocation');
  
  if (!community || !community.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Community not found'
    });
  }
  
  const isMember = community.isMember(req.userId);
  const isAdmin = community.isAdmin(req.userId);
  
  // Check if user can access private community
  if (community.isPrivate && !isMember) {
    return res.status(403).json({
      success: false,
      message: 'This is a private community'
    });
  }
  
  res.json({
    success: true,
    community: {
      ...community.toObject(),
      isMember,
      isAdmin,
      memberCount: community.memberCount
    }
  });
}));

// @desc    Join community
// @route   POST /api/communities/:id/join
// @access  Private
router.post('/:id/join', [
  body('inviteCode')
    .optional()
    .isString()
    .withMessage('Invite code must be a string'),
  body('inviteLink')
    .optional()
    .isString()
    .withMessage('Invite link must be a string')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { inviteCode, inviteLink } = req.body;
  
  const community = await Community.findById(id);
  
  if (!community || !community.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Community not found'
    });
  }
  
  if (community.isMember(req.userId)) {
    return res.status(400).json({
      success: false,
      message: 'Already a member of this community'
    });
  }
  
  // Check if private community and validate invite
  if (community.isPrivate) {
    if (!inviteCode && !inviteLink) {
      return res.status(400).json({
        success: false,
        message: 'Invite code or link required for private community'
      });
    }
    
    const isValidInvite = (inviteCode && community.inviteCode === inviteCode) ||
                         (inviteLink && community.inviteLink === inviteLink);
    
    if (!isValidInvite) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invite code or link'
      });
    }
  }
  
  // Add user to community
  await community.addMember(req.userId);
  
  // Add community to user's communities list
  await User.findByIdAndUpdate(req.userId, {
    $push: {
      communities: {
        community: community._id,
        role: 'member',
        joinedAt: new Date()
      }
    }
  });
  
  await community.updateActivity();
  
  res.json({
    success: true,
    message: 'Successfully joined community',
    community: {
      _id: community._id,
      name: community.name,
      memberCount: community.memberCount + 1
    }
  });
}));

// @desc    Leave community
// @route   POST /api/communities/:id/leave
// @access  Private
router.post('/:id/leave', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const community = await Community.findById(id);
  
  if (!community) {
    return res.status(404).json({
      success: false,
      message: 'Community not found'
    });
  }
  
  if (!community.isMember(req.userId)) {
    return res.status(400).json({
      success: false,
      message: 'Not a member of this community'
    });
  }
  
  // Check if user is the creator
  if (community.creator.toString() === req.userId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Community creator cannot leave. Transfer ownership or delete community.'
    });
  }
  
  // Remove from community
  await community.removeMember(req.userId);
  
  // Remove from user's communities list
  await User.findByIdAndUpdate(req.userId, {
    $pull: {
      communities: { community: community._id }
    }
  });
  
  res.json({
    success: true,
    message: 'Successfully left community'
  });
}));

// @desc    Get community posts
// @route   GET /api/communities/:id/posts
// @access  Private
router.get('/:id/posts', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const community = await Community.findById(id);
  
  if (!community || !community.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Community not found'
    });
  }
  
  const isMember = community.isMember(req.userId);
  
  // Check access for private community
  if (community.isPrivate && !isMember) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to private community'
    });
  }
  
  const posts = await Post.findByCommunity(id, page, limit);
  
  res.json({
    success: true,
    posts,
    pagination: {
      currentPage: parseInt(page),
      limit: parseInt(limit)
    }
  });
}));

// @desc    Generate new invite code (Admin only)
// @route   POST /api/communities/:id/invite-code
// @access  Private + Admin
router.post('/:id/invite-code', communityAdmin, asyncHandler(async (req, res) => {
  const community = req.community;
  
  if (!community.isPrivate) {
    return res.status(400).json({
      success: false,
      message: 'Only private communities can have invite codes'
    });
  }
  
  await community.generateInviteCode();
  
  res.json({
    success: true,
    message: 'New invite code generated',
    inviteCode: community.inviteCode
  });
}));

// @desc    Generate new invite link (Admin only)
// @route   POST /api/communities/:id/invite-link
// @access  Private + Admin
router.post('/:id/invite-link', communityAdmin, asyncHandler(async (req, res) => {
  const community = req.community;
  
  if (!community.isPrivate) {
    return res.status(400).json({
      success: false,
      message: 'Only private communities can have invite links'
    });
  }
  
  await community.generateInviteLink();
  
  res.json({
    success: true,
    message: 'New invite link generated',
    inviteLink: `${process.env.FRONTEND_URL}/communities/join/${community.inviteLink}`
  });
}));

// @desc    Update community (Admin only)
// @route   PUT /api/communities/:id
// @access  Private + Admin
router.put('/:id', communityAdmin, [
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .trim()
    .withMessage('Community name must be 3-100 characters long'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage('Description cannot exceed 1000 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const community = req.community;
  const allowedUpdates = [
    'name', 'description', 'categories', 'targetLocations', 
    'coverImage', 'icon', 'rules', 'settings'
  ];
  
  const updates = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  Object.assign(community, updates);
  await community.save();
  
  res.json({
    success: true,
    message: 'Community updated successfully',
    community
  });
}));

// @desc    Manage community member (Admin only)
// @route   PUT /api/communities/:id/members/:memberId
// @access  Private + Admin
router.put('/:id/members/:memberId', communityAdmin, [
  body('action')
    .isIn(['promote', 'demote', 'mute', 'unmute', 'ban', 'unban'])
    .withMessage('Invalid action'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
], asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const { action, reason } = req.body;
  const community = req.community;
  
  if (!community.isMember(memberId)) {
    return res.status(400).json({
      success: false,
      message: 'User is not a member of this community'
    });
  }
  
  const member = community.members.find(m => m.user.toString() === memberId);
  
  if (!member) {
    return res.status(404).json({
      success: false,
      message: 'Member not found'
    });
  }
  
  switch (action) {
    case 'promote':
      if (member.role === 'moderator') {
        return res.status(400).json({
          success: false,
          message: 'User is already a moderator'
        });
      }
      member.role = 'moderator';
      break;
      
    case 'demote':
      if (member.role === 'member') {
        return res.status(400).json({
          success: false,
          message: 'User is already a regular member'
        });
      }
      member.role = 'member';
      break;
      
    case 'mute':
      member.status = 'muted';
      break;
      
    case 'unmute':
      member.status = 'active';
      break;
      
    case 'ban':
      member.status = 'banned';
      // Remove from user's communities list
      await User.findByIdAndUpdate(memberId, {
        $pull: { communities: { community: community._id } }
      });
      break;
      
    case 'unban':
      member.status = 'active';
      break;
  }
  
  await community.save();
  
  res.json({
    success: true,
    message: `Member ${action}ed successfully`
  });
}));

// @desc    Add community admin (Creator only)
// @route   POST /api/communities/:id/admins
// @access  Private + Creator
router.post('/:id/admins', [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID required'),
  body('permissions')
    .isArray()
    .withMessage('Permissions array required')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId, permissions } = req.body;
  
  const community = await Community.findById(id);
  
  if (!community) {
    return res.status(404).json({
      success: false,
      message: 'Community not found'
    });
  }
  
  // Only creator can add admins - fix authorization comparison
  const creatorIdString = community.creator.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || creatorIdString !== userIdString) {
    return res.status(403).json({
      success: false,
      message: 'Only community creator can add admins'
    });
  }
  
  try {
    await community.addAdmin(userId, permissions, req.userId);
    
    res.json({
      success: true,
      message: 'Admin added successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

export default router;
