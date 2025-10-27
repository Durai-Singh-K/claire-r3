import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Building, Edit, Star, MapPin, Phone, Mail, Globe, Users, TrendingUp, Award } from 'lucide-react';
import { Button, Avatar, Badge, Loading, Modal, Input } from '../components/ui';
import { formatCompactNumber, capitalizeFirst } from '../utils/formatters';
import useAuthStore from '../store/authStore';
import { businessAPI } from '../services/api';

const BusinessPage = () => {
  const { user, updateProfile } = useAuthStore();
  const [businessData, setBusinessData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    setIsLoading(true);
    try {
      const response = await businessAPI.getProfile();
      setBusinessData(response.data);
    } catch (error) {
      console.error('Failed to load business data:', error);
      // Use user data as fallback
      setBusinessData(user);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Building },
    { id: 'products', name: 'Products', icon: TrendingUp },
    { id: 'reviews', name: 'Reviews', icon: Star },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  const EditBusinessModal = () => {
    const [formData, setFormData] = useState({
      businessName: businessData?.businessName || '',
      businessDescription: businessData?.businessDescription || '',
      phone: businessData?.phone || '',
      website: businessData?.website || '',
      shopLocation: {
        address: businessData?.shopLocation?.address || '',
        city: businessData?.shopLocation?.city || '',
        state: businessData?.shopLocation?.state || '',
        pincode: businessData?.shopLocation?.pincode || ''
      }
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await businessAPI.updateProfile(formData);
        setShowEditModal(false);
        loadBusinessData();
      } catch (error) {
        console.error('Failed to update business:', error);
      }
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      if (name.startsWith('shopLocation.')) {
        const field = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          shopLocation: {
            ...prev.shopLocation,
            [field]: value
          }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    };

    return (
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Business Profile"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              required
              fullWidth
            />
            
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Description
            </label>
            <textarea
              name="businessDescription"
              value={formData.businessDescription}
              onChange={handleInputChange}
              placeholder="Describe your business..."
              rows={3}
              className="input w-full"
            />
          </div>

          <Input
            label="Website (Optional)"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="https://your-website.com"
            fullWidth
          />

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Address</h4>
            
            <Input
              label="Street Address"
              name="shopLocation.address"
              value={formData.shopLocation.address}
              onChange={handleInputChange}
              fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                name="shopLocation.city"
                value={formData.shopLocation.city}
                onChange={handleInputChange}
                required
                fullWidth
              />
              
              <Input
                label="State"
                name="shopLocation.state"
                value={formData.shopLocation.state}
                onChange={handleInputChange}
                required
                fullWidth
              />
              
              <Input
                label="Pincode"
                name="shopLocation.pincode"
                value={formData.shopLocation.pincode}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </div>
          </div>

          <Modal.Footer>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>My Business - WholeSale Connect</title>
        </Helmet>
        <Loading.Page message="Loading business profile..." />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Business - WholeSale Connect</title>
        <meta name="description" content="Manage your business profile and track performance." />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Business Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-primary-500 to-secondary-500">
            {businessData?.coverImage && (
              <img
                src={businessData.coverImage}
                alt="Business cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
              {/* Business Avatar */}
              <div className="relative -mt-16 mb-4 lg:mb-0">
                <Avatar
                  src={businessData?.profilePicture}
                  name={businessData?.businessName}
                  size="2xl"
                  className="ring-4 ring-white"
                />
                <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow">
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Business Info */}
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {businessData?.businessName}
                      </h1>
                      {businessData?.isVerified && <Badge.Verification verified />}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span>{capitalizeFirst(businessData?.businessType || 'Business')}</span>
                      {businessData?.shopLocation && (
                        <>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {businessData.shopLocation.city}, {businessData.shopLocation.state}
                            </span>
                          </div>
                        </>
                      )}
                      {businessData?.establishedYear && (
                        <>
                          <span>•</span>
                          <span>Est. {businessData.establishedYear}</span>
                        </>
                      )}
                    </div>

                    {businessData?.businessDescription && (
                      <p className="text-gray-700 mb-3 max-w-2xl">
                        {businessData.businessDescription}
                      </p>
                    )}

                    {/* Contact Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {businessData?.phone && (
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{businessData.phone}</span>
                        </div>
                      )}
                      {businessData?.email && (
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{businessData.email}</span>
                        </div>
                      )}
                      {businessData?.website && (
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Globe className="w-4 h-4" />
                          <a 
                            href={businessData.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700"
                          >
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 lg:mt-0">
                    <Button 
                      icon={Edit} 
                      onClick={() => setShowEditModal(true)}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            {businessData?.categories && businessData.categories.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {businessData.categories.map((category) => (
                    <Badge.Category key={category} category={category} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCompactNumber(businessData?.analytics?.profileViews || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCompactNumber(businessData?.analytics?.totalInquiries || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {businessData?.analytics?.averageRating?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Trust Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {businessData?.analytics?.trustScore || '85'}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Business Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">About</h4>
                      <p className="text-gray-600">
                        {businessData?.businessDescription || 
                         'No business description added yet. Click Edit Profile to add one.'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Specializations</h4>
                      <div className="flex flex-wrap gap-2">
                        {businessData?.specializations?.length > 0 ? (
                          businessData.specializations.map((spec, index) => (
                            <Badge key={index} variant="secondary" size="sm">
                              {spec}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No specializations added</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start showcasing your products to attract customers
                </p>
                <Button>Add Products</Button>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No reviews yet
                </h3>
                <p className="text-gray-600">
                  Reviews from customers will appear here
                </p>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Analytics Coming Soon
                </h3>
                <p className="text-gray-600">
                  Detailed business analytics will be available here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Business Modal */}
        <EditBusinessModal />
      </div>
    </>
  );
};

export default BusinessPage;
