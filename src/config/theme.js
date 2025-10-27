// Claire B2B - Glassmorphism Theme
// Inspired by OpenAI Atlas and modern glass UI designs

export const GLASS_THEME = {
  // Background gradients
  backgrounds: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple gradient
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink-red gradient
    app: 'linear-gradient(to bottom right, #e0e7ff 0%, #fce7f3 50%, #ddd6fe 100%)', // Soft purple-pink gradient
    card: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white
    cardHover: 'rgba(255, 255, 255, 0.85)',
    overlay: 'rgba(0, 0, 0, 0.05)',
  },

  // Glass effects
  glass: {
    // Light glass card
    light: {
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    },
    // Medium glass card
    medium: {
      background: 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(24px) saturate(200%)',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: '0 10px 40px 0 rgba(31, 38, 135, 0.20)',
    },
    // Strong glass card
    strong: {
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(30px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.6)',
      boxShadow: '0 12px 48px 0 rgba(31, 38, 135, 0.25)',
    },
    // Colored glass (for buttons, active states)
    colored: {
      purple: {
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px 0 rgba(102, 126, 234, 0.4)',
      },
      blue: {
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.8) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.4)',
      },
    },
  },

  // Colors
  colors: {
    primary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6', // Main purple
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    accent: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899', // Main pink
      600: '#db2777',
      700: '#be185d',
      800: '#9f1239',
      900: '#881337',
    },
    text: {
      primary: '#1f2937', // Dark gray
      secondary: '#6b7280', // Medium gray
      tertiary: '#9ca3af', // Light gray
      inverse: '#ffffff',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Typography
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      display: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  // Border radius
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },

  // Shadows (for depth)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(139, 92, 246, 0.5)',
  },

  // Animations
  animations: {
    transition: {
      fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
};

// CSS-in-JS helper functions
export const glassCard = (variant = 'light') => ({
  background: GLASS_THEME.glass[variant].background,
  backdropFilter: GLASS_THEME.glass[variant].backdropFilter,
  WebkitBackdropFilter: GLASS_THEME.glass[variant].backdropFilter,
  border: GLASS_THEME.glass[variant].border,
  boxShadow: GLASS_THEME.glass[variant].boxShadow,
  borderRadius: GLASS_THEME.borderRadius.xl,
});

export const glassButton = (color = 'purple') => ({
  background: GLASS_THEME.glass.colored[color].background,
  backdropFilter: GLASS_THEME.glass.colored[color].backdropFilter,
  WebkitBackdropFilter: GLASS_THEME.glass.colored[color].backdropFilter,
  border: GLASS_THEME.glass.colored[color].border,
  boxShadow: GLASS_THEME.glass.colored[color].boxShadow,
  borderRadius: GLASS_THEME.borderRadius.full,
  color: GLASS_THEME.colors.text.inverse,
  fontWeight: GLASS_THEME.typography.fontWeight.semibold,
  transition: `all ${GLASS_THEME.animations.transition.base}`,
});

export default GLASS_THEME;
