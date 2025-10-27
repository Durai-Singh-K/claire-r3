import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Rating
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  // Review content
  title: {
    type: String,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },

  // Category ratings
  ratings: {
    quality: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    delivery: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 }
  },

  // Transaction reference
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  transactionId: {
    type: String
  },

  // Media
  images: [{
    type: String
  }],

  // Response from business
  response: {
    text: { type: String, maxlength: 500 },
    respondedAt: { type: Date }
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'published', 'flagged', 'removed'],
    default: 'published'
  },

  // Moderation
  flaggedReason: {
    type: String
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  },

  // Helpfulness
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulVotes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    votedAt: { type: Date, default: Date.now }
  }],

  // Verification
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ reviewee: 1, status: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isVerifiedPurchase: 1 });
reviewSchema.index({ 'reviewer': 1, 'reviewee': 1 }, { unique: true }); // One review per user pair

// Prevent self-review
reviewSchema.pre('save', function(next) {
  if (this.reviewer.toString() === this.reviewee.toString()) {
    next(new Error('Cannot review yourself'));
  } else {
    next();
  }
});

// Update reviewee's rating after save
reviewSchema.post('save', async function(doc) {
  try {
    const User = mongoose.model('User');

    // Calculate new average rating
    const reviews = await mongoose.model('Review').find({
      reviewee: doc.reviewee,
      status: 'published'
    });

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    await User.findByIdAndUpdate(doc.reviewee, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Error updating user rating:', error);
  }
});

// Update reviewee's rating after deletion
reviewSchema.post('remove', async function(doc) {
  try {
    const User = mongoose.model('User');

    const reviews = await mongoose.model('Review').find({
      reviewee: doc.reviewee,
      status: 'published'
    });

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    await User.findByIdAndUpdate(doc.reviewee, {
      rating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Error updating user rating:', error);
  }
});

// Add business response
reviewSchema.methods.addResponse = function(responseText) {
  this.response = {
    text: responseText,
    respondedAt: new Date()
  };
  return this.save();
};

// Flag review
reviewSchema.methods.flag = function(reason, moderatorId) {
  this.status = 'flagged';
  this.flaggedReason = reason;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  return this.save();
};

// Mark as helpful
reviewSchema.methods.markHelpful = async function(userId) {
  const alreadyVoted = this.helpfulVotes.some(
    vote => vote.user.toString() === userId.toString()
  );

  if (!alreadyVoted) {
    this.helpfulVotes.push({ user: userId });
    this.helpfulCount += 1;
    await this.save();
  }

  return this;
};

// Static method to get reviews for a user
reviewSchema.statics.getReviewsForUser = function(userId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    minRating = 1
  } = options;

  return this.find({
    reviewee: userId,
    status: 'published',
    rating: { $gte: minRating }
  })
    .populate('reviewer', 'displayName profilePicture businessName')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to get rating statistics
reviewSchema.statics.getRatingStats = async function(userId) {
  const reviews = await this.find({
    reviewee: userId,
    status: 'published'
  });

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  reviews.forEach(review => {
    distribution[review.rating]++;
    totalRating += review.rating;
  });

  return {
    averageRating: Math.round((totalRating / reviews.length) * 10) / 10,
    totalReviews: reviews.length,
    distribution,
    categoryAverages: {
      quality: reviews.reduce((sum, r) => sum + (r.ratings?.quality || 0), 0) / reviews.length,
      communication: reviews.reduce((sum, r) => sum + (r.ratings?.communication || 0), 0) / reviews.length,
      delivery: reviews.reduce((sum, r) => sum + (r.ratings?.delivery || 0), 0) / reviews.length,
      professionalism: reviews.reduce((sum, r) => sum + (r.ratings?.professionalism || 0), 0) / reviews.length
    }
  };
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;
