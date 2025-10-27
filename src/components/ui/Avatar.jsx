import React from 'react';
import { cn } from '../../utils/helpers';
import { getInitials, getAvatarColor } from '../../utils/formatters';

const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  showOnline,
  isOnline,
  className,
  fallbackIcon,
  ...props
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl'
  };

  const shapes = {
    circle: 'rounded-full',
    square: 'rounded-lg',
    rounded: 'rounded-md'
  };

  const onlineDotSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
    '2xl': 'w-6 h-6'
  };

  const initials = name ? getInitials(name) : '';
  const avatarColor = name ? getAvatarColor(name) : 'bg-gray-500';

  return (
    <div className={cn('relative inline-flex', className)} {...props}>
      <div
        className={cn(
          'flex items-center justify-center font-medium text-white overflow-hidden',
          sizes[size],
          shapes[shape],
          !src && avatarColor
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image on error, show fallback
              e.target.style.display = 'none';
            }}
          />
        ) : initials ? (
          <span>{initials}</span>
        ) : fallbackIcon ? (
          React.createElement(fallbackIcon, { className: 'w-1/2 h-1/2' })
        ) : (
          <svg
            className="w-1/2 h-1/2 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </div>

      {/* Online indicator */}
      {showOnline && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            onlineDotSizes[size],
            isOnline ? 'bg-green-400' : 'bg-gray-300'
          )}
        />
      )}
    </div>
  );
};

// Avatar Group
const AvatarGroup = ({
  avatars = [],
  max = 3,
  size = 'md',
  className,
  spacing = 'normal',
  showCount = true,
  ...props
}) => {
  const spacings = {
    tight: '-space-x-1',
    normal: '-space-x-2',
    loose: '-space-x-3'
  };

  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div
      className={cn(
        'flex items-center',
        spacings[spacing],
        className
      )}
      {...props}
    >
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={avatar.id || index}
          src={avatar.src}
          name={avatar.name}
          alt={avatar.alt}
          size={size}
          className="ring-2 ring-white"
          {...avatar}
        />
      ))}

      {remainingCount > 0 && showCount && (
        <div
          className={cn(
            'flex items-center justify-center bg-gray-100 text-gray-600 font-medium ring-2 ring-white',
            'rounded-full',
            Avatar.sizes || sizes[size]
          )}
        >
          <span className="text-xs">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};

// Avatar with dropdown
const AvatarDropdown = ({
  trigger,
  children,
  placement = 'bottom-end',
  className,
  ...props
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const placements = {
    'bottom-end': 'top-full right-0 mt-2',
    'bottom-start': 'top-full left-0 mt-2',
    'top-end': 'bottom-full right-0 mb-2',
    'top-start': 'bottom-full left-0 mb-2'
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef} {...props}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 min-w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1',
            'animate-scale-in origin-top-right',
            placements[placement]
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// Avatar Upload
const AvatarUpload = ({
  currentAvatar,
  name,
  size = 'xl',
  onImageSelect,
  className,
  ...props
}) => {
  const fileInputRef = React.useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect?.(file);
    }
    // Reset input
    event.target.value = '';
  };

  return (
    <div className={cn('relative group', className)} {...props}>
      <Avatar
        src={currentAvatar}
        name={name}
        size={size}
        className="cursor-pointer group-hover:opacity-75 transition-opacity"
        onClick={() => fileInputRef.current?.click()}
      />
      
      {/* Upload overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

Avatar.Group = AvatarGroup;
Avatar.Dropdown = AvatarDropdown;
Avatar.Upload = AvatarUpload;

export default Avatar;
export { AvatarGroup, AvatarDropdown, AvatarUpload };
