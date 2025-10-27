import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tier: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: false
  },

  // Pricing
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },

  // Payment Information
  paymentHistory: [{
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet']
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending', 'refunded'],
      default: 'pending'
    },
    paidAt: { type: Date },
    invoiceUrl: { type: String },
    receiptUrl: { type: String }
  }],

  // Features included in subscription
  features: {
    maxProducts: { type: Number, default: 10 },
    maxPhotosPerProduct: { type: Number, default: 5 },
    analyticsAccess: { type: Boolean, default: false },
    featuredListings: { type: Number, default: 0 },
    adCreditsPerMonth: { type: Number, default: 0 },
    prioritySupport: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    bulkImport: { type: Boolean, default: false },
    advancedReporting: { type: Boolean, default: false }
  },

  // Discount/Promotion
  discountApplied: {
    code: { type: String },
    percentage: { type: Number, min: 0, max: 100 },
    amount: { type: Number, min: 0 }
  },

  // Cancellation info
  cancellationDate: { type: Date },
  cancellationReason: { type: String },

  // Notes
  notes: { type: String }
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });
subscriptionSchema.index({ tier: 1 });

// Check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && new Date() < this.endDate;
};

// Renew subscription
subscriptionSchema.methods.renew = async function(duration = 30) {
  this.startDate = this.endDate;
  this.endDate = new Date(this.endDate.getTime() + duration * 24 * 60 * 60 * 1000);
  this.status = 'active';
  return this.save();
};

// Cancel subscription
subscriptionSchema.methods.cancel = async function(reason) {
  this.status = 'cancelled';
  this.cancellationDate = new Date();
  this.cancellationReason = reason;
  this.autoRenew = false;
  return this.save();
};

// Add payment to history
subscriptionSchema.methods.addPayment = function(paymentData) {
  this.paymentHistory.push(paymentData);
  if (paymentData.status === 'success') {
    this.status = 'active';
  }
  return this.save();
};

// Static method to get active subscription for user
subscriptionSchema.statics.getActiveSubscription = function(userId) {
  return this.findOne({
    user: userId,
    status: 'active',
    endDate: { $gt: new Date() }
  }).sort({ endDate: -1 });
};

// Static method to get subscription history for user
subscriptionSchema.statics.getSubscriptionHistory = function(userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
