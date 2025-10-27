import express from 'express';
import { query, validationResult } from 'express-validator';
import axios from 'axios';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Ad from '../models/Ad.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createRateLimit } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting
const searchLimit = createRateLimit(60 * 1000, 30, 'Too many search requests. Please slow down.');
const imageSearchLimit = createRateLimit(60 * 1000, 10, 'Too many image search requests. Please slow down.');

// @desc    Global search
// @route   GET /api/search
// @access  Private
router.get('/', searchLimit, [
  query('q')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be 2-100 characters'),
  query('type')
    .optional()
    .isIn(['all', 'users', 'communities', 'posts', 'products'])
    .withMessage('Invalid search type'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { q, type = 'all', page = 1, limit = 10, location, category } = req.query;
  
  const results = {
    users: [],
    communities: [],
    posts: [],
    products: [],
    ads: []
  };
  
  try {
    if (type === 'all' || type === 'users') {
      // Search users
      let userQuery = {
        $or: [
          { displayName: { $regex: q, $options: 'i' } },
          { businessName: { $regex: q, $options: 'i' } },
          { username: { $regex: q, $options: 'i' } }
        ],
        isActive: true,
        onboardingCompleted: true,
        _id: { $ne: req.userId }
      };
      
      if (location) {
        userQuery['shopLocation.city'] = { $regex: location, $options: 'i' };
      }
      
      if (category) {
        userQuery.categories = { $in: [category] };
      }
      
      const users = await User.find(userQuery)
        .select('displayName businessName profilePicture shopLocation categories isVerified')
        .limit(type === 'users' ? parseInt(limit) : 5)
        .sort({ isVerified: -1, lastActive: -1 });
      
      results.users = users;
    }
    
    if (type === 'all' || type === 'communities') {
      // Search communities
      let communityQuery = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } }
        ],
        isPrivate: false,
        isActive: true
      };
      
      if (category) {
        communityQuery.categories = { $in: [category] };
      }
      
      if (location) {
        communityQuery['targetLocations.city'] = { $regex: location, $options: 'i' };
      }
      
      const communities = await Community.find(communityQuery)
        .populate('creator', 'displayName businessName profilePicture')
        .select('name description coverImage categories targetLocations stats')
        .limit(type === 'communities' ? parseInt(limit) : 5)
        .sort({ 'stats.totalMembers': -1 });
      
      results.communities = communities;
    }
    
    if (type === 'all' || type === 'posts') {
      // Search posts
      let postQuery = {
        $text: { $search: q },
        status: 'active'
      };
      
      const posts = await Post.find(postQuery)
        .populate('author', 'displayName businessName profilePicture')
        .populate('community', 'name')
        .select('content images product location createdAt analytics')
        .limit(type === 'posts' ? parseInt(limit) : 5)
        .sort({ score: { $meta: 'textScore' } });
      
      results.posts = posts;
    }
    
    if (type === 'all' || type === 'products') {
      // Search products
      let productQuery = {
        'content.type': 'product',
        $or: [
          { 'product.name': { $regex: q, $options: 'i' } },
          { 'product.tags': { $regex: q, $options: 'i' } },
          { 'content.text': { $regex: q, $options: 'i' } }
        ],
        status: 'active'
      };
      
      if (category) {
        productQuery['product.category'] = category;
      }
      
      if (location) {
        productQuery['location.city'] = { $regex: location, $options: 'i' };
      }
      
      const products = await Post.find(productQuery)
        .populate('author', 'displayName businessName profilePicture shopLocation')
        .select('content images product location createdAt analytics')
        .limit(type === 'products' ? parseInt(limit) : 5)
        .sort({ createdAt: -1 });
      
      results.products = products;
    }
    
    // Add sponsored content (ads)
    if (type === 'all') {
      const user = await User.findById(req.userId);
      const targetLocation = location || user.shopLocation.city;
      const targetCategories = category ? [category] : user.categories;
      
      const ads = await Ad.findForLocation(targetLocation, targetCategories, 2);
      
      // Record impressions for ads
      await Promise.all(ads.map(ad => ad.recordImpression()));
      
      results.ads = ads.map(ad => ({
        _id: ad._id,
        title: ad.title,
        description: ad.description,
        creative: ad.creative,
        product: ad.product,
        cta: ad.cta,
        owner: ad.owner,
        isSponsored: true
      }));
    }
    
    res.json({
      success: true,
      query: q,
      results,
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
}));

// @desc    Image search for products
// @route   GET /api/search/images
// @access  Private
router.get('/images', imageSearchLimit, [
  query('q')
    .isLength({ min: 2, max: 50 })
    .withMessage('Search query must be 2-50 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  const { q, limit = 10 } = req.query;
  
  try {
    // Using a free image search service (Unsplash API as fallback)
    // In production, you might use Bing Image Search API or Google Custom Search
    
    // Mock image search results for development
    const mockImages = [
      {
        id: '1',
        url: `https://source.unsplash.com/400x400/?${encodeURIComponent(q)},textile,1`,
        thumbnail: `https://source.unsplash.com/200x200/?${encodeURIComponent(q)},textile,1`,
        title: `${q} - Image 1`,
        source: 'Unsplash'
      },
      {
        id: '2',
        url: `https://source.unsplash.com/400x400/?${encodeURIComponent(q)},fabric,2`,
        thumbnail: `https://source.unsplash.com/200x200/?${encodeURIComponent(q)},fabric,2`,
        title: `${q} - Image 2`,
        source: 'Unsplash'
      },
      {
        id: '3',
        url: `https://source.unsplash.com/400x400/?${encodeURIComponent(q)},clothing,3`,
        thumbnail: `https://source.unsplash.com/200x200/?${encodeURIComponent(q)},clothing,3`,
        title: `${q} - Image 3`,
        source: 'Unsplash'
      },
      {
        id: '4',
        url: `https://source.unsplash.com/400x400/?${encodeURIComponent(q)},fashion,4`,
        thumbnail: `https://source.unsplash.com/200x200/?${encodeURIComponent(q)},fashion,4`,
        title: `${q} - Image 4`,
        source: 'Unsplash'
      },
      {
        id: '5',
        url: `https://source.unsplash.com/400x400/?${encodeURIComponent(q)},wear,5`,
        thumbnail: `https://source.unsplash.com/200x200/?${encodeURIComponent(q)},wear,5`,
        title: `${q} - Image 5`,
        source: 'Unsplash'
      }
    ];
    
    // For production, implement actual image search API
    /*
    const response = await axios.get('https://api.bing.microsoft.com/v7.0/images/search', {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_API_KEY
      },
      params: {
        q: `${q} textile clothing fashion`,
        count: limit,
        imageType: 'Photo',
        license: 'ShareCommercially',
        safeSearch: 'Strict'
      }
    });
    
    const images = response.data.value.map((img, index) => ({
      id: index + 1,
      url: img.contentUrl,
      thumbnail: img.thumbnailUrl,
      title: img.name,
      source: img.hostPageDisplayUrl,
      width: img.width,
      height: img.height
    }));
    */
    
    res.json({
      success: true,
      query: q,
      images: mockImages.slice(0, parseInt(limit)),
      totalCount: mockImages.length,
      notice: 'Images are from Unsplash for demonstration. In production, use licensed images or proper image search APIs.'
    });
    
  } catch (error) {
    console.error('Image search error:', error);
    
    // Fallback to placeholder images
    const fallbackImages = Array.from({ length: parseInt(limit) }, (_, index) => ({
      id: index + 1,
      url: `https://via.placeholder.com/400x400/6366f1/white?text=${encodeURIComponent(q)}`,
      thumbnail: `https://via.placeholder.com/200x200/6366f1/white?text=${encodeURIComponent(q)}`,
      title: `${q} - Sample ${index + 1}`,
      source: 'Placeholder'
    }));
    
    res.json({
      success: true,
      query: q,
      images: fallbackImages,
      totalCount: fallbackImages.length,
      fallback: true,
      message: 'Using placeholder images due to service unavailability'
    });
  }
}));

// @desc    Search suggestions/autocomplete
// @route   GET /api/search/suggestions
// @access  Private
router.get('/suggestions', [
  query('q')
    .isLength({ min: 1, max: 50 })
    .withMessage('Search query must be 1-50 characters'),
  query('type')
    .optional()
    .isIn(['users', 'communities', 'products', 'categories'])
    .withMessage('Invalid suggestion type')
], asyncHandler(async (req, res) => {
  const { q, type = 'all' } = req.query;
  
  const suggestions = [];
  
  try {
    if (type === 'all' || type === 'users') {
      // User suggestions
      const users = await User.find({
        $or: [
          { displayName: { $regex: `^${q}`, $options: 'i' } },
          { businessName: { $regex: `^${q}`, $options: 'i' } },
          { username: { $regex: `^${q}`, $options: 'i' } }
        ],
        isActive: true,
        _id: { $ne: req.userId }
      })
      .select('displayName businessName username profilePicture')
      .limit(5);
      
      suggestions.push(...users.map(user => ({
        type: 'user',
        id: user._id,
        text: user.businessName || user.displayName,
        subtitle: user.displayName !== user.businessName ? user.displayName : user.username,
        avatar: user.profilePicture
      })));
    }
    
    if (type === 'all' || type === 'communities') {
      // Community suggestions
      const communities = await Community.find({
        name: { $regex: `^${q}`, $options: 'i' },
        isPrivate: false,
        isActive: true
      })
      .select('name description coverImage')
      .limit(5);
      
      suggestions.push(...communities.map(community => ({
        type: 'community',
        id: community._id,
        text: community.name,
        subtitle: community.description?.substring(0, 50) + '...',
        avatar: community.coverImage
      })));
    }
    
    if (type === 'all' || type === 'categories') {
      // Category suggestions
      const categories = [
        'shirts', 'pants', 'sarees', 'kurtas', 'dresses', 
        'blouses', 'lehengas', 'suits', 'jackets', 'jeans',
        'ethnic_wear', 'western_wear', 'kids_clothing',
        'fabrics', 'accessories', 'footwear'
      ];
      
      const matchingCategories = categories
        .filter(cat => cat.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 5);
      
      suggestions.push(...matchingCategories.map(category => ({
        type: 'category',
        id: category,
        text: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        subtitle: 'Category'
      })));
    }
    
    if (type === 'all' || type === 'products') {
      // Product suggestions from recent posts
      const products = await Post.find({
        'content.type': 'product',
        'product.name': { $regex: q, $options: 'i' },
        status: 'active'
      })
      .select('product.name product.category')
      .limit(5);
      
      suggestions.push(...products.map(post => ({
        type: 'product',
        id: post._id,
        text: post.product.name,
        subtitle: post.product.category
      })));
    }
    
    // Sort suggestions by relevance (exact matches first)
    suggestions.sort((a, b) => {
      const aExact = a.text.toLowerCase().startsWith(q.toLowerCase());
      const bExact = b.text.toLowerCase().startsWith(q.toLowerCase());
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });
    
    res.json({
      success: true,
      query: q,
      suggestions: suggestions.slice(0, 10)
    });
    
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      suggestions: []
    });
  }
}));

// @desc    Popular searches
// @route   GET /api/search/popular
// @access  Private
router.get('/popular', asyncHandler(async (req, res) => {
  // In production, this would come from analytics data
  // For now, return popular textile-related searches
  
  const popularSearches = [
    { text: 'cotton shirts', category: 'shirts', count: 1250 },
    { text: 'silk sarees', category: 'sarees', count: 980 },
    { text: 'denim jeans', category: 'jeans', count: 850 },
    { text: 'wedding lehengas', category: 'lehengas', count: 750 },
    { text: 'formal suits', category: 'suits', count: 680 },
    { text: 'kurti designs', category: 'kurtas', count: 620 },
    { text: 'winter jackets', category: 'jackets', count: 590 },
    { text: 'party dresses', category: 'dresses', count: 540 },
    { text: 'ethnic wear', category: 'ethnic_wear', count: 480 },
    { text: 'kids clothing', category: 'kids_clothing', count: 420 }
  ];
  
  res.json({
    success: true,
    popularSearches: popularSearches.slice(0, 10)
  });
}));

// @desc    Search trending topics
// @route   GET /api/search/trending
// @access  Private
router.get('/trending', asyncHandler(async (req, res) => {
  const { location } = req.query;
  
  try {
    // Get trending hashtags from recent posts
    const recentPosts = await Post.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      hashtags: { $exists: true, $ne: [] },
      status: 'active'
    })
    .select('hashtags location')
    .limit(1000);
    
    // Count hashtag frequency
    const hashtagCounts = {};
    recentPosts.forEach(post => {
      if (location && post.location && post.location.city) {
        if (!post.location.city.toLowerCase().includes(location.toLowerCase())) {
          return; // Skip posts not in the specified location
        }
      }
      
      post.hashtags.forEach(tag => {
        const cleanTag = tag.toLowerCase().replace('#', '');
        hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
      });
    });
    
    // Sort by frequency and get top trends
    const trending = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({
        hashtag: `#${tag}`,
        count,
        category: getCategoryFromHashtag(tag)
      }));
    
    res.json({
      success: true,
      trending,
      location: location || 'All locations',
      period: '7 days'
    });
    
  } catch (error) {
    console.error('Trending search error:', error);
    
    // Fallback trending data
    const fallbackTrending = [
      { hashtag: '#cotton', count: 245, category: 'fabric' },
      { hashtag: '#festivalwear', count: 189, category: 'ethnic_wear' },
      { hashtag: '#wholesale', count: 167, category: 'business' },
      { hashtag: '#newcollection', count: 143, category: 'general' },
      { hashtag: '#handloom', count: 128, category: 'fabric' },
      { hashtag: '#designer', count: 112, category: 'fashion' },
      { hashtag: '#organic', count: 98, category: 'fabric' },
      { hashtag: '#sustainable', count: 87, category: 'fashion' },
      { hashtag: '#madeinIndia', count: 76, category: 'general' },
      { hashtag: '#bulkorders', count: 65, category: 'business' }
    ];
    
    res.json({
      success: true,
      trending: fallbackTrending,
      location: location || 'All locations',
      period: '7 days',
      fallback: true
    });
  }
}));

// Helper function to categorize hashtags
function getCategoryFromHashtag(tag) {
  const categoryMap = {
    'cotton': 'fabric',
    'silk': 'fabric',
    'wool': 'fabric',
    'linen': 'fabric',
    'polyester': 'fabric',
    'handloom': 'fabric',
    'organic': 'fabric',
    'sustainable': 'fashion',
    'designer': 'fashion',
    'vintage': 'fashion',
    'ethnic': 'ethnic_wear',
    'western': 'western_wear',
    'festivalwear': 'ethnic_wear',
    'partywear': 'fashion',
    'casualwear': 'fashion',
    'formalwear': 'fashion',
    'wholesale': 'business',
    'bulkorders': 'business',
    'b2b': 'business',
    'madeinIndia': 'general',
    'newcollection': 'general',
    'trending': 'general'
  };
  
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (tag.includes(keyword)) {
      return category;
    }
  }
  
  return 'general';
}

export default router;
