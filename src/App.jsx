import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import useAuthStore from './store/authStore';
import useAppStore from './store/appStore';
import socketService from './services/socket';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import Layout, { AuthLayout, OnboardingLayout } from './components/layout/Layout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OnboardingPage from './pages/auth/OnboardingPage';

// Main Pages
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import MessagesPage from './pages/MessagesPage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import CommunityJoinPage from './pages/CommunityJoinPage';
import BusinessPage from './pages/BusinessPage';
import ProfilePage from './pages/ProfilePage';
import ProductsPage from './pages/ProductsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CreatePostPage from './pages/CreatePostPage';
import AdsPage from './pages/AdsPage';
import NetworkPage from './pages/NetworkPage';
import SettingsPage from './pages/SettingsPage';

// Error Pages
import NotFoundPage from './pages/NotFoundPage';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, requiresOnboarding } = useAuthStore();
  
  if (isLoading) {
    return <Layout.Loading message="Checking authentication..." />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiresOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, requiresOnboarding } = useAuthStore();
  
  if (isLoading) {
    return <Layout.Loading message="Loading..." />;
  }
  
  if (isAuthenticated && !requiresOnboarding) {
    return <Navigate to="/" replace />;
  }
  
  if (isAuthenticated && requiresOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
};

const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, isLoading, requiresOnboarding } = useAuthStore();
  
  if (isLoading) {
    return <Layout.Loading message="Loading..." />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!requiresOnboarding) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const { initAuth, isAuthenticated } = useAuthStore();
  const { initializeApp } = useAppStore();

  useEffect(() => {
    // Initialize app
    initializeApp();
    
    // Initialize authentication
    initAuth();
  }, [initAuth, initializeApp]);

  useEffect(() => {
    // Initialize socket connection when authenticated
    if (isAuthenticated) {
      socketService.connect();
    }
    
    return () => {
      if (isAuthenticated) {
        socketService.disconnect();
      }
    };
  }, [isAuthenticated]);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Router>
          <div className="App">
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              </PublicRoute>
            } />
            
            <Route path="/register" element={
              <PublicRoute>
                <AuthLayout>
                  <RegisterPage />
                </AuthLayout>
              </PublicRoute>
            } />

            {/* Onboarding Route */}
            <Route path="/onboarding" element={
              <OnboardingRoute>
                <OnboardingLayout currentStep={1} totalSteps={3}>
                  <OnboardingPage />
                </OnboardingLayout>
              </OnboardingRoute>
            } />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/discover" element={
              <ProtectedRoute>
                <Layout>
                  <DiscoverPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/communities" element={
              <ProtectedRoute>
                <Layout>
                  <CommunitiesPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/communities/:id" element={
              <ProtectedRoute>
                <CommunityDetailPage />
              </ProtectedRoute>
            } />

            <Route path="/communities/join/:inviteLink" element={
              <ProtectedRoute>
                <CommunityJoinPage />
              </ProtectedRoute>
            } />

            <Route path="/messages" element={
              <ProtectedRoute>
                <Layout>
                  <MessagesPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/business" element={
              <ProtectedRoute>
                <Layout>
                  <BusinessPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/profile/:userId" element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/products" element={
              <ProtectedRoute>
                <Layout>
                  <ProductsPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/analytics" element={
              <ProtectedRoute>
                <Layout>
                  <AnalyticsPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/create" element={
              <ProtectedRoute>
                <Layout>
                  <CreatePostPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/ads" element={
              <ProtectedRoute>
                <Layout>
                  <AdsPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/network" element={
              <ProtectedRoute>
                <Layout>
                  <NetworkPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </Router>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
