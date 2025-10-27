import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, Users, Eye, MessageSquare, Heart, BarChart3, Calendar, Download } from 'lucide-react';
import { Button, Badge, Loading } from '../components/ui';
import { formatCompactNumber, formatCurrency } from '../utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const AnalyticsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Mock analytics data
      const mockData = {
        overview: {
          profileViews: 1250,
          inquiries: 45,
          likes: 123,
          connections: 89,
          conversionRate: 3.6
        },
        growth: [
          { date: '2024-01-01', views: 120, inquiries: 8, connections: 5 },
          { date: '2024-01-02', views: 150, inquiries: 12, connections: 7 },
          { date: '2024-01-03', views: 180, inquiries: 15, connections: 9 },
          { date: '2024-01-04', views: 200, inquiries: 18, connections: 12 },
          { date: '2024-01-05', views: 165, inquiries: 14, connections: 8 },
          { date: '2024-01-06', views: 190, inquiries: 16, connections: 11 },
          { date: '2024-01-07', views: 220, inquiries: 20, connections: 15 }
        ],
        topProducts: [
          { name: 'Premium Cotton Fabric', views: 450, inquiries: 23, revenue: 12500 },
          { name: 'Silk Sarees', views: 320, inquiries: 18, revenue: 8900 },
          { name: 'Denim Fabric', views: 280, inquiries: 15, revenue: 7200 },
          { name: 'Linen Shirts', views: 200, inquiries: 12, revenue: 5600 }
        ],
        demographics: [
          { name: 'Mumbai', value: 35, color: '#2563eb' },
          { name: 'Delhi', value: 25, color: '#7c3aed' },
          { name: 'Bangalore', value: 20, color: '#059669' },
          { name: 'Chennai', value: 12, color: '#dc2626' },
          { name: 'Others', value: 8, color: '#6b7280' }
        ],
        engagement: {
          postsPublished: 15,
          totalLikes: 234,
          totalComments: 67,
          totalShares: 45,
          avgEngagementRate: 4.2
        }
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const timeRanges = [
    { id: '7d', name: '7 Days' },
    { id: '30d', name: '30 Days' },
    { id: '90d', name: '90 Days' },
    { id: '1y', name: '1 Year' }
  ];

  if (isLoading || !analyticsData) {
    return (
      <>
        <Helmet>
          <title>Analytics - WholeSale Connect</title>
        </Helmet>
        <Loading.Page message="Loading analytics..." />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Analytics - WholeSale Connect</title>
        <meta name="description" content="Track your business performance and growth metrics." />
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Track your business performance and growth metrics
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Time Range Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {timeRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    timeRange === range.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range.name}
                </button>
              ))}
            </div>
            
            <Button variant="outline" icon={Download}>
              Export
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCompactNumber(analyticsData.overview.profileViews)}
                </p>
                <p className="text-sm text-green-600 mt-1">+12% from last week</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCompactNumber(analyticsData.overview.inquiries)}
                </p>
                <p className="text-sm text-green-600 mt-1">+8% from last week</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Likes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCompactNumber(analyticsData.overview.likes)}
                </p>
                <p className="text-sm text-green-600 mt-1">+15% from last week</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Connections</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCompactNumber(analyticsData.overview.connections)}
                </p>
                <p className="text-sm text-green-600 mt-1">+5% from last week</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.overview.conversionRate}%
                </p>
                <p className="text-sm text-green-600 mt-1">+2% from last week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Growth Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Growth Overview</h3>
              <Badge variant="success" size="sm">Trending Up</Badge>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.growth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="inquiries" stroke="#059669" strokeWidth={2} />
                <Line type="monotone" dataKey="connections" stroke="#7c3aed" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Geographic Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Audience by Location</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.demographics}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {analyticsData.demographics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Top Performing Products</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inquiries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analyticsData.topProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCompactNumber(product.views)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCompactNumber(product.inquiries)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(product.revenue, 'INR')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Content Engagement</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {analyticsData.engagement.postsPublished}
              </div>
              <div className="text-sm text-gray-600">Posts Published</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {formatCompactNumber(analyticsData.engagement.totalLikes)}
              </div>
              <div className="text-sm text-gray-600">Total Likes</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {formatCompactNumber(analyticsData.engagement.totalComments)}
              </div>
              <div className="text-sm text-gray-600">Total Comments</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {analyticsData.engagement.avgEngagementRate}%
              </div>
              <div className="text-sm text-gray-600">Avg Engagement Rate</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsPage;
