import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Users, MessageSquare, Share2, Copy, Link2, UserPlus, UserMinus,
  Shield, Crown, Ban, Volume2, VolumeX, ArrowLeft,
  Send, Mic, Languages, Globe, CheckCircle2, Info, Sparkles, X
} from 'lucide-react';
import { Button, Avatar, Badge, Input, Loading } from '../components/ui';
import { formatCompactNumber, formatRelativeTime } from '../utils/formatters';
import { communitiesAPI } from '../services/api';
import useAppStore from '../store/appStore';
import socketService from '../services/socket';
import sarvamAI from '../services/sarvamAI';
import toast from 'react-hot-toast';

const CommunityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppStore();

  const [community, setCommunity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchMembers, setSearchMembers] = useState('');

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState('ta-IN');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(null);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartTimeRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadCommunity();
  }, [id]);

  const loadCommunity = async () => {
    setIsLoading(true);
    try {
      const response = await communitiesAPI.get(id);
      setCommunity(response.data.community);
    } catch (error) {
      console.error('Failed to load community:', error);
      toast.error('Failed to load community');
      navigate('/communities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat' && community && id) {
      loadMessages();
    }
  }, [activeTab, id, community]);

  useEffect(() => {
    if (!socketService.socket || !id) return;

    const joinCommunityRoom = () => {
      if (socketService.isConnected) {
        socketService.emit('join_community', { communityId: id });
      } else {
        setTimeout(() => {
          if (socketService.isConnected) {
            socketService.emit('join_community', { communityId: id });
          }
        }, 1000);
      }
    };

    joinCommunityRoom();

    const handleNewMessage = ({ communityId, message }) => {
      console.log('Received community message:', message);
      if (communityId === id) {
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      }
    };

    const handleTypingStart = ({ communityId, userId, userName }) => {
      if (communityId === id && userId !== user?._id) {
        setTypingUsers(prev => new Set(prev).add(userName));
      }
    };

    const handleTypingStop = ({ communityId, userId }) => {
      if (communityId === id && userId !== user?._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          return newSet;
        });
      }
    };

    socketService.on('new_community_message', handleNewMessage);
    socketService.on('community_typing_start', handleTypingStart);
    socketService.on('community_typing_stop', handleTypingStop);

    return () => {
      if (socketService.isConnected) {
        socketService.emit('leave_community', { communityId: id });
      }
      socketService.off('new_community_message', handleNewMessage);
      socketService.off('community_typing_start', handleTypingStart);
      socketService.off('community_typing_stop', handleTypingStop);
    };
  }, [id, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const response = await communitiesAPI.getMessages(id, { page: 1, limit: 50 });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const messageText = inputText.trim();
    if (!messageText || !socketService.socket) return;

    const member = community?.members.find(m => m.user._id === user?._id);
    if (member?.status === 'muted') {
      toast.error('You are muted in this community');
      return;
    }

    socketService.emit('send_community_message', {
      communityId: id,
      content: {
        original: {
          text: messageText,
          language: 'en'
        }
      },
      type: 'text'
    });

    setInputText('');
    stopTyping();
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (e.target.value && socketService.socket) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const startTyping = () => {
    if (!socketService.socket) return;
    socketService.emit('community_typing_start', {
      communityId: id,
      userName: user?.displayName || user?.businessName
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(), 3000);
  };

  const stopTyping = () => {
    if (!socketService.socket) return;
    socketService.emit('community_typing_stop', { communityId: id });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const startRecording = async () => {
    if (!sarvamAI.isConfigured()) {
      toast.error('Sarvam AI is not configured. Please add VITE_SARVAM_API_KEY to your .env file');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunksRef.current.push(event.data);
      });

      mediaRecorder.addEventListener('stop', async () => {
        const recordingDuration = Date.now() - recordingStartTimeRef.current;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (recordingDuration < 1000) {
          toast.error('Recording too short. Please hold for at least 1 second.');
          setIsRecording(false);
          return;
        }
        if (audioBlob.size < 1000) {
          toast.error('Recording too small. Please speak louder or longer.');
          setIsRecording(false);
          return;
        }
        await transcribeAudio(audioBlob);
      });

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      toast.error('Microphone access denied or not available');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    const supportedLanguages = sarvamAI.getSupportedLanguages();
    const languageName = supportedLanguages.find(l => l.code === voiceLanguage)?.name || 'Tamil';
    const loadingToast = toast.loading(`Translating ${languageName} to English...`);

    try {
      const result = await sarvamAI.translateSpeechToEnglish(audioBlob, { model: 'saaras:v2' });
      toast.dismiss(loadingToast);

      if (result.success) {
        const translatedText = result.translatedText;
        if (!translatedText || translatedText.trim() === '') {
          toast.error('No speech detected. Please speak louder and longer (at least 2-3 seconds).');
          return;
        }
        const language = result.detectedLanguage;
        setDetectedLanguage(language);
        setInputText(prev => prev + (prev ? ' ' : '') + translatedText);

        const detectedLanguageName = supportedLanguages.find(l => l.code === language)?.name || language;
        toast.success(
          <div>
            <strong>Translated from {detectedLanguageName} to English!</strong>
            <div className="text-sm mt-1">"{translatedText}"</div>
          </div>,
          { duration: 4000 }
        );
      } else {
        toast.error(result.error || 'Speech recognition failed. Please try again.');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Transcription error:', error);
      toast.error('Speech recognition failed. Please try again.');
    } finally {
      setIsTranscribing(false);
      setIsRecording(false);
    }
  };

  const handleGenerateInviteLink = async () => {
    try {
      const response = await communitiesAPI.generateInviteLink(id);
      setCommunity(prev => ({ ...prev, inviteLink: response.data.inviteLink.split('/').pop() }));
      toast.success('New invite link generated!');
    } catch (error) {
      toast.error('Failed to generate invite link');
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/communities/join/${community.inviteLink}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite link copied to clipboard!');
  };

  const handleShareInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/communities/join/${community.inviteLink}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${community.name}`,
          text: `Join our community "${community.name}" on Claire B2B!`,
          url: inviteUrl
        });
      } catch (error) {
        if (error.name !== 'AbortError') handleCopyInviteLink();
      }
    } else {
      handleCopyInviteLink();
    }
  };

  const handleLeaveCommunity = async () => {
    if (!confirm('Are you sure you want to leave this community?')) return;
    try {
      await communitiesAPI.leave(id);
      toast.success('Left community successfully');
      navigate('/communities');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave community');
    }
  };

  const handleManageMember = async (memberId, action) => {
    try {
      await communitiesAPI.manageMember(id, memberId, { action });
      toast.success(`Member ${action}d successfully`);
      loadCommunity();
      setShowMemberModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to manage member');
    }
  };

  const InviteModal = () => (
    showInviteModal && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="glass-card-strong max-w-md w-full p-6 animate-scaleIn">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gradient flex items-center gap-2">
              <Share2 className="w-6 h-6" />
              Invite People
            </h2>
            <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Invite Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/communities/join/${community.inviteLink || ''}`}
                  readOnly
                  className="glass-input flex-1 text-sm"
                />
                <button onClick={handleCopyInviteLink} className="glass-button-secondary px-4 py-2 flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button onClick={handleShareInviteLink} className="glass-button w-full flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Link
            </button>

            {community?.isAdmin && (
              <button onClick={handleGenerateInviteLink} className="glass-button-accent w-full flex items-center justify-center gap-2">
                <Link2 className="w-5 h-5" />
                Generate New Link
              </button>
            )}

            <p className="text-xs text-gray-600 text-center mt-4">
              Anyone with this link can join the community
            </p>
          </div>
        </div>
      </div>
    )
  );

  const MemberModal = () => (
    showMemberModal && selectedMember && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="glass-card-strong max-w-sm w-full p-6 animate-scaleIn">
          <div className="text-center mb-6">
            <Avatar
              src={selectedMember.user.profilePicture}
              name={selectedMember.user.displayName}
              size="xl"
              className="mx-auto mb-4 glass-avatar"
            />
            <h3 className="text-xl font-bold text-gray-900">{selectedMember.user.displayName}</h3>
            <p className="text-sm text-gray-600">{selectedMember.user.businessName}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="glass-badge text-purple-700">{selectedMember.role}</span>
              <span className={`glass-badge ${selectedMember.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>
                {selectedMember.status}
              </span>
            </div>
          </div>

          {community?.isAdmin && selectedMember.user._id !== user?._id && (
            <div className="space-y-2 mb-4">
              {selectedMember.role === 'member' && (
                <button onClick={() => handleManageMember(selectedMember.user._id, 'promote')} className="glass-button-secondary w-full flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  Make Moderator
                </button>
              )}
              {selectedMember.role === 'moderator' && (
                <button onClick={() => handleManageMember(selectedMember.user._id, 'demote')} className="glass-button-secondary w-full flex items-center justify-center gap-2">
                  <UserMinus className="w-4 h-4" />
                  Remove as Moderator
                </button>
              )}
              {selectedMember.status === 'active' && (
                <>
                  <button onClick={() => handleManageMember(selectedMember.user._id, 'mute')} className="glass-button-secondary w-full flex items-center justify-center gap-2">
                    <VolumeX className="w-4 h-4" />
                    Mute Member
                  </button>
                  <button onClick={() => handleManageMember(selectedMember.user._id, 'ban')} className="glass-button-accent w-full flex items-center justify-center gap-2">
                    <Ban className="w-4 h-4" />
                    Ban from Community
                  </button>
                </>
              )}
              {selectedMember.status === 'muted' && (
                <button onClick={() => handleManageMember(selectedMember.user._id, 'unmute')} className="glass-button w-full flex items-center justify-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Unmute Member
                </button>
              )}
              {selectedMember.status === 'banned' && (
                <button onClick={() => handleManageMember(selectedMember.user._id, 'unban')} className="glass-button w-full flex items-center justify-center gap-2">
                  Unban Member
                </button>
              )}
            </div>
          )}

          <button onClick={() => setShowMemberModal(false)} className="glass-button-secondary w-full">
            Close
          </button>
        </div>
      </div>
    )
  );

  const ChatTab = () => {
    const supportedLanguages = sarvamAI.getSupportedLanguages();
    const selectedLanguageObj = supportedLanguages.find(l => l.code === voiceLanguage) || supportedLanguages[0];

    const groupMessagesByDate = (messages) => {
      const groups = {};
      messages.forEach(msg => {
        const date = new Date(msg.createdAt).toDateString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
      });
      return groups;
    };

    const messageGroups = messages.length > 0 ? groupMessagesByDate(messages) : {};

    const formatDateHeader = (dateString) => {
      const date = new Date(dateString);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (dateString === today) return 'Today';
      if (dateString === yesterday) return 'Yesterday';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          {isLoadingMessages ? (
            <div className="flex flex-col justify-center items-center h-full">
              <div className="glass-card-strong p-8 animate-scaleIn">
                <Loading size="lg" />
                <p className="text-gray-600 mt-4 text-sm">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full px-4">
              <div className="glass-card-strong p-12 max-w-md text-center animate-scaleIn">
                <div className="w-20 h-20 bg-gradient-purple rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg glow-purple">
                  <MessageSquare className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gradient mb-3">Welcome to {community?.name}!</h3>
                <p className="text-gray-700 mb-2">This is the beginning of your community chat.</p>
                <p className="text-sm text-gray-600 mb-6">
                  Share ideas, collaborate, and connect with {formatCompactNumber(community?.stats?.totalMembers || 0)} members
                </p>
                <div className="glass-card p-4">
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
            <div className="space-y-4 max-w-5xl mx-auto">
              {Object.entries(messageGroups).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex items-center justify-center my-6">
                    <div className="glass-badge text-gray-700 px-4 py-1.5">
                      {formatDateHeader(date)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {msgs.map((message, index) => {
                      const isOwn = message.sender._id === user?._id;
                      const showAvatar = !isOwn && (index === msgs.length - 1 || msgs[index + 1]?.sender._id !== message.sender._id);

                      return (
                        <div key={message._id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-2 animate-fadeIn`}>
                          <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                            {showAvatar ? (
                              <Avatar
                                src={message.sender.profilePicture}
                                name={message.sender.displayName}
                                size="sm"
                                className="flex-shrink-0 mb-0.5 glass-avatar"
                              />
                            ) : (
                              <div className="w-8 flex-shrink-0" />
                            )}

                            <div className="flex flex-col group">
                              {!isOwn && (index === 0 || msgs[index - 1]?.sender._id !== message.sender._id) && (
                                <span className="text-xs font-semibold mb-1 ml-3 text-gradient">
                                  {message.sender.displayName || message.sender.businessName}
                                </span>
                              )}

                              <div className={isOwn ? 'message-bubble-own' : 'message-bubble-other'}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {message.content?.original?.text ||
                                   message.content?.text ||
                                   (typeof message.content === 'string' ? message.content : null) ||
                                   message.text ||
                                   '[No content]'}
                                </p>
                                <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/80' : 'text-gray-600'} text-[10px]`}>
                                  <span>{new Date(message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                                  {isOwn && <CheckCircle2 className="w-3 h-3" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {typingUsers.size > 0 && (
                <div className="flex items-start gap-2 px-2 animate-fadeIn">
                  <Avatar size="sm" className="glass-avatar" />
                  <div className="glass-card px-4 py-3 rounded-2xl">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="glass-card-strong border-t border-white/40 px-4 py-3">
          {(isRecording || detectedLanguage) && (
            <div className="mb-3 glass-card px-4 py-2.5 rounded-xl flex items-center justify-between text-sm animate-fadeIn">
              {isRecording && (
                <span className="flex items-center text-red-600 font-semibold">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 pulse-recording"></span>
                  Recording in {selectedLanguageObj.nativeName}...
                </span>
              )}
              {detectedLanguage && !isRecording && (
                <span className="flex items-center text-purple-700 font-semibold">
                  <Globe className="w-4 h-4 mr-2" />
                  Detected: {supportedLanguages.find(l => l.code === detectedLanguage)?.name}
                </span>
              )}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
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
                } disabled:opacity-50`}
              >
                {isTranscribing ? (
                  <div className="flex gap-1">
                    <div className="w-1 h-5 bg-white rounded-full animate-bounce"></div>
                    <div className="w-1 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLanguageSelector(!showLanguageSelector);
                  }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-purple text-white rounded-full flex items-center justify-center hover:glow-purple transition-all"
                >
                  <Languages className="w-3 h-3" />
                </button>
              </button>

              {showLanguageSelector && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLanguageSelector(false)} />
                  <div className="absolute bottom-full mb-2 left-0 glass-card-strong p-2 z-50 max-h-80 overflow-y-auto w-56 animate-scaleIn">
                    <div className="text-xs font-bold text-gray-700 px-3 py-2 mb-1 border-b border-white/40">
                      Select Voice Language
                    </div>
                    {supportedLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setVoiceLanguage(lang.code);
                          setShowLanguageSelector(false);
                          toast.success(`Voice language: ${lang.name}`);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                          voiceLanguage === lang.code ? 'glass-card text-purple-700' : 'hover:glass-card'
                        }`}
                      >
                        <div className="font-semibold text-sm text-gray-900">{lang.nativeName}</div>
                        <div className="text-xs text-gray-600">{lang.name}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={isRecording ? '🎤 Recording...' : 'Type a message...'}
              disabled={isTranscribing || isRecording}
              className="glass-input flex-1"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isTranscribing || !socketService.socket}
              className={`p-3 rounded-full transition-all duration-200 shadow-md flex-shrink-0 ${
                inputText.trim() && socketService.socket
                  ? 'glass-button hover:scale-110 glow-purple'
                  : 'glass-card text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  };

  const MembersTab = () => {
    const filteredMembers = community?.members.filter(member =>
      member.user.displayName?.toLowerCase().includes(searchMembers.toLowerCase()) ||
      member.user.businessName?.toLowerCase().includes(searchMembers.toLowerCase())
    ) || [];

    return (
      <div className="p-4">
        <div className="mb-4">
          <input
            type="search"
            placeholder="Search members..."
            value={searchMembers}
            onChange={(e) => setSearchMembers(e.target.value)}
            className="glass-input w-full"
          />
        </div>

        <button onClick={() => setShowInviteModal(true)} className="glass-button w-full mb-4 flex items-center justify-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add Members
        </button>

        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-2 font-semibold">
            {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
          </p>

          {filteredMembers.map((member) => (
            <div
              key={member.user._id}
              onClick={() => {
                setSelectedMember(member);
                setShowMemberModal(true);
              }}
              className="glass-card hover:glass-card-medium p-3 cursor-pointer transition-all animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar
                    src={member.user.profilePicture}
                    name={member.user.displayName}
                    size="md"
                    className="glass-avatar"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{member.user.displayName}</h4>
                    <p className="text-sm text-gray-600 truncate">{member.user.businessName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {community.creator._id === member.user._id && <Crown className="w-4 h-4 text-yellow-500" />}
                  {member.role === 'moderator' && <Shield className="w-4 h-4 text-purple-500" />}
                  {member.status === 'muted' && <VolumeX className="w-4 h-4 text-orange-500" />}
                  {member.status === 'banned' && <Ban className="w-4 h-4 text-red-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AboutTab = () => (
    <div className="p-4 space-y-6">
      <div className="glass-card p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Description
        </h3>
        <p className="text-gray-900 leading-relaxed">{community?.description || 'No description provided'}</p>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {community?.categories.map((category) => (
            <span key={category} className="glass-badge text-purple-700">{category}</span>
          ))}
        </div>
      </div>

      {community?.targetLocations && community.targetLocations.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Target Locations</h3>
          <div className="flex flex-wrap gap-2">
            {community.targetLocations.map((location, index) => (
              <span key={index} className="glass-badge text-green-700">{location.city}</span>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card-medium p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Members</p>
            <p className="text-3xl font-bold text-gradient">{formatCompactNumber(community?.stats?.totalMembers || 0)}</p>
          </div>
          <div className="glass-card-medium p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Posts</p>
            <p className="text-3xl font-bold text-gradient">{formatCompactNumber(community?.stats?.totalPosts || 0)}</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">Created</h3>
        <p className="text-gray-900 font-medium">
          {new Date(community?.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {community?.isMember && !community?.isAdmin && (
        <button onClick={handleLeaveCommunity} className="glass-button-accent w-full flex items-center justify-center gap-2">
          <UserMinus className="w-5 h-5" />
          Leave Community
        </button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="glass-card-strong p-8 animate-scaleIn">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  if (!community) return null;

  return (
    <>
      <Helmet>
        <title>{community.name} - Claire B2B</title>
      </Helmet>

      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="glass-card-strong border-b border-white/40 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/communities')} className="glass-card hover:glass-card-medium p-2 rounded-full transition-all">
                <ArrowLeft className="w-5 h-5 text-purple-600" />
              </button>
              <div className="flex items-center gap-3">
                {community.icon ? (
                  <img src={community.icon} alt={community.name} className="w-10 h-10 rounded-full glass-avatar" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-purple rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {community.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-gray-900 flex items-center gap-2">
                    {community.name}
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  </h1>
                  <p className="text-xs text-gray-600">{formatCompactNumber(community.memberCount || community.stats?.totalMembers || 0)} members</p>
                </div>
              </div>
            </div>

            <button onClick={() => setShowInviteModal(true)} className="glass-button px-4 py-2 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Invite</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card border-b border-white/40">
          <div className="flex">
            {[
              { id: 'chat', icon: MessageSquare, label: 'Chat' },
              { id: 'members', icon: Users, label: 'Members' },
              { id: 'about', icon: Info, label: 'About' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-purple-500'
                }`}
              >
                <tab.icon className="w-4 h-4 inline-block mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'members' && <MembersTab />}
          {activeTab === 'about' && <AboutTab />}
        </div>

        <InviteModal />
        <MemberModal />
      </div>
    </>
  );
};

export default CommunityDetailPage;
