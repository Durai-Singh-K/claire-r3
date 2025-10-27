import express from 'express';
import { query, validationResult } from 'express-validator';
import Community from '../models/Community.js';
import CommunityMessage from '../models/CommunityMessage.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get community messages
// @route   GET /api/community-chat/:communityId/messages
// @access  Private
router.get('/:communityId/messages', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // Check if user is member
  const community = await Community.findById(communityId);
  if (!community || !community.isMember(req.userId)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view messages'
    });
  }

  const messages = await CommunityMessage.getCommunityMessages(communityId, page, limit);

  // Reverse to show oldest first
  messages.reverse();

  res.json({
    success: true,
    messages,
    pagination: {
      currentPage: parseInt(page),
      limit: parseInt(limit)
    }
  });
}));

export default router;
