import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>Page Not Found - WholeSale Connect</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <svg
              className="w-32 h-32 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8a7.962 7.962 0 01-2.291 5.657z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Page Not Found
            </h2>
            <p className="text-gray-600 mb-8">
              Sorry, the page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link to="/" className="block">
              <Button fullWidth icon={Home} size="lg">
                Go to Home
              </Button>
            </Link>
            
            <Link to="/discover" className="block">
              <Button variant="outline" fullWidth icon={Search} size="lg">
                Discover Products
              </Button>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go Back</span>
            </button>
          </div>

          {/* Help Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Need help? Try these popular sections:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/communities" className="text-primary-600 hover:text-primary-700">
                Communities
              </Link>
              <Link to="/marketplace" className="text-primary-600 hover:text-primary-700">
                Marketplace
              </Link>
              <Link to="/help" className="text-primary-600 hover:text-primary-700">
                Help Center
              </Link>
              <Link to="/contact" className="text-primary-600 hover:text-primary-700">
                Contact Support
              </Link>
            </div>
          </div>

          {/* Brand */}
          <div className="mt-12">
            <div className="text-primary-600 font-bold text-lg">
              WholeSale Connect
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your B2B Textile Marketplace
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
