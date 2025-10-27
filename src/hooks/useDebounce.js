import { useState, useEffect, useRef, useCallback } from 'react';

// Debounce a value
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Debounce a function
export const useDebouncedCallback = (callback, delay) => {
  const timeoutRef = useRef();
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const flush = useCallback(
    (...args) => {
      cancel();
      callbackRef.current(...args);
    },
    [cancel]
  );

  return [debouncedCallback, { cancel, flush }];
};

// Throttle a function
export const useThrottledCallback = (callback, delay) => {
  const throttleRef = useRef(false);
  const timeoutRef = useRef();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args) => {
      if (!throttleRef.current) {
        callbackRef.current(...args);
        throttleRef.current = true;

        timeoutRef.current = setTimeout(() => {
          throttleRef.current = false;
        }, delay);
      }
    },
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

// Search hook with debouncing
export const useDebounceSearch = (searchFunction, delay = 300, minLength = 2) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounce(query, delay);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < minLength) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const searchResults = await searchFunction(debouncedQuery);
        setResults(searchResults);
      } catch (err) {
        setError(err.message);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery, searchFunction, minLength]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsSearching(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    clearSearch,
    hasResults: results.length > 0,
    hasQuery: query.length >= minLength
  };
};

// Form field with debounced validation
export const useDebouncedValidation = (value, validator, delay = 500) => {
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    const validate = async () => {
      if (!debouncedValue) {
        setError(null);
        setIsValid(true);
        setIsValidating(false);
        return;
      }

      setIsValidating(true);

      try {
        const result = await validator(debouncedValue);
        if (result === true || (typeof result === 'object' && result.isValid)) {
          setError(null);
          setIsValid(true);
        } else {
          const errorMessage = typeof result === 'string' 
            ? result 
            : result.error || 'Validation failed';
          setError(errorMessage);
          setIsValid(false);
        }
      } catch (err) {
        setError(err.message);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [debouncedValue, validator]);

  return {
    error,
    isValid,
    isValidating,
    hasValue: Boolean(value)
  };
};

export default useDebounce;
