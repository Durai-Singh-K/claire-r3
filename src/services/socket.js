import { io } from 'socket.io-client';
import { SOCKET_URL, SOCKET_EVENTS, STORAGE_KEYS } from '../config/constants';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  // Initialize socket connection
  connect() {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    if (!token) {
      console.warn('No auth token found, skipping socket connection');
      return;
    }

    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
      forceNew: true
    });

    this.setupEventListeners();
  }

  // Setup socket event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Emit any queued events
      this.emit('user_connected', { timestamp: new Date() });
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Connection failed. Please refresh the page.');
      }
    });

    // Authentication error
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      
      if (error.message.includes('Authentication')) {
        // Auth failed, clear token and redirect
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        window.location.href = '/login';
      }
    });

    // Message events
    this.socket.on(SOCKET_EVENTS.NEW_MESSAGE, (data) => {
      this.notifyListeners(SOCKET_EVENTS.NEW_MESSAGE, data);
      
      // Show notification if not in the conversation
      if (document.hidden) {
        this.showNotification('New Message', {
          body: `${data.message.sender.displayName}: ${data.message.content.text || 'Voice message'}`,
          icon: data.message.sender.profilePicture
        });
      }
    });

    this.socket.on(SOCKET_EVENTS.MESSAGE_REACTION, (data) => {
      this.notifyListeners(SOCKET_EVENTS.MESSAGE_REACTION, data);
    });

    this.socket.on(SOCKET_EVENTS.MESSAGE_EDITED, (data) => {
      this.notifyListeners(SOCKET_EVENTS.MESSAGE_EDITED, data);
    });

    // Typing events
    this.socket.on(SOCKET_EVENTS.USER_TYPING, (data) => {
      this.notifyListeners(SOCKET_EVENTS.USER_TYPING, data);
    });

    // Voice call events
    this.socket.on(SOCKET_EVENTS.VOICE_CALL_INCOMING, (data) => {
      this.notifyListeners(SOCKET_EVENTS.VOICE_CALL_INCOMING, data);
      
      // Show browser notification
      this.showNotification('Incoming Voice Call', {
        body: `${data.from.displayName} is calling...`,
        icon: data.from.profilePicture,
        tag: 'voice-call',
        requireInteraction: true
      });
    });

    this.socket.on(SOCKET_EVENTS.VOICE_CALL_ACCEPTED, (data) => {
      this.notifyListeners(SOCKET_EVENTS.VOICE_CALL_ACCEPTED, data);
    });

    this.socket.on(SOCKET_EVENTS.VOICE_CALL_DECLINED, (data) => {
      this.notifyListeners(SOCKET_EVENTS.VOICE_CALL_DECLINED, data);
    });

    this.socket.on(SOCKET_EVENTS.VOICE_CALL_ENDED, (data) => {
      this.notifyListeners(SOCKET_EVENTS.VOICE_CALL_ENDED, data);
    });

    this.socket.on(SOCKET_EVENTS.VOICE_CALL_FAILED, (data) => {
      this.notifyListeners(SOCKET_EVENTS.VOICE_CALL_FAILED, data);
      toast.error(data.reason || 'Voice call failed');
    });

    // WebRTC signaling
    this.socket.on(SOCKET_EVENTS.WEBRTC_OFFER, (data) => {
      this.notifyListeners(SOCKET_EVENTS.WEBRTC_OFFER, data);
    });

    this.socket.on(SOCKET_EVENTS.WEBRTC_ANSWER, (data) => {
      this.notifyListeners(SOCKET_EVENTS.WEBRTC_ANSWER, data);
    });

    this.socket.on(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, (data) => {
      this.notifyListeners(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, data);
    });

    // Friend status events
    this.socket.on(SOCKET_EVENTS.FRIEND_STATUS_CHANGED, (data) => {
      this.notifyListeners(SOCKET_EVENTS.FRIEND_STATUS_CHANGED, data);
    });

    // Community events
    this.socket.on(SOCKET_EVENTS.POST_LIKED, (data) => {
      this.notifyListeners(SOCKET_EVENTS.POST_LIKED, data);
    });

    this.socket.on(SOCKET_EVENTS.POST_COMMENTED, (data) => {
      this.notifyListeners(SOCKET_EVENTS.POST_COMMENTED, data);
    });
  }

  // Emit an event to the server
  emit(event, data = {}) {
    if (!this.socket || !this.isConnected) {
      console.warn(`Cannot emit ${event}: socket not connected`);
      return false;
    }

    this.socket.emit(event, data);
    return true;
  }

  // Listen for events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  // Remove event listener
  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Notify all listeners of an event
  notifyListeners(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Chat-specific methods
  joinConversation(conversationId) {
    return this.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId });
  }

  leaveConversation(conversationId) {
    return this.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, { conversationId });
  }

  startTyping(conversationId) {
    return this.emit(SOCKET_EVENTS.TYPING_START, { conversationId });
  }

  stopTyping(conversationId) {
    return this.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId });
  }

  // Voice call methods
  requestVoiceCall(conversationId) {
    return this.emit(SOCKET_EVENTS.VOICE_CALL_REQUEST, { conversationId });
  }

  acceptVoiceCall(callId, conversationId) {
    return this.emit(SOCKET_EVENTS.VOICE_CALL_ACCEPT, { callId, conversationId });
  }

  declineVoiceCall(callId, conversationId) {
    return this.emit(SOCKET_EVENTS.VOICE_CALL_DECLINE, { callId, conversationId });
  }

  endVoiceCall(callId, conversationId) {
    return this.emit(SOCKET_EVENTS.VOICE_CALL_END, { callId, conversationId });
  }

  // WebRTC signaling methods
  sendWebRTCOffer(conversationId, offer, targetUserId) {
    return this.emit(SOCKET_EVENTS.WEBRTC_OFFER, { conversationId, offer, targetUserId });
  }

  sendWebRTCAnswer(conversationId, answer, targetUserId) {
    return this.emit(SOCKET_EVENTS.WEBRTC_ANSWER, { conversationId, answer, targetUserId });
  }

  sendWebRTCIceCandidate(conversationId, candidate, targetUserId) {
    return this.emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, { conversationId, candidate, targetUserId });
  }

  // User status methods
  updateStatus(status) {
    return this.emit(SOCKET_EVENTS.UPDATE_STATUS, { status });
  }

  // Community methods
  joinCommunity(communityId) {
    return this.emit(SOCKET_EVENTS.JOIN_COMMUNITY, { communityId });
  }

  leaveCommunity(communityId) {
    return this.emit(SOCKET_EVENTS.LEAVE_COMMUNITY, { communityId });
  }

  likePost(postId, communityId) {
    return this.emit(SOCKET_EVENTS.POST_LIKE, { postId, communityId });
  }

  commentPost(postId, communityId, comment) {
    return this.emit(SOCKET_EVENTS.POST_COMMENT, { postId, communityId, comment });
  }

  // Notification methods
  markNotificationsRead(notificationIds) {
    return this.emit(SOCKET_EVENTS.MARK_NOTIFICATIONS_READ, { notificationIds });
  }

  // Browser notification helper
  async showNotification(title, options = {}) {
    if (!('Notification' in window)) {
      return;
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      new Notification(title, {
        ...options,
        badge: '/icon-192x192.png',
        icon: options.icon || '/icon-192x192.png'
      });
    }
  }

  // Reconnect manually
  reconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  // Disconnect and cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.listeners.clear();
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

// Export specific methods for convenience
export const {
  connect,
  disconnect,
  emit,
  on,
  off,
  joinConversation,
  leaveConversation,
  startTyping,
  stopTyping,
  requestVoiceCall,
  acceptVoiceCall,
  declineVoiceCall,
  endVoiceCall,
  updateStatus,
  joinCommunity,
  leaveCommunity,
  getStatus
} = socketService;
