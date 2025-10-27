// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// App Configuration
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Claire B2B',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  description: import.meta.env.VITE_APP_DESCRIPTION || 'Modern B2B Platform',
};

// Feature Flags
export const FEATURES = {
  voiceChat: import.meta.env.VITE_ENABLE_VOICE_CHAT === 'true',
  translation: import.meta.env.VITE_ENABLE_TRANSLATION === 'true',
  imageSearch: import.meta.env.VITE_ENABLE_IMAGE_SEARCH === 'true',
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
};

// Supported Languages
export const LANGUAGES = [
  { code: 'english', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hindi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'tamil', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'telugu', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kannada', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'malayalam', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'marathi', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gujarati', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'bengali', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'punjabi', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' }
];

// Textile Categories
export const CATEGORIES = [
  { id: 'shirts', name: 'Shirts', icon: '👔', description: 'Formal and casual shirts' },
  { id: 'pants', name: 'Pants', icon: '👖', description: 'Trousers and pants' },
  { id: 'sarees', name: 'Sarees', icon: '🥻', description: 'Traditional Indian sarees' },
  { id: 'kurtas', name: 'Kurtas', icon: '👘', description: 'Traditional kurtas and kurtis' },
  { id: 'dresses', name: 'Dresses', icon: '👗', description: 'Western dresses' },
  { id: 'blouses', name: 'Blouses', icon: '👚', description: 'Blouses and tops' },
  { id: 'lehengas', name: 'Lehengas', icon: '👸', description: 'Traditional lehengas' },
  { id: 'suits', name: 'Suits', icon: '🤵', description: 'Formal suits and blazers' },
  { id: 'jackets', name: 'Jackets', icon: '🧥', description: 'Jackets and coats' },
  { id: 'jeans', name: 'Jeans', icon: '👖', description: 'Denim and jeans' },
  { id: 'ethnic_wear', name: 'Ethnic Wear', icon: '🪔', description: 'Traditional ethnic clothing' },
  { id: 'western_wear', name: 'Western Wear', icon: '🕺', description: 'Western style clothing' },
  { id: 'kids_clothing', name: 'Kids Clothing', icon: '👶', description: 'Children\'s clothing' },
  { id: 'fabrics', name: 'Fabrics', icon: '🧵', description: 'Raw fabrics and materials' },
  { id: 'accessories', name: 'Accessories', icon: '👜', description: 'Fashion accessories' },
  { id: 'footwear', name: 'Footwear', icon: '👟', description: 'Shoes and sandals' }
];

// Indian States and Cities
export const STATES_AND_CITIES = {
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tirupur', 'Erode'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Shimoga', 'Tumkur'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Anand'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bharatpur'],
  'Punjab': ['Amritsar', 'Ludhiana', 'Patiala', 'Jalandhar', 'Bathinda', 'Mohali', 'Firozpur', 'Hoshiarpur'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Sonipat'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Allahabad', 'Bareilly'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Ratlam', 'Dewas'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Malda', 'Bardhaman', 'Kharagpur'],
  'Andhra Pradesh': ['Hyderabad', 'Vijayawada', 'Visakhapatnam', 'Guntur', 'Nellore', 'Kurnool', 'Kadapa', 'Tirupati'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Mahbubnagar', 'Adilabad', 'Suryapet'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kannur'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Berhampur', 'Sambalpur', 'Rourkela', 'Balasore', 'Puri', 'Jharsuguda']
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    GOOGLE: '/auth/google',
    ONBOARDING: '/auth/onboarding',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    PASSWORD: '/auth/password',
    REFRESH: '/auth/refresh',
    STATUS: '/auth/status',
    ACCOUNT: '/auth/account'
  },
  
  // Users
  USERS: {
    SEARCH: '/users/search',
    PROFILE: (id) => `/users/${id}`,
    FRIEND_REQUEST: (id) => `/users/${id}/friend-request`,
    FRIEND_REQUESTS: '/users/friend-requests',
    FRIEND_REQUEST_RESPOND: (id) => `/users/friend-requests/${id}`,
    REMOVE_FRIEND: (id) => `/users/${id}/friend`,
    FRIENDS: (id) => `/users/${id}/friends`,
    SUGGESTIONS: '/users/suggestions'
  },
  
  // Communities
  COMMUNITIES: {
    LIST: '/communities',
    CREATE: '/communities',
    DETAIL: (id) => `/communities/${id}`,
    JOIN: (id) => `/communities/${id}/join`,
    LEAVE: (id) => `/communities/${id}/leave`,
    POSTS: (id) => `/communities/${id}/posts`,
    INVITE_CODE: (id) => `/communities/${id}/invite-code`,
    INVITE_LINK: (id) => `/communities/${id}/invite-link`,
    UPDATE: (id) => `/communities/${id}`,
    MANAGE_MEMBER: (id, memberId) => `/communities/${id}/members/${memberId}`,
    ADD_ADMIN: (id) => `/communities/${id}/admins`,
    MY: '/communities/my'
  },
  
  // Posts
  POSTS: {
    FEED: '/posts/feed',
    CREATE: '/posts',
    DETAIL: (id) => `/posts/${id}`,
    LIKE: (id) => `/posts/${id}/like`,
    COMMENT: (id) => `/posts/${id}/comments`,
    REPLY: (id, commentId) => `/posts/${id}/comments/${commentId}/replies`,
    SHARE: (id) => `/posts/${id}/share`,
    REPORT: (id) => `/posts/${id}/report`,
    SEARCH: '/posts/search',
    USER_POSTS: (id) => `/posts/user/${id}`,
    UPDATE: (id) => `/posts/${id}`,
    DELETE: (id) => `/posts/${id}`
  },
  
  // Chat
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    MESSAGES: (id) => `/chat/conversations/${id}/messages`,
    SEND_MESSAGE: (id) => `/chat/conversations/${id}/messages`,
    REACT: (id) => `/chat/messages/${id}/react`,
    EDIT: (id) => `/chat/messages/${id}`,
    SETTINGS: (id) => `/chat/conversations/${id}/settings`,
    TYPING: (id) => `/chat/conversations/${id}/typing`,
    DELETE: (id) => `/chat/conversations/${id}`,
    SEARCH: '/chat/search'
  },
  
  // Ads
  ADS: {
    LIST: '/ads',
    CREATE: '/ads',
    MY: '/ads/my',
    DETAIL: (id) => `/ads/${id}`,
    UPDATE: (id) => `/ads/${id}`,
    TOGGLE: (id) => `/ads/${id}/toggle`,
    CLICK: (id) => `/ads/${id}/click`,
    LIKE: (id) => `/ads/${id}/like`,
    SHARE: (id) => `/ads/${id}/share`,
    ANALYTICS: (id) => `/ads/${id}/analytics`,
    ADMIN_PENDING: '/ads/admin/pending',
    ADMIN_REVIEW: (id) => `/ads/${id}/review`,
    ADMIN_FEATURE: (id) => `/ads/${id}/feature`
  },
  
  // Search
  SEARCH: {
    GLOBAL: '/search',
    IMAGES: '/search/images',
    SUGGESTIONS: '/search/suggestions',
    POPULAR: '/search/popular',
    TRENDING: '/search/trending'
  },
  
  // Translation
  TRANSLATION: {
    TRANSLATE: '/translation/translate',
    DETECT: '/translation/detect',
    LANGUAGES: '/translation/languages',
    MESSAGE: (id) => `/translation/message/${id}`,
    BULK: '/translation/bulk'
  },
  
  // Speech
  SPEECH: {
    TRANSCRIBE: '/speech/transcribe',
    SYNTHESIZE: '/speech/synthesize',
    VOICE_MESSAGE: '/speech/voice-message',
    VOICES: '/speech/voices',
    ANALYTICS: '/speech/analytics'
  }
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  LANGUAGE: 'selected_language',
  THEME: 'theme',
  RECENT_SEARCHES: 'recent_searches',
  DRAFT_POST: 'draft_post',
  VOICE_SETTINGS: 'voice_settings',
  NOTIFICATION_SETTINGS: 'notification_settings'
};

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Authentication
  AUTHENTICATE: 'authenticate',
  
  // Conversations
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
  NEW_MESSAGE: 'new_message',
  MESSAGE_REACTION: 'message_reaction',
  MESSAGE_EDITED: 'message_edited',
  
  // Typing
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_TYPING: 'user_typing',
  
  // Voice Chat
  VOICE_CALL_REQUEST: 'voice_call_request',
  VOICE_CALL_ACCEPT: 'voice_call_accept',
  VOICE_CALL_DECLINE: 'voice_call_decline',
  VOICE_CALL_END: 'voice_call_end',
  VOICE_CALL_INCOMING: 'voice_call_incoming',
  VOICE_CALL_SENT: 'voice_call_sent',
  VOICE_CALL_ACCEPTED: 'voice_call_accepted',
  VOICE_CALL_DECLINED: 'voice_call_declined',
  VOICE_CALL_ENDED: 'voice_call_ended',
  VOICE_CALL_FAILED: 'voice_call_failed',
  
  // WebRTC
  WEBRTC_OFFER: 'webrtc_offer',
  WEBRTC_ANSWER: 'webrtc_answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc_ice_candidate',
  
  // User Status
  UPDATE_STATUS: 'update_status',
  FRIEND_STATUS_CHANGED: 'friend_status_changed',
  
  // Communities
  JOIN_COMMUNITY: 'join_community',
  LEAVE_COMMUNITY: 'leave_community',
  POST_LIKE: 'post_like',
  POST_COMMENT: 'post_comment',
  POST_LIKED: 'post_liked',
  POST_COMMENTED: 'post_commented',
  
  // Notifications
  MARK_NOTIFICATIONS_READ: 'mark_notifications_read',
  NOTIFICATIONS_MARKED_READ: 'notifications_marked_read'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size is too large. Please choose a smaller file.',
  UNSUPPORTED_FILE: 'Unsupported file type.',
  VOICE_PERMISSION: 'Microphone permission is required for voice features.',
  CAMERA_PERMISSION: 'Camera permission is required for video features.',
  LOCATION_PERMISSION: 'Location permission is required for location features.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  POST_CREATED: 'Post created successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
  FRIEND_REQUEST_SENT: 'Friend request sent!',
  COMMUNITY_JOINED: 'Joined community successfully!',
  AD_CREATED: 'Advertisement created successfully!'
};

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 50
  },
  POST_CONTENT: {
    MAX_LENGTH: 2000
  },
  COMMENT_CONTENT: {
    MAX_LENGTH: 1000
  },
  MESSAGE_CONTENT: {
    MAX_LENGTH: 10000
  },
  BUSINESS_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100
  },
  PHONE: {
    PATTERN: /^[+]?[\d\s-()]+$/
  }
};

// File Upload Limits
export const FILE_LIMITS = {
  IMAGE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  AUDIO: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_TYPES: ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg']
  },
  VIDEO: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    ACCEPTED_TYPES: ['video/mp4', 'video/webm', 'video/quicktime']
  }
};

// Default Values
export const DEFAULTS = {
  PAGINATION_LIMIT: 20,
  SEARCH_DEBOUNCE_MS: 300,
  TYPING_TIMEOUT_MS: 3000,
  MESSAGE_MAX_LENGTH: 10000,
  PROFILE_PICTURE_SIZE: 200,
  COVER_IMAGE_SIZE: 800
};

export default {
  API_BASE_URL,
  SOCKET_URL,
  APP_CONFIG,
  FEATURES,
  LANGUAGES,
  CATEGORIES,
  STATES_AND_CITIES,
  API_ENDPOINTS,
  STORAGE_KEYS,
  SOCKET_EVENTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES,
  FILE_LIMITS,
  DEFAULTS
};
