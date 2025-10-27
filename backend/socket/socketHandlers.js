import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { Conversation, Message } from '../models/Chat.js';
import Community from '../models/Community.js';
import CommunityMessage from '../models/CommunityMessage.js';

// Store active users and their socket connections
const activeUsers = new Map();
const userSockets = new Map();

export const initializeSocket = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }
      
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.displayName} (${socket.userId})`);
    
    // Store user connection
    activeUsers.set(socket.userId, {
      user: socket.user,
      socketId: socket.id,
      lastSeen: new Date(),
      status: 'online'
    });
    
    userSockets.set(socket.userId, socket);
    
    // Join user to their personal room
    socket.join(`user_${socket.userId}`);
    
    // Update user online status
    updateUserOnlineStatus(socket.userId, 'online');
    
    // Emit user online status to friends
    emitUserStatusToFriends(socket.userId, 'online');
    
    // Handle user joining conversations
    socket.on('join_conversation', async (data) => {
      try {
        const { conversationId } = data;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isParticipant(socket.userId)) {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
          return;
        }
        
        socket.join(`conversation_${conversationId}`);
        
        // Update last seen for this conversation
        await conversation.updateLastSeen(socket.userId);
        
        socket.emit('conversation_joined', { conversationId });
        
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });
    
    // Handle user leaving conversations
    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation_${conversationId}`);
      socket.emit('conversation_left', { conversationId });
    });
    
    // Handle typing indicators
    socket.on('typing_start', async (data) => {
      try {
        const { conversationId } = data;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isParticipant(socket.userId)) {
          return;
        }
        
        // Update typing status
        await conversation.setTyping(socket.userId, true);
        
        // Emit to other participants
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          conversationId,
          userId: socket.userId,
          user: {
            displayName: socket.user.displayName,
            profilePicture: socket.user.profilePicture
          },
          isTyping: true
        });
        
      } catch (error) {
        console.error('Error handling typing start:', error);
      }
    });
    
    socket.on('typing_stop', async (data) => {
      try {
        const { conversationId } = data;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isParticipant(socket.userId)) {
          return;
        }
        
        // Update typing status
        await conversation.setTyping(socket.userId, false);
        
        // Emit to other participants
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          conversationId,
          userId: socket.userId,
          user: {
            displayName: socket.user.displayName,
            profilePicture: socket.user.profilePicture
          },
          isTyping: false
        });
        
      } catch (error) {
        console.error('Error handling typing stop:', error);
      }
    });
    
    // Handle voice chat requests
    socket.on('voice_call_request', async (data) => {
      try {
        const { conversationId } = data;
        
        const conversation = await Conversation.findById(conversationId)
          .populate('participants.user', 'displayName businessName profilePicture');
        
        if (!conversation || !conversation.isParticipant(socket.userId)) {
          socket.emit('error', { message: 'Not authorized for this conversation' });
          return;
        }
        
        // Find the other participant
        const otherParticipant = conversation.participants.find(p => 
          p.user._id.toString() !== socket.userId
        );
        
        if (!otherParticipant) {
          socket.emit('error', { message: 'No other participant found' });
          return;
        }
        
        const otherUserId = otherParticipant.user._id.toString();
        
        // Check if other user is online
        const otherUserSocket = userSockets.get(otherUserId);
        if (!otherUserSocket) {
          socket.emit('voice_call_failed', { 
            reason: 'User is offline',
            conversationId 
          });
          return;
        }
        
        // Generate call ID
        const callId = `call_${Date.now()}_${socket.userId}`;
        
        // Send call request to other user
        otherUserSocket.emit('voice_call_incoming', {
          callId,
          conversationId,
          from: {
            userId: socket.userId,
            displayName: socket.user.displayName,
            businessName: socket.user.businessName,
            profilePicture: socket.user.profilePicture
          }
        });
        
        // Notify caller that request was sent
        socket.emit('voice_call_sent', {
          callId,
          conversationId,
          to: otherParticipant.user
        });
        
      } catch (error) {
        console.error('Error handling voice call request:', error);
        socket.emit('error', { message: 'Failed to initiate voice call' });
      }
    });
    
    // Handle voice call responses
    socket.on('voice_call_accept', (data) => {
      const { callId, conversationId } = data;
      
      // Find the caller and notify them
      io.to(`conversation_${conversationId}`).emit('voice_call_accepted', {
        callId,
        conversationId,
        acceptedBy: socket.userId
      });
    });
    
    socket.on('voice_call_decline', (data) => {
      const { callId, conversationId } = data;
      
      // Find the caller and notify them
      io.to(`conversation_${conversationId}`).emit('voice_call_declined', {
        callId,
        conversationId,
        declinedBy: socket.userId
      });
    });
    
    socket.on('voice_call_end', (data) => {
      const { callId, conversationId } = data;
      
      // Notify all participants
      io.to(`conversation_${conversationId}`).emit('voice_call_ended', {
        callId,
        conversationId,
        endedBy: socket.userId
      });
    });
    
    // Handle WebRTC signaling
    socket.on('webrtc_offer', (data) => {
      const { conversationId, offer, targetUserId } = data;
      const targetSocket = userSockets.get(targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('webrtc_offer', {
          conversationId,
          offer,
          fromUserId: socket.userId
        });
      }
    });
    
    socket.on('webrtc_answer', (data) => {
      const { conversationId, answer, targetUserId } = data;
      const targetSocket = userSockets.get(targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('webrtc_answer', {
          conversationId,
          answer,
          fromUserId: socket.userId
        });
      }
    });
    
    socket.on('webrtc_ice_candidate', (data) => {
      const { conversationId, candidate, targetUserId } = data;
      const targetSocket = userSockets.get(targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('webrtc_ice_candidate', {
          conversationId,
          candidate,
          fromUserId: socket.userId
        });
      }
    });
    
    // Handle user status updates
    socket.on('update_status', async (data) => {
      try {
        const { status } = data; // 'online', 'away', 'busy', 'offline'
        
        if (!['online', 'away', 'busy', 'offline'].includes(status)) {
          return;
        }
        
        // Update in database
        await updateUserOnlineStatus(socket.userId, status);
        
        // Update in memory
        if (activeUsers.has(socket.userId)) {
          activeUsers.get(socket.userId).status = status;
        }
        
        // Emit to friends
        emitUserStatusToFriends(socket.userId, status);
        
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    });
    
    // Handle community events
    socket.on('join_community', (data) => {
      const { communityId } = data;
      socket.join(`community_${communityId}`);
      socket.emit('community_joined', { communityId });
    });
    
    socket.on('leave_community', (data) => {
      const { communityId } = data;
      socket.leave(`community_${communityId}`);
      socket.emit('community_left', { communityId });
    });
    
    // Handle post interactions
    socket.on('post_like', (data) => {
      const { postId, communityId } = data;
      
      // Emit to community members
      if (communityId) {
        socket.to(`community_${communityId}`).emit('post_liked', {
          postId,
          userId: socket.userId,
          user: {
            displayName: socket.user.displayName,
            profilePicture: socket.user.profilePicture
          }
        });
      }
    });
    
    socket.on('post_comment', (data) => {
      const { postId, communityId, comment } = data;
      
      // Emit to community members
      if (communityId) {
        socket.to(`community_${communityId}`).emit('post_commented', {
          postId,
          userId: socket.userId,
          user: {
            displayName: socket.user.displayName,
            profilePicture: socket.user.profilePicture
          },
          comment
        });
      }
    });
    
    // Handle notifications
    socket.on('mark_notifications_read', async (data) => {
      try {
        const { notificationIds } = data;
        
        // In a full implementation, you'd update notification read status
        socket.emit('notifications_marked_read', { notificationIds });
        
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    });

    // ==================== COMMUNITY CHAT HANDLERS ====================

    // Join community room
    socket.on('join_community', async (data) => {
      try {
        const { communityId } = data;

        const community = await Community.findById(communityId);
        if (!community || !community.isMember(socket.userId)) {
          socket.emit('error', { message: 'Not authorized to join this community' });
          return;
        }

        socket.join(`community_${communityId}`);
        socket.emit('community_joined', { communityId });

      } catch (error) {
        console.error('Error joining community:', error);
        socket.emit('error', { message: 'Failed to join community' });
      }
    });

    // Leave community room
    socket.on('leave_community', (data) => {
      const { communityId } = data;
      socket.leave(`community_${communityId}`);
      socket.emit('community_left', { communityId });
    });

    // Community typing indicators
    socket.on('community_typing_start', async (data) => {
      try {
        const { communityId } = data;

        const community = await Community.findById(communityId);
        if (!community || !community.isMember(socket.userId)) {
          return;
        }

        // Broadcast typing to other community members
        socket.to(`community_${communityId}`).emit('community_user_typing', {
          communityId,
          userId: socket.userId,
          displayName: socket.user.displayName,
          isTyping: true
        });

      } catch (error) {
        console.error('Error broadcasting typing:', error);
      }
    });

    socket.on('community_typing_stop', async (data) => {
      try {
        const { communityId } = data;

        socket.to(`community_${communityId}`).emit('community_user_typing', {
          communityId,
          userId: socket.userId,
          displayName: socket.user.displayName,
          isTyping: false
        });

      } catch (error) {
        console.error('Error broadcasting typing stop:', error);
      }
    });

    // Send community message
    socket.on('send_community_message', async (data) => {
      try {
        const { communityId, content, type, voice, media, replyTo } = data;

        const community = await Community.findById(communityId);
        if (!community || !community.isMember(socket.userId)) {
          socket.emit('error', { message: 'Not authorized to send messages' });
          return;
        }

        // Check if user is muted
        const member = community.members.find(m => m.user.toString() === socket.userId.toString());
        if (member && member.status === 'muted') {
          socket.emit('error', { message: 'You are muted in this community' });
          return;
        }

        // Create message
        const message = new CommunityMessage({
          community: communityId,
          sender: socket.userId,
          content: {
            original: {
              text: content?.text || '',
              language: content?.language || 'en'
            }
          },
          type,
          voice,
          media,
          replyTo
        });

        await message.save();
        await message.populate('sender', 'displayName businessName profilePicture');

        // Update community stats
        community.stats.totalPosts = (community.stats.totalPosts || 0) + 1;
        community.lastActivity = new Date();
        await community.save();

        // Broadcast message to all community members
        io.to(`community_${communityId}`).emit('new_community_message', {
          communityId,
          message: message.toObject()
        });

      } catch (error) {
        console.error('Error sending community message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // React to community message
    socket.on('react_community_message', async (data) => {
      try {
        const { messageId, emoji } = data;

        const message = await CommunityMessage.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user is member
        const community = await Community.findById(message.community);
        if (!community || !community.isMember(socket.userId)) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        await message.addReaction(socket.userId, emoji);

        // Broadcast reaction
        io.to(`community_${message.community}`).emit('community_message_reaction', {
          messageId,
          userId: socket.userId,
          emoji,
          reactions: message.reactions
        });

      } catch (error) {
        console.error('Error reacting to message:', error);
      }
    });

    // Mark community messages as read
    socket.on('mark_community_read', async (data) => {
      try {
        const { communityId, messageIds } = data;

        const community = await Community.findById(communityId);
        if (!community || !community.isMember(socket.userId)) {
          return;
        }

        // Mark multiple messages as read
        await Promise.all(
          messageIds.map(id =>
            CommunityMessage.findById(id).then(msg =>
              msg ? msg.markAsRead(socket.userId) : null
            )
          )
        );

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      console.log(`User disconnected: ${socket.user.displayName} (${reason})`);
      
      try {
        // Remove from active users
        activeUsers.delete(socket.userId);
        userSockets.delete(socket.userId);
        
        // Update user status to offline
        await updateUserOnlineStatus(socket.userId, 'offline');
        
        // Stop all typing indicators
        const userConversations = await Conversation.find({
          'participants.user': socket.userId,
          isActive: true
        });
        
        for (const conversation of userConversations) {
          await conversation.setTyping(socket.userId, false);
          
          // Emit typing stop to other participants
          socket.to(`conversation_${conversation._id}`).emit('user_typing', {
            conversationId: conversation._id.toString(),
            userId: socket.userId,
            isTyping: false
          });
        }
        
        // Emit offline status to friends
        emitUserStatusToFriends(socket.userId, 'offline');
        
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
    
    // Handle error
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
  
  // Utility functions
  async function updateUserOnlineStatus(userId, status) {
    try {
      await User.findByIdAndUpdate(userId, {
        onlineStatus: status,
        lastActive: new Date()
      });
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
  }
  
  async function emitUserStatusToFriends(userId, status) {
    try {
      const user = await User.findById(userId)
        .populate('friends.user', '_id onlineStatus');
      
      if (!user) return;
      
      // Emit status change to all friends
      user.friends.forEach(friendship => {
        if (friendship.status === 'accepted') {
          const friendId = friendship.user._id.toString();
          const friendSocket = userSockets.get(friendId);
          
          if (friendSocket) {
            friendSocket.emit('friend_status_changed', {
              userId: userId,
              status: status,
              lastActive: new Date()
            });
          }
        }
      });
      
    } catch (error) {
      console.error('Error emitting status to friends:', error);
    }
  }
  
  // Helper function to emit to user
  function emitToUser(userId, event, data) {
    const socket = userSockets.get(userId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }
  
  // Helper function to get active users count
  function getActiveUsersCount() {
    return activeUsers.size;
  }
  
  // Helper function to get active users in a community
  function getActiveUsersInCommunity(communityId) {
    const sockets = io.sockets.adapter.rooms.get(`community_${communityId}`);
    return sockets ? sockets.size : 0;
  }
  
  // Periodic cleanup of inactive users
  setInterval(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    for (const [userId, userData] of activeUsers.entries()) {
      if (userData.lastSeen < fiveMinutesAgo) {
        activeUsers.delete(userId);
        userSockets.delete(userId);
        
        // Update database status to offline
        updateUserOnlineStatus(userId, 'offline');
        emitUserStatusToFriends(userId, 'offline');
      }
    }
  }, 60000); // Run every minute
  
  // Export utility functions for use in routes
  io.emitToUser = emitToUser;
  io.getActiveUsersCount = getActiveUsersCount;
  io.getActiveUsersInCommunity = getActiveUsersInCommunity;
  
  console.log('Socket.IO initialized with real-time features');
};

export default { initializeSocket };
