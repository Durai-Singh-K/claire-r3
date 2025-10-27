import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Globe, Search, Filter, MapPin, Star, ShoppingBag, Heart, MessageSquare, Send } from 'lucide-react';
import { Button, Avatar, Badge, Input, Loading } from '../components/ui';
import { formatCompactNumber, formatCurrency } from '../utils/formatters';
import { CATEGORIES } from '../config/constants';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const MarketplacePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid');

  const isMyProduct = (product) => {
    // Check if the product belongs to the current user
    const sellerId = product.seller?._id || product.seller?.id;
    return sellerId === user?._id || sellerId?.toString() === user?._id?.toString();
  };

  const handleInquireAboutProduct = async (product) => {
    try {
      // Check if user is trying to contact themselves
      if (isMyProduct(product)) {
        toast.error('You cannot message yourself');
        return;
      }

      // Get the seller ID
      const sellerId = product.seller?._id || product.seller?.id;

      if (!sellerId) {
        toast.error('Seller information not available');
        return;
      }

      // Create or get existing conversation
      toast.loading('Opening chat...', { id: 'inquire-product' });
      const response = await chatAPI.createConversation({ userId: sellerId });
      const conversation = response.data.conversation;

      toast.success('Redirecting to chat...', { id: 'inquire-product' });

      // Navigate to messages page with the conversation ID and product info
      navigate('/messages', {
        state: {
          conversationId: conversation._id,
          productContext: {
            _id: product.id,
            name: product.name,
            price: { amount: product.price, currency: product.currency, unit: product.unit },
            images: product.images,
            description: product.description,
            category: product.category
          }
        }
      });
    } catch (error) {
      console.error('Failed to inquire about product:', error);
      toast.error('Failed to open chat. Please try again.', { id: 'inquire-product' });
    }
  };

  // Mock marketplace data
  const products = [
    {
      id: 1,
      name: 'Premium Cotton Fabric - 100% Organic',
      description: 'High-quality organic cotton fabric perfect for shirts, dresses, and casual wear. Soft texture with excellent durability.',
      price: 250,
      currency: 'INR',
      unit: 'meter',
      minOrderQuantity: 100,
      category: 'fabrics',
      images: [{ url: 'https://via.placeholder.com/400x300?text=Cotton+Fabric' }],
      seller: {
        name: 'Mumbai Cotton Mills',
        location: 'Mumbai, Maharashtra',
        rating: 4.8,
        verified: true,
        avatar: null
      },
      stats: {
        views: 1250,
        likes: 45,
        inquiries: 23
      }
    },
    {
      id: 2,
      name: 'Designer Silk Sarees - Handwoven',
      description: 'Beautiful traditional silk sarees with intricate handwoven designs. Perfect for special occasions and celebrations.',
      price: 5000,
      currency: 'INR',
      unit: 'piece',
      minOrderQuantity: 5,
      category: 'sarees',
      images: [{ url: 'https://via.placeholder.com/400x300?text=Silk+Saree' }],
      seller: {
        name: 'Chennai Silk House',
        location: 'Chennai, Tamil Nadu',
        rating: 4.9,
        verified: true,
        avatar: null
      },
      stats: {
        views: 890,
        likes: 67,
        inquiries: 34
      }
    }
  ];

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Product Image */}
      <div className="relative aspect-square">
        <img
          src={product.images[0]?.url}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {/* Quick Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow">
            <Heart className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <Badge.Category category={product.category} size="xs" />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <Badge.Price 
              price={product.price} 
              currency={product.currency}
              size="sm" 
            />
            <span className="text-xs text-gray-500 ml-1">
              / {product.unit}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Min: {formatCompactNumber(product.minOrderQuantity)}
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-gray-100">
          <Avatar
            src={product.seller.avatar}
            name={product.seller.name}
            size="xs"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-900 truncate">
                {product.seller.name}
              </span>
              {product.seller.verified && <Badge.Verification verified />}
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>{product.seller.location}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs text-gray-600">{product.seller.rating}</span>
          </div>
        </div>

        {/* Stats and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span>{formatCompactNumber(product.stats.views)} views</span>
            <span>{formatCompactNumber(product.stats.likes)} likes</span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Show Inquire button only for products not owned by user */}
            {!isMyProduct(product) && (
              <Button
                size="sm"
                variant="primary"
                icon={Send}
                onClick={() => handleInquireAboutProduct(product)}
                title="Inquire about this product"
              >
                Inquire
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Marketplace - WholeSale Connect</title>
        <meta name="description" content="Discover and buy textile products from verified wholesale suppliers." />
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Globe className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Global Marketplace
            </h1>
          </div>
          <p className="text-gray-600">
            Discover and source textile products from verified wholesale suppliers worldwide
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search products, categories, or suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
                size="lg"
                fullWidth
              />
            </div>
            <Button variant="outline" icon={Filter}>
              Advanced Filters
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input w-full"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="input w-full"
              >
                <option value="">All Locations</option>
                <option value="mumbai">Mumbai</option>
                <option value="delhi">Delhi</option>
                <option value="bangalore">Bangalore</option>
                <option value="chennai">Chennai</option>
                <option value="kolkata">Kolkata</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input w-full"
              >
                <option value="relevance">Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Order
              </label>
              <select className="input w-full">
                <option value="">Any Quantity</option>
                <option value="1-10">1-10 pieces</option>
                <option value="10-50">10-50 pieces</option>
                <option value="50-100">50-100 pieces</option>
                <option value="100+">100+ pieces</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-600">
              Showing {formatCompactNumber(products.length)} products
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : ''
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : ''
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Load More Products
          </Button>
        </div>

        {/* Featured Categories */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Popular Categories
            </h2>
            <p className="text-gray-600">
              Explore trending textile categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CATEGORIES.slice(0, 12).map((category) => (
              <button
                key={category.id}
                className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {category.icon}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {category.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Verified Suppliers</h3>
            <p className="text-sm text-gray-600">
              All suppliers are verified and authenticated for quality assurance
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Quality Guarantee</h3>
            <p className="text-sm text-gray-600">
              Premium quality products with satisfaction guarantee and easy returns
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Global Reach</h3>
            <p className="text-sm text-gray-600">
              Connect with suppliers worldwide and expand your business globally
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarketplacePage;
