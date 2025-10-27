import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Award, TrendingUp } from 'lucide-react';
import { Avatar } from '../ui';
import RatingStars from '../ui/RatingStars';
import TrustBadge from '../ui/TrustBadge';
import SubscriptionBadge from '../ui/SubscriptionBadge';

const BusinessCard = ({ user, onClick, className = '' }) => {
  if (!user) return null;

  const {
    _id,
    username,
    displayName,
    businessName,
    profilePicture,
    shopLocation,
    categories = [],
    rating = 0,
    totalReviews = 0,
    isVerified = false,
    trustScore = 0,
    subscriptionTier = 'free',
    bio
  } = user;

  return (
    <Link
      to={`/business/${username || _id}`}
      onClick={onClick}
      className={`block bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 ${className}`}
    >
      <div className="p-4">
        {/* Header with Avatar and Badges */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar
            src={profilePicture}
            alt={displayName}
            size="lg"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {businessName || displayName}
                </h3>
                <p className="text-sm text-gray-600 truncate">{displayName}</p>
              </div>
              <SubscriptionBadge tier={subscriptionTier} size="sm" showLabel={false} />
            </div>

            {/* Trust & Verification */}
            <div className="mt-2">
              <TrustBadge
                isVerified={isVerified}
                trustScore={trustScore}
                size="sm"
                showDetails={false}
              />
            </div>
          </div>
        </div>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <RatingStars rating={rating} size={16} showNumber={false} />
            <span className="text-sm text-gray-600">
              {rating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}

        {/* Location */}
        {shopLocation?.city && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
            <MapPin size={16} className="flex-shrink-0" />
            <span className="truncate">
              {shopLocation.city}{shopLocation.state && `, ${shopLocation.state}`}
            </span>
          </div>
        )}

        {/* Bio */}
        {bio && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {bio}
          </p>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 3).map((category, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full"
              >
                {category}
              </span>
            ))}
            {categories.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                +{categories.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer with Stats */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            {isVerified && (
              <span className="flex items-center gap-1">
                <Award size={14} className="text-blue-600" />
                Verified
              </span>
            )}
            {trustScore > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp size={14} className="text-green-600" />
                Trust: {trustScore}
              </span>
            )}
          </div>
          <span className="text-blue-600 font-medium">View Profile →</span>
        </div>
      </div>
    </Link>
  );
};

export default BusinessCard;
