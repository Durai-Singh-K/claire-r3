import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Ad from '../models/Ad.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { adminOnly, createRateLimit } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting
const createAdLimit = createRateLimit(60 * 60 * 1000, 5, 'Too many ads created. Please try again later.');

// @desc    Get ads for user location and interests
// @route   GET /api/ads
// @access  Private
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
  query('category')
    .optional()
    .isString(),
  query('location')
    .optional()
    .isString()
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, location } = req.query;
  
  // Use user's location and interests if not specified
  const user = await User.findById(req.userId);
  const targetLocation = location || user.shopLocation.city;
  const targetCategories = category ? [category] : user.categories;
  
  const ads = await Ad.findForLocation(targetLocation, targetCategories, limit);
  
  // Record impressions
  await Promise.all(ads.map(ad => ad.recordImpression()));
  
  res.json({
    success: true,
    ads: ads.map(ad => ({
      _id: ad._id,
      title: ad.title,
      description: ad.description,
      creative: ad.creative,
      product: ad.product,
      cta: ad.cta,
      owner: ad.owner,
      tier: ad.pricing.tier,
      isFeatured: ad.featured.isFeatured,
      isBoosted: ad.boost.isBoosted
    })),
    pagination: {
      currentPage: parseInt(page),
      limit: parseInt(limit)
    }
  });
}));

// @desc    Create new ad
// @route   POST /api/ads
// @access  Private
router.post('/', createAdLimit, [
  body('title')
    .isLength({ min: 5, max: 100 })
    .trim()
    .withMessage('Title must be 5-100 characters long'),
  body('description')
    .isLength({ min: 10, max: 500 })
    .trim()
    .withMessage('Description must be 10-500 characters long'),
  body('product.category')
    .notEmpty()
    .withMessage('Product category is required'),
  body('targeting.locations')
    .isArray({ min: 1 })
    .withMessage('At least one target location is required'),
  body('campaign.startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('campaign.endDate')
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('pricing.budget.total')
    .isFloat({ min: 100 })
    .withMessage('Minimum budget is ₹100')
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
    title,
    description,
    creative,
    product,
    targeting,
    campaign,
    cta,
    pricing
  } = req.body;
  
  // Validate dates
  const startDate = new Date(campaign.startDate);
  const endDate = new Date(campaign.endDate);
  const now = new Date();
  
  if (startDate < now) {
    return res.status(400).json({
      success: false,
      message: 'Start date cannot be in the past'
    });
  }
  
  if (endDate <= startDate) {
    return res.status(400).json({
      success: false,
      message: 'End date must be after start date'
    });
  }
  
  // Check if user has completed onboarding
  if (!req.user.onboardingCompleted) {
    return res.status(403).json({
      success: false,
      message: 'Complete onboarding before creating ads'
    });
  }
  
  // Create ad
  const ad = new Ad({
    owner: req.userId,
    title,
    description,
    creative,
    product,
    targeting,
    campaign,
    cta,
    pricing: {
      ...pricing,
      model: pricing.model || 'flat_rate',
      tier: pricing.tier || 'standard'
    },
    status: 'pending_approval'
  });
  
  await ad.save();
  
  res.status(201).json({
    success: true,
    message: 'Ad created successfully and submitted for approval',
    ad: {
      _id: ad._id,
      title: ad.title,
      status: ad.status,
      campaign: ad.campaign,
      pricing: ad.pricing
    }
  });
}));

// @desc    Get user's ads
// @route   GET /api/ads/my
// @access  Private
router.get('/my', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('status')
    .optional()
    .isIn(['draft', 'pending_approval', 'approved', 'active', 'paused', 'completed', 'rejected', 'cancelled'])
    .withMessage('Invalid status filter')
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  
  let query = { owner: req.userId };
  if (status) {
    query.status = status;
  }
  
  const ads = await Ad.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await Ad.countDocuments(query);
  
  // Add performance metrics
  const adsWithMetrics = ads.map(ad => ({
    ...ad.toObject(),
    performanceMetrics: ad.performanceMetrics,
    daysRemaining: ad.daysRemaining,
    isActive: ad.isActive
  }));
  
  res.json({
    success: true,
    ads: adsWithMetrics,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalAds: total,
      limit: parseInt(limit)
    }
  });
}));

// @desc    Get ad by ID
// @route   GET /api/ads/:id
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const ad = await Ad.findById(id).populate('owner', 'displayName businessName profilePicture');
  
  if (!ad) {
    return res.status(404).json({
      success: false,
      message: 'Ad not found'
    });
  }
  
  // Check if user can view this ad
  const canView = ad.owner._id.toString() === req.userId.toString() || 
                  ad.status === 'active' || 
                  req.user.isAdmin;
  
  if (!canView) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this ad'
    });
  }
  
  // Record interaction if viewing active ad
  if (ad.status === 'active' && ad.owner._id.toString() !== req.userId.toString()) {
    await ad.recordInteraction(req.userId, 'view');
  }
  
  res.json({
    success: true,
    ad: {
      ...ad.toObject(),
      performanceMetrics: ad.performanceMetrics,
      daysRemaining: ad.daysRemaining,
      isActive: ad.isActive
    }
  });
}));

// @desc    Update ad (Owner only)
// @route   PUT /api/ads/:id
// @access  Private
router.put('/:id', [
  body('title')
    .optional()
    .isLength({ min: 5, max: 100 })
    .trim()
    .withMessage('Title must be 5-100 characters long'),
  body('description')
    .optional()
    .isLength({ min: 10, max: 500 })
    .trim()
    .withMessage('Description must be 10-500 characters long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { id } = req.params;
  const ad = await Ad.findById(id);
  
  if (!ad) {
    return res.status(404).json({
      success: false,
      message: 'Ad not found'
    });
  }
  
  // Check ownership - fix authorization comparison
  const ownerIdString = ad.owner.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || ownerIdString !== userIdString) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this ad'
    });
  }
  
  // Can only update draft or rejected ads
  if (!['draft', 'rejected', 'paused'].includes(ad.status)) {
    return res.status(400).json({
      success: false,
      message: 'Can only update draft, rejected, or paused ads'
    });
  }
  
  const allowedUpdates = [
    'title', 'description', 'creative', 'product', 'targeting', 
    'campaign', 'cta', 'pricing'
  ];
  
  const updates = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  // Reset to pending approval if was rejected
  if (ad.status === 'rejected') {
    updates.status = 'pending_approval';
  }
  
  Object.assign(ad, updates);
  await ad.save();
  
  res.json({
    success: true,
    message: 'Ad updated successfully',
    ad: {
      _id: ad._id,
      title: ad.title,
      status: ad.status,
      campaign: ad.campaign
    }
  });
}));

// @desc    Pause/Resume ad (Owner only)
// @route   PUT /api/ads/:id/toggle
// @access  Private
router.put('/:id/toggle', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ad = await Ad.findById(id);
  
  if (!ad) {
    return res.status(404).json({
      success: false,
      message: 'Ad not found'
    });
  }
  
  // Check ownership - fix authorization comparison
  const ownerIdString = ad.owner.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || ownerIdString !== userIdString) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to modify this ad'
    });
  }
  
  if (ad.status === 'active') {
    await ad.pause();
    res.json({
      success: true,
      message: 'Ad paused successfully',
      status: 'paused'
    });
  } else if (ad.status === 'paused') {
    await ad.resume();
    res.json({
      success: true,
      message: 'Ad resumed successfully',
      status: 'active'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Can only pause/resume active or paused ads'
    });
  }
}));

// @desc    Click on ad
// @route   POST /api/ads/:id/click
// @access  Private
router.post('/:id/click', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { metadata = {} } = req.body;
  
  const ad = await Ad.findById(id);
  
  if (!ad || ad.status !== 'active') {
    return res.status(404).json({
      success: false,
      message: 'Ad not found or not active'
    });
  }
  
  // Don't allow owner to click their own ad
  if (ad.owner.toString() === req.userId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot click your own ad'
    });
  }
  
  // Record click
  await ad.recordInteraction(req.userId, 'click', metadata);
  
  // Calculate cost (simplified)
  let cost = 0;
  if (ad.pricing.model === 'cpc') {
    cost = ad.pricing.budget.total / 1000; // Simple CPC calculation
  } else if (ad.pricing.model === 'flat_rate') {
    cost = ad.pricing.budget.total / (ad.analytics.impressions || 1);
  }
  
  if (cost > 0) {
    await ad.updateSpent(cost);
  }
  
  res.json({
    success: true,
    message: 'Click recorded',
    cta: ad.cta
  });
}));

// @desc    Like ad
// @route   PUT /api/ads/:id/like
// @access  Private
router.put('/:id/like', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const ad = await Ad.findById(id);
  
  if (!ad || ad.status !== 'active') {
    return res.status(404).json({
      success: false,
      message: 'Ad not found or not active'
    });
  }
  
  await ad.recordInteraction(req.userId, 'like');
  
  res.json({
    success: true,
    message: 'Ad liked',
    likes: ad.analytics.likes
  });
}));

// @desc    Share ad
// @route   POST /api/ads/:id/share
// @access  Private
router.post('/:id/share', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const ad = await Ad.findById(id);
  
  if (!ad || ad.status !== 'active') {
    return res.status(404).json({
      success: false,
      message: 'Ad not found or not active'
    });
  }
  
  await ad.recordInteraction(req.userId, 'share');
  
  res.json({
    success: true,
    message: 'Ad shared',
    shares: ad.analytics.shares
  });
}));

// @desc    Get ad analytics (Owner only)
// @route   GET /api/ads/:id/analytics
// @access  Private
router.get('/:id/analytics', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { period = '7d' } = req.query;
  
  const ad = await Ad.findById(id);
  
  if (!ad) {
    return res.status(404).json({
      success: false,
      message: 'Ad not found'
    });
  }
  
  // Check ownership - fix authorization comparison
  const ownerIdString = ad.owner.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if ((!req.userId || ownerIdString !== userIdString) && !req.user?.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view analytics'
    });
  }
  
  // Filter daily stats based on period
  let days = 7;
  if (period === '30d') days = 30;
  else if (period === '90d') days = 90;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const filteredDailyStats = ad.analytics.dailyStats.filter(stat => 
    new Date(stat.date) >= cutoffDate
  );
  
  res.json({
    success: true,
    analytics: {
      ...ad.analytics.toObject(),
      dailyStats: filteredDailyStats,
      performanceMetrics: ad.performanceMetrics,
      budgetUtilization: {
        spent: ad.pricing.actualSpent,
        total: ad.pricing.budget.total,
        remaining: ad.pricing.budget.total - ad.pricing.actualSpent,
        utilizationPercent: ((ad.pricing.actualSpent / ad.pricing.budget.total) * 100).toFixed(2)
      }
    }
  });
}));

// ADMIN ROUTES

// @desc    Get ads pending approval (Admin only)
// @route   GET /api/ads/admin/pending
// @access  Private + Admin
router.get('/admin/pending', adminOnly, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const ads = await Ad.findPendingApproval(page, limit);
  
  const total = await Ad.countDocuments({ status: 'pending_approval' });
  
  res.json({
    success: true,
    ads,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalAds: total,
      limit: parseInt(limit)
    }
  });
}));

// @desc    Approve/Reject ad (Admin only)
// @route   PUT /api/ads/:id/review
// @access  Private + Admin
router.put('/:id/review', adminOnly, [
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be approve or reject'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('rejectionReason')
    .if(body('action').equals('reject'))
    .isIn(['inappropriate_content', 'misleading_claims', 'poor_quality', 'policy_violation', 'other'])
    .withMessage('Rejection reason is required when rejecting')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { id } = req.params;
  const { action, notes, rejectionReason } = req.body;
  
  const ad = await Ad.findById(id);
  
  if (!ad) {
    return res.status(404).json({
      success: false,
      message: 'Ad not found'
    });
  }
  
  if (ad.status !== 'pending_approval') {
    return res.status(400).json({
      success: false,
      message: 'Ad is not pending approval'
    });
  }
  
  if (action === 'approve') {
    await ad.approve(req.userId, notes);
    res.json({
      success: true,
      message: 'Ad approved successfully'
    });
  } else {
    await ad.reject(req.userId, rejectionReason, notes);
    res.json({
      success: true,
      message: 'Ad rejected successfully'
    });
  }
}));

// @desc    Feature ad (Admin only)
// @route   PUT /api/ads/:id/feature
// @access  Private + Admin
router.put('/:id/feature', adminOnly, [
  body('duration')
    .isInt({ min: 1, max: 30 })
    .withMessage('Duration must be 1-30 days'),
  body('position')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Position must be 1-10')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { id } = req.params;
  const { duration, position } = req.body;
  
  const ad = await Ad.findById(id);
  
  if (!ad) {
    return res.status(404).json({
      success: false,
      message: 'Ad not found'
    });
  }
  
  const until = new Date();
  until.setDate(until.getDate() + duration);
  
  await ad.feature(until, position);
  
  res.json({
    success: true,
    message: `Ad featured for ${duration} days`,
    featuredUntil: until
  });
}));

export default router;
