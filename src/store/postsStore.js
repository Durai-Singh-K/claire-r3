import { create } from 'zustand';
import { postsAPI, searchAPI } from '../services/api';
import socketService from '../services/socket';
import { SOCKET_EVENTS } from '../config/constants';
import toast from 'react-hot-toast';

const usePostsStore = create((set, get) => ({
  // State
  feed: [],
  userPosts: {},
  communityPosts: {},
  currentPost: null,
  isLoading: false,
  isLoadingMore: false,
  hasMorePosts: true,
  currentPage: 1,
  feedType: 'all', // 'all', 'community', 'friends', 'products'
  selectedFilters: {
    location: '',
    categories: [],
    sortBy: 'newest'
  },
  
  // Post creation state
  isCreatingPost: false,
  postDraft: {
    content: { text: '', type: 'text' },
    images: [],
    product: null,
    location: null,
    hashtags: [],
    community: null
  },
  
  // Search state
  searchResults: [],
  searchQuery: '',
  isSearching: false,
  searchFilters: {},
  
  error: null,

  // Initialize socket listeners
  initializeSocket: () => {
    socketService.on(SOCKET_EVENTS.POST_LIKED, get().handlePostLiked);
    socketService.on(SOCKET_EVENTS.POST_COMMENTED, get().handlePostCommented);
  },

  // Socket event handlers
  handlePostLiked: (data) => {
    const { postId, userId, user } = data;
    get().updatePostEngagement(postId, 'like', { userId, user });
  },

  handlePostCommented: (data) => {
    const { postId, userId, user, comment } = data;
    get().updatePostEngagement(postId, 'comment', { userId, user, comment });
  },

  updatePostEngagement: (postId, type, data) => {
    const { feed, userPosts, communityPosts } = get();
    
    // Update in feed
    const updatedFeed = feed.map(post => {
      if (post._id === postId) {
        if (type === 'like') {
          return { ...post, likeCount: post.likeCount + 1 };
        } else if (type === 'comment') {
          return { ...post, commentCount: post.commentCount + 1 };
        }
      }
      return post;
    });
    
    // Update in user posts
    Object.keys(userPosts).forEach(userId => {
      const posts = userPosts[userId];
      userPosts[userId] = posts.map(post => {
        if (post._id === postId) {
          if (type === 'like') {
            return { ...post, likeCount: post.likeCount + 1 };
          } else if (type === 'comment') {
            return { ...post, commentCount: post.commentCount + 1 };
          }
        }
        return post;
      });
    });
    
    // Update in community posts
    Object.keys(communityPosts).forEach(communityId => {
      const posts = communityPosts[communityId];
      communityPosts[communityId] = posts.map(post => {
        if (post._id === postId) {
          if (type === 'like') {
            return { ...post, likeCount: post.likeCount + 1 };
          } else if (type === 'comment') {
            return { ...post, commentCount: post.commentCount + 1 };
          }
        }
        return post;
      });
    });
    
    set({ feed: updatedFeed, userPosts, communityPosts });
  },

  // Feed actions
  loadFeed: async (refresh = false) => {
    const { feedType, selectedFilters, currentPage } = get();
    
    if (refresh) {
      set({ isLoading: true, currentPage: 1, hasMorePosts: true });
    } else {
      set({ isLoadingMore: true });
    }
    
    try {
      const params = {
        type: feedType,
        page: refresh ? 1 : currentPage,
        limit: 20,
        ...selectedFilters
      };
      
      const response = await postsAPI.getFeed(params);
      const { posts, pagination } = response.data;
      
      const currentFeed = refresh ? [] : get().feed;
      const updatedFeed = refresh ? posts : [...currentFeed, ...posts];
      
      set({
        feed: updatedFeed,
        isLoading: false,
        isLoadingMore: false,
        currentPage: pagination?.currentPage || 1,
        hasMorePosts: posts.length === 20,
        error: null
      });
      
      return { success: true };
    } catch (error) {
      set({ 
        isLoading: false, 
        isLoadingMore: false, 
        error: error.message 
      });
      return { success: false, error: error.message };
    }
  },

  loadMorePosts: () => {
    const { hasMorePosts, isLoadingMore } = get();
    if (hasMorePosts && !isLoadingMore) {
      set({ currentPage: get().currentPage + 1 });
      return get().loadFeed(false);
    }
  },

  setFeedType: (type) => {
    set({ feedType: type });
    return get().loadFeed(true);
  },

  setFilters: (filters) => {
    set({ selectedFilters: { ...get().selectedFilters, ...filters } });
    return get().loadFeed(true);
  },

  // Post actions
  createPost: async (postData) => {
    set({ isCreatingPost: true, error: null });
    
    try {
      const response = await postsAPI.create(postData);
      const { post } = response.data;
      
      // Add to beginning of feed
      const { feed } = get();
      set({
        feed: [post, ...feed],
        isCreatingPost: false,
        postDraft: {
          content: { text: '', type: 'text' },
          images: [],
          product: null,
          location: null,
          hashtags: [],
          community: null
        }
      });
      
      toast.success('Post created successfully!');
      return { success: true, post };
    } catch (error) {
      set({ isCreatingPost: false, error: error.message });
      toast.error('Failed to create post');
      return { success: false, error: error.message };
    }
  },

  updatePost: async (postId, updateData) => {
    try {
      const response = await postsAPI.update(postId, updateData);
      const { post } = response.data;
      
      // Update in all relevant arrays
      get().updatePostInArrays(postId, post);
      
      toast.success('Post updated successfully!');
      return { success: true, post };
    } catch (error) {
      toast.error('Failed to update post');
      return { success: false, error: error.message };
    }
  },

  deletePost: async (postId) => {
    try {
      await postsAPI.delete(postId);
      
      // Remove from all arrays
      get().removePostFromArrays(postId);
      
      toast.success('Post deleted successfully!');
      return { success: true };
    } catch (error) {
      toast.error('Failed to delete post');
      return { success: false, error: error.message };
    }
  },

  likePost: async (postId) => {
    try {
      const response = await postsAPI.like(postId);
      const { liked, likeCount } = response.data;
      
      // Update post optimistically
      get().updatePostInArrays(postId, { liked, likeCount });
      
      // Emit to socket for real-time updates
      const post = get().findPostById(postId);
      if (post?.community) {
        socketService.likePost(postId, post.community._id);
      }
      
      return { success: true, liked, likeCount };
    } catch (error) {
      toast.error('Failed to like post');
      return { success: false, error: error.message };
    }
  },

  addComment: async (postId, content) => {
    try {
      const response = await postsAPI.addComment(postId, { content });
      const { comment, commentCount } = response.data;
      
      // Update post comment count
      get().updatePostInArrays(postId, { commentCount });
      
      // Emit to socket for real-time updates
      const post = get().findPostById(postId);
      if (post?.community) {
        socketService.commentPost(postId, post.community._id, comment);
      }
      
      return { success: true, comment };
    } catch (error) {
      toast.error('Failed to add comment');
      return { success: false, error: error.message };
    }
  },

  sharePost: async (postId) => {
    try {
      const response = await postsAPI.share(postId);
      const { shareCount } = response.data;
      
      // Update post share count
      get().updatePostInArrays(postId, { shareCount });
      
      toast.success('Post shared successfully!');
      return { success: true, shareCount };
    } catch (error) {
      toast.error('Failed to share post');
      return { success: false, error: error.message };
    }
  },

  reportPost: async (postId, reason, description = '') => {
    try {
      await postsAPI.report(postId, { reason, description });
      toast.success('Post reported successfully');
      return { success: true };
    } catch (error) {
      toast.error('Failed to report post');
      return { success: false, error: error.message };
    }
  },

  // User posts
  loadUserPosts: async (userId, page = 1) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await postsAPI.getUserPosts(userId, { page, limit: 20 });
      const { posts } = response.data;
      
      const { userPosts } = get();
      const existingPosts = userPosts[userId] || [];
      const updatedPosts = page === 1 ? posts : [...existingPosts, ...posts];
      
      set({
        userPosts: {
          ...userPosts,
          [userId]: updatedPosts
        },
        isLoading: false
      });
      
      return { success: true };
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Search
  searchPosts: async (query, filters = {}) => {
    set({ isSearching: true, searchQuery: query, searchFilters: filters });
    
    try {
      const response = await postsAPI.search({ q: query, ...filters });
      const { posts } = response.data;
      
      set({
        searchResults: posts,
        isSearching: false
      });
      
      return { success: true, results: posts };
    } catch (error) {
      set({ isSearching: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Draft management
  updatePostDraft: (draftData) => {
    set({
      postDraft: { ...get().postDraft, ...draftData }
    });
    
    // Save to localStorage
    localStorage.setItem('post_draft', JSON.stringify(get().postDraft));
  },

  loadPostDraft: () => {
    try {
      const savedDraft = localStorage.getItem('post_draft');
      if (savedDraft) {
        set({ postDraft: JSON.parse(savedDraft) });
      }
    } catch (error) {
      console.error('Failed to load post draft:', error);
    }
  },

  clearPostDraft: () => {
    set({
      postDraft: {
        content: { text: '', type: 'text' },
        images: [],
        product: null,
        location: null,
        hashtags: [],
        community: null
      }
    });
    localStorage.removeItem('post_draft');
  },

  // Helper methods
  findPostById: (postId) => {
    const { feed, userPosts, communityPosts } = get();
    
    // Check in feed
    let post = feed.find(p => p._id === postId);
    if (post) return post;
    
    // Check in user posts
    Object.values(userPosts).forEach(posts => {
      const found = posts.find(p => p._id === postId);
      if (found) post = found;
    });
    
    // Check in community posts
    Object.values(communityPosts).forEach(posts => {
      const found = posts.find(p => p._id === postId);
      if (found) post = found;
    });
    
    return post;
  },

  updatePostInArrays: (postId, updates) => {
    const { feed, userPosts, communityPosts } = get();
    
    // Update in feed
    const updatedFeed = feed.map(post =>
      post._id === postId ? { ...post, ...updates } : post
    );
    
    // Update in user posts
    const updatedUserPosts = { ...userPosts };
    Object.keys(updatedUserPosts).forEach(userId => {
      updatedUserPosts[userId] = updatedUserPosts[userId].map(post =>
        post._id === postId ? { ...post, ...updates } : post
      );
    });
    
    // Update in community posts
    const updatedCommunityPosts = { ...communityPosts };
    Object.keys(updatedCommunityPosts).forEach(communityId => {
      updatedCommunityPosts[communityId] = updatedCommunityPosts[communityId].map(post =>
        post._id === postId ? { ...post, ...updates } : post
      );
    });
    
    set({
      feed: updatedFeed,
      userPosts: updatedUserPosts,
      communityPosts: updatedCommunityPosts
    });
  },

  removePostFromArrays: (postId) => {
    const { feed, userPosts, communityPosts } = get();
    
    // Remove from feed
    const updatedFeed = feed.filter(post => post._id !== postId);
    
    // Remove from user posts
    const updatedUserPosts = { ...userPosts };
    Object.keys(updatedUserPosts).forEach(userId => {
      updatedUserPosts[userId] = updatedUserPosts[userId].filter(post => 
        post._id !== postId
      );
    });
    
    // Remove from community posts
    const updatedCommunityPosts = { ...communityPosts };
    Object.keys(updatedCommunityPosts).forEach(communityId => {
      updatedCommunityPosts[communityId] = updatedCommunityPosts[communityId].filter(post => 
        post._id !== postId
      );
    });
    
    set({
      feed: updatedFeed,
      userPosts: updatedUserPosts,
      communityPosts: updatedCommunityPosts
    });
  },

  // Clear all data
  clearAllData: () => {
    set({
      feed: [],
      userPosts: {},
      communityPosts: {},
      currentPost: null,
      searchResults: [],
      searchQuery: '',
      currentPage: 1,
      hasMorePosts: true,
      error: null
    });
  },

  clearError: () => {
    set({ error: null });
  }
}));

export default usePostsStore;
