import express from 'express';
import { query, validationResult } from 'express-validator';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('unreadOnly').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;

  let query = { recipient: req.userId };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .populate('sender', 'displayName businessName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: req.userId, isRead: false })
  ]);

  res.json({
    success: true,
    notifications,
    unreadCount,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.userId
  });

  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  await notification.markAsRead();

  res.json({
    success: true,
    message: 'Notification marked as read'
  });
}));

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', asyncHandler(async (req, res) => {
  await Notification.markAllAsRead(req.userId);

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
}));

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.userId
  });

  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  await notification.deleteOne();

  res.json({
    success: true,
    message: 'Notification deleted'
  });
}));

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.userId,
    isRead: false
  });

  res.json({
    success: true,
    count
  });
}));

export default router;
