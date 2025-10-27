import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import multer from 'multer';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @desc    Get all products (with filters)
// @route   GET /api/products
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isString(),
  query('minPrice').optional().isNumeric(),
  query('maxPrice').optional().isNumeric(),
  query('inStock').optional().isBoolean(),
  query('sortBy').optional().isIn(['newest', 'price-low', 'price-high', 'popular'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    page = 1,
    limit = 20,
    category,
    subcategory,
    minPrice,
    maxPrice,
    inStock,
    sortBy = 'newest',
    search
  } = req.query;

  // Build query
  let query = { status: 'active', visibility: 'public' };

  if (category) query.category = category;
  if (subcategory) query.subcategory = subcategory;
  if (inStock === 'true') query.inStock = true;

  if (minPrice || maxPrice) {
    query['price.amount'] = {};
    if (minPrice) query['price.amount'].$gte = Number(minPrice);
    if (maxPrice) query['price.amount'].$lte = Number(maxPrice);
  }

  if (search) {
    query.$text = { $search: search };
  }

  // Build sort
  let sort = {};
  switch (sortBy) {
    case 'price-low':
      sort = { 'price.amount': 1 };
      break;
    case 'price-high':
      sort = { 'price.amount': -1 };
      break;
    case 'popular':
      sort = { 'analytics.views': -1, 'analytics.likes': -1 };
      break;
    default:
      sort = { createdAt: -1 };
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('seller', 'displayName businessName profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(query)
  ]);

  res.json({
    success: true,
    products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// @desc    Get my products
// @route   GET /api/products/my
// @access  Private
router.get('/my', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  let query = { seller: req.userId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(query)
  ]);

  res.json({
    success: true,
    products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = [
    { id: 'fabrics', name: 'Fabrics', description: 'Cotton, Silk, Polyester and more' },
    { id: 'sarees', name: 'Sarees', description: 'Traditional Indian sarees' },
    { id: 'dress-materials', name: 'Dress Materials', description: 'Unstitched fabric sets' },
    { id: 'home-textiles', name: 'Home Textiles', description: 'Bedsheets, curtains, towels' },
    { id: 'garments', name: 'Garments', description: 'Ready-made clothing' },
    { id: 'accessories', name: 'Accessories', description: 'Buttons, zippers, threads' },
    { id: 'yarns', name: 'Yarns', description: 'Cotton, wool, synthetic yarns' },
    { id: 'other', name: 'Other', description: 'Other textile products' }
  ];

  // Get product counts per category
  const counts = await Product.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const countsMap = counts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    productCount: countsMap[cat.id] || 0
  }));

  res.json({
    success: true,
    categories: categoriesWithCounts
  });
}));

// @desc    Create new product
// @route   POST /api/products
// @access  Private
router.post('/', [
  body('name').isLength({ min: 3, max: 200 }).withMessage('Name must be 3-200 characters'),
  body('description').isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('category').isIn(['fabrics', 'sarees', 'dress-materials', 'home-textiles', 'garments', 'accessories', 'yarns', 'other']),
  body('price.amount').isNumeric().withMessage('Price must be a number'),
  body('price.unit').isIn(['piece', 'meter', 'kg', 'set', 'dozen', 'box']),
  body('minOrderQuantity').isInt({ min: 1 }).withMessage('Minimum order quantity must be at least 1')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const productData = {
    ...req.body,
    seller: req.userId
  };

  // Remove empty images array if present
  if (productData.images && productData.images.length === 0) {
    delete productData.images;
  }

  try {
    const product = new Product(productData);
    await product.save();

    await product.populate('seller', 'displayName businessName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create product',
      errors: [{ msg: error.message }]
    });
  }
}));

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('seller', 'displayName businessName profilePicture phone whatsapp email shopLocation');

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Increment view count (don't await)
  product.incrementViews().catch(err => console.error('Failed to increment views:', err));

  res.json({ success: true, product });
}));

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
router.put('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Check ownership - fix authorization comparison
  const sellerIdString = product.seller.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || sellerIdString !== userIdString) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
  }

  // Update fields
  const allowedUpdates = [
    'name', 'description', 'category', 'subcategory', 'price', 'minOrderQuantity',
    'maxOrderQuantity', 'inStock', 'stockQuantity', 'specifications', 'bulkPricing',
    'tags', 'status', 'visibility', 'location', 'shipping', 'seo'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  await product.save();

  res.json({
    success: true,
    message: 'Product updated successfully',
    product
  });
}));

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Check ownership - fix authorization comparison
  const sellerIdString = product.seller.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || sellerIdString !== userIdString) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
  }

  // Delete images from Cloudinary
  if (product.images.length > 0) {
    const deletePromises = product.images
      .filter(img => img.publicId)
      .map(img => deleteFromCloudinary(img.publicId));
    await Promise.allSettled(deletePromises);
  }

  await product.deleteOne();

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
}));

// @desc    Upload product images (Base64)
// @route   POST /api/products/:id/images/base64
// @access  Private
router.post('/:id/images/base64', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Check ownership - fix authorization comparison
  const sellerIdString = product.seller.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || sellerIdString !== userIdString) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized - you can only upload images to your own products'
    });
  }

  const { images } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ success: false, message: 'No images provided' });
  }

  if (images.length > 5) {
    return res.status(400).json({ success: false, message: 'Maximum 5 images allowed' });
  }

  // Add Base64 images to product
  const newImages = images.map((imageData, index) => ({
    url: imageData.url, // Base64 data URL
    publicId: null, // Not using Cloudinary
    alt: imageData.alt || product.name,
    isPrimary: product.images.length === 0 && index === 0
  }));

  product.images.push(...newImages);
  await product.save();

  res.json({
    success: true,
    message: 'Images uploaded successfully',
    images: newImages
  });
}));

// @desc    Upload product images (Multer/Cloudinary - fallback)
// @route   POST /api/products/:id/images
// @access  Private
router.post('/:id/images', upload.array('images', 5), asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Check ownership - fix authorization comparison
  const sellerIdString = product.seller.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || sellerIdString !== userIdString) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No images provided' });
  }

  try {
    // Try uploading to Cloudinary
    const uploadPromises = req.files.map(file =>
      uploadToCloudinary(file.buffer, 'products')
    );

    const uploadResults = await Promise.all(uploadPromises);

    // Add images to product
    const newImages = uploadResults.map((result, index) => ({
      url: result.secure_url,
      publicId: result.public_id,
      alt: req.body.alt || product.name,
      isPrimary: product.images.length === 0 && index === 0
    }));

    product.images.push(...newImages);
    await product.save();

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      images: newImages
    });
  } catch (cloudinaryError) {
    console.error('Cloudinary upload failed, falling back to Base64:', cloudinaryError);

    // Fallback to Base64 if Cloudinary fails
    const newImages = req.files.map((file, index) => ({
      url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      publicId: null,
      alt: req.body.alt || product.name,
      isPrimary: product.images.length === 0 && index === 0
    }));

    product.images.push(...newImages);
    await product.save();

    res.json({
      success: true,
      message: 'Images uploaded successfully (Base64)',
      images: newImages
    });
  }
}));

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private
router.delete('/:id/images/:imageId', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Check ownership - fix authorization comparison
  const sellerIdString = product.seller.toString();
  const userIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || sellerIdString !== userIdString) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const imageIndex = product.images.findIndex(
    img => img._id.toString() === req.params.imageId
  );

  if (imageIndex === -1) {
    return res.status(404).json({ success: false, message: 'Image not found' });
  }

  const image = product.images[imageIndex];

  // Delete from Cloudinary
  if (image.publicId) {
    await deleteFromCloudinary(image.publicId);
  }

  product.images.splice(imageIndex, 1);

  // If deleted image was primary, make first image primary
  if (image.isPrimary && product.images.length > 0) {
    product.images[0].isPrimary = true;
  }

  await product.save();

  res.json({
    success: true,
    message: 'Image deleted successfully'
  });
}));

// @desc    Like/Unlike product
// @route   PUT /api/products/:id/like
// @access  Private
router.put('/:id/like', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  await product.toggleLike(req.userId);

  res.json({
    success: true,
    message: product.likedBy.includes(req.userId) ? 'Product liked' : 'Product unliked',
    likes: product.analytics.likes
  });
}));

// @desc    Send product inquiry
// @route   POST /api/products/:id/inquiry
// @access  Private
router.post('/:id/inquiry', [
  body('message').isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  body('quantity').optional().isInt({ min: 1 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const product = await Product.findById(req.params.id).populate('seller');

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Increment inquiry count
  product.analytics.inquiries += 1;
  await product.save();

  // TODO: Create notification for seller
  // TODO: Send email to seller

  res.json({
    success: true,
    message: 'Inquiry sent successfully'
  });
}));

export default router;
