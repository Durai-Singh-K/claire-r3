import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  
  // Community Type
  isPrivate: {
    type: Boolean,
    default: false
  },
  
  // Access Control
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  inviteLink: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Visual
  coverImage: {
    type: String,
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  
  // Categories
  categories: [{
    type: String,
    enum: [
      'shirts', 'pants', 'sarees', 'kurtas', 'dresses', 
      'blouses', 'lehengas', 'suits', 'jackets', 'jeans',
      'ethnic_wear', 'western_wear', 'kids_clothing',
      'fabrics', 'accessories', 'footwear', 'general', 'other'
    ]
  }],
  
  // Geographic Focus
  targetLocations: [{
    city: { type: String, required: true },
    state: { type: String },
    priority: { type: Number, default: 1 } // 1-5, higher is more important
  }],
  
  // Creator and Admins
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permissions: [{
      type: String,
      enum: ['manage_members', 'manage_posts', 'manage_settings', 'make_announcements', 'moderate_content']
    }],
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Members
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['member', 'moderator'], default: 'member' },
    status: { type: String, enum: ['active', 'muted', 'banned'], default: 'active' },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Community Rules
  rules: [{
    title: { type: String, required: true },
    description: { type: String, required: true }
  }],
  
  // Settings
  settings: {
    allowMemberInvites: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    allowImagePosts: { type: Boolean, default: true },
    allowProductPosts: { type: Boolean, default: true },
    allowExternalLinks: { type: Boolean, default: false },
    maxPostsPerDay: { type: Number, default: 10 },
    autoDeleteInactiveMembers: { type: Boolean, default: false },
    inactivityDays: { type: Number, default: 30 }
  },
  
  // Content Moderation
  moderationSettings: {
    autoModerationEnabled: { type: Boolean, default: true },
    bannedWords: [{ type: String }],
    requirePostApproval: { type: Boolean, default: false },
    spamDetection: { type: Boolean, default: true }
  },
  
  // Statistics
  stats: {
    totalMembers: { type: Number, default: 0 },
    totalPosts: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    dailyActiveUsers: { type: Number, default: 0 },
    weeklyActiveUsers: { type: Number, default: 0 },
    monthlyActiveUsers: { type: Number, default: 0 }
  },
  
  // Activity
  lastActivity: { type: Date, default: Date.now },
  
  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  
  // Featured
  isFeatured: { type: Boolean, default: false },
  featuredUntil: { type: Date },
  
  // Tags for search
  tags: [{ type: String, maxlength: 50 }]
}, {
  timestamps: true
});

// Indexes for performance
communitySchema.index({ name: 'text', description: 'text', tags: 'text' });
communitySchema.index({ categories: 1 });
communitySchema.index({ 'targetLocations.city': 1 });
communitySchema.index({ isPrivate: 1, isActive: 1 });
communitySchema.index({ creator: 1 });
communitySchema.index({ 'members.user': 1 });

// Virtual for member count
communitySchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.status === 'active').length;
});

// Virtual for admin count
communitySchema.virtual('adminCount').get(function() {
  return this.admins.length;
});

// Pre-save middleware to update stats
communitySchema.pre('save', function(next) {
  if (this.isModified('members')) {
    this.stats.totalMembers = this.members.filter(member => member.status === 'active').length;
  }
  next();
});

// Methods

// Check if user is member
communitySchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && member.status === 'active'
  );
};

// Check if user is admin
communitySchema.methods.isAdmin = function(userId) {
  return this.creator.toString() === userId.toString() || 
         this.admins.some(admin => admin.user.toString() === userId.toString());
};

// Add member
communitySchema.methods.addMember = function(userId, invitedBy = null) {
  if (this.isMember(userId)) {
    throw new Error('User is already a member');
  }
  
  this.members.push({
    user: userId,
    invitedBy: invitedBy,
    joinedAt: new Date()
  });
  
  return this.save();
};

// Remove member
communitySchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
  return this.save();
};

// Add admin
communitySchema.methods.addAdmin = function(userId, permissions, assignedBy) {
  if (!this.isMember(userId)) {
    throw new Error('User must be a member first');
  }
  
  if (this.isAdmin(userId)) {
    throw new Error('User is already an admin');
  }
  
  this.admins.push({
    user: userId,
    permissions: permissions || ['manage_posts', 'moderate_content'],
    assignedBy: assignedBy,
    assignedAt: new Date()
  });
  
  return this.save();
};

// Generate invite code
communitySchema.methods.generateInviteCode = function() {
  const code = Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
  this.inviteCode = code.toUpperCase();
  return this.save();
};

// Generate invite link
communitySchema.methods.generateInviteLink = function() {
  const link = Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
  this.inviteLink = link;
  return this.save();
};

// Update activity
communitySchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Static methods

// Find public communities
communitySchema.statics.findPublic = function(page = 1, limit = 20) {
  return this.find({ isPrivate: false, isActive: true })
    .populate('creator', 'displayName businessName profilePicture')
    .sort({ 'stats.totalMembers': -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Find by category
communitySchema.statics.findByCategory = function(category, page = 1, limit = 20) {
  return this.find({ 
    categories: category, 
    isPrivate: false, 
    isActive: true 
  })
  .populate('creator', 'displayName businessName profilePicture')
  .sort({ 'stats.totalMembers': -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

// Find by location
communitySchema.statics.findByLocation = function(city, page = 1, limit = 20) {
  return this.find({ 
    'targetLocations.city': new RegExp(city, 'i'),
    isPrivate: false,
    isActive: true 
  })
  .populate('creator', 'displayName businessName profilePicture')
  .sort({ 'targetLocations.priority': -1, 'stats.totalMembers': -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

const Community = mongoose.model('Community', communitySchema);

export default Community;
