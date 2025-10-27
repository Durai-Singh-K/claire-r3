import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Users, Plus, Search, Filter, Globe, Lock, TrendingUp, MessageSquare, UserPlus, X, MapPin, Sparkles, Info, CheckCircle2 } from 'lucide-react';
import { formatCompactNumber, formatRelativeTime } from '../utils/formatters';
import { communitiesAPI } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'shirts', label: 'Shirts' },
  { value: 'pants', label: 'Pants' },
  { value: 'sarees', label: 'Sarees' },
  { value: 'kurtas', label: 'Kurtas' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'blouses', label: 'Blouses' },
  { value: 'lehengas', label: 'Lehengas' },
  { value: 'suits', label: 'Suits' },
  { value: 'jackets', label: 'Jackets' },
  { value: 'jeans', label: 'Jeans' },
  { value: 'ethnic_wear', label: 'Ethnic Wear' },
  { value: 'western_wear', label: 'Western Wear' },
  { value: 'kids_clothing', label: 'Kids Clothing' },
  { value: 'fabrics', label: 'Fabrics' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' }
];

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
  'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
  'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
  'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot',
  'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi'
];

const CommunitiesPage = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [myCommunities, setMyCommunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadCommunities();
  }, [selectedCategory]);

  const loadCommunities = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;

      const [allCommunitiesRes, myCommunitiesRes] = await Promise.all([
        communitiesAPI.list(params),
        communitiesAPI.getMyCommunities()
      ]);

      setCommunities(allCommunitiesRes.data.communities || []);
      setMyCommunities(myCommunitiesRes.data.communities || []);
    } catch (error) {
      console.error('Failed to load communities:', error);
      toast.error('Failed to load communities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId) => {
    try {
      await communitiesAPI.join(communityId);
      toast.success('Successfully joined community!');
      loadCommunities();
    } catch (error) {
      console.error('Failed to join community:', error);
      toast.error(error.response?.data?.message || 'Failed to join community');
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    if (!confirm('Are you sure you want to leave this community?')) return;

    try {
      await communitiesAPI.leave(communityId);
      toast.success('Successfully left community');
      loadCommunities();
    } catch (error) {
      console.error('Failed to leave community:', error);
      toast.error(error.response?.data?.message || 'Failed to leave community');
    }
  };

  const CommunityCard = ({ community, isMember = false }) => (
    <div
      onClick={() => navigate(`/communities/${community._id}`)}
      className="glass-card hover:glass-card-medium overflow-hidden transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl group animate-fadeIn"
    >
      {/* Cover Image */}
      <div className={`h-40 relative overflow-hidden ${community.coverImage ? '' : 'bg-gradient-purple'}`}>
        {community.coverImage ? (
          <img
            src={community.coverImage}
            alt={community.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-16 h-16 text-white opacity-60" />
          </div>
        )}

        {/* Privacy Badge */}
        <div className="absolute top-3 right-3">
          {community.isPrivate ? (
            <div className="glass-card px-3 py-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-700" />
              <span className="text-xs font-semibold text-purple-900">Private</span>
            </div>
          ) : (
            <div className="glass-card px-3 py-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-green-700" />
              <span className="text-xs font-semibold text-green-900">Public</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gradient mb-2 flex items-center gap-2 group-hover:text-purple-700 transition-colors">
              {community.name}
              {isMember && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </h3>

            <p className="text-sm text-gray-700 mb-3 line-clamp-2 leading-relaxed">
              {community.description || 'No description provided'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="glass-card px-3 py-2 flex items-center gap-2 flex-1">
            <Users className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-xs text-gray-600">Members</p>
              <p className="text-sm font-bold text-gray-900">{formatCompactNumber(community.stats?.totalMembers || community.memberCount || 0)}</p>
            </div>
          </div>
          <div className="glass-card px-3 py-2 flex items-center gap-2 flex-1">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-xs text-gray-600">Posts</p>
              <p className="text-sm font-bold text-gray-900">{formatCompactNumber(community.stats?.totalPosts || 0)}</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        {community.categories && community.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {community.categories.slice(0, 3).map((category) => (
              <span key={category} className="glass-badge text-purple-700 text-xs">
                {CATEGORIES.find(c => c.value === category)?.label || category}
              </span>
            ))}
            {community.categories.length > 3 && (
              <span className="glass-badge text-gray-700 text-xs">
                +{community.categories.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Target Locations */}
        {community.targetLocations && community.targetLocations.length > 0 && (
          <div className="glass-card p-2 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-purple-700">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {community.targetLocations.map(loc => loc.city).slice(0, 2).join(', ')}
                {community.targetLocations.length > 2 && ` +${community.targetLocations.length - 2}`}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-purple rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md glass-avatar">
              {community.creator?.profilePicture ? (
                <img
                  src={community.creator.profilePicture}
                  alt={community.creator.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (community.creator?.displayName || community.creator?.businessName || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-xs text-gray-600">Created by</p>
              <p className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">
                {community.creator?.displayName || community.creator?.businessName || 'Unknown'}
              </p>
            </div>
          </div>

          {isMember ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLeaveCommunity(community._id);
              }}
              className="glass-card hover:glass-card-medium px-4 py-2 text-sm font-medium text-gray-700 transition-all"
            >
              Leave
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleJoinCommunity(community._id);
              }}
              className="glass-button px-4 py-2 text-sm font-semibold flex items-center gap-1.5 hover:scale-105 transition-transform"
            >
              <UserPlus className="w-4 h-4" />
              Join
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const CreateCommunityModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      categories: [],
      targetLocations: [],
      isPrivate: false,
      rules: []
    });
    const [locationInput, setLocationInput] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCategoryToggle = (category) => {
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.includes(category)
          ? prev.categories.filter(c => c !== category)
          : [...prev.categories, category]
      }));
    };

    const handleAddLocation = () => {
      if (!locationInput.trim()) return;

      setFormData(prev => ({
        ...prev,
        targetLocations: [
          ...prev.targetLocations,
          { city: locationInput.trim(), priority: 1 }
        ]
      }));
      setLocationInput('');
    };

    const handleRemoveLocation = (index) => {
      setFormData(prev => ({
        ...prev,
        targetLocations: prev.targetLocations.filter((_, i) => i !== index)
      }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      // Validation
      if (!formData.name.trim()) {
        toast.error('Community name is required');
        return;
      }

      if (formData.categories.length === 0) {
        toast.error('Please select at least one category');
        return;
      }

      if (formData.targetLocations.length === 0) {
        toast.error('Please add at least one target location');
        return;
      }

      setIsCreating(true);
      try {
        await communitiesAPI.create(formData);
        toast.success('Community created successfully!');
        setShowCreateModal(false);
        loadCommunities();

        // Reset form
        setFormData({
          name: '',
          description: '',
          categories: [],
          targetLocations: [],
          isPrivate: false,
          rules: []
        });
      } catch (error) {
        console.error('Failed to create community:', error);
        toast.error(error.response?.data?.message || 'Failed to create community');
      } finally {
        setIsCreating(false);
      }
    };

    return (
      showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-card-strong max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/40">
              <h2 className="text-2xl font-bold text-gradient flex items-center gap-2">
                <Plus className="w-6 h-6 text-purple-600" />
                Create New Community
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="glass-card hover:glass-card-medium p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Community Name */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-1">
                  Community Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mumbai Wholesalers, Textile Traders India"
                  required
                  className="glass-input w-full"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your community..."
                  rows={3}
                  className="glass-input w-full resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-purple-700 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {formData.description.length}/1000 characters
                </p>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-1">
                  Categories <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-purple-700">(Select at least one)</span>
                </label>
                <div className="glass-card p-4 max-h-64 overflow-y-auto scrollbar-hide">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map((category) => (
                      <label
                        key={category.value}
                        className={`glass-card hover:glass-card-medium p-3 cursor-pointer transition-all ${
                          formData.categories.includes(category.value) ? 'bg-gradient-purple text-white' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.categories.includes(category.value)}
                            onChange={() => handleCategoryToggle(category.value)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className={`text-sm font-medium ${
                            formData.categories.includes(category.value) ? 'text-white' : 'text-gray-900'
                          }`}>
                            {category.label}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-purple-700 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {formData.categories.length} category selected
                </p>
              </div>

              {/* Target Locations */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-1">
                  Target Locations <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-purple-700">(Add at least one)</span>
                </label>
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <input
                      list="cities"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      placeholder="Select or type city name"
                      className="glass-input w-full"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddLocation();
                        }
                      }}
                    />
                    <datalist id="cities">
                      {INDIAN_CITIES.map(city => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLocation}
                    disabled={!locationInput.trim()}
                    className={`glass-button px-6 py-2 font-semibold ${
                      !locationInput.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Add
                  </button>
                </div>

                {/* Selected Locations */}
                {formData.targetLocations.length > 0 && (
                  <div className="glass-card p-4">
                    <div className="flex flex-wrap gap-2">
                      {formData.targetLocations.map((location, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1.5 bg-gradient-purple text-white rounded-full text-sm font-medium shadow-md"
                        >
                          <MapPin className="w-3.5 h-3.5 mr-1.5" />
                          {location.city}
                          <button
                            type="button"
                            onClick={() => handleRemoveLocation(index)}
                            className="ml-2 hover:scale-110 transition-transform"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Privacy */}
              <div className="glass-card p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-600" />
                      Make this a private community
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      Private communities require an invite link to join
                    </p>
                  </div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/40">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                  className="glass-card hover:glass-card-medium px-6 py-3 font-medium text-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="glass-button px-8 py-3 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  {isCreating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 inline-block mr-2" />
                      Create Community
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )
    );
  };

  const filteredCommunities = activeTab === 'discover'
    ? communities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : myCommunities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <>
      <Helmet>
        <title>Communities - Claire B2B</title>
        <meta name="description" content="Join wholesale trading communities in your niche and location." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gradient flex items-center gap-3 mb-2">
              <Users className="w-10 h-10 text-purple-600" />
              Communities
            </h1>
            <p className="text-gray-700 flex items-center gap-2">
              Connect with wholesalers in your niche and location
              <Sparkles className="w-4 h-4 text-purple-500" />
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="glass-button mt-4 sm:mt-0 px-6 py-3 font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Community
          </button>
        </div>

        {/* Tabs */}
        <div className="glass-card inline-flex p-1 mb-6 animate-fadeIn">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'discover'
                ? 'bg-gradient-purple text-white shadow-md'
                : 'text-gray-700 hover:text-purple-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline-block mr-2" />
            Discover
          </button>
          <button
            onClick={() => setActiveTab('my-communities')}
            className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'my-communities'
                ? 'bg-gradient-purple text-white shadow-md'
                : 'text-gray-700 hover:text-purple-700'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            My Communities ({myCommunities.length})
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
              <input
                type="search"
                placeholder="Search communities..."
                className="glass-input w-full pl-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="glass-input w-full sm:w-64 pl-10 appearance-none cursor-pointer font-medium"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Communities Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="glass-card-strong p-8">
              <div className="flex gap-2 mb-2">
                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="text-sm text-gray-700">Loading communities...</p>
            </div>
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="text-center py-16">
            <div className="glass-card-strong p-12 max-w-md mx-auto animate-scaleIn">
              <div className="w-24 h-24 bg-gradient-purple rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl glow-purple float-animation">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gradient mb-3 flex items-center justify-center gap-2">
                {searchQuery ? 'No communities found' : activeTab === 'my-communities' ? 'No communities yet' : 'No communities available'}
                <Sparkles className="w-5 h-5 text-purple-500" />
              </h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                {activeTab === 'my-communities'
                  ? 'Browse and join communities to get started'
                  : searchQuery
                    ? 'Try different keywords or create a new community'
                    : 'Be the first to create a community!'}
              </p>
              {activeTab === 'discover' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="glass-button px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Community
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <CommunityCard
                key={community._id}
                community={community}
                isMember={activeTab === 'my-communities' || community.isMember}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Community Modal */}
      <CreateCommunityModal />
    </>
  );
};

export default CommunitiesPage;
