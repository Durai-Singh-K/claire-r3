import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Building, Edit, Star, MapPin, Phone, Mail, Globe, Users,
  TrendingUp, Award, MessageSquare, UserPlus, UserCheck, Calendar,
  Package, Grid, List, Share2, MoreHorizontal, Heart, Briefcase
} from 'lucide-react';
import { Button, Avatar, Badge, Loading, Input } from '../components/ui';
import { formatCompactNumber, capitalizeFirst, formatRelativeTime } from '../utils/formatters';
import useAuthStore from '../store/authStore';
import { usersAPI, postsAPI, chatAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);

  // If no userId in params, show current user's profile
  const targetUserId = userId || currentUser?._id;
  const isOwnProfile = !userId || targetUserId === currentUser?._id;

  useEffect(() => {
    if (targetUserId) {
      loadProfileData();
    }
  }, [targetUserId]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const [userResponse, postsResponse] = await Promise.all([
        usersAPI.getProfile(targetUserId),
        postsAPI.getUserPosts(targetUserId)
      ]);

      setProfileUser(userResponse.data.user || userResponse.data);
      setUserPosts(postsResponse.data.posts || []);

      // Check if current user is following this user
      if (!isOwnProfile && userResponse.data.user?.followers) {
        setIsFollowing(userResponse.data.user.followers.includes(currentUser?._id));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');

      // Fallback to current user data for own profile
      if (isOwnProfile) {
        setProfileUser(currentUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await usersAPI.unfollow(targetUserId);
        toast.success('Unfollowed successfully');
        setIsFollowing(false);
      } else {
        await usersAPI.follow(targetUserId);
        toast.success('Following successfully');
        setIsFollowing(true);
      }
      loadProfileData();
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleMessage = async () => {
    try {
      toast.loading('Opening chat...', { id: 'open-chat' });
      const response = await chatAPI.createConversation({ userId: targetUserId });
      const conversation = response.data.conversation;

      toast.success('Redirecting to chat...', { id: 'open-chat' });
      navigate('/messages', {
        state: {
          conversationId: conversation._id
        }
      });
    } catch (error) {
      console.error('Failed to open chat:', error);
      toast.error('Failed to open chat. Please try again.', { id: 'open-chat' });
    }
  };

  const tabs = [
    { id: 'posts', name: 'Posts', icon: MessageSquare, count: userPosts.length },
    { id: 'products', name: 'Products', icon: Package, count: 0 },
    { id: 'about', name: 'About', icon: Building }
  ];

  const PostCard = ({ post }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {post.content?.text && (
              <p className="text-gray-800 mb-3">{post.content.text}</p>
            )}
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Product Info */}
        {post.product && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <h4 className="font-medium text-gray-900 mb-1">{post.product.name}</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{post.product.description}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge.Category category={post.product.category} size="sm" />
            </div>
          </div>
        )}

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className={`grid gap-2 mb-3 ${
            post.images.length === 1 ? 'grid-cols-1' :
            post.images.length === 2 ? 'grid-cols-2' :
            post.images.length === 3 ? 'grid-cols-3' :
            'grid-cols-2'
          }`}>
            {post.images.slice(0, 4).map((image, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={image.url}
                  alt={image.alt || `Post image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 3 && post.images.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      +{post.images.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Post Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors">
              <Heart className="w-4 h-4" />
              <span>{formatCompactNumber(post.likeCount || 0)}</span>
            </button>
            <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span>{formatCompactNumber(post.commentCount || 0)}</span>
            </button>
            <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600 transition-colors">
              <Share2 className="w-4 h-4" />
              <span>{formatCompactNumber(post.shareCount || 0)}</span>
            </button>
          </div>
          <span className="text-xs text-gray-500">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{profileUser.businessName || profileUser.displayName} - Profile</title>
        <meta name="description" content={`View ${profileUser.businessName || profileUser.displayName}'s profile`} />
      </Helmet>

      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-t-lg relative">
            <div className="absolute -bottom-16 left-8">
              <Avatar
                src={profileUser.profilePicture}
                name={profileUser.businessName || profileUser.displayName}
                size="2xl"
                className="border-4 border-white shadow-xl"
                showOnline
                isOnline={profileUser.onlineStatus === 'online'}
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-20 px-8 pb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profileUser.businessName || profileUser.displayName}
                  </h1>
                  {profileUser.isVerified && <Badge.Verification verified />}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                  {profileUser.businessType && (
                    <div className="flex items-center space-x-1">
                      <Briefcase className="w-4 h-4" />
                      <span>{capitalizeFirst(profileUser.businessType)}</span>
                    </div>
                  )}
                  {profileUser.shopLocation && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profileUser.shopLocation.city}, {profileUser.shopLocation.state}</span>
                    </div>
                  )}
                  {profileUser.createdAt && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                {profileUser.businessDescription && (
                  <p className="text-gray-700 mb-4 max-w-2xl">
                    {profileUser.businessDescription}
                  </p>
                )}

                {/* Categories */}
                {profileUser.categories && profileUser.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profileUser.categories.slice(0, 5).map((category) => (
                      <Badge.Category key={category} category={category} size="sm" />
                    ))}
                    {profileUser.categories.length > 5 && (
                      <Badge variant="secondary" size="sm">
                        +{profileUser.categories.length - 5}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm">
                  <div>
                    <span className="font-bold text-gray-900">
                      {formatCompactNumber(profileUser.stats?.totalPosts || userPosts.length)}
                    </span>
                    <span className="text-gray-600 ml-1">Posts</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">
                      {formatCompactNumber(profileUser.stats?.followers || profileUser.followers?.length || 0)}
                    </span>
                    <span className="text-gray-600 ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">
                      {formatCompactNumber(profileUser.stats?.following || profileUser.following?.length || 0)}
                    </span>
                    <span className="text-gray-600 ml-1">Following</span>
                  </div>
                  {profileUser.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-bold text-gray-900">{profileUser.rating.toFixed(1)}</span>
                      <span className="text-gray-600">({formatCompactNumber(profileUser.stats?.totalReviews || 0)})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {isOwnProfile ? (
                  <Button
                    variant="outline"
                    icon={Edit}
                    onClick={() => navigate('/business')}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant={isFollowing ? 'outline' : 'primary'}
                      icon={isFollowing ? UserCheck : UserPlus}
                      onClick={handleFollow}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    <Button
                      variant="primary"
                      icon={MessageSquare}
                      onClick={handleMessage}
                    >
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Contact Info */}
            {(profileUser.phone || profileUser.email || profileUser.website) && (
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200">
                {profileUser.phone && (
                  <a href={`tel:${profileUser.phone}`} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                    <Phone className="w-4 h-4" />
                    <span>{profileUser.phone}</span>
                  </a>
                )}
                {profileUser.email && (
                  <a href={`mailto:${profileUser.email}`} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                    <Mail className="w-4 h-4" />
                    <span>{profileUser.email}</span>
                  </a>
                )}
                {profileUser.website && (
                  <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                    <Globe className="w-4 h-4" />
                    <span>{profileUser.website}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                  {tab.count !== undefined && (
                    <Badge variant="secondary" size="sm">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'posts' && (
              <div>
                {userPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-600">
                      {isOwnProfile ? "You haven't created any posts yet." : "This user hasn't posted anything yet."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map((post) => (
                      <PostCard key={post._id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'products' && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600">Products will appear here.</p>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profileUser.businessType && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Business Type</label>
                        <p className="text-gray-900 mt-1">{capitalizeFirst(profileUser.businessType)}</p>
                      </div>
                    )}
                    {profileUser.gstNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">GST Number</label>
                        <p className="text-gray-900 mt-1">{profileUser.gstNumber}</p>
                      </div>
                    )}
                    {profileUser.shopLocation && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <p className="text-gray-900 mt-1">
                          {profileUser.shopLocation.address && `${profileUser.shopLocation.address}, `}
                          {profileUser.shopLocation.city}, {profileUser.shopLocation.state}
                          {profileUser.shopLocation.pincode && ` - ${profileUser.shopLocation.pincode}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {profileUser.categories && profileUser.categories.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Product Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {profileUser.categories.map((category) => (
                        <Badge.Category key={category} category={category} size="md" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
