import { create } from 'zustand';
import { chatAPI } from '../services/api';
import socketService from '../services/socket';
import { SOCKET_EVENTS } from '../config/constants';
import toast from 'react-hot-toast';

const useChatStore = create((set, get) => ({
  // State
  conversations: [],
  currentConversation: null,
  messages: {},
  typingUsers: {},
  unreadCounts: {},
  isLoading: false,
  isLoadingMessages: false,
  isConnected: false,
  error: null,

  // Voice call state
  activeCall: null,
  incomingCall: null,
  callStatus: 'idle', // 'idle', 'calling', 'ringing', 'connected', 'ended'

  // Socket listeners setup
  initializeSocket: () => {
    const {
      handleNewMessage,
      handleMessageReaction,
      handleMessageEdit,
      handleTyping,
      handleVoiceCallIncoming,
      handleVoiceCallAccepted,
      handleVoiceCallDeclined,
      handleVoiceCallEnded
    } = get();

    // Set up socket listeners
    socketService.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
    socketService.on(SOCKET_EVENTS.MESSAGE_REACTION, handleMessageReaction);
    socketService.on(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdit);
    socketService.on(SOCKET_EVENTS.USER_TYPING, handleTyping);
    socketService.on(SOCKET_EVENTS.VOICE_CALL_INCOMING, handleVoiceCallIncoming);
    socketService.on(SOCKET_EVENTS.VOICE_CALL_ACCEPTED, handleVoiceCallAccepted);
    socketService.on(SOCKET_EVENTS.VOICE_CALL_DECLINED, handleVoiceCallDeclined);
    socketService.on(SOCKET_EVENTS.VOICE_CALL_ENDED, handleVoiceCallEnded);

    set({ isConnected: true });
  },

  // Socket event handlers
  handleNewMessage: (data) => {
    const { conversationId, message } = data;
    const { messages, conversations, currentConversation } = get();

    // Add message to conversation
    const conversationMessages = messages[conversationId] || [];
    const updatedMessages = {
      ...messages,
      [conversationId]: [...conversationMessages, message]
    };

    // Update conversation last message
    const updatedConversations = conversations.map(conv =>
      conv._id === conversationId
        ? {
            ...conv,
            lastMessage: message,
            unreadCount: conv._id === currentConversation?._id ? 0 : (conv.unreadCount || 0) + 1
          }
        : conv
    );

    // Update unread counts
    const updatedUnreadCounts = { ...get().unreadCounts };
    if (conversationId !== currentConversation?._id) {
      updatedUnreadCounts[conversationId] = (updatedUnreadCounts[conversationId] || 0) + 1;
    }

    set({
      messages: updatedMessages,
      conversations: updatedConversations,
      unreadCounts: updatedUnreadCounts
    });
  },

  handleMessageReaction: (data) => {
    const { messageId, reaction, action } = data;
    const { messages } = get();

    // Find and update message reaction
    Object.keys(messages).forEach(conversationId => {
      const conversationMessages = messages[conversationId];
      const messageIndex = conversationMessages.findIndex(msg => msg._id === messageId);

      if (messageIndex !== -1) {
        const updatedMessages = [...conversationMessages];
        const message = { ...updatedMessages[messageIndex] };

        if (action === 'add') {
          message.reactions = [...(message.reactions || []), reaction];
        } else if (action === 'remove') {
          message.reactions = (message.reactions || []).filter(r => 
            !(r.user === reaction.userId)
          );
        }

        updatedMessages[messageIndex] = message;
        set({
          messages: {
            ...messages,
            [conversationId]: updatedMessages
          }
        });
      }
    });
  },

  handleMessageEdit: (data) => {
    const { messageId, newContent, editedAt } = data;
    const { messages } = get();

    Object.keys(messages).forEach(conversationId => {
      const conversationMessages = messages[conversationId];
      const messageIndex = conversationMessages.findIndex(msg => msg._id === messageId);

      if (messageIndex !== -1) {
        const updatedMessages = [...conversationMessages];
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          content: {
            ...updatedMessages[messageIndex].content,
            text: newContent
          },
          isEdited: true,
          editedAt
        };

        set({
          messages: {
            ...messages,
            [conversationId]: updatedMessages
          }
        });
      }
    });
  },

  handleTyping: (data) => {
    const { conversationId, userId, user, isTyping } = data;
    const { typingUsers } = get();

    if (isTyping) {
      set({
        typingUsers: {
          ...typingUsers,
          [conversationId]: {
            ...typingUsers[conversationId],
            [userId]: user
          }
        }
      });
    } else {
      const conversationTyping = { ...typingUsers[conversationId] };
      delete conversationTyping[userId];

      set({
        typingUsers: {
          ...typingUsers,
          [conversationId]: conversationTyping
        }
      });
    }
  },

  handleVoiceCallIncoming: (data) => {
    set({
      incomingCall: data,
      callStatus: 'ringing'
    });
  },

  handleVoiceCallAccepted: (data) => {
    set({
      activeCall: data,
      incomingCall: null,
      callStatus: 'connected'
    });
  },

  handleVoiceCallDeclined: (data) => {
    set({
      activeCall: null,
      incomingCall: null,
      callStatus: 'ended'
    });
    
    toast.error('Call declined');
    
    // Reset call status after delay
    setTimeout(() => {
      set({ callStatus: 'idle' });
    }, 2000);
  },

  handleVoiceCallEnded: (data) => {
    set({
      activeCall: null,
      incomingCall: null,
      callStatus: 'ended'
    });
    
    // Reset call status after delay
    setTimeout(() => {
      set({ callStatus: 'idle' });
    }, 2000);
  },

  // Actions
  loadConversations: async (page = 1) => {
    set({ isLoading: true, error: null });

    try {
      const response = await chatAPI.getConversations({ page, limit: 20 });
      const { conversations } = response.data;

      // Calculate unread counts
      const unreadCounts = {};
      conversations.forEach(conv => {
        if (conv.unreadCount > 0) {
          unreadCounts[conv._id] = conv.unreadCount;
        }
      });

      set({
        conversations,
        unreadCounts,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  createConversation: async (userId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await chatAPI.createConversation({ userId });
      const { conversation } = response.data;

      // Add to conversations if not exists
      const { conversations } = get();
      const exists = conversations.find(conv => conv._id === conversation._id);

      if (!exists) {
        set({
          conversations: [conversation, ...conversations],
          isLoading: false
        });
      } else {
        set({ isLoading: false });
      }

      return { success: true, conversation };
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  selectConversation: async (conversation) => {
    set({ currentConversation: conversation });

    // Join conversation room
    socketService.joinConversation(conversation._id);

    // Mark as read
    get().markConversationAsRead(conversation._id);

    // Load messages if not loaded
    if (!get().messages[conversation._id]) {
      await get().loadMessages(conversation._id);
    }
  },

  loadMessages: async (conversationId, page = 1) => {
    set({ isLoadingMessages: true, error: null });

    try {
      const response = await chatAPI.getMessages(conversationId, { page, limit: 50 });
      const { messages: newMessages } = response.data;

      const { messages } = get();
      const existingMessages = messages[conversationId] || [];

      // Merge messages (new messages at the beginning for pagination)
      const mergedMessages = page === 1 
        ? newMessages 
        : [...newMessages, ...existingMessages];

      set({
        messages: {
          ...messages,
          [conversationId]: mergedMessages
        },
        isLoadingMessages: false
      });

      return { success: true };
    } catch (error) {
      set({ isLoadingMessages: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  sendMessage: async (conversationId, messageData) => {
    try {
      const response = await chatAPI.sendMessage(conversationId, messageData);
      const { message } = response.data;

      // Add message optimistically (it will be updated via socket)
      const { messages } = get();
      const conversationMessages = messages[conversationId] || [];

      set({
        messages: {
          ...messages,
          [conversationId]: [...conversationMessages, message]
        }
      });

      return { success: true, message };
    } catch (error) {
      toast.error('Failed to send message');
      return { success: false, error: error.message };
    }
  },

  sendVoiceMessage: async (conversationId, audioFile, language = 'auto') => {
    try {
      const response = await chatAPI.sendVoiceMessage(audioFile, {
        conversationId,
        language
      });

      const { message } = response.data;

      // Add message optimistically
      const { messages } = get();
      const conversationMessages = messages[conversationId] || [];

      set({
        messages: {
          ...messages,
          [conversationId]: [...conversationMessages, message]
        }
      });

      return { success: true, message };
    } catch (error) {
      toast.error('Failed to send voice message');
      return { success: false, error: error.message };
    }
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      await chatAPI.reactToMessage(messageId, { emoji });
      return { success: true };
    } catch (error) {
      toast.error('Failed to add reaction');
      return { success: false, error: error.message };
    }
  },

  removeReaction: async (messageId) => {
    try {
      await chatAPI.removeReaction(messageId);
      return { success: true };
    } catch (error) {
      toast.error('Failed to remove reaction');
      return { success: false, error: error.message };
    }
  },

  editMessage: async (messageId, newContent) => {
    try {
      await chatAPI.editMessage(messageId, { content: newContent });
      return { success: true };
    } catch (error) {
      toast.error('Failed to edit message');
      return { success: false, error: error.message };
    }
  },

  startTyping: (conversationId) => {
    socketService.startTyping(conversationId);
  },

  stopTyping: (conversationId) => {
    socketService.stopTyping(conversationId);
  },

  markConversationAsRead: (conversationId) => {
    const { unreadCounts, conversations } = get();
    
    // Clear unread count
    const updatedUnreadCounts = { ...unreadCounts };
    delete updatedUnreadCounts[conversationId];

    // Update conversation
    const updatedConversations = conversations.map(conv =>
      conv._id === conversationId
        ? { ...conv, unreadCount: 0 }
        : conv
    );

    set({
      unreadCounts: updatedUnreadCounts,
      conversations: updatedConversations
    });
  },

  // Voice call methods
  startVoiceCall: (conversationId) => {
    set({ callStatus: 'calling' });
    socketService.requestVoiceCall(conversationId);
  },

  acceptVoiceCall: () => {
    const { incomingCall } = get();
    if (incomingCall) {
      socketService.acceptVoiceCall(incomingCall.callId, incomingCall.conversationId);
    }
  },

  declineVoiceCall: () => {
    const { incomingCall } = get();
    if (incomingCall) {
      socketService.declineVoiceCall(incomingCall.callId, incomingCall.conversationId);
    }
  },

  endVoiceCall: () => {
    const { activeCall } = get();
    if (activeCall) {
      socketService.endVoiceCall(activeCall.callId, activeCall.conversationId);
    }
  },

  clearCall: () => {
    set({
      activeCall: null,
      incomingCall: null,
      callStatus: 'idle'
    });
  },

  // Search messages
  searchMessages: async (query, conversationId = null) => {
    try {
      const params = { q: query };
      if (conversationId) {
        params.conversationId = conversationId;
      }

      const response = await chatAPI.searchMessages(params);
      return { success: true, results: response.data.messages };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    try {
      await chatAPI.deleteConversation(conversationId);

      const { conversations } = get();
      const updatedConversations = conversations.filter(conv => conv._id !== conversationId);

      set({ conversations: updatedConversations });
      
      // Leave socket room
      socketService.leaveConversation(conversationId);

      toast.success('Conversation deleted');
      return { success: true };
    } catch (error) {
      toast.error('Failed to delete conversation');
      return { success: false, error: error.message };
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

export default useChatStore;
