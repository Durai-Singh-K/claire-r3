import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Megaphone, Plus, TrendingUp, Eye, BarChart3 } from 'lucide-react';
import { Button, Badge } from '../components/ui';

const AdsPage = () => {
  return (
    <>
      <Helmet>
        <title>Advertisements - WholeSale Connect</title>
        <meta name="description" content="Promote your business and products with targeted advertisements." />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Advertisements
            </h1>
            <p className="text-gray-600">
              Promote your business and products to reach more customers
            </p>
          </div>
          
          <Button icon={Plus}>
            Create Ad Campaign
          </Button>
        </div>

        {/* Coming Soon */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Megaphone className="w-8 h-8 text-primary-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Advertisement Platform Coming Soon
          </h3>
          
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            We're building a powerful advertising platform to help you promote your textile business, 
            showcase your products, and reach potential customers across the platform.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Targeted Promotion</h4>
              <p className="text-sm text-gray-600">
                Reach the right audience based on location, business type, and interests
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Brand Visibility</h4>
              <p className="text-sm text-gray-600">
                Increase your brand visibility and showcase your products effectively
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Performance Analytics</h4>
              <p className="text-sm text-gray-600">
                Track campaign performance with detailed analytics and insights
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="outline" disabled>
              Get Notified When Available
            </Button>
            <p className="text-xs text-gray-500">
              We'll notify you as soon as the advertising platform is ready
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdsPage;
