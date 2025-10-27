import { useState, useEffect, useCallback } from 'react';

const useLocalStorage = (key, initialValue, options = {}) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncAcrossTabs = true
  } = options;

  // Get initial value from localStorage
  const getStoredValue = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        // If initialValue is a function, call it
        return typeof initialValue === 'function' ? initialValue() : initialValue;
      }
      return deserialize(item);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  }, [key, initialValue, deserialize]);

  const [storedValue, setStoredValue] = useState(getStoredValue);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = typeof value === 'function' ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, serialize(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, storedValue]);

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(typeof initialValue === 'function' ? initialValue() : initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to localStorage from other tabs
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error deserializing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, deserialize, syncAcrossTabs]);

  return [storedValue, setValue, removeValue];
};

// Hook for storing objects with validation
export const useValidatedLocalStorage = (key, initialValue, validator) => {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);

  const setValidatedValue = useCallback((newValue) => {
    if (validator && !validator(newValue)) {
      console.warn(`Validation failed for localStorage key "${key}"`);
      return false;
    }
    setValue(newValue);
    return true;
  }, [setValue, validator, key]);

  return [value, setValidatedValue, removeValue];
};

// Hook for storing arrays with helper methods
export const useLocalStorageArray = (key, initialValue = []) => {
  const [array, setArray, removeArray] = useLocalStorage(key, initialValue);

  const addItem = useCallback((item) => {
    setArray(currentArray => [...currentArray, item]);
  }, [setArray]);

  const removeItem = useCallback((index) => {
    setArray(currentArray => currentArray.filter((_, i) => i !== index));
  }, [setArray]);

  const removeItemByValue = useCallback((value, compareFn) => {
    setArray(currentArray => {
      if (compareFn) {
        return currentArray.filter(item => !compareFn(item, value));
      }
      return currentArray.filter(item => item !== value);
    });
  }, [setArray]);

  const updateItem = useCallback((index, newValue) => {
    setArray(currentArray => 
      currentArray.map((item, i) => i === index ? newValue : item)
    );
  }, [setArray]);

  const clear = useCallback(() => {
    setArray([]);
  }, [setArray]);

  const contains = useCallback((value, compareFn) => {
    if (compareFn) {
      return array.some(item => compareFn(item, value));
    }
    return array.includes(value);
  }, [array]);

  return {
    array,
    setArray,
    addItem,
    removeItem,
    removeItemByValue,
    updateItem,
    clear,
    removeArray,
    contains,
    length: array.length,
    isEmpty: array.length === 0
  };
};

// Hook for storing objects with deep merge
export const useLocalStorageObject = (key, initialValue = {}) => {
  const [obj, setObj, removeObj] = useLocalStorage(key, initialValue);

  const updateProperty = useCallback((property, value) => {
    setObj(currentObj => ({
      ...currentObj,
      [property]: value
    }));
  }, [setObj]);

  const updateProperties = useCallback((updates) => {
    setObj(currentObj => ({
      ...currentObj,
      ...updates
    }));
  }, [setObj]);

  const removeProperty = useCallback((property) => {
    setObj(currentObj => {
      const { [property]: removed, ...rest } = currentObj;
      return rest;
    });
  }, [setObj]);

  const reset = useCallback(() => {
    setObj(initialValue);
  }, [setObj, initialValue]);

  return {
    obj,
    setObj,
    updateProperty,
    updateProperties,
    removeProperty,
    reset,
    removeObj,
    hasProperty: (property) => property in obj,
    getProperty: (property, defaultValue) => obj[property] ?? defaultValue
  };
};

// Hook for recent items list
export const useRecentItems = (key, maxItems = 10) => {
  const [items, setItems] = useLocalStorage(key, []);

  const addRecentItem = useCallback((item, compareFn) => {
    setItems(currentItems => {
      // Remove item if it already exists
      let filteredItems = currentItems;
      if (compareFn) {
        filteredItems = currentItems.filter(existing => !compareFn(existing, item));
      } else {
        filteredItems = currentItems.filter(existing => 
          JSON.stringify(existing) !== JSON.stringify(item)
        );
      }

      // Add item to beginning and limit to maxItems
      return [item, ...filteredItems].slice(0, maxItems);
    });
  }, [setItems, maxItems]);

  const removeRecentItem = useCallback((item, compareFn) => {
    setItems(currentItems => {
      if (compareFn) {
        return currentItems.filter(existing => !compareFn(existing, item));
      }
      return currentItems.filter(existing => 
        JSON.stringify(existing) !== JSON.stringify(item)
      );
    });
  }, [setItems]);

  const clearRecent = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return {
    recentItems: items,
    addRecentItem,
    removeRecentItem,
    clearRecent,
    hasRecent: items.length > 0
  };
};

// Hook for user preferences
export const useUserPreferences = (defaultPreferences = {}) => {
  const [preferences, setPreferences, removePreferences] = useLocalStorage(
    'user_preferences',
    defaultPreferences
  );

  const updatePreference = useCallback((key, value) => {
    setPreferences(current => ({
      ...current,
      [key]: value
    }));
  }, [setPreferences]);

  const getPreference = useCallback((key, defaultValue) => {
    return preferences[key] ?? defaultValue;
  }, [preferences]);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, [setPreferences, defaultPreferences]);

  return {
    preferences,
    updatePreference,
    getPreference,
    resetPreferences,
    removePreferences
  };
};

// Hook for form state persistence
export const usePersistedForm = (formKey, initialState = {}) => {
  const [formState, setFormState] = useLocalStorage(
    `form_${formKey}`,
    initialState
  );

  const updateField = useCallback((fieldName, value) => {
    setFormState(current => ({
      ...current,
      [fieldName]: value
    }));
  }, [setFormState]);

  const updateFields = useCallback((fields) => {
    setFormState(current => ({
      ...current,
      ...fields
    }));
  }, [setFormState]);

  const resetForm = useCallback(() => {
    setFormState(initialState);
  }, [setFormState, initialState]);

  const clearForm = useCallback(() => {
    setFormState({});
    localStorage.removeItem(`form_${formKey}`);
  }, [setFormState, formKey]);

  return {
    formState,
    updateField,
    updateFields,
    resetForm,
    clearForm,
    hasData: Object.keys(formState).length > 0
  };
};

export default useLocalStorage;
