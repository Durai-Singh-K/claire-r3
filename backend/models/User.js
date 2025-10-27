import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic Auth
  firebaseUid: {
    type: String,
    sparse: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.firebaseUid; // Only required if not using Firebase
    },
    select: false // Don't include password in queries by default
  },
  authProvider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  
  // Profile Information
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 30
  },
  displayName: {
    type: String,
    required: true,
    maxlength: 50
  },
  businessName: {
    type: String,
    maxlength: 100
  },
  profilePicture: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500
  },
  
  // Location Information
  shopLocation: {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' },
    pincode: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  
  // Delivery Areas
  deliveryAreas: [{
    name: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    distance: { type: Number }, // in kilometers
    deliveryTime: { type: String } // e.g., "2-3 days"
  }],
  
  // Business Categories
  categories: [{
    type: String,
    enum: [
      'shirts', 'pants', 'sarees', 'kurtas', 'dresses', 
      'blouses', 'lehengas', 'suits', 'jackets', 'jeans',
      'ethnic_wear', 'western_wear', 'kids_clothing',
      'fabrics', 'accessories', 'footwear', 'other'
    ]
  }],
  
  // Contact Information
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        // Accept 10-digit Indian numbers or international format with +
        return !v || /^[6-9]\d{9}$/.test(v) || /^\+\d{10,15}$/.test(v);
      },
      message: 'Invalid phone number format'
    }
  },
  whatsapp: {
    type: String,
    validate: {
      validator: function(v) {
        // Accept 10-digit Indian numbers or international format with +
        return !v || /^[6-9]\d{9}$/.test(v) || /^\+\d{10,15}$/.test(v);
      },
      message: 'Invalid WhatsApp number format'
    }
  },
  website: {
    type: String
  },
  
  // Communication Preferences
  languages: [{
    type: String,
    enum: ['hindi', 'english', 'tamil', 'telugu', 'kannada', 'malayalam', 'marathi', 'gujarati', 'bengali', 'punjabi']
  }],
  preferredLanguage: {
    type: String,
    default: 'english'
  },
  
  // Privacy Settings
  privacySettings: {
    showPhone: {
      type: String,
      enum: ['public', 'friends', 'communities', 'private'],
      default: 'communities'
    },
    showEmail: {
      type: String,
      enum: ['public', 'friends', 'communities', 'private'],
      default: 'friends'
    },
    showLocation: {
      type: String,
      enum: ['public', 'friends', 'communities', 'private'],
      default: 'public'
    }
  },
  
  // Social Connections
  friends: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['accepted'], default: 'accepted' },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Communities
  communities: [{
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    role: { type: String, enum: ['member', 'admin'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  
  // Notifications Settings
  notificationSettings: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    friendRequests: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    communityUpdates: { type: Boolean, default: true },
    adPromotions: { type: Boolean, default: false }
  },
  
  // Business Verification
  isVerified: { type: Boolean, default: false },
  verificationDocuments: [{
    type: { type: String },
    url: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  }],
  
  // Activity Stats
  lastActive: { type: Date, default: Date.now },
  onlineStatus: {
    type: String,
    enum: ['online', 'away', 'busy', 'offline'],
    default: 'offline'
  },
  
  // Account Status
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String },
  
  // Onboarding
  onboardingCompleted: { type: Boolean, default: false },
  onboardingStep: { type: Number, default: 0 },

  // Business/Tax Information
  gst: {
    type: String,
    sparse: true,
    unique: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
      },
      message: 'Invalid GST number format'
    }
  },
  pan: {
    type: String,
    sparse: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
      },
      message: 'Invalid PAN card format'
    }
  },
  businessType: {
    type: String,
    enum: ['manufacturer', 'wholesaler', 'retailer', 'distributor', 'supplier', 'trader'],
    default: 'retailer'
  },
  businessRegistrationNumber: {
    type: String,
    sparse: true
  },
  yearEstablished: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear(),
    validate: {
      validator: function(v) {
        return !v || (v >= 1900 && v <= new Date().getFullYear());
      },
      message: 'Year must be between 1900 and current year'
    }
  },
  employeeCount: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+', 'not-disclosed'],
    default: 'not-disclosed'
  },

  // Financial/Transaction
  bankDetails: {
    accountNumber: {
      type: String,
      select: false // Don't include by default for security
    },
    ifscCode: {
      type: String,
      uppercase: true,
      validate: {
        validator: function(v) {
          return !v || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
        },
        message: 'Invalid IFSC code format'
      }
    },
    accountHolderName: { type: String },
    bankName: { type: String },
    branch: { type: String }
  },
  paymentMethods: [{
    type: String,
    enum: ['upi', 'cash', 'card', 'netbanking', 'cheque', 'bank_transfer', 'cod']
  }],
  creditTerms: {
    type: String,
    default: 'immediate'
  },
  minimumOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
  },

  // Business Metrics (calculated/updated)
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  responseTime: {
    type: Number, // in minutes
    default: 0
  },
  completionRate: {
    type: Number, // percentage 0-100
    default: 0,
    min: 0,
    max: 100
  },
  trustScore: {
    type: Number, // 0-100, platform-calculated
    default: 0,
    min: 0,
    max: 100
  },

  // Business Hours
  businessHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    openTime: { type: String }, // Format: "HH:MM" (24-hour)
    closeTime: { type: String }, // Format: "HH:MM" (24-hour)
    isClosed: { type: Boolean, default: false }
  }],
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },

  // Catalog/Inventory
  totalProducts: {
    type: Number,
    default: 0,
    min: 0
  },
  catalogUrl: {
    type: String
  },
  supplyCapacity: {
    quantity: { type: Number },
    unit: { type: String, enum: ['pieces', 'kg', 'meters', 'dozens', 'boxes'] },
    period: { type: String, enum: ['daily', 'weekly', 'monthly'] }
  },
  leadTime: {
    type: String,
    default: '3-5 days'
  },

  // Shipping/Logistics
  shippingMethods: [{
    type: String,
    enum: ['own_delivery', 'third_party', 'courier', 'pickup', 'shipping']
  }],
  returnPolicy: {
    accepted: { type: Boolean, default: false },
    duration: { type: Number, default: 0 }, // in days
    conditions: { type: String }
  },
  warrantyOffered: {
    type: Boolean,
    default: false
  },

  // Social/Marketing
  socialMedia: {
    instagram: { type: String },
    facebook: { type: String },
    linkedin: { type: String },
    twitter: { type: String },
    youtube: { type: String }
  },
  certifications: [{
    name: { type: String, required: true },
    issuedBy: { type: String },
    issuedDate: { type: Date },
    expiryDate: { type: Date },
    documentUrl: { type: String },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    }
  }],
  awards: [{
    title: { type: String, required: true },
    issuedBy: { type: String },
    year: { type: Number },
    description: { type: String }
  }],
  featuredProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],

  // Platform Engagement
  subscriptionTier: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  subscriptionExpiry: {
    type: Date
  },
  featuredUntil: {
    type: Date
  },
  adCredits: {
    type: Number,
    default: 0,
    min: 0
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Preferences & Security
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  autoReplyMessage: {
    type: String,
    maxlength: 500
  },
  vacationMode: {
    enabled: { type: Boolean, default: false },
    from: { type: Date },
    to: { type: Date },
    message: { type: String, maxlength: 500 }
  },

  // Analytics (for tracking)
  analytics: {
    profileViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 },
    productViews: { type: Number, default: 0 },
    catalogDownloads: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ 'shopLocation.city': 1 });
userSchema.index({ categories: 1 });
userSchema.index({ businessName: 'text', displayName: 'text' });

// New indexes for enhanced fields
userSchema.index({ gst: 1 }, { sparse: true });
userSchema.index({ pan: 1 }, { sparse: true });
userSchema.index({ businessType: 1 });
userSchema.index({ subscriptionTier: 1 });
userSchema.index({ rating: -1 });
userSchema.index({ trustScore: -1 });
userSchema.index({ referralCode: 1 }, { sparse: true });
userSchema.index({ 'shopLocation.coordinates': '2dsphere' });
userSchema.index({ isVerified: 1, rating: -1 });
userSchema.index({ businessType: 1, 'shopLocation.city': 1 });
userSchema.index({ categories: 1, rating: -1 });

// Virtual for full name
userSchema.virtual('fullBusinessInfo').get(function() {
  return `${this.businessName} - ${this.shopLocation.city}`;
});

// Virtual for profile completion percentage
userSchema.virtual('profileCompletionPercentage').get(function() {
  const fields = [
    this.displayName, this.businessName, this.profilePicture, this.bio,
    this.phone, this.shopLocation?.address, this.shopLocation?.city,
    this.categories?.length > 0, this.businessType, this.yearEstablished,
    this.paymentMethods?.length > 0, this.businessHours?.length > 0
  ];
  const filledFields = fields.filter(field => field).length;
  return Math.round((filledFields / fields.length) * 100);
});

// Virtual for current business status (open/closed)
userSchema.virtual('isCurrentlyOpen').get(function() {
  if (this.vacationMode?.enabled) {
    const now = new Date();
    if (now >= this.vacationMode.from && now <= this.vacationMode.to) {
      return false;
    }
  }

  if (!this.businessHours || this.businessHours.length === 0) {
    return null; // Unknown
  }

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];

  const todayHours = this.businessHours.find(h => h.day === currentDay);
  if (!todayHours || todayHours.isClosed) {
    return false;
  }

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.closeTime.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime <= closeTime;
});

// Generate referral code if not exists
userSchema.pre('save', async function(next) {
  if (this.isNew && !this.referralCode) {
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let unique = false;
    while (!unique) {
      this.referralCode = generateCode();
      const existing = await this.constructor.findOne({ referralCode: this.referralCode });
      if (!existing) unique = true;
    }
  }
  next();
});

// Calculate trust score before saving
userSchema.pre('save', function(next) {
  if (this.isModified('rating') || this.isModified('totalReviews') ||
      this.isModified('completionRate') || this.isModified('isVerified') ||
      this.isModified('emailVerified') || this.isModified('phoneVerified')) {

    let score = 0;

    // Rating contribution (40 points)
    if (this.totalReviews > 0) {
      score += (this.rating / 5) * 40;
    }

    // Completion rate contribution (20 points)
    score += (this.completionRate / 100) * 20;

    // Verification contribution (30 points)
    if (this.isVerified) score += 15;
    if (this.emailVerified) score += 8;
    if (this.phoneVerified) score += 7;

    // Review count contribution (10 points)
    const reviewScore = Math.min(this.totalReviews / 50, 1) * 10;
    score += reviewScore;

    this.trustScore = Math.round(Math.min(score, 100));
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Get safe user object (without sensitive data)
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.firebaseUid;
  return userObject;
};

// Static method to find users by location
userSchema.statics.findByLocation = function(city, categories = []) {
  const query = { 'shopLocation.city': new RegExp(city, 'i'), isActive: true };
  if (categories.length > 0) {
    query.categories = { $in: categories };
  }
  return this.find(query).select('-password -firebaseUid');
};

// Update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Check if subscription is active
userSchema.methods.hasActiveSubscription = function() {
  if (this.subscriptionTier === 'free') return false;
  if (!this.subscriptionExpiry) return false;
  return new Date() < this.subscriptionExpiry;
};

// Check if user has access to a feature based on subscription
userSchema.methods.canAccessFeature = function(feature) {
  const features = {
    free: ['basic_profile', 'basic_search', 'messages'],
    basic: ['basic_profile', 'basic_search', 'messages', 'analytics', 'products_10'],
    premium: ['basic_profile', 'basic_search', 'messages', 'analytics', 'products_unlimited', 'featured_listing', 'priority_support'],
    enterprise: ['all']
  };

  const tierFeatures = features[this.subscriptionTier] || features.free;
  return tierFeatures.includes('all') || tierFeatures.includes(feature);
};

// Enable vacation mode
userSchema.methods.enableVacationMode = function(from, to, message) {
  this.vacationMode = {
    enabled: true,
    from: from || new Date(),
    to: to,
    message: message || 'We are currently on vacation. Will be back soon!'
  };
  return this.save();
};

// Disable vacation mode
userSchema.methods.disableVacationMode = function() {
  this.vacationMode = {
    enabled: false,
    from: null,
    to: null,
    message: null
  };
  return this.save();
};

// Update business hours
userSchema.methods.updateBusinessHours = function(hours) {
  this.businessHours = hours;
  return this.save();
};

// Increment profile views
userSchema.methods.incrementProfileViews = function() {
  if (!this.analytics) {
    this.analytics = { profileViews: 0 };
  }
  this.analytics.profileViews += 1;
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
