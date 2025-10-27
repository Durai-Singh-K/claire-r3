import mongoose from 'mongoose';

const communityMessageSchema = new mongoose.Schema({
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
    index: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  content: {
    original: {
      text: { type: String },
      language: { type: String, default: 'en' }
    },
    translated: [{
      language: { type: String, required: true },
      text: { type: String, required: true },
      translatedAt: { type: Date, default: Date.now }
    }]
  },

  type: {
    type: String,
    enum: ['text', 'voice', 'image', 'file', 'system'],
    default: 'text'
  },

  // Voice message specific
  voice: {
    audioUrl: { type: String },
    duration: { type: Number },
    transcription: {
      text: { type: String },
      language: { type: String }
    }
  },

  // Media (images/files)
  media: {
    type: { type: String, enum: ['image', 'file', 'video'] },
    url: { type: String },
    filename: { type: String },
    size: { type: Number },
    mimeType: { type: String }
  },

  // Reply to message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityMessage'
  },

  // Reactions
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],

  // Read receipts
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],

  // Edited
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },

  // Deleted
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },

  // Mentioned users
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes
communityMessageSchema.index({ community: 1, createdAt: -1 });
communityMessageSchema.index({ sender: 1 });
communityMessageSchema.index({ 'readBy.user': 1 });

// Methods
communityMessageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(r => r.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

communityMessageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from user if any
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  this.reactions.push({ user: userId, emoji });
  return this.save();
};

communityMessageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  return this.save();
};

// Static methods
communityMessageSchema.statics.getCommunityMessages = async function(communityId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  return this.find({
    community: communityId,
    isDeleted: false
  })
  .populate('sender', 'displayName businessName profilePicture')
  .populate('replyTo')
  .populate('reactions.user', 'displayName profilePicture')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

const CommunityMessage = mongoose.model('CommunityMessage', communityMessageSchema);

export default CommunityMessage;
