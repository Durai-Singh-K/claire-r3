import api from './api';

const userService = {
  // Get business profile
  getBusinessProfile: async () => {
    const response = await api.get('/users/business-profile');
    return response.data;
  },

  // Get business analytics
  getBusinessAnalytics: async () => {
    const response = await api.get('/users/business-analytics');
    return response.data;
  },

  // Get detailed analytics
  getAnalytics: async () => {
    const response = await api.get('/users/analytics');
    return response.data;
  },

  // Update business information
  updateBusinessInfo: async (data) => {
    const response = await api.put('/users/business-info', data);
    return response.data;
  },

  // Update financial information
  updateFinancialInfo: async (data) => {
    const response = await api.put('/users/financial-info', data);
    return response.data;
  },

  // Update business hours
  updateBusinessHours: async (businessHours, timezone) => {
    const response = await api.put('/users/business-hours', { businessHours, timezone });
    return response.data;
  },

  // Update social media links
  updateSocialMedia: async (socialMedia) => {
    const response = await api.put('/users/social-media', { socialMedia });
    return response.data;
  },

  // Add certification
  addCertification: async (certificationData) => {
    const response = await api.post('/users/certifications', certificationData);
    return response.data;
  },

  // Delete certification
  deleteCertification: async (certId) => {
    const response = await api.delete(`/users/certifications/${certId}`);
    return response.data;
  },

  // Add award
  addAward: async (awardData) => {
    const response = await api.post('/users/awards', awardData);
    return response.data;
  },

  // Delete award
  deleteAward: async (awardId) => {
    const response = await api.delete(`/users/awards/${awardId}`);
    return response.data;
  },

  // Toggle vacation mode
  setVacationMode: async (enabled, from = null, to = null, message = '') => {
    const response = await api.put('/users/vacation-mode', { enabled, from, to, message });
    return response.data;
  },

  // Send email verification
  sendEmailVerification: async () => {
    const response = await api.post('/users/verify-email/send');
    return response.data;
  },

  // Verify email with token
  verifyEmail: async (token) => {
    const response = await api.post('/users/verify-email', { token });
    return response.data;
  },

  // Send phone verification code
  sendPhoneVerification: async (phone) => {
    const response = await api.post('/users/verify-phone/send', { phone });
    return response.data;
  },

  // Verify phone with code
  verifyPhone: async (code) => {
    const response = await api.post('/users/verify-phone', { code });
    return response.data;
  },

  // Submit verification document
  submitDocument: async (type, url) => {
    const response = await api.post('/users/documents', { type, url });
    return response.data;
  },

  // Get verification status
  getVerificationStatus: async () => {
    const response = await api.get('/users/verification-status');
    return response.data;
  },

  // Increment analytics counter
  incrementAnalytics: async (metric) => {
    const response = await api.post('/users/analytics/increment', { metric });
    return response.data;
  },

  // Update return policy
  updateReturnPolicy: async (returnPolicy) => {
    const response = await api.put('/users/return-policy', { returnPolicy });
    return response.data;
  },

  // Get user by ID or username
  getUserProfile: async (identifier) => {
    const response = await api.get(`/users/${identifier}`);
    return response.data;
  },

  // Search users
  searchUsers: async (params) => {
    const response = await api.get('/users/search', { params });
    return response.data;
  },

  // Get friend suggestions
  getSuggestions: async () => {
    const response = await api.get('/users/suggestions');
    return response.data;
  },

  // Send friend request
  sendFriendRequest: async (userId, message) => {
    const response = await api.post(`/users/${userId}/friend-request`, { message });
    return response.data;
  },

  // Get friend requests
  getFriendRequests: async (type = 'received') => {
    const response = await api.get('/users/friend-requests', { params: { type } });
    return response.data;
  },

  // Respond to friend request
  respondToFriendRequest: async (requestId, action, message = '') => {
    const response = await api.put(`/users/friend-requests/${requestId}`, { action, message });
    return response.data;
  },

  // Cancel friend request
  cancelFriendRequest: async (requestId) => {
    const response = await api.delete(`/users/friend-requests/${requestId}`);
    return response.data;
  },

  // Remove friend
  removeFriend: async (userId) => {
    const response = await api.delete(`/users/${userId}/friend`);
    return response.data;
  },

  // Get user's friends
  getFriends: async (userId, page = 1, limit = 20) => {
    const response = await api.get(`/users/${userId}/friends`, {
      params: { page, limit }
    });
    return response.data;
  }
};

export default userService;
