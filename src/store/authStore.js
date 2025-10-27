import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../config/constants';
import { authAPI } from '../services/api';
import { signInWithGoogle, signOutUser, onAuthStateChange } from '../config/firebase';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import userService from '../services/userService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      requiresOnboarding: false,
      error: null,

      // Actions
      initAuth: () => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        
        if (token && userData) {
          try {
            const user = JSON.parse(userData);
            set({
              token,
              user,
              isAuthenticated: true,
              requiresOnboarding: !user.onboardingCompleted,
              isLoading: false
            });
            
            // Connect to socket
            socketService.connect();
          } catch (error) {
            console.error('Failed to parse user data:', error);
            get().clearAuth();
          }
        } else {
          set({ isLoading: false });
        }

        // Listen for Firebase auth state changes
        onAuthStateChange((firebaseUser) => {
          if (!firebaseUser && get().isAuthenticated) {
            // Firebase user signed out but we still have local auth
            // This might happen if user signs out from another tab
            get().logout();
          }
        });
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.login(credentials);
          const { token, user, requiresOnboarding } = response.data;
          
          // Store in localStorage
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
          
          set({
            token,
            user,
            isAuthenticated: true,
            requiresOnboarding,
            isLoading: false,
            error: null
          });
          
          // Connect to socket
          socketService.connect();
          
          toast.success(`Welcome back, ${user.displayName}!`);
          return { success: true };
          
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Login failed' 
          });
          return { success: false, error: error.message };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.register(userData);
          const { token, user, requiresOnboarding } = response.data;
          
          // Store in localStorage
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
          
          set({
            token,
            user,
            isAuthenticated: true,
            requiresOnboarding,
            isLoading: false,
            error: null
          });
          
          // Connect to socket
          socketService.connect();
          
          toast.success(`Welcome to WholeSale Connect, ${user.displayName}!`);
          return { success: true };
          
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Registration failed' 
          });
          return { success: false, error: error.message };
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const googleResult = await signInWithGoogle();
          
          if (!googleResult.success) {
            throw new Error(googleResult.error);
          }
          
          const response = await authAPI.googleAuth(googleResult.token);
          const { token, user, requiresOnboarding, isNewUser } = response.data;
          
          // Store in localStorage
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
          
          set({
            token,
            user,
            isAuthenticated: true,
            requiresOnboarding,
            isLoading: false,
            error: null
          });
          
          // Connect to socket
          socketService.connect();
          
          if (isNewUser) {
            toast.success(`Welcome to WholeSale Connect, ${user.displayName}!`);
          } else {
            toast.success(`Welcome back, ${user.displayName}!`);
          }
          
          return { success: true, isNewUser, requiresOnboarding };
          
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Google sign-in failed' 
          });
          return { success: false, error: error.message };
        }
      },

      completeOnboarding: async (onboardingData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.onboarding(onboardingData);
          const { user } = response.data;
          
          // Update localStorage
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
          
          set({
            user,
            requiresOnboarding: false,
            isLoading: false,
            error: null
          });
          
          toast.success('Profile setup completed!');
          return { success: true };
          
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Onboarding failed' 
          });
          return { success: false, error: error.message };
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.updateProfile(profileData);
          const { user } = response.data;
          
          // Update localStorage
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
          
          set({
            user,
            isLoading: false,
            error: null
          });
          
          toast.success('Profile updated successfully!');
          return { success: true };
          
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Profile update failed' 
          });
          return { success: false, error: error.message };
        }
      },

      changePassword: async (passwordData) => {
        set({ isLoading: true, error: null });
        
        try {
          await authAPI.changePassword(passwordData);
          
          set({
            isLoading: false,
            error: null
          });
          
          toast.success('Password changed successfully!');
          return { success: true };
          
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Password change failed' 
          });
          return { success: false, error: error.message };
        }
      },

      updateUserStatus: async (status) => {
        try {
          await authAPI.updateStatus(status);
          
          const updatedUser = { ...get().user, onlineStatus: status };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          
          set({ user: updatedUser });
          
          // Update socket status
          socketService.updateStatus(status);
          
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      refreshProfile: async () => {
        try {
          const response = await authAPI.getProfile();
          const { user } = response.data;
          
          // Update localStorage
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
          
          set({ user });
          return { success: true };
        } catch (error) {
          console.error('Failed to refresh profile:', error);
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          // Sign out from Firebase if using Google auth
          if (get().user?.authProvider === 'google') {
            await signOutUser();
          }
          
          // Disconnect socket
          socketService.disconnect();
          
          // Clear local storage
          get().clearAuth();
          
          toast.success('Logged out successfully');
        } catch (error) {
          console.error('Logout error:', error);
          // Still clear local auth even if Firebase logout fails
          get().clearAuth();
        }
      },

      clearAuth: () => {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          requiresOnboarding: false,
          isLoading: false,
          error: null
        });
        
        // Disconnect socket
        socketService.disconnect();
      },

      clearError: () => {
        set({ error: null });
      },

      // ============ NEW ENHANCED METHODS ============

      // Update business information
      updateBusinessInfo: async (businessData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userService.updateBusinessInfo(businessData);
          const updatedUser = { ...get().user, ...businessData };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
          toast.success('Business information updated!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Update failed');
          return { success: false, error: error.message };
        }
      },

      // Update financial information
      updateFinancialInfo: async (financialData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userService.updateFinancialInfo(financialData);
          const updatedUser = { ...get().user, ...financialData };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
          toast.success('Financial information updated!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Update failed');
          return { success: false, error: error.message };
        }
      },

      // Update business hours
      updateBusinessHours: async (businessHours, timezone) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userService.updateBusinessHours(businessHours, timezone);
          const updatedUser = { ...get().user, businessHours, timezone };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
          toast.success('Business hours updated!');
          return { success: true, data: response };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Update failed');
          return { success: false, error: error.message };
        }
      },

      // Update social media links
      updateSocialMedia: async (socialMedia) => {
        set({ isLoading: true, error: null });
        try {
          await userService.updateSocialMedia(socialMedia);
          const updatedUser = { ...get().user, socialMedia };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
          toast.success('Social media links updated!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Update failed');
          return { success: false, error: error.message };
        }
      },

      // Add certification
      addCertification: async (certificationData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userService.addCertification(certificationData);
          const updatedUser = {
            ...get().user,
            certifications: [...(get().user.certifications || []), response.certification]
          };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
          toast.success('Certification added!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Failed to add certification');
          return { success: false, error: error.message };
        }
      },

      // Delete certification
      deleteCertification: async (certId) => {
        set({ isLoading: true, error: null });
        try {
          await userService.deleteCertification(certId);
          const updatedUser = {
            ...get().user,
            certifications: get().user.certifications.filter(c => c._id !== certId)
          };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
          toast.success('Certification removed!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Failed to delete certification');
          return { success: false, error: error.message };
        }
      },

      // Add award
      addAward: async (awardData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userService.addAward(awardData);
          const updatedUser = {
            ...get().user,
            awards: [...(get().user.awards || []), response.award]
          };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
          toast.success('Award added!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Failed to add award');
          return { success: false, error: error.message };
        }
      },

      // Delete award
      deleteAward: async (awardId) => {
        set({ isLoading: true, error: null });
        try {
          await userService.deleteAward(awardId);
          const updatedUser = {
            ...get().user,
            awards: get().user.awards.filter(a => a._id !== awardId)
          };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
          toast.success('Award removed!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Failed to delete award');
          return { success: false, error: error.message };
        }
      },

      // Enable vacation mode
      enableVacationMode: async (from, to, message) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userService.setVacationMode(true, from, to, message);
          const updatedUser = { ...get().user, vacationMode: response.vacationMode };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
          toast.success('Vacation mode enabled!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Failed to enable vacation mode');
          return { success: false, error: error.message };
        }
      },

      // Disable vacation mode
      disableVacationMode: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await userService.setVacationMode(false);
          const updatedUser = { ...get().user, vacationMode: response.vacationMode };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
          toast.success('Vacation mode disabled!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Failed to disable vacation mode');
          return { success: false, error: error.message };
        }
      },

      // Send email verification
      sendEmailVerification: async () => {
        set({ isLoading: true, error: null });
        try {
          await userService.sendEmailVerification();
          set({ isLoading: false });
          toast.success('Verification email sent! Please check your inbox.');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Failed to send verification email');
          return { success: false, error: error.message };
        }
      },

      // Verify email
      verifyEmail: async (token) => {
        set({ isLoading: true, error: null });
        try {
          await userService.verifyEmail(token);
          const updatedUser = { ...get().user, emailVerified: true };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
          toast.success('Email verified successfully!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Email verification failed');
          return { success: false, error: error.message };
        }
      },

      // Send phone verification
      sendPhoneVerification: async (phone) => {
        set({ isLoading: true, error: null });
        try {
          await userService.sendPhoneVerification(phone);
          set({ isLoading: false });
          toast.success('Verification code sent to your phone!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Failed to send verification code');
          return { success: false, error: error.message };
        }
      },

      // Verify phone
      verifyPhone: async (code) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userService.verifyPhone(code);
          const updatedUser = { ...get().user, phoneVerified: true };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
          toast.success('Phone verified successfully!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Phone verification failed');
          return { success: false, error: error.message };
        }
      },

      // Submit verification document
      submitVerificationDocument: async (type, url) => {
        set({ isLoading: true, error: null });
        try {
          await userService.submitDocument(type, url);
          set({ isLoading: false });
          toast.success('Document submitted for verification!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Failed to submit document');
          return { success: false, error: error.message };
        }
      },

      // Get verification status
      getVerificationStatus: async () => {
        try {
          const status = await userService.getVerificationStatus();
          return { success: true, data: status };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // Update return policy
      updateReturnPolicy: async (returnPolicy) => {
        set({ isLoading: true, error: null });
        try {
          await userService.updateReturnPolicy(returnPolicy);
          const updatedUser = { ...get().user, returnPolicy };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
          toast.success('Return policy updated!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Update failed');
          return { success: false, error: error.message };
        }
      },

      // Check if user can access feature based on subscription
      canAccessFeature: (feature) => {
        const user = get().user;
        if (!user) return false;

        const features = {
          free: ['basic_profile', 'basic_search', 'messages'],
          basic: ['basic_profile', 'basic_search', 'messages', 'analytics', 'products_50'],
          premium: ['basic_profile', 'basic_search', 'messages', 'analytics', 'products_unlimited', 'featured_listing', 'priority_support'],
          enterprise: ['all']
        };

        const tierFeatures = features[user.subscriptionTier] || features.free;
        return tierFeatures.includes('all') || tierFeatures.includes(feature);
      },

      // Check if subscription is active
      hasActiveSubscription: () => {
        const user = get().user;
        if (!user || user.subscriptionTier === 'free') return false;
        if (!user.subscriptionExpiry) return false;
        return new Date() < new Date(user.subscriptionExpiry);
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        requiresOnboarding: state.requiresOnboarding
      })
    }
  )
);

export default useAuthStore;
