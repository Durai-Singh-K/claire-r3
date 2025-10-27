import { useState, useEffect, useRef, useCallback } from 'react';

// Intersection Observer hook for lazy loading and infinite scroll
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    once = false,
    skip = false
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    
    if (skip || !element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);

        if (once && entry.isIntersecting && observerRef.current) {
          observerRef.current.disconnect();
        }
      },
      { threshold, root, rootMargin }
    );

    observerRef.current = observer;
    observer.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, root, rootMargin, once, skip]);

  return { elementRef, isIntersecting, entry };
};

// Hook for infinite scroll
export const useInfiniteScroll = (fetchMore, hasMore, threshold = 1.0) => {
  const [isFetching, setIsFetching] = useState(false);
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold,
    once: false
  });

  useEffect(() => {
    if (isIntersecting && hasMore && !isFetching) {
      setIsFetching(true);
      fetchMore().finally(() => setIsFetching(false));
    }
  }, [isIntersecting, hasMore, isFetching, fetchMore]);

  return { elementRef, isFetching };
};

// Hook for lazy loading images
export const useLazyImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    once: true
  });

  useEffect(() => {
    if (isIntersecting && src && imageSrc === placeholder) {
      setIsLoading(true);
      setHasError(false);

      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
      };
      
      img.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
      
      img.src = src;
    }
  }, [isIntersecting, src, placeholder, imageSrc]);

  return {
    elementRef,
    imageSrc,
    isLoading,
    hasError
  };
};

// Online/Offline status hook
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Window size hook
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

// Media query hook
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = (event) => setMatches(event.matches);
    
    if (media.addListener) {
      media.addListener(listener);
    } else {
      media.addEventListener('change', listener);
    }

    return () => {
      if (media.removeListener) {
        media.removeListener(listener);
      } else {
        media.removeEventListener('change', listener);
      }
    };
  }, [matches, query]);

  return matches;
};

// Responsive breakpoints
export const useBreakpoints = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLarge = useMediaQuery('(min-width: 1280px)');
  const isXLarge = useMediaQuery('(min-width: 1536px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLarge,
    isXLarge,
    current: isMobile ? 'mobile' : isTablet ? 'tablet' : isDesktop ? 'desktop' : isLarge ? 'large' : 'xlarge'
  };
};

// Click outside hook
export const useClickOutside = (callback, enabled = true) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [callback, enabled]);

  return ref;
};

// Escape key hook
export const useEscapeKey = (callback, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        callback(event);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [callback, enabled]);
};

// Focus trap hook for modals and dropdowns
export const useFocusTrap = (isActive = false) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    // Focus first element when activated
    firstElement?.focus();

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isActive]);

  return containerRef;
};

// Previous value hook
export const usePrevious = (value) => {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
};

// Toggle hook
export const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => setValue(prev => !prev), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  
  return [value, { toggle, setTrue, setFalse, setValue }];
};

// Counter hook
export const useCounter = (initialValue = 0, { min, max } = {}) => {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(prev => {
      const newCount = prev + 1;
      return max !== undefined ? Math.min(newCount, max) : newCount;
    });
  }, [max]);

  const decrement = useCallback(() => {
    setCount(prev => {
      const newCount = prev - 1;
      return min !== undefined ? Math.max(newCount, min) : newCount;
    });
  }, [min]);

  const reset = useCallback(() => setCount(initialValue), [initialValue]);

  const set = useCallback((value) => {
    setCount(prev => {
      let newCount = typeof value === 'function' ? value(prev) : value;
      if (min !== undefined) newCount = Math.max(newCount, min);
      if (max !== undefined) newCount = Math.min(newCount, max);
      return newCount;
    });
  }, [min, max]);

  return {
    count,
    increment,
    decrement,
    reset,
    set
  };
};

// Copy to clipboard hook
export const useCopyToClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, []);

  return { copyToClipboard, isCopied };
};

// Hover hook
export const useHover = () => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return { ref, isHovered };
};

// Document title hook
export const useDocumentTitle = (title, restoreOnUnmount = false) => {
  const originalTitle = useRef(document.title);

  useEffect(() => {
    document.title = title;

    return () => {
      if (restoreOnUnmount) {
        document.title = originalTitle.current;
      }
    };
  }, [title, restoreOnUnmount]);
};

// Favicon hook
export const useFavicon = (href) => {
  useEffect(() => {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = href;
    document.getElementsByTagName('head')[0].appendChild(link);
  }, [href]);
};

// Page visibility hook
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
};

// Geolocation hook
export const useGeolocation = (options = {}) => {
  const [state, setState] = useState({
    loading: true,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: null,
    longitude: null,
    speed: null,
    timestamp: null,
    error: null
  });

  useEffect(() => {
    let watchId = null;

    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: new Error('Geolocation is not supported')
      }));
      return;
    }

    const handleSuccess = (position) => {
      setState({
        loading: false,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed,
        timestamp: position.timestamp,
        error: null
      });
    };

    const handleError = (error) => {
      setState(prev => ({
        ...prev,
        loading: false,
        error
      }));
    };

    if (options.watch) {
      watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        options
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge, options.watch]);

  return state;
};


