import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  // Parties involved
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Transaction details
  transactionId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },

  // Amount
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

  // Breakdown
  breakdown: {
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    shippingCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 }
  },

  // Payment details
  paymentMethod: {
    type: String,
    enum: ['upi', 'cash', 'card', 'netbanking', 'cheque', 'bank_transfer', 'cod', 'wallet'],
    required: true
  },
  paymentGateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'paytm', 'phonepe', 'manual']
  },
  gatewayTransactionId: {
    type: String
  },

  // Status
  status: {
    type: String,
    enum: ['initiated', 'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'initiated',
    index: true
  },

  // Timestamps for status changes
  statusHistory: [{
    status: {
      type: String,
      enum: ['initiated', 'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']
    },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }],

  // Payment dates
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },

  // Refund information
  refund: {
    amount: { type: Number },
    reason: { type: String },
    refundedAt: { type: Date },
    refundTransactionId: { type: String }
  },

  // Invoice/Receipt
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  invoiceUrl: {
    type: String
  },
  receiptUrl: {
    type: String
  },

  // Notes
  buyerNotes: {
    type: String,
    maxlength: 500
  },
  sellerNotes: {
    type: String,
    maxlength: 500
  },
  adminNotes: {
    type: String,
    maxlength: 500
  },

  // Metadata
  metadata: {
    ipAddress: { type: String },
    userAgent: { type: String },
    deviceType: { type: String }
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ buyer: 1, status: 1, createdAt: -1 });
transactionSchema.index({ seller: 1, status: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1 });

// Generate transaction ID before save
transactionSchema.pre('save', async function(next) {
  if (this.isNew && !this.transactionId) {
    const generateTxnId = () => {
      const prefix = 'TXN';
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${prefix}${timestamp}${random}`;
    };

    let unique = false;
    while (!unique) {
      this.transactionId = generateTxnId();
      const existing = await this.constructor.findOne({ transactionId: this.transactionId });
      if (!existing) unique = true;
    }
  }

  // Add to status history if status changed
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });

    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    }
  }

  next();
});

// Update seller's order count on completion
transactionSchema.post('save', async function(doc) {
  if (doc.status === 'completed') {
    try {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(doc.seller, {
        $inc: { totalOrders: 1 }
      });
    } catch (error) {
      console.error('Error updating seller order count:', error);
    }
  }
});

// Mark as completed
transactionSchema.methods.markCompleted = function(note) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (note) {
    this.statusHistory.push({
      status: 'completed',
      timestamp: new Date(),
      note
    });
  }
  return this.save();
};

// Mark as failed
transactionSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.statusHistory.push({
    status: 'failed',
    timestamp: new Date(),
    note: reason
  });
  return this.save();
};

// Process refund
transactionSchema.methods.processRefund = function(amount, reason) {
  this.status = 'refunded';
  this.refund = {
    amount: amount || this.amount,
    reason,
    refundedAt: new Date(),
    refundTransactionId: `REFUND-${this.transactionId}`
  };
  return this.save();
};

// Static method to get transaction summary for user
transactionSchema.statics.getUserTransactionSummary = async function(userId, role = 'both') {
  const query = {};

  if (role === 'buyer') {
    query.buyer = userId;
  } else if (role === 'seller') {
    query.seller = userId;
  } else {
    query.$or = [{ buyer: userId }, { seller: userId }];
  }

  const transactions = await this.find(query);

  const summary = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => t.status === 'pending' || t.status === 'processing').length,
    failed: transactions.filter(t => t.status === 'failed').length,
    refunded: transactions.filter(t => t.status === 'refunded').length,
    totalAmount: transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
  };

  return summary;
};

// Static method to get recent transactions
transactionSchema.statics.getRecentTransactions = function(userId, role = 'both', limit = 10) {
  const query = {};

  if (role === 'buyer') {
    query.buyer = userId;
  } else if (role === 'seller') {
    query.seller = userId;
  } else {
    query.$or = [{ buyer: userId }, { seller: userId }];
  }

  return this.find(query)
    .populate('buyer', 'displayName businessName profilePicture')
    .populate('seller', 'displayName businessName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit);
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
