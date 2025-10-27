import React from 'react';
import {
  Menu,
  Search,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  User,
  Building,
  Globe,
  Sparkles,
  CheckCircle2,
  Bot,
  Scissors
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import useAuthStore from '../../store/authStore';
import useAppStore from '../../store/appStore';
import { formatRelativeTime } from '../../utils/formatters';
import { Link } from 'react-router-dom';

const Header = ({ onMenuClick, className, ...props }) => {
  const { user, logout } = useAuthStore();
  const {
    selectedLanguage,
    setLanguage,
    toggleMobileMenu,
    sidebarOpen,
    toggleSidebar
  } = useAppStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = React.useState(false);

  const handleLogout = async () => {
    await logout();
  };

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'New message from John Doe',
      message: 'Hey, I\'m interested in your latest collection...',
      time: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      type: 'message'
    },
    {
      id: 2,
      title: 'Order #1234 confirmed',
      message: 'Your order has been confirmed and will be shipped soon.',
      time: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
      type: 'order'
    },
    {
      id: 3,
      title: 'Welcome to the platform!',
      message: 'Complete your profile to get better matches.',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
      type: 'welcome'
    }
  ];

  const languages = [
    { code: 'english', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'hindi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
    { code: 'tamil', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
    { code: 'telugu', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' }
  ];

  const currentLanguage = languages.find(lang => lang.code === selectedLanguage) || languages[0];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className={cn('glass-card-strong border-b border-white/40 px-4 py-3 sticky top-0 z-50', className)} {...props}>
      <div className="flex items-center justify-between">
        {/* Left side - Menu and Search */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="glass-card hover:glass-card-medium p-2 rounded-xl lg:hidden transition-all"
          >
            <Menu className="w-5 h-5 text-purple-600" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-gradient flex items-center gap-2">
              Claire B2B
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <span className="glass-badge text-purple-700 text-xs font-bold px-2 py-1">Beta</span>
          </Link>

          {/* Search - Hidden on mobile */}
          <div className="hidden md:block min-w-64 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
              <input
                type="search"
                placeholder="Search products, users, communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input w-full pl-10 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right side - Actions and User */}
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          <button className="glass-card hover:glass-card-medium p-2 rounded-xl md:hidden transition-all">
            <Search className="w-5 h-5 text-purple-600" />
          </button>

          {/* Chat Bot Button */}
          <a
            href="https://frolicking-puffpuff-9f24c4.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card hover:glass-card-medium px-3 py-2 rounded-xl flex items-center gap-2 transition-all"
          >
            <Bot className="w-5 h-5 text-purple-600" />
            <span className="hidden lg:inline text-sm font-semibold text-gray-900">Chat Bot</span>
          </a>

          {/* Optimizer Button */}
          <a
            href="https://clothcut-utdsziznv9r37usfhsvy4u.streamlit.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card hover:glass-card-medium px-3 py-2 rounded-xl flex items-center gap-2 transition-all"
          >
            <Scissors className="w-5 h-5 text-purple-600" />
            <span className="hidden lg:inline text-sm font-semibold text-gray-900">Optimizer</span>
          </a>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="glass-card hover:glass-card-medium p-2 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Globe className="w-5 h-5 text-purple-600" />
              <span className="hidden sm:inline text-lg">{currentLanguage.flag}</span>
            </button>

            {showLanguageMenu && (
              <div className="absolute right-0 top-full mt-2 glass-card-strong rounded-2xl shadow-2xl py-2 w-56 z-50 animate-scaleIn">
                <div className="px-4 py-2 border-b border-white/40">
                  <p className="text-sm font-bold text-gradient flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Select Language
                  </p>
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLanguageMenu(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 text-left hover:bg-white/30 flex items-center gap-2.5 transition-all',
                      selectedLanguage === lang.code && 'bg-gradient-purple text-white'
                    )}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className={cn(
                      "text-sm font-medium",
                      selectedLanguage === lang.code ? 'text-white' : 'text-gray-900'
                    )}>
                      {lang.nativeName}
                    </span>
                    {selectedLanguage === lang.code && (
                      <CheckCircle2 className="w-4 h-4 ml-auto text-white" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <Link to="/messages" className="glass-card hover:glass-card-medium p-2 rounded-xl relative transition-all">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
              2
            </div>
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="glass-card hover:glass-card-medium p-2 rounded-xl relative transition-all"
            >
              <Bell className="w-5 h-5 text-purple-600" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                  {unreadCount}
                </div>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-96 glass-card-strong rounded-2xl shadow-2xl z-50 animate-scaleIn">
                <div className="p-4 border-b border-white/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gradient flex items-center gap-2">
                      <Bell className="w-5 h-5 text-purple-600" />
                      Notifications
                    </h3>
                    <button className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                      Mark all read
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto scrollbar-hide">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 border-b border-white/20 hover:bg-white/30 cursor-pointer transition-all',
                        !notification.read && 'bg-gradient-to-r from-purple-50/50 to-pink-50/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5",
                            notification.type === 'message' ? 'bg-purple-500' : 'bg-green-500'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-700 truncate mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-purple-600 mt-1 font-medium">
                            {formatRelativeTime(notification.time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-white/40">
                  <button className="w-full text-center text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="glass-card hover:glass-card-medium flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all"
            >
              <div className="w-8 h-8 bg-gradient-purple rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md glass-avatar">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.displayName || user.businessName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (user?.displayName || user?.businessName || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-bold text-gray-900">
                  {user?.businessName || user?.displayName}
                </div>
                <div className="text-xs text-purple-600 font-medium">
                  {user?.businessType || 'User'}
                </div>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 glass-card-strong rounded-2xl shadow-2xl py-2 z-50 animate-scaleIn">
                <div className="px-4 py-3 border-b border-white/40">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-purple rounded-full flex items-center justify-center text-white font-bold shadow-lg glass-avatar">
                      {user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.displayName || user.businessName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        (user?.displayName || user?.businessName || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">
                        {user?.businessName || user?.displayName}
                      </div>
                      <div className="text-xs text-gray-700 truncate">{user?.email}</div>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <Link
                    to="/profile"
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-900 hover:bg-white/30 flex items-center gap-3 transition-all"
                  >
                    <User className="w-4 h-4 text-purple-600" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/business"
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-900 hover:bg-white/30 flex items-center gap-3 transition-all"
                  >
                    <Building className="w-4 h-4 text-purple-600" />
                    <span>Business Settings</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-900 hover:bg-white/30 flex items-center gap-3 transition-all"
                  >
                    <Settings className="w-4 h-4 text-purple-600" />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="border-t border-white/40 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50/50 flex items-center gap-3 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside handlers */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
      {showLanguageMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLanguageMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;
