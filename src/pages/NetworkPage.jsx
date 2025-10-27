import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserCheck, Users, Search, Filter, UserPlus, MessageSquare } from 'lucide-react';
import { Button, Avatar, Badge, Input, Loading } from '../components/ui';
import { formatRelativeTime } from '../utils/formatters';

const NetworkPage = () => {
  const [activeTab, setActiveTab] = useState('connections');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const connections = [
    {
      id: 1,
      name: 'Rajesh Textiles',
      businessType: 'Manufacturer',
      location: 'Mumbai, Maharashtra',
      avatar: null,
      isVerified: true,
      connectionDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      mutualConnections: 5
    },
    {
      id: 2,
      name: 'Priya Fabrics Ltd',
      businessType: 'Wholesaler',
      location: 'Delhi, Delhi',
      avatar: null,
      isVerified: false,
      connectionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      mutualConnections: 3
    }
  ];

  const suggestions = [
    {
      id: 1,
      name: 'Mumbai Cotton Mills',
      businessType: 'Manufacturer',
      location: 'Mumbai, Maharashtra',
      avatar: null,
      isVerified: true,
      mutualConnections: 8,
      reason: 'Similar business interests'
    },
    {
      id: 2,
      name: 'Chennai Silk Weavers',
      businessType: 'Manufacturer',
      location: 'Chennai, Tamil Nadu',
      avatar: null,
      isVerified: true,
      mutualConnections: 4,
      reason: 'Located nearby'
    }
  ];

  const ConnectionCard = ({ connection, showConnectButton = false }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <Avatar
          src={connection.avatar}
          name={connection.name}
          size="lg"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {connection.name}
            </h3>
            {connection.isVerified && <Badge.Verification verified />}
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            {connection.businessType}
          </p>
          
          <p className="text-sm text-gray-500 mb-3">
            {connection.location}
          </p>

          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
            {connection.mutualConnections > 0 && (
              <span>{connection.mutualConnections} mutual connections</span>
            )}
            {connection.connectionDate && (
              <span>Connected {formatRelativeTime(connection.connectionDate)}</span>
            )}
            {connection.reason && (
              <span>• {connection.reason}</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {showConnectButton ? (
              <Button size="sm" icon={UserPlus}>
                Connect
              </Button>
            ) : (
              <Button size="sm" variant="outline" icon={MessageSquare}>
                Message
              </Button>
            )}
            <Button size="sm" variant="outline">
              View Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Network - WholeSale Connect</title>
        <meta name="description" content="Build your professional network and connect with textile businesses." />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              My Network
            </h1>
            <p className="text-gray-600">
              Build connections with textile businesses and industry professionals
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Input
              type="search"
              placeholder="Search network..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
              className="w-64"
            />
            <Button variant="outline" icon={Filter}>
              Filter
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Connections</p>
                <p className="text-2xl font-bold text-gray-900">127</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'connections'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'suggestions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Suggestions ({suggestions.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'requests'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Requests (5)
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'connections' && (
            <>
              {connections.length > 0 ? (
                connections.map((connection) => (
                  <ConnectionCard key={connection.id} connection={connection} />
                ))
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No connections yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start building your network by connecting with textile businesses
                  </p>
                  <Button onClick={() => setActiveTab('suggestions')}>
                    Find Connections
                  </Button>
                </div>
              )}
            </>
          )}

          {activeTab === 'suggestions' && (
            <>
              {suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                  <ConnectionCard 
                    key={suggestion.id} 
                    connection={suggestion} 
                    showConnectButton={true}
                  />
                ))
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No suggestions available
                  </h3>
                  <p className="text-gray-600">
                    Check back later for new connection suggestions
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pending requests
              </h3>
              <p className="text-gray-600">
                Connection requests will appear here
              </p>
            </div>
          )}
        </div>

        {/* Load More */}
        {((activeTab === 'connections' && connections.length > 0) || 
          (activeTab === 'suggestions' && suggestions.length > 0)) && (
          <div className="text-center mt-8">
            <Button variant="outline" loading={isLoading}>
              Load More
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default NetworkPage;
