import React from 'react';
import { cn } from '../../utils/helpers';

const Button = React.forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  loading,
  loadingText,
  icon,
  iconPosition = 'left',
  fullWidth,
  ...props
}, ref) => {
  const baseClasses = 'btn focus-visible';
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white'
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
    xl: 'px-8 py-4 text-xl'
  };

  const classes = cn(
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    disabled && 'opacity-50 cursor-not-allowed',
    loading && 'opacity-70 cursor-wait',
    className
  );

  const IconComponent = icon;
  const showIcon = IconComponent && !loading;

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      ref={ref}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {showIcon && iconPosition === 'left' && (
        <IconComponent className="w-4 h-4 mr-2" />
      )}
      
      {children}
      
      {showIcon && iconPosition === 'right' && (
        <IconComponent className="w-4 h-4 ml-2" />
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
