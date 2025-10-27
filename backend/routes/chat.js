import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Conversation, Message } from '../models/Chat.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createRateLimit } from '../middleware/auth.js';
import { io } from '../server.js';

const router = express.Router();

// Rate limiting
const messageLimit = createRateLimit(60 * 1000, 60, 'Too many messages. Please slow down.');

// @desc    Get user conversations
// @route   GET /api/chat/conversations
// @access  Private
router.get('/conversations', [
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
  
  const conversations = await Conversation.getUserConversations(req.userId, page, limit);
  
  // Add unread count and other participant info
  const conversationsWithInfo = conversations.map(conv => {
    const otherParticipant = conv.participants.find(p => 
      p.user._id.toString() !== req.userId.toString()
    );
    
    const unreadCount = conv.getUnreadCount(req.userId);
    
    return {
      _id: conv._id,
      otherParticipant: otherParticipant ? otherParticipant.user : null,
      lastMessage: conv.lastMessage,
      unreadCount,
      updatedAt: conv.updatedAt,
      settings: conv.settings
    };
  });
  
  res.json({
    success: true,
    conversations: conversationsWithInfo,
    pagination: {
      currentPage: parseInt(page),
      limit: parseInt(limit),
      hasMore: conversations.length === parseInt(limit)
    }
  });
}));

// @desc    Start or get conversation with user
// @route   POST /api/chat/conversations
// @access  Private
router.post('/conversations', [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { userId } = req.body;
  
  if (userId === req.userId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot start conversation with yourself'
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
  
  // Check if conversation already exists
  let conversation = await Conversation.findBetweenUsers(req.userId, userId);
  
  if (!conversation) {
    // Create new conversation
    conversation = new Conversation({
      participants: [
        { user: req.userId },
        { user: userId }
      ],
      participantStatus: [
        { user: req.userId },
        { user: userId }
      ]
    });
    
    await conversation.save();
  }
  
  // Populate participants
  await conversation.populate('participants.user', 'displayName businessName profilePicture onlineStatus');
  
  const otherParticipant = conversation.participants.find(p => 
    p.user._id.toString() !== req.userId.toString()
  );
  
  res.json({
    success: true,
    conversation: {
      _id: conversation._id,
      otherParticipant: otherParticipant.user,
      lastMessage: conversation.lastMessage,
      unreadCount: conversation.getUnreadCount(req.userId),
      settings: conversation.settings,
      createdAt: conversation.createdAt
    }
  });
}));

// @desc    Get messages in conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
router.get('/conversations/:id/messages', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  
  const conversation = await Conversation.findById(id);
  
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found'
    });
  }
  
  if (!conversation.isParticipant(req.userId)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this conversation'
    });
  }
  
  const messages = await Message.getConversationMessages(id, page, limit);
  
  // Mark messages as read
  const unreadMessages = messages.filter(msg => 
    msg.sender._id.toString() !== req.userId.toString() &&
    !msg.readBy.some(r => r.user.toString() === req.userId.toString())
  );
  
  await Promise.all(unreadMessages.map(msg => msg.markAsRead(req.userId)));
  
  // Update conversation last seen
  await conversation.updateLastSeen(req.userId);
  
  // Format messages for response
  const formattedMessages = messages.map(msg => {
    let content = msg.content.original.text;
    
    // Get translation if user's preferred language is different
    if (req.user.preferredLanguage !== msg.content.original.language) {
      const translation = msg.getTranslation(req.user.preferredLanguage);
      if (translation) {
        content = translation.text;
      }
    }
    
    return {
      _id: msg._id,
      sender: msg.sender,
      content: {
        text: content,
        original: msg.content.original,
        hasTranslation: msg.content.translated.length > 0
      },
      type: msg.type,
      voice: msg.voice,
      media: msg.media,
      reactions: msg.reactions,
      replyTo: msg.replyTo,
      isEdited: msg.isEdited,
      createdAt: msg.createdAt,
      readBy: msg.readBy
    };
  });
  
  res.json({
    success: true,
    messages: formattedMessages.reverse(), // Reverse to get chronological order
    pagination: {
      currentPage: parseInt(page),
      limit: parseInt(limit),
      hasMore: messages.length === parseInt(limit)
    }
  });
}));

// @desc    Send message
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
router.post('/conversations/:id/messages', messageLimit, [
  body('content.text')
    .optional()
    .isLength({ min: 1, max: 10000 })
    .trim()
    .withMessage('Message content must be 1-10000 characters'),
  body('type')
    .isIn(['text', 'voice', 'image', 'file'])
    .withMessage('Invalid message type'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid reply message ID')
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
  const { content, type, voice, media, replyTo } = req.body;
  
  const conversation = await Conversation.findById(id);
  
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found'
    });
  }
  
  if (!conversation.isParticipant(req.userId)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to send messages in this conversation'
    });
  }
  
  // Validate reply message
  if (replyTo) {
    const replyMessage = await Message.findOne({
      _id: replyTo,
      conversation: id
    });
    
    if (!replyMessage) {
      return res.status(400).json({
        success: false,
        message: 'Reply message not found'
      });
    }
  }
  
  // Create message
  const message = new Message({
    conversation: id,
    sender: req.userId,
    content: {
      original: {
        text: content?.text || '',
        language: content?.language || 'auto'
      }
    },
    type,
    voice,
    media,
    replyTo
  });
  
  await message.save();
  
  // Update conversation
  await conversation.updateLastMessage({
    content: message.content,
    sender: message.sender,
    type: message.type,
    createdAt: message.createdAt
  });
  
  // Populate sender for response
  await message.populate('sender', 'displayName businessName profilePicture');
  if (replyTo) {
    await message.populate('replyTo', 'content.original.text sender');
  }
  
  // Emit message via Socket.IO
  const otherParticipants = conversation.participants
    .filter(p => p.user.toString() !== req.userId.toString())
    .map(p => p.user.toString());
  
  otherParticipants.forEach(participantId => {
    io.to(`user_${participantId}`).emit('new_message', {
      conversationId: id,
      message: {
        _id: message._id,
        sender: message.sender,
        content: message.content,
        type: message.type,
        voice: message.voice,
        media: message.media,
        replyTo: message.replyTo,
        createdAt: message.createdAt
      }
    });
  });
  
  res.status(201).json({
    success: true,
    message: {
      _id: message._id,
      sender: message.sender,
      content: message.content,
      type: message.type,
      voice: message.voice,
      media: message.media,
      reactions: message.reactions,
      replyTo: message.replyTo,
      createdAt: message.createdAt
    }
  });
}));

// @desc    React to message
// @route   PUT /api/chat/messages/:id/react
// @access  Private
router.put('/messages/:id/react', [
  body('emoji')
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji is required')
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
  const { emoji } = req.body;
  
  const message = await Message.findById(id).populate('conversation');
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }
  
  const conversation = await Conversation.findById(message.conversation);
  if (!conversation.isParticipant(req.userId)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to react to this message'
    });
  }
  
  await message.addReaction(req.userId, emoji);
  
  // Emit reaction via Socket.IO
  const otherParticipants = conversation.participants
    .filter(p => p.user.toString() !== req.userId.toString())
    .map(p => p.user.toString());
  
  otherParticipants.forEach(participantId => {
    io.to(`user_${participantId}`).emit('message_reaction', {
      messageId: id,
      reaction: { user: req.userId, emoji },
      action: 'add'
    });
  });
  
  res.json({
    success: true,
    message: 'Reaction added',
    reactions: message.reactions
  });
}));

// @desc    Remove reaction from message
// @route   DELETE /api/chat/messages/:id/react
// @access  Private
router.delete('/messages/:id/react', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const message = await Message.findById(id).populate('conversation');
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }
  
  const conversation = await Conversation.findById(message.conversation);
  if (!conversation.isParticipant(req.userId)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to react to this message'
    });
  }
  
  await message.removeReaction(req.userId);
  
  // Emit reaction removal via Socket.IO
  const otherParticipants = conversation.participants
    .filter(p => p.user.toString() !== req.userId.toString())
    .map(p => p.user.toString());
  
  otherParticipants.forEach(participantId => {
    io.to(`user_${participantId}`).emit('message_reaction', {
      messageId: id,
      userId: req.userId,
      action: 'remove'
    });
  });
  
  res.json({
    success: true,
    message: 'Reaction removed',
    reactions: message.reactions
  });
}));

// @desc    Edit message
// @route   PUT /api/chat/messages/:id
// @access  Private
router.put('/messages/:id', [
  body('content')
    .isLength({ min: 1, max: 10000 })
    .trim()
    .withMessage('Message content must be 1-10000 characters')
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
  const { content } = req.body;
  
  const message = await Message.findById(id).populate('conversation');
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }
  
  if (message.sender.toString() !== req.userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Can only edit your own messages'
    });
  }
  
  if (message.type !== 'text') {
    return res.status(400).json({
      success: false,
      message: 'Can only edit text messages'
    });
  }
  
  await message.editMessage(content);
  
  // Emit message edit via Socket.IO
  const conversation = await Conversation.findById(message.conversation);
  const otherParticipants = conversation.participants
    .filter(p => p.user.toString() !== req.userId.toString())
    .map(p => p.user.toString());
  
  otherParticipants.forEach(participantId => {
    io.to(`user_${participantId}`).emit('message_edited', {
      messageId: id,
      newContent: content,
      editedAt: new Date()
    });
  });
  
  res.json({
    success: true,
    message: 'Message edited successfully',
    content: message.content,
    isEdited: message.isEdited
  });
}));

// @desc    Update conversation settings
// @route   PUT /api/chat/conversations/:id/settings
// @access  Private
router.put('/conversations/:id/settings', [
  body('autoTranslate')
    .optional()
    .isBoolean()
    .withMessage('Auto translate must be a boolean'),
  body('notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean')
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
  const { autoTranslate, notifications } = req.body;
  
  const conversation = await Conversation.findById(id);
  
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found'
    });
  }
  
  if (!conversation.isParticipant(req.userId)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to modify this conversation'
    });
  }
  
  // Update settings
  if (autoTranslate !== undefined) conversation.settings.autoTranslate = autoTranslate;
  if (notifications !== undefined) conversation.settings.notifications = notifications;
  
  await conversation.save();
  
  res.json({
    success: true,
    message: 'Settings updated',
    settings: conversation.settings
  });
}));

// @desc    Set typing status
// @route   PUT /api/chat/conversations/:id/typing
// @access  Private
router.put('/conversations/:id/typing', [
  body('isTyping')
    .isBoolean()
    .withMessage('Typing status must be boolean')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isTyping } = req.body;
  
  const conversation = await Conversation.findById(id);
  
  if (!conversation || !conversation.isParticipant(req.userId)) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found'
    });
  }
  
  await conversation.setTyping(req.userId, isTyping);
  
  // Emit typing status via Socket.IO
  const otherParticipants = conversation.participants
    .filter(p => p.user.toString() !== req.userId.toString())
    .map(p => p.user.toString());
  
  otherParticipants.forEach(participantId => {
    io.to(`user_${participantId}`).emit('typing_status', {
      conversationId: id,
      userId: req.userId,
      isTyping
    });
  });
  
  res.json({
    success: true,
    message: 'Typing status updated'
  });
}));

// @desc    Delete conversation
// @route   DELETE /api/chat/conversations/:id
// @access  Private
router.delete('/conversations/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const conversation = await Conversation.findById(id);
  
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found'
    });
  }
  
  if (!conversation.isParticipant(req.userId)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this conversation'
    });
  }
  
  // Remove user from conversation
  await conversation.removeParticipant(req.userId);
  
  // If no active participants left, mark conversation as inactive
  const activeParticipants = conversation.participants.filter(p => !p.leftAt);
  if (activeParticipants.length === 0) {
    conversation.isActive = false;
    await conversation.save();
  }
  
  res.json({
    success: true,
    message: 'Conversation deleted'
  });
}));

// @desc    Search messages
// @route   GET /api/chat/search
// @access  Private
router.get('/search', [
  query('q')
    .isLength({ min: 1 })
    .withMessage('Search query is required'),
  query('conversationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid conversation ID')
], asyncHandler(async (req, res) => {
  const { q, conversationId, page = 1, limit = 20 } = req.query;
  
  let searchQuery = {
    $text: { $search: q }
  };
  
  // If conversation ID provided, search within that conversation
  if (conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isParticipant(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to search this conversation'
      });
    }
    searchQuery.conversation = conversationId;
  } else {
    // Search across all user's conversations
    const userConversations = await Conversation.find({
      'participants.user': req.userId,
      isActive: true
    }).select('_id');
    
    searchQuery.conversation = { $in: userConversations.map(c => c._id) };
  }
  
  const messages = await Message.find(searchQuery)
    .populate('sender', 'displayName businessName profilePicture')
    .populate('conversation', 'participants')
    .sort({ score: { $meta: 'textScore' } })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  res.json({
    success: true,
    messages: messages.map(msg => ({
      _id: msg._id,
      sender: msg.sender,
      content: msg.content,
      conversation: msg.conversation._id,
      createdAt: msg.createdAt
    })),
    pagination: {
      currentPage: parseInt(page),
      limit: parseInt(limit),
      hasMore: messages.length === parseInt(limit)
    }
  });
}));

export default router;
