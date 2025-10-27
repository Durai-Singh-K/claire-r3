import api from './api';

const subscriptionService = {
  // Get all available plans
  getPlans: async () => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },

  // Get current subscription
  getCurrentSubscription: async () => {
    const response = await api.get('/subscriptions/current');
    return response.data;
  },

  // Get subscription history
  getHistory: async () => {
    const response = await api.get('/subscriptions/history');
    return response.data;
  },

  // Upgrade/create subscription
  upgradePlan: async (tier, billingCycle = 'monthly', autoRenew = false) => {
    const response = await api.post('/subscriptions/upgrade', {
      tier,
      billingCycle,
      autoRenew
    });
    return response.data;
  },

  // Process payment
  processPayment: async (subscriptionId, paymentData) => {
    const response = await api.post('/subscriptions/payment', {
      subscriptionId,
      ...paymentData
    });
    return response.data;
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId, reason) => {
    const response = await api.delete(`/subscriptions/${subscriptionId}`, {
      data: { reason }
    });
    return response.data;
  },

  // Renew subscription
  renewSubscription: async (subscriptionId) => {
    const response = await api.post(`/subscriptions/${subscriptionId}/renew`);
    return response.data;
  },

  // Apply discount code
  applyDiscount: async (subscriptionId, discountCode) => {
    const response = await api.post('/subscriptions/apply-discount', {
      subscriptionId,
      discountCode
    });
    return response.data;
  },

  // Get invoice
  getInvoice: async (paymentId) => {
    const response = await api.get(`/subscriptions/invoice/${paymentId}`);
    return response.data;
  }
};

export default subscriptionService;
