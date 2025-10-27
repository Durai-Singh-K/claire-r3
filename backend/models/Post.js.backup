import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Community (null for general posts)
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null
  },
  
  // Content
  content: {
    text: { type: String, maxlength: 2000 },
    type: {
      type: String,
      enum: ['text', 'image', 'product', 'announcement', 'poll', 'event'],
      default: 'text'
    }
  },
  
  // Media
  images: [{
    url: { type: String, required: true },
    caption: { type: String, maxlength: 200 },
    thumbnail: { type: String },
    dimensions: {
      width: { type: Number },
      height: { type: Number }
    }
  }],
  
  // Product Information (for product posts)
  product: {
    name: { type: String, maxlength: 200 },
    category: {
      type: String,
      enum: [
        'shirts', 'pants', 'sarees', 'kurtas', 'dresses', 
        'blouses', 'lehengas', 'suits', 'jackets', 'jeans',
        'ethnic_wear', 'western_wear', 'kids_clothing',
        'fabrics', 'accessories', 'footwear', 'other'
      ]
    },
    price: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'INR' },
      unit: { type: String, default: 'piece' } // piece, meter, kg, etc.
    },
    specifications: [{
      key: { type: String }, // Size, Color, Material, etc.
      value: { type: String }
    }],
    availability: {
      inStock: { type: Boolean, default: true },
      quantity: { type: Number },
      minOrderQuantity: { type: Number, default: 1 }
    },
    tags: [{ type: String, maxlength: 30 }]
  },
  
  // Location
  location: {
    name: { type: String },
    city: { type: String },
    state: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  
  // Engagement
  likes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
    likes: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }],
    replies: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      content: { type: String, required: true, maxlength: 500 },
      createdAt: { type: Date, default: Date.now }
    }]
  }],
  
  shares: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Post Status
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted', 'pending_approval', 'reported'],
    default: 'active'
  },
  
  // Moderation
  isAnnouncement: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  pinnedUntil: { type: Date },
  
  // Reporting
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'fake_product', 'harassment', 'copyright', 'other']
    },
    description: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }],
  
  // Analytics
  analytics: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    engagement_rate: { type: Number, default: 0 }
  },
  
  // SEO and Search
  hashtags: [{ type: String, maxlength: 50 }],
  mentions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String }
  }],
  
  // Poll (if type is poll)
  poll: {
    question: { type: String, maxlength: 500 },
    options: [{
      text: { type: String, maxlength: 200 },
      votes: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
      }]
    }],
    expiresAt: { type: Date },
    allowMultipleChoices: { type: Boolean, default: false }
  },
  
  // Event (if type is event)
  event: {
    title: { type: String, maxlength: 200 },
    startDate: { type: Date },
    endDate: { type: Date },
    venue: { type: String, maxlength: 300 },
    description: { type: String, maxlength: 1000 },
    attendees: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['attending', 'maybe', 'not_attending'] },
      responseAt: { type: Date, default: Date.now }
    }],
    maxAttendees: { type: Number },
    isPublic: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ community: 1, createdAt: -1 });
postSchema.index({ 'content.type': 1 });
postSchema.index({ 'product.category': 1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'location.city': 1 });
postSchema.index({ isPinned: 1, createdAt: -1 });

// Text search index
postSchema.index({
  'content.text': 'text',
  'product.name': 'text',
  hashtags: 'text',
  'product.tags': 'text'
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for share count
postSchema.virtual('shareCount').get(function() {
  return this.shares.length;
});

// Virtual for total engagement
postSchema.virtual('totalEngagement').get(function() {
  return this.likes.length + this.comments.length + this.shares.length;
});

// Methods

// Check if user liked the post
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Toggle like
postSchema.methods.toggleLike = function(userId) {
  const existingLike = this.likes.find(like => 
    like.user.toString() === userId.toString()
  );
  
  if (existingLike) {
    this.likes = this.likes.filter(like => 
      like.user.toString() !== userId.toString()
    );
  } else {
    this.likes.push({ user: userId });
  }
  
  return this.save();
};

// Add comment
postSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content,
    createdAt: new Date()
  });
  return this.save();
};

// Update analytics
postSchema.methods.incrementViews = function() {
  this.analytics.views += 1;
  return this.save();
};

postSchema.methods.incrementClicks = function() {
  this.analytics.clicks += 1;
  return this.save();
};

// Report post
postSchema.methods.reportPost = function(userId, reason, description) {
  this.reports.push({
    user: userId,
    reason: reason,
    description: description
  });
  return this.save();
};

// Pin post
postSchema.methods.pin = function(until = null) {
  this.isPinned = true;
  if (until) {
    this.pinnedUntil = until;
  }
  return this.save();
};

// Unpin post
postSchema.methods.unpin = function() {
  this.isPinned = false;
  this.pinnedUntil = null;
  return this.save();
};

// Static methods

// Find posts by community
postSchema.statics.findByCommunity = function(communityId, page = 1, limit = 20) {
  return this.find({ 
    community: communityId, 
    status: 'active' 
  })
  .populate('author', 'displayName businessName profilePicture')
  .sort({ isPinned: -1, createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

// Find public posts (feed)
postSchema.statics.findPublicFeed = function(page = 1, limit = 20, location = null, categories = []) {
  let query = { 
    community: null, // Only posts not in communities
    status: 'active' 
  };
  
  if (location) {
    query['location.city'] = new RegExp(location, 'i');
  }
  
  if (categories.length > 0) {
    query['product.category'] = { $in: categories };
  }
  
  return this.find(query)
    .populate('author', 'displayName businessName profilePicture')
    .sort({ isPinned: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Find product posts
postSchema.statics.findProducts = function(filters = {}, page = 1, limit = 20) {
  let query = { 'content.type': 'product', status: 'active' };
  
  if (filters.category) {
    query['product.category'] = filters.category;
  }
  
  if (filters.location) {
    query['location.city'] = new RegExp(filters.location, 'i');
  }
  
  if (filters.priceRange) {
    query['product.price.min'] = { $gte: filters.priceRange.min };
    query['product.price.max'] = { $lte: filters.priceRange.max };
  }
  
  return this.find(query)
    .populate('author', 'displayName businessName profilePicture shopLocation')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
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
  
  return this.find(query)
    .populate('author', 'displayName businessName profilePicture')
    .sort({ score: { $meta: 'textScore' } })
    .skip((page - 1) * limit)
    .limit(limit);
};

const Post = mongoose.model('Post', postSchema);

export default Post;
