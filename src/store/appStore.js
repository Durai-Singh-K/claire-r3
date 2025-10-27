import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS, LANGUAGES } from '../config/constants';
import toast from 'react-hot-toast';

const useAppStore = create(
  persist(
    (set, get) => ({
      // UI State
      theme: 'light',
      selectedLanguage: 'english',
      sidebarOpen: false,
      mobileMenuOpen: false,
      
      // Notification settings
      notificationsEnabled: true,
      pushNotificationsEnabled: false,
      emailNotificationsEnabled: true,
      
      // App settings
      autoTranslateEnabled: true,
      voiceChatEnabled: true,
      locationEnabled: false,
      analyticsEnabled: true,
      
      // Recent activity
      recentSearches: [],
      recentContacts: [],
      
      // Loading states
      globalLoading: false,
      
      // Error handling
      errors: [],
      
      // Navigation history
      navigationHistory: [],
      currentPath: '/',
      
      // Actions
      setTheme: (theme) => {
        set({ theme });
        
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        toast.success(`Switched to ${theme} mode`);
      },
      
      setLanguage: (language) => {
        const languageData = LANGUAGES.find(lang => lang.code === language);
        if (languageData) {
          set({ selectedLanguage: language });
          
          // Apply language-specific font
          const fontClass = `font-${language}`;
          document.documentElement.className = document.documentElement.className
            .replace(/font-\w+/g, '')
            + ` ${fontClass}`;
          
          toast.success(`Language changed to ${languageData.nativeName}`);
        }
      },
      
      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }));
      },
      
      closeSidebar: () => {
        set({ sidebarOpen: false });
      },
      
      toggleMobileMenu: () => {
        set(state => ({ mobileMenuOpen: !state.mobileMenuOpen }));
      },
      
      closeMobileMenu: () => {
        set({ mobileMenuOpen: false });
      },
      
      updateNotificationSettings: (settings) => {
        set(state => ({
          ...state,
          ...settings
        }));
        
        // Request notification permission if enabling push notifications
        if (settings.pushNotificationsEnabled && 'Notification' in window) {
          Notification.requestPermission().then(permission => {
            if (permission !== 'granted') {
              set({ pushNotificationsEnabled: false });
              toast.error('Notification permission denied');
            } else {
              toast.success('Push notifications enabled');
            }
          });
        }
      },
      
      updateAppSettings: (settings) => {
        set(state => ({ ...state, ...settings }));
        toast.success('Settings updated');
      },
      
      addRecentSearch: (query) => {
        const { recentSearches } = get();
        const updatedSearches = [
          query,
          ...recentSearches.filter(search => search !== query)
        ].slice(0, 10); // Keep only last 10 searches
        
        set({ recentSearches: updatedSearches });
      },
      
      clearRecentSearches: () => {
        set({ recentSearches: [] });
        toast.success('Search history cleared');
      },
      
      addRecentContact: (contact) => {
        const { recentContacts } = get();
        const updatedContacts = [
          contact,
          ...recentContacts.filter(c => c._id !== contact._id)
        ].slice(0, 20); // Keep only last 20 contacts
        
        set({ recentContacts: updatedContacts });
      },
      
      setGlobalLoading: (loading) => {
        set({ globalLoading: loading });
      },
      
      addError: (error) => {
        const { errors } = get();
        const errorId = Date.now().toString();
        const errorObj = {
          id: errorId,
          message: error.message || error,
          timestamp: new Date(),
          type: error.type || 'error'
        };
        
        set({ errors: [...errors, errorObj] });
        
        // Auto-remove error after 5 seconds
        setTimeout(() => {
          get().removeError(errorId);
        }, 5000);
      },
      
      removeError: (errorId) => {
        const { errors } = get();
        set({ errors: errors.filter(error => error.id !== errorId) });
      },
      
      clearErrors: () => {
        set({ errors: [] });
      },
      
      updateNavigation: (path) => {
        const { navigationHistory, currentPath } = get();
        
        if (path !== currentPath) {
          const updatedHistory = [
            currentPath,
            ...navigationHistory.filter(p => p !== currentPath)
          ].slice(0, 10); // Keep last 10 paths
          
          set({
            currentPath: path,
            navigationHistory: updatedHistory
          });
        }
      },
      
      goBack: () => {
        const { navigationHistory } = get();
        if (navigationHistory.length > 0) {
          const previousPath = navigationHistory[0];
          const updatedHistory = navigationHistory.slice(1);
          
          set({
            currentPath: previousPath,
            navigationHistory: updatedHistory
          });
          
          return previousPath;
        }
        return null;
      },
      
      // Device capabilities
      getDeviceCapabilities: () => {
        const capabilities = {
          hasCamera: false,
          hasMicrophone: false,
          hasLocation: false,
          hasNotifications: false,
          hasVibration: false,
          isOnline: navigator.onLine,
          isMobile: window.innerWidth < 768,
          isTouch: 'ontouchstart' in window,
          supportsPWA: 'serviceWorker' in navigator,
          supportsWebRTC: 'RTCPeerConnection' in window
        };
        
        // Check for camera
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(() => { capabilities.hasCamera = true; })
            .catch(() => { capabilities.hasCamera = false; });
        }
        
        // Check for microphone
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => { capabilities.hasMicrophone = true; })
            .catch(() => { capabilities.hasMicrophone = false; });
        }
        
        // Check for location
        capabilities.hasLocation = 'geolocation' in navigator;
        
        // Check for notifications
        capabilities.hasNotifications = 'Notification' in window;
        
        // Check for vibration
        capabilities.hasVibration = 'vibrate' in navigator;
        
        return capabilities;
      },
      
      // Request permissions
      requestPermissions: async (permissions = []) => {
        const results = {};
        
        for (const permission of permissions) {
          try {
            switch (permission) {
              case 'camera':
                await navigator.mediaDevices.getUserMedia({ video: true });
                results.camera = 'granted';
                break;
                
              case 'microphone':
                await navigator.mediaDevices.getUserMedia({ audio: true });
                results.microphone = 'granted';
                break;
                
              case 'location':
                await new Promise((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                results.location = 'granted';
                break;
                
              case 'notifications':
                const notificationResult = await Notification.requestPermission();
                results.notifications = notificationResult;
                break;
                
              default:
                results[permission] = 'unsupported';
            }
          } catch (error) {
            results[permission] = 'denied';
          }
        }
        
        return results;
      },
      
      // Network status
      setOnlineStatus: (isOnline) => {
        set({ isOnline });
        
        if (isOnline) {
          toast.success('Back online');
        } else {
          toast.error('No internet connection');
        }
      },
      
      // Initialize app
      initializeApp: () => {
        // Set initial theme
        const { theme } = get();
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
        
        // Set initial language
        const { selectedLanguage } = get();
        const fontClass = `font-${selectedLanguage}`;
        document.documentElement.classList.add(fontClass);
        
        // Listen for online/offline events
        window.addEventListener('online', () => get().setOnlineStatus(true));
        window.addEventListener('offline', () => get().setOnlineStatus(false));
        
        // Set initial online status
        set({ isOnline: navigator.onLine });
        
        // Listen for visibility change
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            // App became visible, refresh data if needed
            // This can be implemented based on specific needs
          }
        });
        
        // Listen for resize events
        window.addEventListener('resize', () => {
          const isMobile = window.innerWidth < 768;
          if (isMobile) {
            get().closeSidebar();
          }
        });
      }
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        theme: state.theme,
        selectedLanguage: state.selectedLanguage,
        notificationsEnabled: state.notificationsEnabled,
        pushNotificationsEnabled: state.pushNotificationsEnabled,
        emailNotificationsEnabled: state.emailNotificationsEnabled,
        autoTranslateEnabled: state.autoTranslateEnabled,
        voiceChatEnabled: state.voiceChatEnabled,
        locationEnabled: state.locationEnabled,
        analyticsEnabled: state.analyticsEnabled,
        recentSearches: state.recentSearches,
        recentContacts: state.recentContacts
      })
    }
  )
);

export default useAppStore;
