import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import subscriptionService from '../services/subscriptionService';

const useSubscriptionStore = create(
  persist(
    (set, get) => ({
      // State
      plans: null,
      currentSubscription: null,
      history: [],
      isLoading: false,
      error: null,

      // Fetch all plans
      fetchPlans: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await subscriptionService.getPlans();
          set({ plans: data.plans, isLoading: false });
          return data.plans;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to fetch plans',
            isLoading: false
          });
          throw error;
        }
      },

      // Fetch current subscription
      fetchCurrentSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await subscriptionService.getCurrentSubscription();
          set({
            currentSubscription: data.subscription,
            isLoading: false
          });
          return data;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to fetch subscription',
            isLoading: false
          });
          throw error;
        }
      },

      // Fetch subscription history
      fetchHistory: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await subscriptionService.getHistory();
          set({ history: data.subscriptions, isLoading: false });
          return data.subscriptions;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to fetch history',
            isLoading: false
          });
          throw error;
        }
      },

      // Upgrade plan
      upgradePlan: async (tier, billingCycle, autoRenew) => {
        set({ isLoading: true, error: null });
        try {
          const data = await subscriptionService.upgradePlan(tier, billingCycle, autoRenew);
          set({
            currentSubscription: data.subscription,
            isLoading: false
          });
          return data;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to upgrade plan',
            isLoading: false
          });
          throw error;
        }
      },

      // Process payment
      processPayment: async (subscriptionId, paymentData) => {
        set({ isLoading: true, error: null });
        try {
          const data = await subscriptionService.processPayment(subscriptionId, paymentData);
          set({
            currentSubscription: data.subscription,
            isLoading: false
          });
          // Refresh current subscription after payment
          await get().fetchCurrentSubscription();
          return data;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Payment failed',
            isLoading: false
          });
          throw error;
        }
      },

      // Cancel subscription
      cancelSubscription: async (subscriptionId, reason) => {
        set({ isLoading: true, error: null });
        try {
          const data = await subscriptionService.cancelSubscription(subscriptionId, reason);
          set({ isLoading: false });
          // Refresh current subscription
          await get().fetchCurrentSubscription();
          return data;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to cancel subscription',
            isLoading: false
          });
          throw error;
        }
      },

      // Renew subscription
      renewSubscription: async (subscriptionId) => {
        set({ isLoading: true, error: null });
        try {
          const data = await subscriptionService.renewSubscription(subscriptionId);
          set({
            currentSubscription: data.subscription,
            isLoading: false
          });
          return data;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to renew subscription',
            isLoading: false
          });
          throw error;
        }
      },

      // Apply discount code
      applyDiscount: async (subscriptionId, discountCode) => {
        set({ isLoading: true, error: null });
        try {
          const data = await subscriptionService.applyDiscount(subscriptionId, discountCode);
          set({
            currentSubscription: data.subscription,
            isLoading: false
          });
          return data;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Invalid discount code',
            isLoading: false
          });
          throw error;
        }
      },

      // Get invoice
      getInvoice: async (paymentId) => {
        set({ isLoading: true, error: null });
        try {
          const data = await subscriptionService.getInvoice(paymentId);
          set({ isLoading: false });
          return data.invoice;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to fetch invoice',
            isLoading: false
          });
          throw error;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Reset store
      reset: () => set({
        plans: null,
        currentSubscription: null,
        history: [],
        isLoading: false,
        error: null
      })
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({
        plans: state.plans,
        currentSubscription: state.currentSubscription
      })
    }
  )
);

export default useSubscriptionStore;
