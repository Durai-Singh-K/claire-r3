import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  
  message: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  // Response details
  respondedAt: { type: Date },
  responseMessage: {
    type: String,
    maxlength: 500
  },
  
  // Auto expiry
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  },
  
  // Metadata
  requestSource: {
    type: String,
    enum: ['profile', 'community', 'post', 'search', 'suggestion'],
    default: 'profile'
  },
  
  commonConnections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commonCommunities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }]
}, {
  timestamps: true
});

// Indexes
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });
friendRequestSchema.index({ to: 1, status: 1 });
friendRequestSchema.index({ from: 1, status: 1 });
friendRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for is expired
friendRequestSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Methods

// Accept request
friendRequestSchema.methods.accept = function(responseMessage = '') {
  this.status = 'accepted';
  this.respondedAt = new Date();
  this.responseMessage = responseMessage;
  return this.save();
};

// Reject request
friendRequestSchema.methods.reject = function(responseMessage = '') {
  this.status = 'rejected';
  this.respondedAt = new Date();
  this.responseMessage = responseMessage;
  return this.save();
};

// Cancel request
friendRequestSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Static methods

// Check if request exists
friendRequestSchema.statics.requestExists = function(fromId, toId) {
  return this.findOne({
    $or: [
      { from: fromId, to: toId, status: 'pending' },
      { from: toId, to: fromId, status: 'pending' }
    ]
  });
};

// Get pending requests for user
friendRequestSchema.statics.getPendingRequests = function(userId, type = 'received') {
  const query = { status: 'pending' };
  
  if (type === 'received') {
    query.to = userId;
  } else if (type === 'sent') {
    query.from = userId;
  }
  
  return this.find(query)
    .populate('from', 'displayName businessName profilePicture shopLocation categories')
    .populate('to', 'displayName businessName profilePicture')
    .sort({ createdAt: -1 });
};

// Get mutual connections
friendRequestSchema.statics.getMutualConnections = async function(userId1, userId2) {
  const User = mongoose.model('User');
  
  const user1 = await User.findById(userId1).populate('friends.user');
  const user2 = await User.findById(userId2).populate('friends.user');
  
  if (!user1 || !user2) return [];
  
  const user1Friends = user1.friends.map(f => f.user._id.toString());
  const user2Friends = user2.friends.map(f => f.user._id.toString());
  
  const mutual = user1Friends.filter(id => user2Friends.includes(id));
  return User.find({ _id: { $in: mutual } }).select('displayName businessName profilePicture');
};

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

export default FriendRequest;
