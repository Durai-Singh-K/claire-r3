import api from './api';

const reviewService = {
  // Create a review
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Get reviews for a user
  getReviews: async (userId, params = {}) => {
    const { page = 1, limit = 10, minRating = 1, sort = '-createdAt' } = params;
    const response = await api.get(`/reviews/${userId}`, {
      params: { page, limit, minRating, sort }
    });
    return response.data;
  },

  // Get review statistics
  getReviewStats: async (userId) => {
    const response = await api.get(`/reviews/stats/${userId}`);
    return response.data;
  },

  // Update a review
  updateReview: async (reviewId, updates) => {
    const response = await api.put(`/reviews/${reviewId}`, updates);
    return response.data;
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  // Add business response to review
  addResponse: async (reviewId, response) => {
    const res = await api.post(`/reviews/${reviewId}/response`, { response });
    return res.data;
  },

  // Mark review as helpful
  markHelpful: async (reviewId) => {
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  },

  // Flag a review
  flagReview: async (reviewId, reason) => {
    const response = await api.post(`/reviews/${reviewId}/flag`, { reason });
    return response.data;
  },

  // Get user's own reviews
  getMyReviews: async (page = 1, limit = 10) => {
    const response = await api.get('/reviews/my/reviews', {
      params: { page, limit }
    });
    return response.data;
  }
};

export default reviewService;
