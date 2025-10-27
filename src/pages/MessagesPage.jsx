import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Phone, Video, Search, Plus, Mic, Send, Globe, X, Users, Languages, Volume2, CheckCircle2, Sparkles, Info, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';
import { chatAPI, translationAPI, usersAPI } from '../services/api';
import sarvamAI from '../services/sarvamAI';
import socketService from '../services/socket';
import useAppStore from '../store/appStore';
import toast from 'react-hot-toast';

const MessagesPage = () => {
  const location = useLocation();
  const { selectedLanguage, autoTranslateEnabled, user } = useAppStore();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [voiceLanguage, setVoiceLanguage] = useState('ta-IN'); // Default to Tamil
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  // New conversation modal
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const userSearchTimeoutRef = useRef(null);
  const languageSelectorRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Handle conversation from navigation state (e.g., from product page)
  useEffect(() => {
    const handleProductContact = async () => {
      if (location.state?.conversationId && conversations.length > 0) {
        const conversation = conversations.find(c => c._id === location.state.conversationId);
        if (conversation) {
          setSelectedConversation(conversation);

          // If there's product context, send an auto-message
          if (location.state?.productContext) {
            const product = location.state.productContext;
            const priceText = product.price?.amount
              ? `${product.price.currency || 'INR'} ${product.price.amount}/${product.price.unit}`
              : 'Price not specified';

            // Create product inquiry message
            const inquiryMessage = `Hi! I'm interested in the following product:\n\n📦 ${product.name}\n💰 Price: ${priceText}\n\n${product.description || ''}\n\nCould you please provide more details?`;

            // Wait a moment for the conversation to be fully selected and messages loaded
            setTimeout(async () => {
              try {
                await chatAPI.sendMessage(conversation._id, {
                  content: {
                    text: inquiryMessage,
                    language: selectedLanguage
                  },
                  type: 'text'
                });

                // Reload messages to show the sent message
                await loadMessages(conversation._id);

                toast.success('Message sent to seller');
              } catch (error) {
                console.error('Failed to send product inquiry:', error);
                // Pre-fill the input instead if auto-send fails
                setInputText(inquiryMessage);
                toast.error('Failed to send message. You can try sending manually.');
              }
            }, 1500); // Increased delay to ensure conversation is fully loaded
          }

          // Clear the state to prevent re-triggering
          window.history.replaceState({}, document.title);
        }
      }
    };

    handleProductContact();
  }, [location.state, conversations, selectedLanguage]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation._id);

      // Join the conversation room for socket events
      socketService.emit('join_conversation', { conversationId: selectedConversation._id });

      // Mark messages as read
      // You could add API call here to mark as read

      return () => {
        // Leave the conversation room when switching
        socketService.emit('leave_conversation', { conversationId: selectedConversation._id });
      };
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  // Close language selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageSelectorRef.current && !languageSelectorRef.current.contains(event.target)) {
        setShowLanguageSelector(false);
      }
    };

    if (showLanguageSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showLanguageSelector]);

  // Listen for new messages via socket
  useEffect(() => {
    const handleNewMessage = (data) => {
      const { message, conversationId } = data;

      // Update conversations list
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv._id === conversationId) {
            return {
              ...conv,
              lastMessage: message,
              updatedAt: message.createdAt
            };
          }
          return conv;
        });
        // Sort by most recent
        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });

      // If this conversation is selected, add message to messages list
      if (selectedConversation?._id === conversationId) {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) {
            return prev;
          }
          return [...prev, message];
        });
        scrollToBottom();
      } else {
        // Show notification for other conversations
        toast(`New message from ${message.sender.displayName}`);
      }
    };

    const handleUserTyping = (data) => {
      const { userId, isTyping, conversationId } = data;

      if (selectedConversation?._id === conversationId) {
        setTypingUsers(prev => {
          const updated = new Set(prev);
          if (isTyping) {
            updated.add(userId);
          } else {
            updated.delete(userId);
          }
          return updated;
        });
      }
    };

    socketService.on('new_message', handleNewMessage);
    socketService.on('user_typing', handleUserTyping);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('user_typing', handleUserTyping);
    };
  }, [selectedConversation]);

  // Join/leave conversation rooms when selection changes
  useEffect(() => {
    if (selectedConversation) {
      socketService.emit('join_conversation', { conversationId: selectedConversation._id });
      loadMessages(selectedConversation._id);
    }

    return () => {
      if (selectedConversation) {
        socketService.emit('leave_conversation', { conversationId: selectedConversation._id });
      }
    };
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // User search with debounce
  useEffect(() => {
    if (userSearchQuery.trim().length >= 2) {
      // Clear existing timeout
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }

      // Set new timeout for search
      userSearchTimeoutRef.current = setTimeout(() => {
        searchUsers(userSearchQuery);
      }, 500);
    } else {
      setSearchedUsers([]);
    }

    return () => {
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }
    };
  }, [userSearchQuery]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await chatAPI.getConversations();
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setIsLoadingMessages(true);
      const response = await chatAPI.getMessages(conversationId);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const searchUsers = async (query) => {
    try {
      setIsSearchingUsers(true);
      const response = await usersAPI.search({ q: query, limit: 10 });
      setSearchedUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to search users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const startConversation = async (userId) => {
    try {
      setIsCreatingConversation(true);

      // Create or get existing conversation
      const response = await chatAPI.createConversation({ userId });
      const newConversation = response.data.conversation;

      // Check if conversation already exists in list
      const exists = conversations.find(conv => conv._id === newConversation._id);
      if (!exists) {
        setConversations(prev => [newConversation, ...prev]);
      }

      // Select the conversation
      setSelectedConversation(newConversation);

      // Close modal
      setShowNewConversationModal(false);
      setUserSearchQuery('');
      setSearchedUsers([]);

      toast.success('Conversation started!');
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const clearChat = async () => {
    if (!selectedConversation) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to delete this conversation? This will permanently remove the chat from your list and delete all messages.'
    );

    if (!confirmed) return;

    try {
      toast.loading('Deleting conversation...', { id: 'clear-chat' });

      const conversationId = selectedConversation._id;

      // Delete conversation from backend (permanent deletion)
      await chatAPI.deleteConversation(conversationId);

      // Clear messages locally
      setMessages([]);

      // Remove conversation from the list
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));

      // Clear selected conversation
      setSelectedConversation(null);

      toast.success('Conversation deleted permanently', { id: 'clear-chat' });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation. Please try again.', { id: 'clear-chat' });

      // Reload conversations on error to sync with backend
      loadConversations();
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedConversation || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await chatAPI.sendMessage(selectedConversation._id, {
        content: {
          text: messageText,
          language: selectedLanguage
        },
        type: 'text'
      });

      // Message will be added via socket event, no need for optimistic update
      // The socket event will handle adding the message

      // Stop typing indicator
      socketService.emit('typing_stop', { conversationId: selectedConversation._id });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setInputText(messageText); // Restore text on error
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    // Handle typing indicator
    if (selectedConversation) {
      socketService.emit('typing_start', { conversationId: selectedConversation._id });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketService.emit('typing_stop', { conversationId: selectedConversation._id });
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordingStartTimeRef.current = Date.now();

      const audioChunks = [];
      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener('stop', async () => {
        const recordingDuration = Date.now() - recordingStartTimeRef.current;
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

        // Check minimum recording duration (1 second) and size
        if (recordingDuration < 1000) {
          toast.error('Recording too short. Please hold for at least 1 second.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        if (audioBlob.size < 1000) {
          toast.error('Recording too small. Please speak louder or longer.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      });

      mediaRecorder.start();
      setIsRecording(true);
      toast('Recording... Speak clearly in your chosen language', { icon: '🎤' });
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Microphone access denied or not available');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);

    try {
      // Check if Sarvam AI is configured
      if (!sarvamAI.isConfigured()) {
        toast.error('Sarvam AI is not configured. Please add VITE_SARVAM_API_KEY to your .env file');
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading('Translating Tamil to English...');

      // Use Sarvam AI to translate Tamil speech to English text directly
      const result = await sarvamAI.translateSpeechToEnglish(audioBlob, {
        model: 'saaras:v2'
      });

      toast.dismiss(loadingToast);

      if (result.success) {
        const translatedText = result.translatedText;
        const language = result.detectedLanguage;

        // Check if transcript is empty
        if (!translatedText || translatedText.trim() === '') {
          toast.error('No speech detected. Please speak louder and longer (at least 2-3 seconds).', {
            duration: 4000
          });
          return;
        }

        setDetectedLanguage(language);
        setInputText(prev => prev + (prev ? ' ' : '') + translatedText);

        // Show success with detected language
        const languageName = sarvamAI.getSupportedLanguages().find(l => l.code === language)?.name || language || 'Unknown';
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Translated from {languageName} to English!</span>
          </div>,
          { duration: 3000 }
        );
      } else {
        toast.error(result.error || 'Translation failed. Please try again.');
      }
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      toast.error('Speech recognition failed. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const translateMessage = async (messageId, text) => {
    if (!autoTranslateEnabled) return;

    try {
      const response = await translationAPI.translate({
        text,
        targetLang: selectedLanguage
      });

      setTranslatedMessages(prev => ({
        ...prev,
        [messageId]: response.data.translatedText
      }));
    } catch (error) {
      console.error('Translation failed:', error);
      toast.error('Translation failed');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const participant = conv.otherParticipant;
    return participant?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           participant?.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getOtherParticipant = (conversation) => {
    return conversation?.otherParticipant || null;
  };

  return (
    <>
      <Helmet>
        <title>Messages - Claire B2B</title>
        <meta name="description" content="Communicate with your business partners and potential clients." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-purple-600" />
              Messages
            </h1>
            <p className="text-gray-700 mt-1 flex items-center gap-2">
              Communicate with your business partners
              <Sparkles className="w-4 h-4 text-purple-500" />
            </p>
          </div>
          <button
            onClick={() => setShowNewConversationModal(true)}
            className="glass-button flex items-center gap-2 px-6 py-3"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Message</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1 glass-card-strong flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-white/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                <input
                  type="search"
                  placeholder="Search conversations..."
                  className="glass-input w-full pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {isLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="glass-card p-8">
                    <MessageSquare className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium">No conversations yet</p>
                    <p className="text-sm text-gray-600 mt-1">Start a new chat to get started</p>
                  </div>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const participant = getOtherParticipant(conversation);
                  if (!participant) return null;

                  const isSelected = selectedConversation?._id === conversation._id;

                  return (
                    <div
                      key={conversation._id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 cursor-pointer transition-all border-b border-white/20 ${
                        isSelected
                          ? 'bg-gradient-purple shadow-lg'
                          : 'hover:bg-white/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-purple rounded-full flex items-center justify-center text-white font-bold shadow-md glass-avatar">
                            {participant.profilePicture ? (
                              <img
                                src={participant.profilePicture}
                                alt={participant.displayName || participant.businessName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              (participant.displayName || participant.businessName || '?').charAt(0).toUpperCase()
                            )}
                          </div>
                          {participant.onlineStatus === 'online' && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
                          )}
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                              {participant.displayName || participant.businessName}
                            </h3>
                            <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                              {conversation.lastMessage && formatRelativeTime(conversation.lastMessage.timestamp)}
                            </span>
                          </div>
                          {conversation.lastMessage && (
                            <p className={`text-xs truncate ${
                              isSelected
                                ? 'text-white/90'
                                : conversation.unreadCount > 0
                                ? 'text-gray-900 font-medium'
                                : 'text-gray-600'
                            }`}>
                              {conversation.lastMessage.content?.original?.text ||
                               conversation.lastMessage.content?.text ||
                               (typeof conversation.lastMessage.content === 'string' ? conversation.lastMessage.content : null) ||
                               conversation.lastMessage.text ||
                               'Message'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div className="lg:col-span-2 glass-card-strong flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="glass-card border-b border-white/40 px-4 py-3">
                <div className="flex items-center justify-between">
                  {(() => {
                    const participant = getOtherParticipant(selectedConversation);
                    if (!participant) return null;

                    return (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-11 h-11 bg-gradient-purple rounded-full flex items-center justify-center text-white font-bold shadow-lg glass-avatar">
                              {participant.profilePicture ? (
                                <img
                                  src={participant.profilePicture}
                                  alt={participant.displayName || participant.businessName}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                (participant.displayName || participant.businessName || '?').charAt(0).toUpperCase()
                              )}
                            </div>
                            {participant.onlineStatus === 'online' && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                              {participant.displayName || participant.businessName}
                            </h3>
                            <p className={`text-xs font-medium ${
                              participant.onlineStatus === 'online'
                                ? 'text-green-600'
                                : 'text-gray-600'
                            }`}>
                              {participant.onlineStatus === 'online' ? 'Online now' : 'Offline'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button className="glass-card hover:glass-card-medium p-2.5 rounded-full transition-all">
                            <Phone className="w-5 h-5 text-purple-600" />
                          </button>
                          <button className="glass-card hover:glass-card-medium p-2.5 rounded-full transition-all">
                            <Video className="w-5 h-5 text-purple-600" />
                          </button>
                          <button
                            onClick={clearChat}
                            className="glass-card hover:glass-card-medium p-2.5 rounded-full transition-all hover:bg-red-50"
                            title="Clear chat"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide bg-gradient-app">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="glass-card-strong p-8">
                      <div className="flex gap-2 mb-2">
                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <p className="text-sm text-gray-700">Loading messages...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="glass-card-strong p-12 max-w-md text-center animate-scaleIn">
                      <div className="w-20 h-20 bg-gradient-purple rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg glow-purple">
                        <MessageSquare className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gradient mb-3">Start the conversation!</h3>
                      <p className="text-gray-700 mb-2">Send a message to begin chatting</p>
                      <div className="glass-card p-4 mt-4">
                        <div className="flex items-start gap-3">
                          <Mic className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-purple-900">Voice Input Available</p>
                            <p className="text-xs text-purple-700 mt-1">Hold the mic button to speak in Tamil and send as English text</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      // Fix: Ensure proper comparison for message alignment
                      const isOwn = message.sender?._id?.toString() === user?._id?.toString();
                      const showTranslation = translatedMessages[message._id];

                      return (
                        <div
                          key={message._id || index}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-2 animate-fadeIn`}
                        >
                          {/* Instagram-style: Others' messages on LEFT, own messages on RIGHT */}
                          <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isOwn && (
                              <div className="w-8 h-8 bg-gradient-purple rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mb-0.5 glass-avatar">
                                {message.sender.profilePicture ? (
                                  <img
                                    src={message.sender.profilePicture}
                                    alt={message.sender.displayName}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  (message.sender.displayName || '?').charAt(0).toUpperCase()
                                )}
                              </div>
                            )}

                            <div className="flex flex-col group">
                              {!isOwn && (
                                <span className="text-xs font-semibold mb-1 ml-3 text-gradient">
                                  {message.sender.displayName || message.sender.businessName}
                                </span>
                              )}

                              <div className={isOwn ? 'message-bubble-own' : 'message-bubble-other'}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {showTranslation || message.content?.original?.text || message.content?.text || message.text || ''}
                                </p>

                                {message.content?.original?.language &&
                                 message.content.original.language !== selectedLanguage &&
                                 autoTranslateEnabled && (
                                  <button
                                    onClick={() => translateMessage(message._id, message.content.original.text)}
                                    className={`text-xs hover:underline mt-2 flex items-center gap-1 transition-opacity hover:opacity-80 ${
                                      isOwn ? 'text-white/80' : 'text-purple-600'
                                    }`}
                                  >
                                    <Globe className="w-3 h-3" />
                                    {showTranslation ? 'Show original' : 'Translate'}
                                  </button>
                                )}

                                <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/80' : 'text-gray-600'} text-[10px]`}>
                                  <span>{formatRelativeTime(message.createdAt)}</span>
                                  {isOwn && message.status && (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing Indicator */}
                    {typingUsers.size > 0 && (
                      <div className="flex items-start gap-2 px-2 animate-fadeIn">
                        <div className="w-8 h-8 bg-gradient-purple rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 glass-avatar">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="glass-card p-3 rounded-2xl rounded-bl-md">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="glass-card border-t border-white/40 p-4">
                {/* Voice Language Info */}
                {detectedLanguage && (
                  <div className="mb-3 glass-card p-3 flex items-center justify-between animate-scaleIn">
                    <div className="flex items-center gap-2 text-xs text-purple-700">
                      <Languages className="w-4 h-4" />
                      <span>
                        Detected: <strong>{sarvamAI.getSupportedLanguages().find(l => l.code === detectedLanguage)?.name || detectedLanguage}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => setDetectedLanguage(null)}
                      className="text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-end gap-2">
                  {/* Voice Input Section */}
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onMouseLeave={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      disabled={isTranscribing}
                      className={`p-3 rounded-full transition-all duration-200 shadow-md ${
                        isRecording
                          ? 'bg-red-500 text-white scale-110 pulse-recording'
                          : isTranscribing
                          ? 'glass-button-secondary'
                          : 'glass-card hover:glass-card-medium text-purple-600'
                      }`}
                      title={isRecording ? 'Release to stop' : isTranscribing ? 'Translating...' : 'Hold to record voice'}
                    >
                      {isTranscribing ? (
                        <div className="flex gap-1">
                          <div className="w-1 h-5 bg-white rounded-full animate-bounce"></div>
                          <div className="w-1 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      ) : isRecording ? (
                        <Volume2 className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </button>

                    {/* Language Selector Badge */}
                    <button
                      type="button"
                      onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-purple text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                      title="Select voice language"
                    >
                      <Languages className="w-3 h-3" />
                    </button>

                    {/* Language Selector Popup */}
                    {showLanguageSelector && (
                      <div
                        ref={languageSelectorRef}
                        className="absolute bottom-full mb-2 left-0 glass-card-strong rounded-2xl shadow-2xl py-2 w-72 max-h-80 overflow-y-auto z-10 animate-scaleIn"
                      >
                        <div className="px-4 py-3 border-b border-white/40">
                          <p className="text-sm font-bold text-gradient flex items-center gap-2">
                            <Languages className="w-4 h-4" />
                            Select Voice Language
                          </p>
                        </div>
                        {sarvamAI.getSupportedLanguages().map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              setVoiceLanguage(lang.code);
                              setShowLanguageSelector(false);
                              toast.success(`Voice language set to ${lang.name}`);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-white/30 transition-all ${
                              voiceLanguage === lang.code ? 'bg-gradient-purple text-white' : 'text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold">{lang.name}</div>
                                <div className={`text-xs ${voiceLanguage === lang.code ? 'text-white/80' : 'text-gray-600'}`}>
                                  {lang.nativeName}
                                </div>
                              </div>
                              {voiceLanguage === lang.code && (
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Text Input */}
                  <input
                    type="text"
                    placeholder={isRecording ? '🎤 Recording...' : 'Type your message or hold mic to speak...'}
                    className="glass-input flex-1"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    disabled={isSending || isTranscribing}
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending || isTranscribing}
                    className={`p-3 rounded-full transition-all duration-200 shadow-md ${
                      inputText.trim() && !isSending && !isTranscribing
                        ? 'glass-button hover:scale-110 glow-purple'
                        : 'glass-card text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>

                {/* Status Bar */}
                <div className="mt-3 flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                    {autoTranslateEnabled && (
                      <p className="text-xs text-purple-700 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Auto-translate: {selectedLanguage}
                      </p>
                    )}
                    <p className="text-xs text-purple-700 flex items-center gap-1">
                      <Mic className="w-3 h-3" />
                      Voice: {sarvamAI.getSupportedLanguages().find(l => l.code === voiceLanguage)?.name || 'Tamil'}
                    </p>
                  </div>
                  {isRecording && (
                    <p className="text-xs text-red-600 font-semibold animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Recording... Release to translate
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="lg:col-span-2 glass-card-strong flex items-center justify-center">
              <div className="text-center p-12 max-w-md">
                <div className="w-24 h-24 bg-gradient-purple rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl glow-purple float-animation">
                  <MessageSquare className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gradient mb-3 flex items-center justify-center gap-2">
                  Select a conversation
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Choose from your existing conversations or start a new one to begin chatting with your business partners
                </p>
                <button
                  onClick={() => setShowNewConversationModal(true)}
                  className="glass-button px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
                >
                  <Plus className="w-5 h-5 inline-block mr-2" />
                  Start New Conversation
                </button>
                <div className="glass-card p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-purple-900">Voice Translation</p>
                      <p className="text-xs text-purple-700 mt-1">Speak in your language and send messages in English automatically</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-card-strong max-w-md w-full max-h-[600px] flex flex-col animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/40">
              <h2 className="text-xl font-bold text-gradient flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                Start New Conversation
              </h2>
              <button
                onClick={() => {
                  setShowNewConversationModal(false);
                  setUserSearchQuery('');
                  setSearchedUsers([]);
                }}
                className="glass-card hover:glass-card-medium p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-6 border-b border-white/40">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                <input
                  type="search"
                  placeholder="Search by name, email, or business..."
                  className="glass-input w-full pl-10"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <p className="text-xs text-purple-700 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Search for users to start a conversation
              </p>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-6">
              {isSearchingUsers ? (
                <div className="flex justify-center py-8">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              ) : userSearchQuery.length < 2 ? (
                <div className="text-center py-8">
                  <div className="glass-card p-8">
                    <Search className="w-12 h-12 mx-auto mb-3 text-purple-500" />
                    <p className="text-gray-700 font-medium">Start searching</p>
                    <p className="text-sm text-gray-600 mt-1">Type at least 2 characters to search</p>
                  </div>
                </div>
              ) : searchedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="glass-card p-8">
                    <Users className="w-12 h-12 mx-auto mb-3 text-purple-500" />
                    <p className="text-gray-700 font-medium">No users found</p>
                    <p className="text-sm text-gray-600 mt-1">Try a different search term</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchedUsers.map((searchedUser) => (
                    <div
                      key={searchedUser._id}
                      className="glass-card hover:glass-card-medium p-4 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-purple rounded-full flex items-center justify-center text-white font-bold shadow-md glass-avatar">
                              {searchedUser.profilePicture ? (
                                <img
                                  src={searchedUser.profilePicture}
                                  alt={searchedUser.displayName || searchedUser.businessName}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                (searchedUser.displayName || searchedUser.businessName || '?').charAt(0).toUpperCase()
                              )}
                            </div>
                            {searchedUser.onlineStatus === 'online' && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {searchedUser.displayName || searchedUser.businessName}
                            </h4>
                            <p className="text-xs text-gray-600 truncate">
                              {searchedUser.businessName && searchedUser.displayName !== searchedUser.businessName
                                ? searchedUser.businessName
                                : searchedUser.email}
                            </p>
                            {searchedUser.shopLocation?.city && (
                              <p className="text-xs text-purple-600">
                                📍 {searchedUser.shopLocation.city}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => startConversation(searchedUser._id)}
                          disabled={isCreatingConversation}
                          className="glass-button px-4 py-2 text-sm ml-2"
                        >
                          {isCreatingConversation ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Starting
                            </div>
                          ) : (
                            'Chat'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/40">
              <p className="text-xs text-center text-purple-700 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                You can message any user on the platform
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessagesPage;
