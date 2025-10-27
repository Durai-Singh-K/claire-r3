import React from 'react';
import { Crown, Zap, Star, Sparkles } from 'lucide-react';

const SubscriptionBadge = ({ tier = 'free', size = 'md', showLabel = true, className = '' }) => {
  const tiers = {
    free: {
      label: 'Free',
      icon: Star,
      color: 'bg-gray-100 text-gray-700 border-gray-300',
      iconColor: 'text-gray-600'
    },
    basic: {
      label: 'Basic',
      icon: Zap,
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      iconColor: 'text-blue-600'
    },
    premium: {
      label: 'Premium',
      icon: Crown,
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      iconColor: 'text-purple-600'
    },
    enterprise: {
      label: 'Enterprise',
      icon: Sparkles,
      color: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-orange-300',
      iconColor: 'text-orange-600'
    }
  };

  const sizes = {
    sm: { icon: 12, text: 'text-xs', padding: 'px-1.5 py-0.5' },
    md: { icon: 16, text: 'text-sm', padding: 'px-2 py-1' },
    lg: { icon: 20, text: 'text-base', padding: 'px-3 py-1.5' }
  };

  const tierConfig = tiers[tier] || tiers.free;
  const sizeConfig = sizes[size] || sizes.md;
  const Icon = tierConfig.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${tierConfig.color} ${sizeConfig.padding} ${sizeConfig.text} ${className}`}
    >
      <Icon size={sizeConfig.icon} className={tierConfig.iconColor} />
      {showLabel && <span>{tierConfig.label}</span>}
    </span>
  );
};

export default SubscriptionBadge;
