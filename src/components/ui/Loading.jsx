import React from 'react';
import { cn } from '../../utils/helpers';

// Loading Spinner Component
const Loading = ({ size = 'md', color = 'primary', className, ...props }) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  const colors = {
    primary: 'text-primary-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    accent: 'text-accent-600'
  };

  return (
    <div className={cn('flex items-center justify-center', className)} {...props}>
      <svg
        className={cn(
          'animate-spin',
          sizes[size],
          colors[color]
        )}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// Loading Overlay
const LoadingOverlay = ({ isLoading, children, message = 'Loading...', className }) => {
  if (!isLoading) {
    return children;
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <div className="flex flex-col items-center space-y-2">
          <Loading size="lg" />
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loading
const Skeleton = ({ className, ...props }) => (
  <div
    className={cn(
      'animate-pulse bg-gray-200 rounded',
      className
    )}
    {...props}
  />
);

// Skeleton variants
const SkeletonText = ({ lines = 3, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        className={cn(
          'h-4',
          index === lines - 1 ? 'w-3/4' : 'w-full'
        )}
      />
    ))}
  </div>
);

const SkeletonAvatar = ({ size = 'md', className }) => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <Skeleton
      className={cn(
        'rounded-full',
        sizes[size],
        className
      )}
    />
  );
};

const SkeletonCard = ({ className }) => (
  <div className={cn('p-4 space-y-4', className)}>
    <div className="flex items-center space-x-3">
      <SkeletonAvatar />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <SkeletonText lines={2} />
    <Skeleton className="h-48 w-full" />
    <div className="flex justify-between">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-16" />
    </div>
  </div>
);

// Page Loading
const PageLoading = ({ message = 'Loading page...' }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Loading size="xl" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  </div>
);

// Button Loading
const ButtonLoading = ({ children, isLoading, loadingText = 'Loading...', ...props }) => (
  <button disabled={isLoading} {...props}>
    {isLoading && (
      <Loading size="sm" color="white" className="mr-2" />
    )}
    {isLoading ? loadingText : children}
  </button>
);

// Dots Loading
const DotsLoading = ({ size = 'md', color = 'primary', className }) => {
  const sizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const colors = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-600',
    white: 'bg-white',
    accent: 'bg-accent-600'
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'rounded-full animate-pulse',
            sizes[size],
            colors[color]
          )}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  );
};

// Progress Bar Loading
const ProgressBar = ({ progress = 0, size = 'md', color = 'primary', className, showPercentage = false }) => {
  const sizes = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const colors = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-600',
    accent: 'bg-accent-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn('w-full', className)}>
      {showPercentage && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full transition-all duration-300 ease-out rounded-full', colors[color])}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

// Pulse Loading
const PulseLoading = ({ children, className }) => (
  <div className={cn('animate-pulse', className)}>
    {children}
  </div>
);

Loading.Overlay = LoadingOverlay;
Loading.Skeleton = Skeleton;
Loading.SkeletonText = SkeletonText;
Loading.SkeletonAvatar = SkeletonAvatar;
Loading.SkeletonCard = SkeletonCard;
Loading.Page = PageLoading;
Loading.Button = ButtonLoading;
Loading.Dots = DotsLoading;
Loading.Progress = ProgressBar;
Loading.Pulse = PulseLoading;

export default Loading;
export {
  LoadingOverlay,
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  PageLoading,
  ButtonLoading,
  DotsLoading,
  ProgressBar,
  PulseLoading
};
