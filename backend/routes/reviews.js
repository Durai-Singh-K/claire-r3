import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { auth } from '../middleware/auth.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import {
  validateCreateReview,
  validateUpdateReview,
  validateAddResponse,
  validateFlagReview,
  validateGetReviews,
  validateReviewId
} from '../validators/reviewValidator.js';
import { validationResult } from 'express-validator';

const router = express.Router();

// All routes require authentication
router.use(auth);

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
router.post('/', validateCreateReview, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { reviewee, rating, title, comment, ratings, orderId, transactionId, images } = req.body;

  // Check if reviewee exists
  const revieweeUser = await User.findById(reviewee);
  if (!revieweeUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user is trying to review themselves
  if (req.userId.toString() === reviewee) {
    return res.status(400).json({
      success: false,
      message: 'You cannot review yourself'
    });
  }

  // Check if review already exists
  const existingReview = await Review.findOne({
    reviewer: req.userId,
    reviewee
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this user'
    });
  }

  const review = new Review({
    reviewer: req.userId,
    reviewee,
    rating,
    title,
    comment,
    ratings,
    orderId,
    transactionId,
    images: images || [],
    isVerifiedPurchase: !!orderId
  });

  await review.save();
  await review.populate('reviewer', 'displayName profilePicture businessName');

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    review
  });
}));

// @desc    Get reviews for a user
// @route   GET /api/reviews/:userId
// @access  Private
router.get('/:userId', validateGetReviews, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { userId } = req.params;
  const { page = 1, limit = 10, minRating = 1, sort = '-createdAt' } = req.query;

  const reviews = await Review.getReviewsForUser(userId, {
    page: parseInt(page),
    limit: parseInt(limit),
    minRating: parseInt(minRating),
    sort
  });

  const totalReviews = await Review.countDocuments({
    reviewee: userId,
    status: 'published'
  });

  res.json({
    success: true,
    reviews,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReviews / limit),
      totalReviews,
      limit: parseInt(limit)
    }
  });
}));

// @desc    Get review statistics for a user
// @route   GET /api/reviews/stats/:userId
// @access  Private
router.get('/stats/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const stats = await Review.getRatingStats(userId);

  res.json({
    success: true,
    stats
  });
}));

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private
router.put('/:reviewId', validateUpdateReview, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { reviewId } = req.params;
  const { rating, title, comment, ratings } = req.body;

  const review = await Review.findById(reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if user is the reviewer - fix authorization comparison
  const reviewerIdString = review.reviewer.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || reviewerIdString !== userIdString) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own reviews'
    });
  }

  // Update fields
  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;
  if (ratings !== undefined) review.ratings = { ...review.ratings, ...ratings };

  await review.save();

  res.json({
    success: true,
    message: 'Review updated successfully',
    review
  });
}));

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
router.delete('/:reviewId', validateReviewId, asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if user is the reviewer - fix authorization comparison
  const reviewerIdString = review.reviewer.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || reviewerIdString !== userIdString) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own reviews'
    });
  }

  await review.remove();

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
}));

// @desc    Add business response to a review
// @route   POST /api/reviews/:reviewId/response
// @access  Private
router.post('/:reviewId/response', validateAddResponse, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { reviewId } = req.params;
  const { response } = req.body;

  const review = await Review.findById(reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if user is the reviewee (business owner) - fix authorization comparison
  const revieweeIdString = review.reviewee.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || revieweeIdString !== userIdString) {
    return res.status(403).json({
      success: false,
      message: 'Only the business owner can respond to reviews'
    });
  }

  if (review.response && review.response.text) {
    return res.status(400).json({
      success: false,
      message: 'Response already exists. Update it instead.'
    });
  }

  await review.addResponse(response);

  res.json({
    success: true,
    message: 'Response added successfully',
    review
  });
}));

// @desc    Mark review as helpful
// @route   POST /api/reviews/:reviewId/helpful
// @access  Private
router.post('/:reviewId/helpful', validateReviewId, asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  await review.markHelpful(req.userId);

  res.json({
    success: true,
    message: 'Review marked as helpful',
    helpfulCount: review.helpfulCount
  });
}));

// @desc    Flag a review
// @route   POST /api/reviews/:reviewId/flag
// @access  Private
router.post('/:reviewId/flag', validateFlagReview, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { reviewId } = req.params;
  const { reason } = req.body;

  const review = await Review.findById(reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  await review.flag(reason, req.userId);

  res.json({
    success: true,
    message: 'Review flagged for moderation'
  });
}));

// @desc    Get user's own reviews (reviews they've written)
// @route   GET /api/reviews/my-reviews
// @access  Private
router.get('/my/reviews', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const reviews = await Review.find({ reviewer: req.userId })
    .populate('reviewee', 'displayName profilePicture businessName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const totalReviews = await Review.countDocuments({ reviewer: req.userId });

  res.json({
    success: true,
    reviews,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReviews / limit),
      totalReviews,
      limit: parseInt(limit)
    }
  });
}));

export default router;
