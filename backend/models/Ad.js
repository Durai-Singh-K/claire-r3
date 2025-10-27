import mongoose from 'mongoose';

const adSchema = new mongoose.Schema({
  // Owner
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Ad Content
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  
  // Creative Assets
  creative: {
    type: {
      type: String,
      enum: ['image', 'video', 'carousel'],
      default: 'image'
    },
    images: [{
      url: { type: String, required: true },
      caption: { type: String, maxlength: 200 },
      thumbnail: { type: String },
      dimensions: {
        width: { type: Number },
        height: { type: Number }
      }
    }],
    video: {
      url: { type: String },
      thumbnail: { type: String },
      duration: { type: Number } // in seconds
    }
  },
  
  // Product Information
  product: {
    name: { type: String, maxlength: 200 },
    category: {
      type: String,
      enum: [
        'shirts', 'pants', 'sarees', 'kurtas', 'dresses', 
        'blouses', 'lehengas', 'suits', 'jackets', 'jeans',
        'ethnic_wear', 'western_wear', 'kids_clothing',
        'fabrics', 'accessories', 'footwear', 'other'
      ],
      required: true
    },
    price: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'INR' },
      discount: {
        type: { type: String, enum: ['percentage', 'fixed'] },
        value: { type: Number },
        validUntil: { type: Date }
      }
    },
    specifications: [{
      key: { type: String }, // Size, Color, Material, etc.
      value: { type: String }
    }],
    tags: [{ type: String, maxlength: 30 }]
  },
  
  // Targeting
  targeting: {
    locations: [{
      city: { type: String, required: true },
      state: { type: String },
      radius: { type: Number, default: 50 } // in kilometers
    }],
    categories: [{
      type: String,
      enum: [
        'shirts', 'pants', 'sarees', 'kurtas', 'dresses', 
        'blouses', 'lehengas', 'suits', 'jackets', 'jeans',
        'ethnic_wear', 'western_wear', 'kids_clothing',
        'fabrics', 'accessories', 'footwear', 'other'
      ]
    }],
    demographics: {
      businessType: [{ type: String }], // retailer, wholesaler, manufacturer
      businessSize: [{ type: String }], // small, medium, large
      languages: [{ type: String }]
    },
    communities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community'
    }]
  },
  
  // Campaign Settings
  campaign: {
    objective: {
      type: String,
      enum: ['awareness', 'traffic', 'engagement', 'conversions', 'leads'],
      default: 'awareness'
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    schedule: {
      days: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
      hours: {
        start: { type: String }, // HH:MM format
        end: { type: String }
      }
    }
  },
  
  // Call to Action
  cta: {
    type: {
      type: String,
      enum: ['learn_more', 'shop_now', 'contact', 'call', 'whatsapp', 'visit_website'],
      default: 'learn_more'
    },
    text: { type: String, maxlength: 30 },
    link: { type: String },
    phone: { type: String },
    whatsapp: { type: String }
  },
  
  // Pricing & Billing
  pricing: {
    tier: {
      type: String,
      enum: ['standard', 'premium', 'featured'],
      default: 'standard'
    },
    model: {
      type: String,
      enum: ['cpm', 'cpc', 'flat_rate'], // Cost per mille, cost per click, flat rate
      default: 'flat_rate'
    },
    budget: {
      daily: { type: Number },
      total: { type: Number, required: true },
      currency: { type: String, default: 'INR' }
    },
    actualSpent: { type: Number, default: 0 }
  },
  
  // Status & Approval
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'active', 'paused', 'completed', 'rejected', 'cancelled'],
    default: 'draft'
  },
  
  // Admin Review
  review: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    notes: { type: String, maxlength: 1000 },
    rejectionReason: {
      type: String,
      enum: ['inappropriate_content', 'misleading_claims', 'poor_quality', 'policy_violation', 'other']
    }
  },
  
  // Performance Analytics
  analytics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    
    // Calculated metrics
    ctr: { type: Number, default: 0 }, // Click-through rate
    engagement_rate: { type: Number, default: 0 },
    cost_per_click: { type: Number, default: 0 },
    cost_per_conversion: { type: Number, default: 0 },
    
    // Daily breakdown
    dailyStats: [{
      date: { type: Date },
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      spent: { type: Number, default: 0 }
    }]
  },
  
  // Engagement tracking
  interactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['view', 'click', 'like', 'share', 'comment'] },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed }
  }],
  
  // A/B Testing (future feature)
  abTest: {
    isActive: { type: Boolean, default: false },
    variants: [{
      name: { type: String },
      weight: { type: Number, default: 50 }, // percentage
      creative: { type: mongoose.Schema.Types.Mixed },
      performance: {
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 }
      }
    }]
  },
  
  // Featured placement
  featured: {
    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date },
    featuredPosition: { type: Number },
    featuredLocations: [{ type: String }]
  },
  
  // Boost settings
  boost: {
    isBoosted: { type: Boolean, default: false },
    boostMultiplier: { type: Number, default: 1 },
    boostUntil: { type: Date }
  }
}, {
  timestamps: true
});

// Indexes for performance
adSchema.index({ owner: 1, status: 1 });
adSchema.index({ status: 1, createdAt: -1 });
adSchema.index({ 'product.category': 1, status: 1 });
adSchema.index({ 'targeting.locations.city': 1, status: 1 });
adSchema.index({ 'campaign.startDate': 1, 'campaign.endDate': 1 });
adSchema.index({ 'featured.isFeatured': 1, 'featured.featuredUntil': 1 });

// Text search index
adSchema.index({
  title: 'text',
  description: 'text',
  'product.name': 'text',
  'product.tags': 'text'
});

// Virtual for days remaining
adSchema.virtual('daysRemaining').get(function() {
  if (this.campaign.endDate) {
    const now = new Date();
    const end = new Date(this.campaign.endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
  return 0;
});

// Virtual for is active
adSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.campaign.startDate <= now && 
         this.campaign.endDate >= now;
});

// Virtual for performance metrics
adSchema.virtual('performanceMetrics').get(function() {
  const { impressions, clicks, conversions } = this.analytics;
  return {
    ctr: impressions > 0 ? (clicks / impressions * 100).toFixed(2) : 0,
    conversionRate: clicks > 0 ? (conversions / clicks * 100).toFixed(2) : 0,
    costPerClick: clicks > 0 ? (this.pricing.actualSpent / clicks).toFixed(2) : 0,
    costPerConversion: conversions > 0 ? (this.pricing.actualSpent / conversions).toFixed(2) : 0
  };
});

// Methods

// Update analytics
adSchema.methods.recordInteraction = function(userId, type, metadata = {}) {
  // Record interaction
  this.interactions.push({
    user: userId,
    type: type,
    metadata: metadata
  });
  
  // Update analytics
  switch(type) {
    case 'view':
      this.analytics.views += 1;
      break;
    case 'click':
      this.analytics.clicks += 1;
      break;
    case 'like':
      this.analytics.likes += 1;
      break;
    case 'share':
      this.analytics.shares += 1;
      break;
    case 'comment':
      this.analytics.comments += 1;
      break;
  }
  
  // Update daily stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dailyStat = this.analytics.dailyStats.find(stat => 
    stat.date.getTime() === today.getTime()
  );
  
  if (!dailyStat) {
    dailyStat = { date: today, impressions: 0, clicks: 0, views: 0, spent: 0 };
    this.analytics.dailyStats.push(dailyStat);
  }
  
  if (type === 'view') dailyStat.views += 1;
  if (type === 'click') dailyStat.clicks += 1;
  
  // Calculate metrics
  if (this.analytics.impressions > 0) {
    this.analytics.ctr = (this.analytics.clicks / this.analytics.impressions) * 100;
  }
  
  const totalEngagements = this.analytics.likes + this.analytics.comments + this.analytics.shares;
  if (this.analytics.impressions > 0) {
    this.analytics.engagement_rate = (totalEngagements / this.analytics.impressions) * 100;
  }
  
  return this.save();
};

// Record impression
adSchema.methods.recordImpression = function() {
  this.analytics.impressions += 1;
  
  // Update daily stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dailyStat = this.analytics.dailyStats.find(stat => 
    stat.date.getTime() === today.getTime()
  );
  
  if (!dailyStat) {
    dailyStat = { date: today, impressions: 0, clicks: 0, views: 0, spent: 0 };
    this.analytics.dailyStats.push(dailyStat);
  }
  
  dailyStat.impressions += 1;
  
  return this.save();
};

// Update spent amount
adSchema.methods.updateSpent = function(amount) {
  this.pricing.actualSpent += amount;
  
  // Update daily stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dailyStat = this.analytics.dailyStats.find(stat => 
    stat.date.getTime() === today.getTime()
  );
  
  if (!dailyStat) {
    dailyStat = { date: today, impressions: 0, clicks: 0, views: 0, spent: 0 };
    this.analytics.dailyStats.push(dailyStat);
  }
  
  dailyStat.spent += amount;
  
  return this.save();
};

// Check if budget exceeded
adSchema.methods.isBudgetExceeded = function() {
  return this.pricing.actualSpent >= this.pricing.budget.total;
};

// Approve ad
adSchema.methods.approve = function(reviewerId, notes = '') {
  this.status = 'approved';
  this.review.reviewedBy = reviewerId;
  this.review.reviewedAt = new Date();
  this.review.notes = notes;
  return this.save();
};

// Reject ad
adSchema.methods.reject = function(reviewerId, reason, notes = '') {
  this.status = 'rejected';
  this.review.reviewedBy = reviewerId;
  this.review.reviewedAt = new Date();
  this.review.rejectionReason = reason;
  this.review.notes = notes;
  return this.save();
};

// Feature ad
adSchema.methods.feature = function(until, position = null) {
  this.featured.isFeatured = true;
  this.featured.featuredUntil = until;
  if (position) {
    this.featured.featuredPosition = position;
  }
  return this.save();
};

// Pause ad
adSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

// Resume ad
adSchema.methods.resume = function() {
  if (this.status === 'paused') {
    this.status = 'active';
  }
  return this.save();
};

// Static methods

// Find active ads for location
adSchema.statics.findForLocation = function(city, categories = [], limit = 10) {
  const now = new Date();
  let query = {
    status: 'active',
    'campaign.startDate': { $lte: now },
    'campaign.endDate': { $gte: now },
    'targeting.locations.city': new RegExp(city, 'i')
  };
  
  if (categories.length > 0) {
    query['product.category'] = { $in: categories };
  }
  
  return this.find(query)
    .populate('owner', 'displayName businessName profilePicture')
    .sort({ 
      'featured.isFeatured': -1, 
      'boost.isBoosted': -1,
      'analytics.engagement_rate': -1,
      createdAt: -1 
    })
    .limit(limit);
};

// Find ads pending approval
adSchema.statics.findPendingApproval = function(page = 1, limit = 20) {
  return this.find({ status: 'pending_approval' })
    .populate('owner', 'displayName businessName profilePicture')
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Get user's ads
adSchema.statics.getUserAds = function(userId, page = 1, limit = 20) {
  return this.find({ owner: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Search ads
adSchema.statics.searchAds = function(searchTerm, filters = {}, page = 1, limit = 20) {
  let query = { 
    $text: { $search: searchTerm },
    status: 'active'
  };
  
  if (filters.category) {
    query['product.category'] = filters.category;
  }
  
  if (filters.location) {
    query['targeting.locations.city'] = new RegExp(filters.location, 'i');
  }
  
  return this.find(query)
    .populate('owner', 'displayName businessName profilePicture')
    .sort({ score: { $meta: 'textScore' } })
    .skip((page - 1) * limit)
    .limit(limit);
};

const Ad = mongoose.model('Ad', adSchema);

export default Ad;
