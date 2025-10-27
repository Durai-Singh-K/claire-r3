import mongoose from 'mongoose';

// Conversation Schema
const conversationSchema = new mongoose.Schema({
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
    role: { type: String, enum: ['participant'], default: 'participant' }
  }],
  
  type: {
    type: String,
    enum: ['direct'], // Only direct messages for now
    default: 'direct'
  },
  
  lastMessage: {
    content: { type: String },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date },
    type: { type: String, enum: ['text', 'voice', 'image', 'file'] }
  },
  
  // Settings
  settings: {
    autoTranslate: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  },
  
  // Status for each participant
  participantStatus: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastSeen: { type: Date },
    unreadCount: { type: Number, default: 0 },
    isTyping: { type: Boolean, default: false },
    lastTyping: { type: Date },
    isMuted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false }
  }],
  
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Message Schema
const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  content: {
    original: {
      text: { type: String },
      language: { type: String, default: 'auto' }
    },
    translated: [{
      language: { type: String, required: true },
      text: { type: String, required: true },
      translatedAt: { type: Date, default: Date.now },
      confidence: { type: Number }
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
    duration: { type: Number }, // in seconds
    transcription: {
      text: { type: String },
      language: { type: String },
      confidence: { type: Number }
    },
    waveform: [{ type: Number }] // Audio waveform data for visualization
  },
  
  // Image/File specific
  media: {
    url: { type: String },
    filename: { type: String },
    mimeType: { type: String },
    size: { type: Number }, // in bytes
    thumbnail: { type: String },
    dimensions: {
      width: { type: Number },
      height: { type: Number }
    }
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Read receipts
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  
  // Message reactions
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }, // Unicode emoji
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Forward information
  forwarded: {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    originalMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    forwardedAt: { type: Date }
  },
  
  // Editing
  editHistory: [{
    previousContent: { type: String },
    editedAt: { type: Date, default: Date.now }
  }],
  isEdited: { type: Boolean, default: false },
  
  // Message scheduling (for future feature)
  scheduledFor: { type: Date },
  isScheduled: { type: Boolean, default: false },
  
  // System message data
  systemData: {
    type: { type: String }, // 'user_joined', 'user_left', etc.
    data: { type: mongoose.Schema.Types.Mixed }
  },
  
  // Encryption (for future security enhancement)
  isEncrypted: { type: Boolean, default: false },
  
  // Temporary message (auto-delete)
  expiresAt: { type: Date },
  isTemporary: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes for performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ status: 1 });

// Virtual for active participants
conversationSchema.virtual('activeParticipants').get(function() {
  return this.participants.filter(p => !p.leftAt);
});

// Methods for Conversation

// Check if user is participant
conversationSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => 
    p.user.toString() === userId.toString() && !p.leftAt
  );
};

// Add participant
conversationSchema.methods.addParticipant = function(userId) {
  if (this.isParticipant(userId)) {
    return Promise.resolve(this);
  }
  
  this.participants.push({ user: userId });
  this.participantStatus.push({ user: userId });
  return this.save();
};

// Remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.leftAt = new Date();
  }
  
  return this.save();
};

// Update last seen
conversationSchema.methods.updateLastSeen = function(userId) {
  const status = this.participantStatus.find(s => 
    s.user.toString() === userId.toString()
  );
  
  if (status) {
    status.lastSeen = new Date();
    status.unreadCount = 0;
  }
  
  return this.save();
};

// Set typing status
conversationSchema.methods.setTyping = function(userId, isTyping) {
  const status = this.participantStatus.find(s => 
    s.user.toString() === userId.toString()
  );
  
  if (status) {
    status.isTyping = isTyping;
    status.lastTyping = new Date();
  }
  
  return this.save();
};

// Get unread count for user
conversationSchema.methods.getUnreadCount = function(userId) {
  const status = this.participantStatus.find(s => 
    s.user.toString() === userId.toString()
  );
  
  return status ? status.unreadCount : 0;
};

// Update last message
conversationSchema.methods.updateLastMessage = function(messageData) {
  this.lastMessage = {
    content: messageData.content.original.text,
    sender: messageData.sender,
    timestamp: messageData.createdAt || new Date(),
    type: messageData.type
  };
  
  // Increment unread count for other participants
  this.participantStatus.forEach(status => {
    if (status.user.toString() !== messageData.sender.toString()) {
      status.unreadCount += 1;
    }
  });
  
  return this.save();
};

// Methods for Message

// Mark as read
messageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(r => r.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId });
    this.status = 'read';
  }
  return this.save();
};

// Add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => 
    r.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({ user: userId, emoji: emoji });
  return this.save();
};

// Remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => 
    r.user.toString() !== userId.toString()
  );
  return this.save();
};

// Edit message
messageSchema.methods.editMessage = function(newContent) {
  this.editHistory.push({
    previousContent: this.content.original.text
  });
  
  this.content.original.text = newContent;
  this.isEdited = true;
  return this.save();
};

// Add translation
messageSchema.methods.addTranslation = function(language, translatedText, confidence = 1) {
  // Remove existing translation for this language
  this.content.translated = this.content.translated.filter(t => 
    t.language !== language
  );
  
  // Add new translation
  this.content.translated.push({
    language: language,
    text: translatedText,
    confidence: confidence
  });
  
  return this.save();
};

// Get translation
messageSchema.methods.getTranslation = function(language) {
  return this.content.translated.find(t => t.language === language);
};

// Static methods

// Find conversation between users
conversationSchema.statics.findBetweenUsers = function(userId1, userId2) {
  return this.findOne({
    type: 'direct',
    'participants.user': { $all: [userId1, userId2] },
    'participants.leftAt': { $exists: false }
  });
};

// Get user conversations
conversationSchema.statics.getUserConversations = function(userId, page = 1, limit = 20) {
  return this.find({
    'participants.user': userId,
    'participants.leftAt': { $exists: false },
    isActive: true
  })
  .populate('participants.user', 'displayName businessName profilePicture onlineStatus')
  .populate('lastMessage.sender', 'displayName')
  .sort({ updatedAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

// Get messages in conversation
messageSchema.statics.getConversationMessages = function(conversationId, page = 1, limit = 50) {
  return this.find({ conversation: conversationId })
    .populate('sender', 'displayName businessName profilePicture')
    .populate('replyTo', 'content.original.text sender')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

export { Conversation, Message };
