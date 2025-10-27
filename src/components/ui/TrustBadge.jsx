import React from 'react';
import { Shield, CheckCircle, Award } from 'lucide-react';

const TrustBadge = ({
  isVerified = false,
  trustScore = 0,
  emailVerified = false,
  phoneVerified = false,
  size = 'md',
  showDetails = false,
  className = ''
}) => {
  const sizes = {
    sm: { icon: 16, text: 'text-xs' },
    md: { icon: 20, text: 'text-sm' },
    lg: { icon: 24, text: 'text-base' }
  };

  const { icon: iconSize, text: textSize } = sizes[size] || sizes.md;

  const getTrustLevel = (score) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800 border-green-300' };
    if (score >= 60) return { label: 'Good', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    if (score >= 40) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    return { label: 'Building', color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  const trustLevel = getTrustLevel(trustScore);

  if (!showDetails) {
    // Simple badge view
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        {isVerified && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle size={iconSize} />
            <span className={`font-medium ${textSize}`}>Verified</span>
          </span>
        )}
        {trustScore > 0 && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${trustLevel.color}`}>
            <Shield size={iconSize} />
            <span className={`font-medium ${textSize}`}>{trustScore}</span>
          </span>
        )}
      </div>
    );
  }

  // Detailed badge view
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {isVerified && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
            <CheckCircle size={iconSize} className="text-blue-600" />
            <div>
              <p className="text-xs font-semibold text-blue-900">Business Verified</p>
              <p className="text-xs text-blue-700">Documents reviewed</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${trustLevel.color}`}>
          <Shield size={iconSize} />
          <div>
            <p className="text-xs font-semibold">Trust Score: {trustScore}</p>
            <p className="text-xs opacity-75">{trustLevel.label}</p>
          </div>
        </div>
      </div>

      {(emailVerified || phoneVerified) && (
        <div className="flex items-center gap-2 text-xs">
          {emailVerified && (
            <span className="inline-flex items-center gap-1 text-green-700">
              <CheckCircle size={14} />
              Email Verified
            </span>
          )}
          {phoneVerified && (
            <span className="inline-flex items-center gap-1 text-green-700">
              <CheckCircle size={14} />
              Phone Verified
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TrustBadge;
