import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['fabrics', 'sarees', 'dress-materials', 'home-textiles', 'garments', 'accessories', 'yarns', 'other'],
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  price: {
    amount: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP']
    },
    unit: {
      type: String,
      required: true,
      enum: ['piece', 'meter', 'kg', 'set', 'dozen', 'box']
    }
  },
  minOrderQuantity: {
    type: Number,
    required: [true, 'Minimum order quantity is required'],
    min: [1, 'Minimum order quantity must be at least 1']
  },
  maxOrderQuantity: {
    type: Number,
    min: [1, 'Maximum order quantity must be at least 1']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    min: [0, 'Stock quantity cannot be negative']
  },
  specifications: {
    material: String,
    color: String,
    pattern: String,
    width: String,
    weight: String,
    gsm: Number,
    threadCount: Number,
    fabricType: String,
    careInstructions: String,
    customFields: [{
      key: String,
      value: String
    }]
  },
  bulkPricing: [{
    minQuantity: {
      type: Number,
      required: true
    },
    maxQuantity: Number,
    price: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'out-of-stock', 'discontinued'],
    default: 'active',
    index: true
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'members-only'],
    default: 'public'
  },
  location: {
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  shipping: {
    available: {
      type: Boolean,
      default: true
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: Number,
    deliveryTime: String,
    zones: [String]
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    inquiries: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    lastViewedAt: Date
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  featured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date,
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

// Indexes for performance
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ 'price.amount': 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ featured: 1, featuredUntil: 1 });

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0];
});

// Method to increment view count
productSchema.methods.incrementViews = async function() {
  this.analytics.views += 1;
  this.analytics.lastViewedAt = new Date();
  return this.save();
};

// Method to toggle like
productSchema.methods.toggleLike = async function(userId) {
  const index = this.likedBy.indexOf(userId);
  if (index > -1) {
    this.likedBy.splice(index, 1);
    this.analytics.likes = Math.max(0, this.analytics.likes - 1);
  } else {
    this.likedBy.push(userId);
    this.analytics.likes += 1;
  }
  return this.save();
};

// Static method to get products by seller
productSchema.statics.getBySeller = function(sellerId, filters = {}) {
  const query = { seller: sellerId, ...filters };
  return this.find(query).sort({ createdAt: -1 });
};

const Product = mongoose.model('Product', productSchema);

export default Product;
