import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  MessageSquare,
  Search,
  PlusSquare,
  Building,
  Settings,
  HelpCircle,
  Megaphone,
  ShoppingBag,
  UserCheck,
  BarChart3,
  Bookmark,
  Calendar,
  X,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import useAuthStore from '../../store/authStore';
import useAppStore from '../../store/appStore';

const Sidebar = ({ className, ...props }) => {
  const { user } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useAppStore();
  const location = useLocation();

  const navigation = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      description: 'Your personalized feed'
    },
    {
      name: 'Discover',
      href: '/discover',
      icon: Search,
      description: 'Find new products and businesses'
    },
    {
      name: 'Communities',
      href: '/communities',
      icon: Users,
      description: 'Join textile communities',
      badge: 'New'
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      description: 'Chat with businesses',
      badge: 3
    },
    {
      name: 'My Business',
      href: '/business',
      icon: Building,
      description: 'Manage your business profile'
    },
    {
      name: 'Products',
      href: '/products',
      icon: ShoppingBag,
      description: 'Your product catalog'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Business insights and metrics'
    }
  ];

  const secondaryNavigation = [
    {
      name: 'Create Post',
      href: '/create',
      icon: PlusSquare,
      description: 'Share your products'
    },
    {
      name: 'Advertisements',
      href: '/ads',
      icon: Megaphone,
      description: 'Promote your business'
    },
    {
      name: 'Network',
      href: '/network',
      icon: UserCheck,
      description: 'Connect with businesses'
    }
  ];

  const bottomNavigation = [
    {
      name: 'Saved',
      href: '/saved',
      icon: Bookmark,
      description: 'Your saved content'
    },
    {
      name: 'Events',
      href: '/events',
      icon: Calendar,
      description: 'Industry events and webinars'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Account and app settings'
    },
    {
      name: 'Help',
      href: '/help',
      icon: HelpCircle,
      description: 'Support and documentation'
    }
  ];

  const NavItem = ({ item, onClick }) => {
    const isActive = location.pathname === item.href;

    return (
      <NavLink
        to={item.href}
        onClick={onClick}
        className={cn(
          'group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200',
          isActive
            ? 'bg-gradient-purple text-white shadow-lg scale-[1.02]'
            : 'text-gray-700 hover:bg-white/30 hover:text-purple-700'
        )}
      >
        <item.icon
          className={cn(
            'mr-3 flex-shrink-0 h-5 w-5',
            isActive ? 'text-white' : 'text-purple-600 group-hover:text-purple-700'
          )}
        />
        <span className="flex-1">{item.name}</span>

        {item.badge && (
          <div className={cn(
            "ml-2 px-2 py-0.5 rounded-full text-xs font-bold shadow-md",
            typeof item.badge === 'number' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          )}>
            {item.badge}
          </div>
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full glass-card-strong border-r border-white/40">
      {/* Mobile header */}
      <div className="flex items-center justify-between p-4 border-b border-white/40 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold text-gradient flex items-center gap-2">
            Claire B2B
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <span className="glass-badge text-purple-700 text-xs font-bold px-2 py-1">Beta</span>
        </div>
        <button
          onClick={closeSidebar}
          className="glass-card hover:glass-card-medium p-2 rounded-xl transition-all"
        >
          <X className="w-5 h-5 text-purple-600" />
        </button>
      </div>

      {/* User profile section */}
      <div className="p-4 border-b border-white/40">
        <div className="glass-card p-4 hover:glass-card-medium transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-purple rounded-full flex items-center justify-center text-white font-bold shadow-lg glass-avatar relative">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.displayName || user.businessName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (user?.displayName || user?.businessName || 'U').charAt(0).toUpperCase()
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate flex items-center gap-1">
                {user?.businessName || user?.displayName}
                {user?.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
              </div>
              <div className="text-xs text-purple-600 font-medium truncate">
                {user?.businessType || 'Individual'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
        {/* Primary navigation */}
        <nav className="px-3 space-y-1.5">
          {navigation.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              onClick={() => window.innerWidth < 1024 && closeSidebar()}
            />
          ))}
        </nav>

        {/* Secondary navigation */}
        <div className="mt-8 px-3">
          <h3 className="px-3 text-xs font-bold text-gradient uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            Quick Actions
          </h3>
          <div className="space-y-1.5">
            {secondaryNavigation.map((item) => (
              <NavItem
                key={item.name}
                item={item}
                onClick={() => window.innerWidth < 1024 && closeSidebar()}
              />
            ))}
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="mt-8 px-3">
          <div className="space-y-1.5">
            {bottomNavigation.map((item) => (
              <NavItem
                key={item.name}
                item={item}
                onClick={() => window.innerWidth < 1024 && closeSidebar()}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/40">
        <div className="glass-card p-3 text-center">
          <div className="text-xs font-bold text-gradient mb-1">Claire B2B v1.0</div>
          <div className="text-xs text-purple-600">© 2024 All rights reserved</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn('hidden lg:block lg:w-64 lg:flex-shrink-0', className)} {...props}>
        <div className="h-full">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={closeSidebar}
          />

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden animate-slideIn">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
