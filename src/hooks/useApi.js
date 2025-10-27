import { useState, useEffect } from 'react';
import { handleAPIResponse } from '../services/api';

export const useApi = (apiCall, dependencies = [], options = {}) => {
  const [data, setData] = useState(options.initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const {
    immediate = true,
    successMessage = null,
    errorMessage = null,
    onSuccess = null,
    onError = null
  } = options;
  
  const execute = async (...args) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await handleAPIResponse(
        () => apiCall(...args),
        successMessage
      );
      
      if (response.success) {
        setData(response.data);
        onSuccess?.(response.data);
      } else {
        setError(response.error);
        onError?.(response.error);
      }
      
      return response;
    } catch (err) {
      const errorMsg = err.message || errorMessage || 'An error occurred';
      setError(errorMsg);
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  
  const reset = () => {
    setData(options.initialData || null);
    setError(null);
    setIsLoading(false);
  };
  
  return {
    data,
    isLoading,
    error,
    execute,
    reset,
    refetch: execute
  };
};

export default useApi;
