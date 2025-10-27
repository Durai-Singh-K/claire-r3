import { useState, useEffect, useRef, useCallback } from 'react';

// Hook for handling clicks outside an element
export const useClickOutside = (callback, enabled = true) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
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

// Hook for handling Escape key press
export const useEscapeKey = (callback, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [callback, enabled]);
};

// Hook for managing modal/dialog state
export const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Close on escape key
  useEscapeKey(close, isOpen);

  return {
    isOpen,
    open,
    close,
    toggle
  };
};

// Hook for managing dropdown/popover state
export const useDropdown = (initialOpen = false, closeOnClickOutside = true) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const toggleRef = useRef(null);
  const dropdownRef = useRef(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Close on escape key
  useEscapeKey(close, isOpen);

  // Close on click outside
  useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return;

    const handleClickOutside = (event) => {
      const isOutsideToggle = toggleRef.current && !toggleRef.current.contains(event.target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target);
      
      if (isOutsideToggle && isOutsideDropdown) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeOnClickOutside, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
    toggleRef,
    dropdownRef
  };
};

// Hook for managing toggle state with persistence
export const useToggle = (initialValue = false, persistKey = null) => {
  const getInitialValue = () => {
    if (persistKey) {
      const stored = localStorage.getItem(persistKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    }
    return initialValue;
  };

  const [value, setValue] = useState(getInitialValue);

  const toggle = useCallback(() => {
    setValue(current => {
      const newValue = !current;
      if (persistKey) {
        localStorage.setItem(persistKey, JSON.stringify(newValue));
      }
      return newValue;
    });
  }, [persistKey]);

  const setTrue = useCallback(() => {
    setValue(true);
    if (persistKey) {
      localStorage.setItem(persistKey, JSON.stringify(true));
    }
  }, [persistKey]);

  const setFalse = useCallback(() => {
    setValue(false);
    if (persistKey) {
      localStorage.setItem(persistKey, JSON.stringify(false));
    }
  }, [persistKey]);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue: (newValue) => {
      setValue(newValue);
      if (persistKey) {
        localStorage.setItem(persistKey, JSON.stringify(newValue));
      }
    }
  };
};

// Hook for managing accordion/collapsible state
export const useAccordion = (initialItems = []) => {
  const [expandedItems, setExpandedItems] = useState(new Set(initialItems));

  const isExpanded = useCallback((itemId) => {
    return expandedItems.has(itemId);
  }, [expandedItems]);

  const expand = useCallback((itemId) => {
    setExpandedItems(prev => new Set([...prev, itemId]));
  }, []);

  const collapse = useCallback((itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  }, []);

  const toggle = useCallback((itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const expandAll = useCallback((itemIds) => {
    setExpandedItems(new Set(itemIds));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedItems(new Set());
  }, []);

  return {
    expandedItems: Array.from(expandedItems),
    isExpanded,
    expand,
    collapse,
    toggle,
    expandAll,
    collapseAll
  };
};

// Hook for managing tabs state
export const useTabs = (initialTab = 0, persistKey = null) => {
  const getInitialTab = () => {
    if (persistKey) {
      const stored = localStorage.getItem(persistKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    }
    return initialTab;
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const changeTab = useCallback((tabIndex) => {
    setActiveTab(tabIndex);
    if (persistKey) {
      localStorage.setItem(persistKey, JSON.stringify(tabIndex));
    }
  }, [persistKey]);

  const nextTab = useCallback((maxTabs) => {
    setActiveTab(current => {
      const newTab = current + 1 >= maxTabs ? 0 : current + 1;
      if (persistKey) {
        localStorage.setItem(persistKey, JSON.stringify(newTab));
      }
      return newTab;
    });
  }, [persistKey]);

  const prevTab = useCallback((maxTabs) => {
    setActiveTab(current => {
      const newTab = current - 1 < 0 ? maxTabs - 1 : current - 1;
      if (persistKey) {
        localStorage.setItem(persistKey, JSON.stringify(newTab));
      }
      return newTab;
    });
  }, [persistKey]);

  return {
    activeTab,
    changeTab,
    nextTab,
    prevTab,
    isActive: (tabIndex) => activeTab === tabIndex
  };
};

// Hook for managing stepper/wizard state
export const useStepper = (totalSteps, initialStep = 0) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const nextStep = useCallback(() => {
    setCurrentStep(current => Math.min(current + 1, totalSteps - 1));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep(current => Math.max(current - 1, 0));
  });

  const goToStep = useCallback((step) => {
    setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)));
  }, [totalSteps]);

  const completeStep = useCallback((step = currentStep) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  }, [currentStep]);

  const uncompleteStep = useCallback((step) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(step);
      return newSet;
    });
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(initialStep);
    setCompletedSteps(new Set());
  }, [initialStep]);

  const isStepCompleted = useCallback((step) => {
    return completedSteps.has(step);
  }, [completedSteps]);

  const canGoToStep = useCallback((step) => {
    // Can go to current step, previous steps, or next immediate step if current is completed
    return step <= currentStep || (step === currentStep + 1 && isStepCompleted(currentStep));
  }, [currentStep, isStepCompleted]);

  return {
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    goToStep,
    completeStep,
    uncompleteStep,
    reset,
    isStepCompleted,
    canGoToStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    progress: ((currentStep + 1) / totalSteps) * 100,
    completedSteps: Array.from(completedSteps)
  };
};

// Hook for managing selection state (single or multiple)
export const useSelection = (initialSelection = [], multiSelect = true) => {
  const [selection, setSelection] = useState(() => 
    new Set(Array.isArray(initialSelection) ? initialSelection : [initialSelection])
  );

  const select = useCallback((item) => {
    setSelection(prev => {
      if (multiSelect) {
        return new Set([...prev, item]);
      } else {
        return new Set([item]);
      }
    });
  }, [multiSelect]);

  const deselect = useCallback((item) => {
    setSelection(prev => {
      const newSet = new Set(prev);
      newSet.delete(item);
      return newSet;
    });
  }, []);

  const toggle = useCallback((item) => {
    setSelection(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        if (!multiSelect) {
          newSet.clear();
        }
        newSet.add(item);
      }
      return newSet;
    });
  }, [multiSelect]);

  const selectAll = useCallback((items) => {
    if (multiSelect) {
      setSelection(new Set(items));
    }
  }, [multiSelect]);

  const clearSelection = useCallback(() => {
    setSelection(new Set());
  }, []);

  const isSelected = useCallback((item) => {
    return selection.has(item);
  }, [selection]);

  return {
    selection: Array.from(selection),
    select,
    deselect,
    toggle,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection: selection.size > 0,
    selectedCount: selection.size,
    selectedSet: selection
  };
};

// Hook for managing pagination state
export const usePagination = (totalItems, itemsPerPage = 10, initialPage = 1) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage(current => Math.min(current + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage(current => Math.max(current - 1, 1));
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Generate page numbers for pagination UI
  const getPageNumbers = useCallback((maxVisible = 5) => {
    const pages = [];
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // Adjust start if we're at the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [currentPage, totalPages]);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    getPageNumbers,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    isEmpty: totalItems === 0
  };
};

export default useClickOutside;
