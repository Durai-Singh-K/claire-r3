import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Filter, Grid, List, MapPin, Star, TrendingUp, Users, ShoppingBag, BarChart3, Send } from 'lucide-react';
import { Input, Button, Avatar, Badge, Loading } from '../components/ui';
import { formatCompactNumber, capitalizeFirst } from '../utils/formatters';
import { useDebounce } from '../hooks/useDebounce';
import { searchAPI, chatAPI } from '../services/api';
import { CATEGORIES } from '../config/constants';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'trends'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchType, setSearchType] = useState('all'); // 'all', 'users', 'products', 'communities'
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    category: '',
    sortBy: 'relevance'
  });

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounce(query, 300);

  // Perform search with debounced query
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < 2) {
        setResults({});
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await searchAPI.global({
          q: debouncedQuery,
          type: searchType,
          ...filters
        });
        setResults(response.data.results || {});
      } catch (err) {
        console.error('Search failed:', err);
        setError(err.message);
        setResults({});
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery, searchType, filters]);

  const hasResults = Object.values(results).some(items => items && items.length > 0);

  const [trendingSearches, setTrendingSearches] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);

  useEffect(() => {
    // Load trending and popular searches
    const loadSearchData = async () => {
      try {
        const [trendingRes, popularRes] = await Promise.all([
          searchAPI.trending(),
          searchAPI.popular()
        ]);
        setTrendingSearches(trendingRes.data.trending || []);
        setPopularSearches(popularRes.data.popularSearches || []);
      } catch (error) {
        console.error('Failed to load search data:', error);
      }
    };

    loadSearchData();
  }, []);

  const searchTypes = [
    { id: 'all', name: 'All', icon: Search, description: 'Search everything' },
    { id: 'users', name: 'Businesses', icon: Users, description: 'Find businesses' },
    { id: 'products', name: 'Products', icon: ShoppingBag, description: 'Discover products' },
    { id: 'communities', name: 'Communities', icon: Users, description: 'Join communities' }
  ];

  const handleQuickSearch = (searchTerm) => {
    setQuery(searchTerm);
  };

  const isMyPost = (item) => {
    // Check if the post belongs to the current user
    const authorId = item.author?._id || item.author;
    return authorId === user?._id || authorId?.toString() === user?._id?.toString();
  };

  const handleInquireAboutProduct = async (item) => {
    try {
      // Check if user is trying to contact themselves
      if (isMyPost(item)) {
        toast.error('You cannot message yourself');
        return;
      }

      // Get the author ID - handle both populated and non-populated author
      const authorId = item.author?._id || item.author;

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
          productContext: item.product ? {
            _id: item._id,
            name: item.product.name,
            price: item.product.price,
            images: item.images,
            description: item.product.description,
            category: item.product.category
          } : null
        }
      });
    } catch (error) {
      console.error('Failed to inquire about product:', error);
      toast.error('Failed to open chat. Please try again.', { id: 'inquire-product' });
    }
  };

  const ResultCard = ({ item, type }) => {
    if (type === 'user' || item.type === 'user') {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <Avatar
              src={item.profilePicture}
              name={item.businessName || item.displayName}
              size="lg"
              showOnline
              isOnline={item.onlineStatus === 'online'}
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">
                  {item.businessName || item.displayName}
                </h3>
                {item.isVerified && <Badge.Verification verified />}
              </div>
              <p className="text-sm text-gray-600">{capitalizeFirst(item.businessType)}</p>
              {item.shopLocation && (
                <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{item.shopLocation.city}, {item.shopLocation.state}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 mt-2">
                {item.categories?.slice(0, 2).map((category) => (
                  <Badge.Category key={category} category={category} size="xs" />
                ))}
                {item.categories?.length > 2 && (
                  <Badge variant="secondary" size="xs">
                    +{item.categories.length - 2}
                  </Badge>
                )}
              </div>
            </div>
            <Button size="sm" variant="outline">
              Connect
            </Button>
          </div>
        </div>
      );
    }

    if (type === 'community' || item.type === 'community') {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                <span>{formatCompactNumber(item.stats?.totalMembers || 0)} members</span>
                <span>{formatCompactNumber(item.stats?.totalPosts || 0)} posts</span>
              </div>
            </div>
            <Button size="sm" variant="primary">
              Join
            </Button>
          </div>
        </div>
      );
    }

    if (type === 'product' || item.type === 'product') {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          {item.images?.[0] && (
            <div className="aspect-square">
              <img 
                src={item.images[0].url} 
                alt={item.product?.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 line-clamp-2">
                  {item.product?.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  {item.product?.description}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge.Category category={item.product?.category} size="xs" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <Avatar
                  src={item.author?.profilePicture}
                  name={item.author?.businessName}
                  size="xs"
                />
                <span className="text-xs text-gray-600">
                  {item.author?.businessName}
                </span>
              </div>
              {/* Show Inquire button only for products not owned by user */}
              {!isMyPost(item) && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={Send}
                  onClick={() => handleInquireAboutProduct(item)}
                  title="Inquire about this product"
                >
                  Inquire
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Helmet>
        <title>Discover - WholeSale Connect</title>
        <meta name="description" content="Discover new textile businesses, products, and communities on WholeSale Connect." />
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Discover
          </h1>
          <p className="text-gray-600">
            Find new businesses, products, and communities in the textile industry
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'search'
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Search className="w-5 h-5" />
                <span>Search & Discover</span>
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'trends'
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Trends Analysis</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Trends Dashboard Tab */}
        {activeTab === 'trends' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Dashboard Info Header */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Fashion Trends Analysis Dashboard
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Comprehensive trend analysis powered by Google Trends and AI-driven fashion blog insights
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                      <BarChart3 className="w-4 h-4 text-sky-600" />
                      <span className="text-gray-700">Multi-timeframe Analysis</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">State-wise Insights</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <span className="text-gray-700">Real-time Trends</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Dashboard */}
            <div className="relative" style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
              <iframe
                src="http://localhost:8051"
                title="Fashion Trends Dashboard"
                className="w-full h-full border-0"
                style={{ display: 'block' }}
                onError={(e) => {
                  console.error('Dashboard failed to load:', e);
                }}
              />

              {/* Loading/Error State Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 pointer-events-none" id="dashboard-loading">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-sky-500 border-t-transparent mb-4"></div>
                  <p className="text-gray-600 mb-2">Loading Trends Dashboard...</p>
                  <p className="text-sm text-gray-500">
                    If the dashboard doesn't load, please ensure the Python service is running on port 8051
                  </p>
                </div>
              </div>
            </div>

            {/* Dashboard Instructions */}
            <div className="bg-gray-50 p-4 border-t border-gray-200">
              <details className="cursor-pointer">
                <summary className="font-medium text-gray-900 hover:text-sky-600 transition-colors">
                  How to use the Trends Dashboard
                </summary>
                <div className="mt-3 pl-4 space-y-2 text-sm text-gray-600">
                  <p><strong>Overview Tab:</strong> Enter fashion keywords to analyze Google Trends data with interactive visualizations</p>
                  <p><strong>Trends Tab:</strong> Get state-wise analysis and comprehensive fashion blog reports using AI</p>
                  <p><strong>Reports Tab:</strong> Generate multi-timeframe reports with related keywords and market insights</p>
                  <p className="mt-3 text-xs text-gray-500">
                    Note: The dashboard runs as a separate Python service. To start it, run: <code className="bg-gray-200 px-2 py-0.5 rounded">python trends_dashboard_service.py</code>
                  </p>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Search Tab Content */}
        {activeTab === 'search' && (
          <>
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search for businesses, products, communities..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                icon={Search}
                size="lg"
                fullWidth
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                icon={Filter}
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-primary-50 text-primary-700' : ''}
              >
                Filters
              </Button>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Type Tabs */}
          <div className="flex flex-wrap gap-2 mt-4">
            {searchTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSearchType(type.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === type.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <type.icon className="w-4 h-4" />
                <span>{type.name}</span>
              </button>
            ))}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="input w-full"
                >
                  <option value="">All locations</option>
                  <option value="mumbai">Mumbai</option>
                  <option value="delhi">Delhi</option>
                  <option value="bangalore">Bangalore</option>
                  <option value="chennai">Chennai</option>
                  <option value="kolkata">Kolkata</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="input w-full"
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="input w-full"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Search Results or Default Content */}
        {hasResults ? (
          <div className="space-y-6">
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing results for "<strong>{query}</strong>"
              </p>
              {isSearching && <Loading size="sm" />}
            </div>

            {/* Results */}
            <div className={`grid gap-4 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}>
              {Object.entries(results).map(([type, items]) =>
                items?.map((item, index) => (
                  <ResultCard key={`${type}-${index}`} item={item} type={type} />
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trending Searches */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <h3 className="font-medium text-gray-900">Trending</h3>
              </div>
              <div className="space-y-2">
                {trendingSearches.slice(0, 8).map((trend, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSearch(trend.hashtag.replace('#', ''))}
                    className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-primary-600 font-medium">
                        {trend.hashtag}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatCompactNumber(trend.count)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Searches */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="font-medium text-gray-900">Popular Searches</h3>
              </div>
              <div className="space-y-2">
                {popularSearches.slice(0, 8).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSearch(search.text)}
                    className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-gray-700">{search.text}</span>
                    <span className="text-xs text-gray-500">
                      {formatCompactNumber(search.count)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Categories */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Browse Categories</h3>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.slice(0, 10).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleQuickSearch(category.name)}
                    className="flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isSearching && !hasResults && (
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        )}

        {/* Empty State */}
        {query && !isSearching && !hasResults && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or filters
            </p>
            <Button onClick={() => setQuery('')}>
              Clear Search
            </Button>
          </div>
        )}
          </>
        )}
      </div>
    </>
  );
};

export default DiscoverPage;
