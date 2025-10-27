import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Users, CheckCircle, AlertCircle, MapPin, MessageSquare } from 'lucide-react';
import { Button, Avatar, Loading } from '../components/ui';
import { formatCompactNumber } from '../utils/formatters';
import { communitiesAPI } from '../services/api';
import toast from 'react-hot-toast';

const CommunityJoinPage = () => {
  const { inviteLink } = useParams();
  const navigate = useNavigate();

  const [community, setCommunity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    loadCommunityByInviteLink();
  }, [inviteLink]);

  const loadCommunityByInviteLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all communities and find the one with matching invite link
      const response = await communitiesAPI.list({ limit: 100 });
      const communities = response.data.communities;

      const matchedCommunity = communities.find(c => c.inviteLink === inviteLink);

      if (!matchedCommunity) {
        setError('Invalid or expired invite link');
        return;
      }

      setCommunity(matchedCommunity);
      setAlreadyMember(matchedCommunity.isMember);
    } catch (error) {
      console.error('Failed to load community:', error);
      setError('Failed to load community details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsJoining(true);

    try {
      await communitiesAPI.join(community._id, { inviteLink });
      toast.success(`Successfully joined ${community.name}!`);
      navigate(`/communities/${community._id}`);
    } catch (error) {
      console.error('Failed to join community:', error);
      toast.error(error.response?.data?.message || 'Failed to join community');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Helmet>
          <title>Invalid Invite - WholeSale Connect</title>
        </Helmet>

        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Invite Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <Button
            onClick={() => navigate('/communities')}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            fullWidth
          >
            Browse Communities
          </Button>
        </div>
      </div>
    );
  }

  if (!community) {
    return null;
  }

  if (alreadyMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Helmet>
          <title>Already a Member - WholeSale Connect</title>
        </Helmet>

        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            You're Already a Member!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You're already part of <strong>{community.name}</strong>
          </p>
          <Button
            onClick={() => navigate(`/communities/${community._id}`)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            fullWidth
          >
            Open Community
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Helmet>
        <title>Join {community.name} - WholeSale Connect</title>
      </Helmet>

      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Cover Image */}
        <div className={`h-48 ${community.coverImage ? '' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'}`}>
          {community.coverImage && (
            <img
              src={community.coverImage}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Community Icon/Name */}
          <div className="flex items-center space-x-4 mb-6">
            {community.icon ? (
              <img
                src={community.icon}
                alt={community.name}
                className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center text-white font-bold text-2xl">
                {community.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {community.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Community on WholeSale Connect
              </p>
            </div>
          </div>

          {/* Description */}
          {community.description && (
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {community.description}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Members</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCompactNumber(community.stats?.totalMembers || community.memberCount || 0)}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">Posts</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCompactNumber(community.stats?.totalPosts || 0)}
              </p>
            </div>
          </div>

          {/* Categories */}
          {community.categories && community.categories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {community.categories.map((category) => (
                  <span
                    key={category}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Target Locations */}
          {community.targetLocations && community.targetLocations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Target Locations
              </h3>
              <div className="flex flex-wrap gap-2">
                {community.targetLocations.map((location, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    {location.city}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Creator */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Created by
            </h3>
            <div className="flex items-center space-x-3">
              <Avatar
                src={community.creator?.profilePicture}
                name={community.creator?.displayName}
                size="md"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {community.creator?.displayName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {community.creator?.businessName}
                </p>
              </div>
            </div>
          </div>

          {/* Join Button */}
          <Button
            onClick={handleJoin}
            disabled={isJoining}
            fullWidth
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {isJoining ? 'Joining...' : `Join ${community.name}`}
          </Button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
            By joining, you agree to the community guidelines
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommunityJoinPage;
