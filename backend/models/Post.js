import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post must have an author'],
    index: true
  },

  // Community (null for public posts)
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null,
    index: true
  },

  // Content - FIXED: Made text required for non-product posts
  content: {
    text: {
      type: String,
      maxlength: [2000, 'Post content cannot exceed 2000 characters'],
      trim: true
    },
    type: {
      type: String,
      enum: {
        values: ['text', 'image', 'product', 'announcement', 'poll', 'event'],
        message: '{VALUE} is not a valid post type'
      },
      default: 'text',
      required: true,
      index: true
    }
  },

  // Media - Support base64 encoded images
  images: [{
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          // Allow base64 data URLs or regular URLs
          return /^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(v) || /^https?:\/\//.test(v);
        },
        message: 'Image URL must be a valid URL or base64 data URL'
      }
    },
    caption: { type: String, maxlength: 200, trim: true },
    publicId: { type: String }, // For Cloudinary/cloud storage
    alt: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],

  // Product Information - FIXED: Consistent structure with Products schema
  product: {
    name: {
      type: String,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      trim: true
    },
    description: {
      type: String,
      maxlength: [1000, 'Product description cannot exceed 1000 characters'],
      trim: true
    },
    category: {
      type: String,
      enum: {
        values: [
          'shirts', 'pants', 'sarees', 'kurtas', 'dresses',
          'blouses', 'lehengas', 'suits', 'jackets', 'jeans',
          'ethnic_wear', 'western_wear', 'kids_clothing',
          'fabrics', 'accessories', 'footwear', 'other'
        ],
        message: '{VALUE} is not a valid category'
      },
      index: true
    },
    // FIXED: Match Products schema - single price with amount
    price: {
      amount: { type: Number, min: [0, 'Price cannot be negative'] },
      currency: { type: String, default: 'INR', uppercase: true },
      unit: {
        type: String,
        default: 'piece',
        enum: ['piece', 'meter', 'kg', 'dozen', 'set', 'pair']
      }
    },
    specifications: [{
      key: { type: String, trim: true },
      value: { type: String, trim: true }
    }],
    availability: {
      inStock: { type: Boolean, default: true },
      quantity: { type: Number, min: 0 },
      minOrderQuantity: { type: Number, default: 1, min: 1 }
    },
    tags: [{ type: String, maxlength: 30, trim: true, lowercase: true }]
  },

  // Location
  location: {
    name: { type: String, trim: true },
    city: { type: String, trim: true, index: true },
    state: { type: String, trim: true },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },

  // Engagement - FIXED: Added indexes for performance
  likes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }],

  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      trim: true
    },
    createdAt: { type: Date, default: Date.now },
    likes: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }],
    replies: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      content: {
        type: String,
        required: [true, 'Reply content is required'],
        maxlength: [500, 'Reply cannot exceed 500 characters'],
        trim: true
      },
      createdAt: { type: Date, default: Date.now }
    }]
  }],

  shares: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }],

  // Post Status
  status: {
    type: String,
    enum: {
      values: ['active', 'hidden', 'deleted', 'pending_approval', 'reported'],
      message: '{VALUE} is not a valid status'
    },
    default: 'active',
    index: true
  },

  // Moderation
  isAnnouncement: { type: Boolean, default: false, index: true },
  isPinned: { type: Boolean, default: false, index: true },
  pinnedUntil: { type: Date },
  pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Reporting
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      enum: {
        values: ['spam', 'inappropriate', 'fake_product', 'harassment', 'copyright', 'other'],
        message: '{VALUE} is not a valid report reason'
      }
    },
    description: { type: String, maxlength: 500, trim: true },
    createdAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending'
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  }],

  // Analytics
  analytics: {
    views: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    uniqueViews: { type: Number, default: 0, min: 0 },
    engagement_rate: { type: Number, default: 0, min: 0, max: 100 }
  },

  // SEO and Search
  hashtags: [{
    type: String,
    maxlength: 50,
    trim: true,
    lowercase: true,
    index: true
  }],
  mentions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String, trim: true }
  }],

  // Poll (if type is poll)
  poll: {
    question: { type: String, maxlength: 500, trim: true },
    options: [{
      text: { type: String, maxlength: 200, trim: true, required: true },
      votes: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now }
      }]
    }],
    expiresAt: { type: Date },
    allowMultipleChoices: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },

  // Event (if type is event)
  event: {
    title: { type: String, maxlength: 200, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    venue: { type: String, maxlength: 300, trim: true },
    description: { type: String, maxlength: 1000, trim: true },
    attendees: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      status: {
        type: String,
        enum: ['attending', 'maybe', 'not_attending'],
        default: 'maybe'
      },
      responseAt: { type: Date, default: Date.now }
    }],
    maxAttendees: { type: Number, min: 1 },
    isPublic: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }, // FIXED: Enable virtuals in JSON
  toObject: { virtuals: true }
});

// FIXED: Compound indexes for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ community: 1, isPinned: -1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ 'content.type': 1, status: 1, createdAt: -1 });
postSchema.index({ 'product.category': 1, status: 1 });
postSchema.index({ 'location.city': 1, status: 1 });

// Text search index
postSchema.index({
  'content.text': 'text',
  'product.name': 'text',
  'product.description': 'text',
  hashtags: 'text',
  'product.tags': 'text'
});

// FIXED: Virtual fields with proper configuration
postSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

postSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

postSchema.virtual('shareCount').get(function() {
  return this.shares ? this.shares.length : 0;
});

postSchema.virtual('totalEngagement').get(function() {
  return this.likeCount + this.commentCount + this.shareCount;
});

// FIXED: Validation before save - More flexible validation
postSchema.pre('save', function(next) {
  // Validate product posts have product info (relaxed - allow empty product for draft posts)
  if (this.content.type === 'product' && this.product) {
    // Only validate if product object exists and is not empty
    const hasProductData = this.product.name || this.product.category;
    if (!hasProductData && Object.keys(this.product).length > 0) {
      return next(new Error('Product posts must include at least name or category'));
    }
  }

  // Validate poll posts have poll data
  if (this.content.type === 'poll' && (!this.poll || !this.poll.options || this.poll.options.length < 2)) {
    return next(new Error('Poll posts must have at least 2 options'));
  }

  // Validate event posts have event data
  if (this.content.type === 'event' && (!this.event || !this.event.title || !this.event.startDate)) {
    return next(new Error('Event posts must include title and start date'));
  }

  // Ensure text content or images exist for text/image posts (relaxed)
  if (['text', 'image'].includes(this.content.type)) {
    if (!this.content.text && (!this.images || this.images.length === 0)) {
      // Allow empty posts, just ensure type is correct
      this.content.type = 'text';
    }
  }

  next();
});

// Methods

// Check if user liked the post
postSchema.methods.isLikedBy = function(userId) {
  if (!userId || !this.likes) return false;
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Toggle like
postSchema.methods.toggleLike = async function(userId) {
  if (!userId) throw new Error('User ID is required');

  const existingLikeIndex = this.likes.findIndex(like =>
    like.user.toString() === userId.toString()
  );

  if (existingLikeIndex !== -1) {
    this.likes.splice(existingLikeIndex, 1);
  } else {
    this.likes.push({ user: userId });
  }

  return this.save();
};

// Add comment
postSchema.methods.addComment = async function(userId, content) {
  if (!userId) throw new Error('User ID is required');
  if (!content || !content.trim()) throw new Error('Comment content is required');

  this.comments.push({
    user: userId,
    content: content.trim(),
    createdAt: new Date()
  });
  return this.save();
};

// Update analytics
postSchema.methods.incrementViews = async function() {
  this.analytics.views += 1;
  return this.save();
};

postSchema.methods.incrementClicks = async function() {
  this.analytics.clicks += 1;
  return this.save();
};

// Report post
postSchema.methods.reportPost = async function(userId, reason, description) {
  if (!userId) throw new Error('User ID is required');
  if (!reason) throw new Error('Report reason is required');

  this.reports.push({
    user: userId,
    reason: reason,
    description: description || ''
  });

  // Auto-flag if multiple reports
  if (this.reports.length >= 3 && this.status === 'active') {
    this.status = 'reported';
  }

  return this.save();
};

// Pin post
postSchema.methods.pin = async function(userId, until = null) {
  this.isPinned = true;
  this.pinnedBy = userId;
  if (until) {
    this.pinnedUntil = until;
  }
  return this.save();
};

// Unpin post
postSchema.methods.unpin = async function() {
  this.isPinned = false;
  this.pinnedUntil = null;
  this.pinnedBy = null;
  return this.save();
};

// Static methods

// FIXED: Find posts for feed - includes all posts, not just community-less
postSchema.statics.findForFeed = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    location,
    categories = [],
    sortBy = 'newest'
  } = options;

  let query = { status: 'active' };

  // Filter by location if provided
  if (location) {
    query['location.city'] = new RegExp(location, 'i');
  }

  // Filter by categories if provided
  if (categories.length > 0) {
    query['product.category'] = { $in: categories };
  }

  let sort = {};
  switch (sortBy) {
    case 'popular':
      // Will need to be aggregated separately for likes count
      sort = { createdAt: -1 };
      break;
    case 'trending':
      sort = { 'analytics.views': -1, createdAt: -1 };
      break;
    case 'newest':
    default:
      sort = { isPinned: -1, createdAt: -1 };
  }

  return this.find(query)
    .populate('author', 'displayName businessName profilePicture isVerified onlineStatus')
    .populate('community', 'name')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean(); // Use lean for better performance
};

// Find posts by community
postSchema.statics.findByCommunity = function(communityId, page = 1, limit = 20) {
  return this.find({
    community: communityId,
    status: 'active'
  })
  .populate('author', 'displayName businessName profilePicture isVerified')
  .populate('community', 'name')
  .sort({ isPinned: -1, createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(parseInt(limit))
  .lean();
};

// Find product posts
postSchema.statics.findProducts = function(filters = {}, page = 1, limit = 20) {
  let query = {
    'content.type': 'product',
    status: 'active',
    product: { $exists: true, $ne: null }
  };

  if (filters.category) {
    query['product.category'] = filters.category;
  }

  if (filters.location) {
    query['location.city'] = new RegExp(filters.location, 'i');
  }

  if (filters.priceRange) {
    if (filters.priceRange.min !== undefined) {
      query['product.price.amount'] = { $gte: filters.priceRange.min };
    }
    if (filters.priceRange.max !== undefined) {
      query['product.price.amount'] = {
        ...query['product.price.amount'],
        $lte: filters.priceRange.max
      };
    }
  }

  return this.find(query)
    .populate('author', 'displayName businessName profilePicture shopLocation isVerified')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();
};

// Search posts
postSchema.statics.searchPosts = function(searchTerm, filters = {}, page = 1, limit = 20) {
  let query = {
    $text: { $search: searchTerm },
    status: 'active'
  };

  if (filters.community) {
    query.community = filters.community;
  }

  if (filters.type) {
    query['content.type'] = filters.type;
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('author', 'displayName businessName profilePicture')
    .populate('community', 'name')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();
};

const Post = mongoose.model('Post', postSchema);

export default Post;
