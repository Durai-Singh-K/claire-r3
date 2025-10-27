import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Sidebar from './Sidebar';
import { cn } from '../../utils/helpers';
import useAuthStore from '../../store/authStore';
import useAppStore from '../../store/appStore';
import { Loading } from '../ui';

const Layout = ({ children, className, ...props }) => {
  const { isLoading: authLoading } = useAuthStore();
  const { sidebarOpen } = useAppStore();

  // Show loading screen while auth is initializing
  if (authLoading) {
    return <Loading.Page message="Loading application..." />;
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)} {...props}>
      {/* Header */}
      <Header />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: '#10B981',
              secondary: 'white',
            },
          },
          error: {
            duration: 5000,
            theme: {
              primary: '#EF4444',
              secondary: 'white',
            },
          },
        }}
      />
    </div>
  );
};

// Auth Layout (for login/register pages)
const AuthLayout = ({ children, className, ...props }) => {
  const { isLoading: authLoading } = useAuthStore();

  if (authLoading) {
    return <Loading.Page message="Loading..." />;
  }

  return (
    <div 
      className={cn(
        'min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4',
        className
      )} 
      {...props}
    >
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
};

// Onboarding Layout
const OnboardingLayout = ({ children, currentStep, totalSteps, className, ...props }) => {
  const { user } = useAuthStore();

  return (
    <div className={cn('min-h-screen bg-gray-50', className)} {...props}>
      {/* Progress header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-lg font-semibold text-gray-900">
                Welcome to WholeSale Connect
              </div>
              {user?.displayName && (
                <div className="text-sm text-gray-500">
                  Hi, {user.displayName}!
                </div>
              )}
            </div>
            
            {currentStep && totalSteps && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  Step {currentStep} of {totalSteps}
                </span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Toast notifications */}
      <Toaster position="top-center" />
    </div>
  );
};

// Error Layout
const ErrorLayout = ({ error, onRetry, className, ...props }) => {
  return (
    <div 
      className={cn(
        'min-h-screen bg-gray-50 flex items-center justify-center p-4',
        className
      )} 
      {...props}
    >
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-6">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-primary"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

// Loading Layout
const LoadingLayout = ({ message = 'Loading...', className, ...props }) => {
  return (
    <div 
      className={cn(
        'min-h-screen bg-gray-50 flex items-center justify-center',
        className
      )} 
      {...props}
    >
      <div className="text-center">
        <Loading size="xl" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
};

// Export all layouts
Layout.Auth = AuthLayout;
Layout.Onboarding = OnboardingLayout;
Layout.Error = ErrorLayout;
Layout.Loading = LoadingLayout;

export default Layout;
export { AuthLayout, OnboardingLayout, ErrorLayout, LoadingLayout };
