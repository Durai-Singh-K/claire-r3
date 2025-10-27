import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';
import { handleApiError, isAuthError, requiresReload } from '../utils/errorHandler';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Use centralized error handler
    const parsedError = handleApiError(error);

    // Handle authentication errors
    if (isAuthError(error)) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);

      // Prevent redirect loop - don't redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle errors that require page reload
    if (requiresReload(error)) {
      // Show a more user-friendly message before reload
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }

    return Promise.reject(parsedError);
  }
);

// API Methods
export const apiService = {
  // Generic methods
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  
  // File upload helper
  uploadFile: (url, file, onProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      };
    }
    
    return api.post(url, formData, config);
  },
  
  // Multipart form data helper
  postForm: (url, formData, config = {}) => {
    return api.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

// Auth API
export const authAPI = {
  register: (data) => apiService.post('/auth/register', data),
  login: (data) => apiService.post('/auth/login', data),
  googleAuth: (idToken) => apiService.post('/auth/google', { idToken }),
  onboarding: (data) => apiService.post('/auth/onboarding', data),
  getProfile: () => apiService.get('/auth/me'),
  updateProfile: (data) => apiService.put('/auth/profile', data),
  changePassword: (data) => apiService.put('/auth/password', data),
  refreshToken: () => apiService.post('/auth/refresh'),
  updateStatus: (status) => apiService.put('/auth/status', { status }),
  deleteAccount: (data) => apiService.delete('/auth/account', { data })
};

// Users API
export const usersAPI = {
  search: (params) => apiService.get('/users/search', { params }),
  getProfile: (identifier) => apiService.get(`/users/${identifier}`),
  sendFriendRequest: (userId, data = {}) => apiService.post(`/users/${userId}/friend-request`, data),
  getFriendRequests: (type = 'received') => apiService.get('/users/friend-requests', { params: { type } }),
  respondToFriendRequest: (requestId, data) => apiService.put(`/users/friend-requests/${requestId}`, data),
  cancelFriendRequest: (requestId) => apiService.delete(`/users/friend-requests/${requestId}`),
  removeFriend: (userId) => apiService.delete(`/users/${userId}/friend`),
  getFriends: (userId, params = {}) => apiService.get(`/users/${userId}/friends`, { params }),
  getSuggestions: () => apiService.get('/users/suggestions')
};

// Communities API
export const communitiesAPI = {
  list: (params) => apiService.get('/communities', { params }),
  create: (data) => apiService.post('/communities', data),
  get: (id) => apiService.get(`/communities/${id}`),
  join: (id, data = {}) => apiService.post(`/communities/${id}/join`, data),
  leave: (id) => apiService.post(`/communities/${id}/leave`),
  getPosts: (id, params) => apiService.get(`/communities/${id}/posts`, { params }),
  generateInviteCode: (id) => apiService.post(`/communities/${id}/invite-code`),
  generateInviteLink: (id) => apiService.post(`/communities/${id}/invite-link`),
  update: (id, data) => apiService.put(`/communities/${id}`, data),
  manageMember: (id, memberId, data) => apiService.put(`/communities/${id}/members/${memberId}`, data),
  addAdmin: (id, data) => apiService.post(`/communities/${id}/admins`, data),
  getMyCommunities: () => apiService.get('/communities/my'),
  // Community Chat
  getMessages: (id, params) => apiService.get(`/community-chat/${id}/messages`, { params })
};

// Posts API
export const postsAPI = {
  getFeed: (params) => apiService.get('/posts/feed', { params }),
  getStats: () => apiService.get('/posts/stats'),
  create: (data) => apiService.post('/posts', data),
  get: (id) => apiService.get(`/posts/${id}`),
  like: (id) => apiService.put(`/posts/${id}/like`),
  addComment: (id, data) => apiService.post(`/posts/${id}/comments`, data),
  replyToComment: (id, commentId, data) => apiService.post(`/posts/${id}/comments/${commentId}/replies`, data),
  share: (id) => apiService.post(`/posts/${id}/share`),
  report: (id, data) => apiService.post(`/posts/${id}/report`, data),
  search: (params) => apiService.get('/posts/search', { params }),
  getUserPosts: (userId, params) => apiService.get(`/posts/user/${userId}`, { params }),
  update: (id, data) => apiService.put(`/posts/${id}`, data),
  delete: (id) => apiService.delete(`/posts/${id}`)
};

// Chat API
export const chatAPI = {
  getConversations: (params) => apiService.get('/chat/conversations', { params }),
  createConversation: (data) => apiService.post('/chat/conversations', data),
  getMessages: (id, params) => apiService.get(`/chat/conversations/${id}/messages`, { params }),
  sendMessage: (id, data) => apiService.post(`/chat/conversations/${id}/messages`, data),
  reactToMessage: (id, data) => apiService.put(`/chat/messages/${id}/react`, data),
  removeReaction: (id) => apiService.delete(`/chat/messages/${id}/react`),
  editMessage: (id, data) => apiService.put(`/chat/messages/${id}`, data),
  updateSettings: (id, data) => apiService.put(`/chat/conversations/${id}/settings`, data),
  setTyping: (id, isTyping) => apiService.put(`/chat/conversations/${id}/typing`, { isTyping }),
  deleteConversation: (id) => apiService.delete(`/chat/conversations/${id}`),
  searchMessages: (params) => apiService.get('/chat/search', { params })
};

// Ads API
export const adsAPI = {
  list: (params) => apiService.get('/ads', { params }),
  create: (data) => apiService.post('/ads', data),
  getMyAds: (params) => apiService.get('/ads/my', { params }),
  get: (id) => apiService.get(`/ads/${id}`),
  update: (id, data) => apiService.put(`/ads/${id}`, data),
  toggle: (id) => apiService.put(`/ads/${id}/toggle`),
  click: (id, data = {}) => apiService.post(`/ads/${id}/click`, data),
  like: (id) => apiService.put(`/ads/${id}/like`),
  share: (id) => apiService.post(`/ads/${id}/share`),
  getAnalytics: (id, params) => apiService.get(`/ads/${id}/analytics`, { params }),
  // Admin
  getPendingAds: (params) => apiService.get('/ads/admin/pending', { params }),
  reviewAd: (id, data) => apiService.put(`/ads/${id}/review`, data),
  featureAd: (id, data) => apiService.put(`/ads/${id}/feature`, data)
};

// Business API
export const businessAPI = {
  getProfile: () => apiService.get('/users/business-profile'),
  updateProfile: (data) => apiService.put('/users/business-profile', data),
  getAnalytics: (params) => apiService.get('/users/business-analytics', { params }),
  uploadLogo: (file) => apiService.uploadFile('/users/business-logo', file),
  uploadCover: (file) => apiService.uploadFile('/users/business-cover', file),
  verifyBusiness: (data) => apiService.post('/users/verify-business', data),
  getReviews: (params) => apiService.get('/users/business-reviews', { params }),
  addReview: (userId, data) => apiService.post(`/users/${userId}/reviews`, data)
};

// Products API
export const productsAPI = {
  list: (params) => apiService.get('/products', { params }),
  create: (data) => apiService.post('/products', data),
  get: (id) => apiService.get(`/products/${id}`),
  update: (id, data) => apiService.put(`/products/${id}`, data),
  delete: (id) => apiService.delete(`/products/${id}`),
  getMyProducts: (params) => apiService.get('/products/my', { params }),
  uploadImages: (id, files) => {
    const formData = new FormData();
    // Support both array of files and FileList
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    fileArray.forEach(file => formData.append('images', file));
    return apiService.postForm(`/products/${id}/images`, formData);
  },
  uploadImagesBase64: async (id, files) => {
    // Convert files to Base64
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    const base64Images = await Promise.all(
      fileArray.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              url: reader.result, // Base64 data URL
              alt: file.name
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );

    return apiService.post(`/products/${id}/images/base64`, { images: base64Images });
  },
  deleteImage: (id, imageId) => apiService.delete(`/products/${id}/images/${imageId}`),
  like: (id) => apiService.put(`/products/${id}/like`),
  inquiry: (id, data) => apiService.post(`/products/${id}/inquiry`, data),
  search: (params) => apiService.get('/products/search', { params }),
  getCategories: () => apiService.get('/products/categories'),
  getBulkPricing: (id, quantity) => apiService.get(`/products/${id}/bulk-pricing`, { params: { quantity } })
};

// Search API
export const searchAPI = {
  global: (params) => apiService.get('/search', { params }),
  images: (params) => apiService.get('/search/images', { params }),
  suggestions: (params) => apiService.get('/search/suggestions', { params }),
  popular: () => apiService.get('/search/popular'),
  trending: (params) => apiService.get('/search/trending', { params })
};

// Translation API
export const translationAPI = {
  translate: (data) => apiService.post('/translation/translate', data),
  detect: (data) => apiService.post('/translation/detect', data),
  getLanguages: () => apiService.get('/translation/languages'),
  translateMessage: (messageId, data) => apiService.post(`/translation/message/${messageId}`, data),
  bulkTranslate: (data) => apiService.post('/translation/bulk', data)
};

// Speech API
export const speechAPI = {
  transcribe: (file, data = {}) => {
    const formData = new FormData();
    formData.append('audio', file);
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    return apiService.postForm('/speech/transcribe', formData);
  },
  synthesize: (data) => apiService.post('/speech/synthesize', data),
  sendVoiceMessage: (file, data) => {
    const formData = new FormData();
    formData.append('audio', file);
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    return apiService.postForm('/speech/voice-message', formData);
  },
  getVoices: (params) => apiService.get('/speech/voices', { params }),
  getAnalytics: (params) => apiService.get('/speech/analytics', { params })
};

// Helper function to handle API responses
export const handleAPIResponse = async (apiCall, successMessage = null) => {
  try {
    const response = await apiCall();
    if (successMessage) {
      const toast = (await import('react-hot-toast')).default;
      toast.success(successMessage);
    }
    return { success: true, data: response.data };
  } catch (error) {
    // Error is already handled and displayed by the interceptor
    console.error('API Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred',
      status: error.status || 500,
      errorCode: error.errorCode,
      details: error.details,
      errors: error.errors // Validation errors
    };
  }
};

// Helper function to handle file uploads with progress
export const uploadWithProgress = (url, file, onProgress = null) => {
  return new Promise((resolve, reject) => {
    apiService.uploadFile(url, file, onProgress)
      .then(response => resolve({ success: true, data: response.data }))
      .catch(error => {
        // Error is already handled by the interceptor
        reject({
          success: false,
          error: error.message || 'Upload failed',
          status: error.status,
          errorCode: error.errorCode
        });
      });
  });
};

export default api;
