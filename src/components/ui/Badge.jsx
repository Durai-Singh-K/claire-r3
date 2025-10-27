import React from 'react';
import { cn } from '../../utils/helpers';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const baseClasses = 'badge inline-flex items-center font-medium';

  const variants = {
    default: 'badge-secondary',
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    success: 'badge-success bg-green-100 text-green-800',
    warning: 'badge-warning bg-yellow-100 text-yellow-800',
    error: 'badge-error bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    pink: 'bg-pink-100 text-pink-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    outline: 'border border-gray-300 text-gray-700 bg-white',
    dark: 'bg-gray-800 text-gray-100'
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm',
    xl: 'px-4 py-1 text-base'
  };

  return (
    <span
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// Status Badge
const StatusBadge = ({ status, className, ...props }) => {
  const statusConfig = {
    active: { variant: 'success', text: 'Active' },
    inactive: { variant: 'error', text: 'Inactive' },
    pending: { variant: 'warning', text: 'Pending' },
    approved: { variant: 'success', text: 'Approved' },
    rejected: { variant: 'error', text: 'Rejected' },
    draft: { variant: 'secondary', text: 'Draft' },
    published: { variant: 'success', text: 'Published' },
    archived: { variant: 'dark', text: 'Archived' },
    online: { variant: 'success', text: 'Online' },
    offline: { variant: 'secondary', text: 'Offline' },
    away: { variant: 'warning', text: 'Away' },
    busy: { variant: 'error', text: 'Busy' }
  };

  const config = statusConfig[status] || { variant: 'default', text: status };

  return (
    <Badge
      variant={config.variant}
      className={className}
      {...props}
    >
      {config.text}
    </Badge>
  );
};

// Notification Badge
const NotificationBadge = ({ 
  count, 
  max = 99, 
  showZero = false, 
  className,
  size = 'sm',
  ...props 
}) => {
  if (!showZero && (!count || count === 0)) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count;

  return (
    <Badge
      variant="error"
      size={size}
      className={cn('absolute -top-1 -right-1 min-w-5 justify-center', className)}
      {...props}
    >
      {displayCount}
    </Badge>
  );
};

// Dot Badge (simple indicator)
const DotBadge = ({ variant = 'primary', size = 'md', className, ...props }) => {
  const sizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  const variants = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-400',
    success: 'bg-green-400',
    warning: 'bg-yellow-400',
    error: 'bg-red-400',
    info: 'bg-blue-400'
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

// Category Badge
const CategoryBadge = ({ category, className, ...props }) => {
  const categoryColors = {
    // Textile categories
    shirts: 'bg-blue-100 text-blue-800',
    pants: 'bg-indigo-100 text-indigo-800',
    sarees: 'bg-pink-100 text-pink-800',
    kurtas: 'bg-purple-100 text-purple-800',
    dresses: 'bg-rose-100 text-rose-800',
    fabrics: 'bg-orange-100 text-orange-800',
    accessories: 'bg-teal-100 text-teal-800',
    footwear: 'bg-cyan-100 text-cyan-800',
    // Business types
    manufacturer: 'bg-green-100 text-green-800',
    wholesaler: 'bg-blue-100 text-blue-800',
    retailer: 'bg-purple-100 text-purple-800',
    supplier: 'bg-orange-100 text-orange-800',
    // Default
    default: 'bg-gray-100 text-gray-800'
  };

  const colorClass = categoryColors[category?.toLowerCase()] || categoryColors.default;

  return (
    <Badge
      className={cn(colorClass, className)}
      {...props}
    >
      {category}
    </Badge>
  );
};

// Price Range Badge - FIXED: Handle both old and new schema
const PriceBadge = ({ price, currency, className, ...props }) => {
  // Handle both schema formats:
  // Old: { min, max, currency, unit }
  // New: { amount, currency, unit }
  const priceAmount = price?.amount || price?.min || price;
  const priceCurrency = price?.currency || currency || 'INR';
  const priceUnit = price?.unit || '';

  // Map currency codes to symbols
  const currencySymbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };

  const currencySymbol = currencySymbols[priceCurrency] || priceCurrency;

  const formatPrice = (amount) => {
    if (!amount && amount !== 0) return 'Price not set';
    if (amount >= 100000) {
      return `${currencySymbol}${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `${currencySymbol}${(amount / 1000).toFixed(1)}K`;
    }
    return `${currencySymbol}${amount}`;
  };

  return (
    <Badge
      variant="success"
      className={cn('font-mono', className)}
      {...props}
    >
      {formatPrice(priceAmount)}{priceUnit && `/${priceUnit}`}
    </Badge>
  );
};

// Verification Badge
const VerificationBadge = ({ verified = false, className, ...props }) => {
  if (!verified) return null;

  return (
    <Badge
      variant="success"
      size="sm"
      className={cn('ml-1', className)}
      {...props}
    >
      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </Badge>
  );
};

// Language Badge
const LanguageBadge = ({ language, flag, className, ...props }) => {
  return (
    <Badge
      variant="outline"
      size="sm"
      className={cn('gap-1', className)}
      {...props}
    >
      {flag && <span>{flag}</span>}
      {language}
    </Badge>
  );
};

// Removable Badge
const RemovableBadge = ({ children, onRemove, className, ...props }) => {
  return (
    <Badge
      variant="secondary"
      className={cn('pr-1', className)}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </Badge>
  );
};

// Export all badge variants
Badge.Status = StatusBadge;
Badge.Notification = NotificationBadge;
Badge.Dot = DotBadge;
Badge.Category = CategoryBadge;
Badge.Price = PriceBadge;
Badge.Verification = VerificationBadge;
Badge.Language = LanguageBadge;
Badge.Removable = RemovableBadge;

export default Badge;
export {
  StatusBadge,
  NotificationBadge,
  DotBadge,
  CategoryBadge,
  PriceBadge,
  VerificationBadge,
  LanguageBadge,
  RemovableBadge
};
