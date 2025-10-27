import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Post from '../models/Post.js';
import Community from '../models/Community.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createRateLimit } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting
const createPostLimit = createRateLimit(60 * 60 * 1000, 20, 'Too many posts created. Please try again later.');
const likeLimit = createRateLimit(60 * 1000, 100, 'Too many likes. Please slow down.');
const commentLimit = createRateLimit(60 * 60 * 1000, 50, 'Too many comments. Please try again later.');

// @desc    Get all posts (alias for feed)
// @route   GET /api/posts
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
  query('type')
    .optional()
    .isIn(['all', 'products', 'community', 'friends'])
    .withMessage('Invalid feed type')
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type = 'all', location, categories } = req.query;

  let posts = [];

  if (type === 'community') {
    // Get posts from user's communities
    const user = await User.findById(req.userId);
    const userCommunities = user.communities.map(c => c.community);

    posts = await Post.find({
      community: { $in: userCommunities },
      status: 'active'
    })
    .populate('author', 'displayName businessName profilePicture')
    .populate('community', 'name')
    .sort({ isPinned: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  } else if (type === 'friends') {
    // Get posts from friends
    const user = await User.findById(req.userId);
    const friendIds = user.friends
      .filter(f => f.status === 'accepted')
      .map(f => f.user);

    posts = await Post.find({
      author: { $in: friendIds },
      status: 'active'
    })
    .populate('author', 'displayName businessName profilePicture')
    .populate('community', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  } else if (type === 'products') {
    // Get product posts
    const categoryArray = categories ? categories.split(',') : [];
    posts = await Post.findProducts({ location, category: categoryArray[0] }, page, limit);

  } else {
    // Get all public posts
    const categoryArray = categories ? categories.split(',') : [];
    posts = await Post.findPublicFeed(page, limit, location, categoryArray);
  }

  // Add user interaction info
  const postsWithInteractions = posts.map(post => {
    const liked = post.isLikedBy(req.userId);
    return {
      ...post.toObject(),
      liked,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount
    };
  });

  res.json({
    success: true,
    posts: postsWithInteractions,
    pagination: {
      currentPage: parseInt(page),
      limit: parseInt(limit),
      hasMore: posts.length === parseInt(limit)
    }
  });
}));

// @desc    Get feed posts
// @route   GET /api/posts/feed
// @access  Private
router.get('/feed', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('type')
    .optional()
    .isIn(['all', 'products', 'community', 'friends'])
    .withMessage('Invalid feed type')
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type = 'all', location, categories } = req.query;
  
  let posts = [];
  
  if (type === 'community') {
    // Get posts from user's communities
    const user = await User.findById(req.userId);
    const userCommunities = user.communities.map(c => c.community);
    
    posts = await Post.find({
      community: { $in: userCommunities },
      status: 'active'
    })
    .populate('author', 'displayName businessName profilePicture')
    .populate('community', 'name')
    .sort({ isPinned: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
    
  } else if (type === 'friends') {
    // Get posts from friends
    const user = await User.findById(req.userId);
    const friendIds = user.friends
      .filter(f => f.status === 'accepted')
      .map(f => f.user);
    
    posts = await Post.find({
      author: { $in: friendIds },
      status: 'active'
    })
    .populate('author', 'displayName businessName profilePicture')
    .populate('community', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
    
  } else if (type === 'products') {
    // Get product posts
    const categoryArray = categories ? categories.split(',') : [];
    posts = await Post.findProducts({ location, category: categoryArray[0] }, page, limit);
    
  } else {
    // Get all public posts
    const categoryArray = categories ? categories.split(',') : [];
    posts = await Post.findPublicFeed(page, limit, location, categoryArray);
  }
  
  // Add user interaction info
  const postsWithInteractions = posts.map(post => {
    const liked = post.isLikedBy(req.userId);
    return {
      ...post.toObject(),
      liked,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount
    };
  });
  
  res.json({
    success: true,
    posts: postsWithInteractions,
    pagination: {
      currentPage: parseInt(page),
      limit: parseInt(limit),
      hasMore: posts.length === parseInt(limit)
    }
  });
}));

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
router.post('/', createPostLimit, [
  body('content.text')
    .optional()
    .isLength({ max: 2000 })
    .trim()
    .withMessage('Post content cannot exceed 2000 characters'),
  body('content.type')
    .isIn(['text', 'image', 'product', 'announcement', 'poll', 'event'])
    .withMessage('Invalid post type'),
  body('community')
    .optional()
    .isMongoId()
    .withMessage('Invalid community ID')
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
    content,
    images = [],
    product,
    location,
    community,
    hashtags = [],
    poll,
    event
  } = req.body;
  
  // Validate community access if specified
  if (community) {
    const communityDoc = await Community.findById(community);
    if (!communityDoc || !communityDoc.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to post in this community'
      });
    }
    
    // Check if user is muted or banned
    const member = communityDoc.members.find(m => m.user.toString() === req.userId.toString());
    if (member && (member.status === 'muted' || member.status === 'banned')) {
      return res.status(403).json({
        success: false,
        message: 'You are muted or banned from this community'
      });
    }
  }
  
  // Create post
  const post = new Post({
    author: req.userId,
    community: community || null,
    content,
    images,
    product,
    location,
    hashtags,
    poll,
    event
  });
  
  // Set announcement if user is admin and type is announcement
  if (content.type === 'announcement' && community) {
    const communityDoc = await Community.findById(community);
    if (communityDoc.isAdmin(req.userId)) {
      post.isAnnouncement = true;
    }
  }
  
  await post.save();
  
  // Update community activity and stats
  if (community) {
    await Community.findByIdAndUpdate(community, {
      $inc: { 'stats.totalPosts': 1 },
      lastActivity: new Date()
    });
  }
  
  // Populate author for response
  await post.populate('author', 'displayName businessName profilePicture');
  if (community) {
    await post.populate('community', 'name');
  }
  
  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    post: {
      ...post.toObject(),
      liked: false,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0
    }
  });
}));

// @desc    Get platform stats
// @route   GET /api/posts/stats
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count posts created today
    const postsToday = await Post.countDocuments({
      createdAt: { $gte: today },
      status: 'active'
    });

    // Count active users (users who posted or commented today)
    const activePostAuthors = await Post.distinct('author', {
      createdAt: { $gte: today },
      status: 'active'
    });

    // Count product posts created today
    const newProducts = await Post.countDocuments({
      createdAt: { $gte: today },
      product: { $exists: true, $ne: null },
      status: 'active'
    });

    res.json({
      success: true,
      stats: {
        postsToday,
        activeUsers: activePostAuthors.length,
        newProducts
      }
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    res.json({
      success: true,
      stats: {
        postsToday: 0,
        activeUsers: 0,
        newProducts: 0
      }
    });
  }
}));

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const post = await Post.findById(id)
    .populate('author', 'displayName businessName profilePicture')
    .populate('community', 'name isPrivate')
    .populate('comments.user', 'displayName businessName profilePicture')
    .populate('comments.replies.user', 'displayName businessName profilePicture');
  
  if (!post || post.status !== 'active') {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }
  
  // Check access for community posts
  if (post.community && post.community.isPrivate) {
    const community = await Community.findById(post.community._id);
    if (!community.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to private community post'
      });
    }
  }
  
  // Increment view count
  await post.incrementViews();
  
  const liked = post.isLikedBy(req.userId);
  
  res.json({
    success: true,
    post: {
      ...post.toObject(),
      liked,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount
    }
  });
}));

// @desc    Like/Unlike post
// @route   PUT /api/posts/:id/like
// @access  Private
router.put('/:id/like', likeLimit, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const post = await Post.findById(id);
  
  if (!post || post.status !== 'active') {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }
  
  // Check access for community posts
  if (post.community) {
    const community = await Community.findById(post.community);
    if (community && community.isPrivate && !community.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
  }
  
  await post.toggleLike(req.userId);
  const liked = post.isLikedBy(req.userId);
  
  res.json({
    success: true,
    message: liked ? 'Post liked' : 'Post unliked',
    liked,
    likeCount: post.likeCount
  });
}));

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
router.post('/:id/comments', commentLimit, [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .trim()
    .withMessage('Comment must be 1-1000 characters long')
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
  
  const post = await Post.findById(id);
  
  if (!post || post.status !== 'active') {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }
  
  // Check access for community posts
  if (post.community) {
    const community = await Community.findById(post.community);
    if (community && community.isPrivate && !community.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Check if user is muted
    const member = community.members.find(m => m.user.toString() === req.userId.toString());
    if (member && member.status === 'muted') {
      return res.status(403).json({
        success: false,
        message: 'You are muted in this community'
      });
    }
  }
  
  await post.addComment(req.userId, content);
  
  // Get the newly added comment with populated user
  const updatedPost = await Post.findById(id)
    .populate('comments.user', 'displayName businessName profilePicture');
  
  const newComment = updatedPost.comments[updatedPost.comments.length - 1];
  
  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    comment: newComment,
    commentCount: updatedPost.commentCount
  });
}));

// @desc    Reply to comment
// @route   POST /api/posts/:id/comments/:commentId/replies
// @access  Private
router.post('/:id/comments/:commentId/replies', commentLimit, [
  body('content')
    .isLength({ min: 1, max: 500 })
    .trim()
    .withMessage('Reply must be 1-500 characters long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { id, commentId } = req.params;
  const { content } = req.body;
  
  const post = await Post.findById(id);
  
  if (!post || post.status !== 'active') {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }
  
  const comment = post.comments.id(commentId);
  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }
  
  // Check access for community posts
  if (post.community) {
    const community = await Community.findById(post.community);
    if (community && community.isPrivate && !community.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Check if user is muted
    const member = community.members.find(m => m.user.toString() === req.userId.toString());
    if (member && member.status === 'muted') {
      return res.status(403).json({
        success: false,
        message: 'You are muted in this community'
      });
    }
  }
  
  comment.replies.push({
    user: req.userId,
    content
  });
  
  await post.save();
  
  // Populate the new reply
  await post.populate('comments.replies.user', 'displayName businessName profilePicture');
  
  const updatedComment = post.comments.id(commentId);
  const newReply = updatedComment.replies[updatedComment.replies.length - 1];
  
  res.status(201).json({
    success: true,
    message: 'Reply added successfully',
    reply: newReply
  });
}));

// @desc    Share post
// @route   POST /api/posts/:id/share
// @access  Private
router.post('/:id/share', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const post = await Post.findById(id);
  
  if (!post || post.status !== 'active') {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }
  
  // Check if already shared
  const alreadyShared = post.shares.some(share => 
    share.user.toString() === req.userId.toString()
  );
  
  if (alreadyShared) {
    return res.status(400).json({
      success: false,
      message: 'Post already shared'
    });
  }
  
  post.shares.push({ user: req.userId });
  post.analytics.shares += 1;
  
  await post.save();
  
  res.json({
    success: true,
    message: 'Post shared successfully',
    shareCount: post.shareCount
  });
}));

// @desc    Report post
// @route   POST /api/posts/:id/report
// @access  Private
router.post('/:id/report', [
  body('reason')
    .isIn(['spam', 'inappropriate', 'fake_product', 'harassment', 'copyright', 'other'])
    .withMessage('Invalid report reason'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .withMessage('Description cannot exceed 500 characters')
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
  const { reason, description } = req.body;
  
  const post = await Post.findById(id);
  
  if (!post || post.status !== 'active') {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }
  
  // Check if already reported by this user
  const alreadyReported = post.reports.some(report => 
    report.user.toString() === req.userId.toString()
  );
  
  if (alreadyReported) {
    return res.status(400).json({
      success: false,
      message: 'Post already reported by you'
    });
  }
  
  await post.reportPost(req.userId, reason, description);
  
  res.json({
    success: true,
    message: 'Post reported successfully'
  });
}));

// @desc    Search posts
// @route   GET /api/posts/search
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
  
  const { q, page = 1, limit = 20, type, community } = req.query;
  
  const filters = {};
  if (type) filters.type = type;
  if (community) filters.community = community;
  
  const posts = await Post.searchPosts(q, filters, page, limit);
  
  // Add user interaction info
  const postsWithInteractions = posts.map(post => {
    const liked = post.isLikedBy(req.userId);
    return {
      ...post.toObject(),
      liked,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount
    };
  });
  
  res.json({
    success: true,
    posts: postsWithInteractions,
    pagination: {
      currentPage: parseInt(page),
      limit: parseInt(limit),
      hasMore: posts.length === parseInt(limit)
    }
  });
}));

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Private
router.get('/user/:userId', [
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
  
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const posts = await Post.find({
    author: userId,
    status: 'active'
  })
  .populate('author', 'displayName businessName profilePicture')
  .populate('community', 'name')
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(parseInt(limit));
  
  // Add user interaction info
  const postsWithInteractions = posts.map(post => {
    const liked = post.isLikedBy(req.userId);
    return {
      ...post.toObject(),
      liked,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount
    };
  });
  
  const total = await Post.countDocuments({
    author: userId,
    status: 'active'
  });
  
  res.json({
    success: true,
    posts: postsWithInteractions,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      limit: parseInt(limit)
    }
  });
}));

// @desc    Delete post (Author only)
// @route   DELETE /api/posts/:id
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const post = await Post.findById(id);
  
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }
  
  // Check if user is author or community admin
  let canDelete = post.author.toString() === req.userId.toString();
  
  if (!canDelete && post.community) {
    const community = await Community.findById(post.community);
    canDelete = community && community.isAdmin(req.userId);
  }
  
  if (!canDelete) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this post'
    });
  }
  
  post.status = 'deleted';
  await post.save();
  
  // Update community stats
  if (post.community) {
    await Community.findByIdAndUpdate(post.community, {
      $inc: { 'stats.totalPosts': -1 }
    });
  }
  
  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
}));

// @desc    Update post (Author only)
// @route   PUT /api/posts/:id
// @access  Private
router.put('/:id', [
  body('content.text')
    .optional()
    .isLength({ max: 2000 })
    .trim()
    .withMessage('Post content cannot exceed 2000 characters')
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
  const { content, images, product, location, hashtags } = req.body;
  
  const post = await Post.findById(id);
  
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }
  
  // Check ownership - fix authorization comparison
  const authorIdString = post.author.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || authorIdString !== userIdString) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to edit this post'
    });
  }
  
  // Update allowed fields
  if (content) post.content = { ...post.content, ...content };
  if (images !== undefined) post.images = images;
  if (product !== undefined) post.product = product;
  if (location !== undefined) post.location = location;
  if (hashtags !== undefined) post.hashtags = hashtags;
  
  await post.save();
  
  await post.populate('author', 'displayName businessName profilePicture');
  if (post.community) {
    await post.populate('community', 'name');
  }
  
  const liked = post.isLikedBy(req.userId);
  
  res.json({
    success: true,
    message: 'Post updated successfully',
    post: {
      ...post.toObject(),
      liked,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount
    }
  });
}));

export default router;
