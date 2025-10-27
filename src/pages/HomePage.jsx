import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, TrendingUp, MessageSquare, Heart, Share2, MoreHorizontal, Filter, Send } from 'lucide-react';
import { Button, Avatar, Badge, Loading, Modal } from '../components/ui';
import { formatRelativeTime, formatCompactNumber } from '../utils/formatters';
import useAuthStore from '../store/authStore';
import usePostsStore from '../store/postsStore';
import { postsAPI, chatAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    feed,
    isLoading,
    loadFeed,
    likePost,
    feedType,
    setFeedType,
    selectedFilters,
    setFilters
  } = usePostsStore();

  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    postsToday: 0,
    activeUsers: 0,
    newProducts: 0
  });

  useEffect(() => {
    loadFeed(true);
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await postsAPI.getStats();
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const feedTypes = [
    { id: 'all', name: 'All Posts', description: 'Posts from everyone' }
  ];

  const handleLike = async (postId) => {
    await likePost(postId);
  };

  const isMyPost = (post) => {
    // Check if the post belongs to the current user
    const authorId = post.author?._id || post.author;
    return authorId === user?._id || authorId?.toString() === user?._id?.toString();
  };

  const handleInquireAboutProduct = async (post) => {
    try {
      // Check if user is trying to contact themselves
      if (isMyPost(post)) {
        toast.error('You cannot message yourself');
        return;
      }

      // Get the author ID - handle both populated and non-populated author
      const authorId = post.author?._id || post.author;

      if (!authorId) {
        toast.error('Author information not available');
        return;
      }

      // Create or get existing conversation
      toast.loading('Opening chat...', { id: 'inquire-product' });
      const response = await chatAPI.createConversation({ userId: authorId });
      const conversation = response.data.conversation;

      toast.success('Redirecting to chat...', { id: 'inquire-product' });

      // Navigate to messages page with the conversation ID and product info
      navigate('/messages', {
        state: {
          conversationId: conversation._id,
          productContext: post.product ? {
            _id: post._id,
            name: post.product.name,
            price: post.product.price,
            images: post.images,
            description: post.product.description,
            category: post.product.category
          } : null
        }
      });
    } catch (error) {
      console.error('Failed to inquire about product:', error);
      toast.error('Failed to open chat. Please try again.', { id: 'inquire-product' });
    }
  };

  const handleNavigateToProfile = (authorId) => {
    // Navigate to profile page
    const userId = authorId._id || authorId;
    if (userId === user?._id || userId?.toString() === user?._id?.toString()) {
      // Navigate to own profile
      navigate('/profile');
    } else {
      // Navigate to other user's profile
      navigate(`/profile/${userId}`);
    }
  };

  const PostCard = ({ post }) => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {/* Post Header */}
        <div className="p-4 pb-3 flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleNavigateToProfile(post.author._id || post.author)}
          >
            <Avatar
              src={post.author.profilePicture}
              name={post.author.displayName || post.author.businessName}
              size="md"
              showOnline
              isOnline={post.author.onlineStatus === 'online'}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900 hover:text-primary-600 transition-colors">
                  {post.author.businessName || post.author.displayName}
                </h3>
                {post.author.isVerified && <Badge.Verification verified />}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{formatRelativeTime(post.createdAt)}</span>
                {post.community && (
                  <>
                    <span>•</span>
                    <span>in {post.community.name}</span>
                  </>
                )}
                {post.location && (
                  <>
                    <span>•</span>
                    <span>{post.location.city}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          {post.content.text && (
            <p className="text-gray-800 mb-3">{post.content.text}</p>
          )}
          
          {post.product && (
            <div className="bg-gray-50 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{post.product.name}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{post.product.description}</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <Badge.Category category={post.product.category} size="sm" />
                  </div>
                </div>
                {/* Show Inquire button only for posts not owned by user */}
                {!isMyPost(post) && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Send}
                    onClick={() => handleInquireAboutProduct(post)}
                    className="ml-4"
                    title="Inquire about this product"
                  >
                    Inquire
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className="px-4 pb-3">
            <div className={`grid gap-2 ${
              post.images.length === 1 ? 'grid-cols-1' :
              post.images.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {post.images.slice(0, 4).map((image, index) => (
                <div 
                  key={index} 
                  className={`relative rounded-lg overflow-hidden ${
                    post.images.length === 1 ? 'aspect-video' : 'aspect-square'
                  }`}
                >
                  <img 
                    src={image.url} 
                    alt={image.alt || `Post image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {post.images.length > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-medium">
                        +{post.images.length - 4} more
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Post Actions */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => handleLike(post._id)}
                className={`flex items-center space-x-2 text-sm ${
                  post.liked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                } transition-colors`}
              >
                <Heart className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
                <span>{formatCompactNumber(post.likeCount || 0)}</span>
              </button>
              
              <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <MessageSquare className="w-5 h-5" />
                <span>{formatCompactNumber(post.commentCount || 0)}</span>
              </button>
              
              <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                <Share2 className="w-5 h-5" />
                <span>{formatCompactNumber(post.shareCount || 0)}</span>
              </button>
            </div>
            
            <div className="text-xs text-gray-500">
              {formatCompactNumber(post.analytics?.impressions || 0)} views
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Home - WholeSale Connect</title>
        <meta name="description" content="Stay updated with latest textile business posts and opportunities." />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {user?.displayName}!
              </h1>
              <p className="opacity-90">
                Here's what's happening in the textile business world today
              </p>
            </div>
            <div className="hidden md:block">
              <Link to="/create">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Feed Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-6">
              <h3 className="font-medium text-gray-900 mb-4">Feed Filters</h3>
              
              {/* Feed Type */}
              <div className="space-y-2 mb-6">
                {feedTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFeedType(type.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      feedType === type.id
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{type.name}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </button>
                ))}
              </div>

              {/* Additional Filters */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  icon={Filter}
                  onClick={() => setShowFilters(true)}
                >
                  More Filters
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="pt-4 border-t border-gray-200 mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Quick Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Posts Today</span>
                    <span className="font-medium">{formatCompactNumber(stats.postsToday)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Users</span>
                    <span className="font-medium">{formatCompactNumber(stats.activeUsers)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New Products</span>
                    <span className="font-medium">{formatCompactNumber(stats.newProducts)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-3">
            {/* Mobile Create Post Button */}
            <div className="lg:hidden mb-4">
              <Link to="/create">
                <Button fullWidth icon={Plus}>
                  Create Post
                </Button>
              </Link>
            </div>

            {/* Loading State */}
            {isLoading && feed.length === 0 ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, index) => (
                  <Loading.SkeletonCard key={index} />
                ))}
              </div>
            ) : (
              <>
                {/* Feed */}
                <div>
                  {feed.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>

                {/* Empty State */}
                {feed.length === 0 && !isLoading && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <div className="text-center mb-8">
                      <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {feedType === 'all' ? 'No posts in your feed yet' :
                         feedType === 'products' ? 'No product posts yet' :
                         feedType === 'community' ? 'No community posts yet' :
                         'No posts from your network yet'}
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {feedType === 'all' ? 'Be the first to share something with the community! Create a post or list a product to get started.' :
                         feedType === 'products' ? 'No one has shared products yet. List your first product to showcase it to buyers!' :
                         feedType === 'community' ? 'Join communities or create posts to see content here.' :
                         'Connect with other businesses to see their posts in your network feed.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                      <Link to="/create" className="block">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer text-center">
                          <Plus className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                          <h4 className="font-medium text-gray-900 mb-1">Create a Post</h4>
                          <p className="text-sm text-gray-600">Share updates, announcements, or showcase your products</p>
                        </div>
                      </Link>

                      <Link to="/products" className="block">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer text-center">
                          <TrendingUp className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                          <h4 className="font-medium text-gray-900 mb-1">List a Product</h4>
                          <p className="text-sm text-gray-600">Add products to your catalog for buyers to discover</p>
                        </div>
                      </Link>
                    </div>

                    <div className="mt-8 text-center">
                      <p className="text-sm text-gray-500">
                        Tip: Posts you create will be visible to all users on the platform
                      </p>
                    </div>
                  </div>
                )}

                {/* Load More */}
                {feed.length > 0 && (
                  <div className="text-center mt-8">
                    <Button
                      variant="outline"
                      onClick={() => loadFeed(false)}
                      loading={isLoading}
                      loadingText="Loading more..."
                    >
                      Load More Posts
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Filters Modal */}
        <Modal
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          title="Feed Filters"
          size="md"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select className="input w-full">
                <option value="">All locations</option>
                <option value="mumbai">Mumbai</option>
                <option value="delhi">Delhi</option>
                <option value="bangalore">Bangalore</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select className="input w-full">
                <option value="">All categories</option>
                <option value="shirts">Shirts</option>
                <option value="sarees">Sarees</option>
                <option value="fabrics">Fabrics</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select className="input w-full">
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Trending</option>
              </select>
            </div>
          </div>

          <Modal.Footer>
            <Button variant="outline" onClick={() => setShowFilters(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowFilters(false)}>
              Apply Filters
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default HomePage;
