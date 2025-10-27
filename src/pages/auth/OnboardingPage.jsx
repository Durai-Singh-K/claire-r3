import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Building, MapPin, Tag, Target, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button, Input, Badge, Avatar } from '../../components/ui';
import { CATEGORIES, STATES_AND_CITIES } from '../../config/constants';
import useAuthStore from '../../store/authStore';

const OnboardingPage = () => {
  const { user, completeOnboarding, isLoading } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Business Information
    businessType: '',
    businessDescription: '',
    establishedYear: '',
    employeeCount: '',
    
    // Step 2: Location & Contact
    shopLocation: {
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    
    // Step 3: Categories & Specialization
    categories: [],
    specializations: [],
    targetCustomers: []
  });

  const businessTypes = [
    { id: 'manufacturer', name: 'Manufacturer', description: 'You manufacture textile products' },
    { id: 'wholesaler', name: 'Wholesaler', description: 'You sell products in bulk to retailers' },
    { id: 'retailer', name: 'Retailer', description: 'You sell directly to end customers' },
    { id: 'supplier', name: 'Supplier', description: 'You supply raw materials or components' },
    { id: 'exporter', name: 'Exporter', description: 'You export textile products internationally' },
    { id: 'importer', name: 'Importer', description: 'You import textile products for distribution' }
  ];

  const employeeRanges = [
    '1-10',
    '11-50',
    '51-100',
    '101-500',
    '500+'
  ];

  const targetCustomerTypes = [
    'Retailers',
    'Wholesalers',
    'Manufacturers',
    'Exporters',
    'Online Sellers',
    'Fashion Brands',
    'Garment Manufacturers',
    'Textile Mills'
  ];

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
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const onboardingData = {
      businessType: formData.businessType,
      businessDescription: formData.businessDescription,
      establishedYear: parseInt(formData.establishedYear),
      employeeCount: formData.employeeCount,
      shopLocation: formData.shopLocation,
      categories: formData.categories,
      specializations: formData.specializations,
      targetCustomers: formData.targetCustomers
    };

    const result = await completeOnboarding(onboardingData);
    
    if (!result.success) {
      // Handle error
      console.error('Onboarding failed:', result.error);
    }
  };

  const canProceedStep1 = formData.businessType && formData.businessDescription && formData.establishedYear;
  const canProceedStep2 = formData.shopLocation.city && formData.shopLocation.state && formData.shopLocation.pincode;
  const canCompleteOnboarding = formData.categories.length > 0;

  return (
    <>
      <Helmet>
        <title>Business Setup - WholeSale Connect</title>
        <meta name="description" content="Set up your business profile on WholeSale Connect." />
      </Helmet>

      <div className="max-w-2xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <Avatar
            src={user?.profilePicture}
            name={user?.displayName}
            size="xl"
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {user?.displayName}!
          </h1>
          <p className="text-gray-600">
            Let's set up your business profile to help you connect with the right partners
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: Business Information */}
          {currentStep === 1 && (
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Building className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Business Information
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What type of business are you? *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {businessTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, businessType: type.id }))}
                        className={`p-4 text-left border rounded-lg transition-colors ${
                          formData.businessType === type.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Business Description"
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleInputChange}
                  placeholder="Tell us about your business..."
                  helperText="Describe your business activities and what makes you unique"
                  fullWidth
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Established Year"
                    type="number"
                    name="establishedYear"
                    value={formData.establishedYear}
                    onChange={handleInputChange}
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear()}
                    fullWidth
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Count
                    </label>
                    <select
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleInputChange}
                      className="input w-full"
                    >
                      <option value="">Select range</option>
                      {employeeRanges.map((range) => (
                        <option key={range} value={range}>
                          {range} employees
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location & Contact */}
          {currentStep === 2 && (
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <MapPin className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Location & Contact
                </h2>
              </div>

              <div className="space-y-6">
                <Input
                  label="Business Address"
                  name="shopLocation.address"
                  value={formData.shopLocation.address}
                  onChange={handleInputChange}
                  placeholder="Street address, building name, etc."
                  fullWidth
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <select
                      name="shopLocation.state"
                      value={formData.shopLocation.state}
                      onChange={handleInputChange}
                      className="input w-full"
                      required
                    >
                      <option value="">Select State</option>
                      {Object.keys(STATES_AND_CITIES).map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <select
                      name="shopLocation.city"
                      value={formData.shopLocation.city}
                      onChange={handleInputChange}
                      className="input w-full"
                      required
                      disabled={!formData.shopLocation.state}
                    >
                      <option value="">Select City</option>
                      {formData.shopLocation.state &&
                        STATES_AND_CITIES[formData.shopLocation.state]?.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Pincode"
                    name="shopLocation.pincode"
                    value={formData.shopLocation.pincode}
                    onChange={handleInputChange}
                    placeholder="110001"
                    fullWidth
                    required
                  />

                  <Input
                    label="Country"
                    name="shopLocation.country"
                    value={formData.shopLocation.country}
                    onChange={handleInputChange}
                    fullWidth
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Categories & Specialization */}
          {currentStep === 3 && (
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Tag className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Categories & Specialization
                </h2>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What categories do you deal in? *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleMultiSelect('categories', category.id)}
                        className={`p-3 text-left border rounded-lg transition-colors ${
                          formData.categories.includes(category.id)
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-lg mb-1">{category.icon}</div>
                        <div className="font-medium text-sm">{category.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Who are your target customers?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {targetCustomerTypes.map((customer) => (
                      <button
                        key={customer}
                        type="button"
                        onClick={() => handleMultiSelect('targetCustomers', customer)}
                        className={`p-3 text-center border rounded-lg transition-colors ${
                          formData.targetCustomers.includes(customer)
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-sm">{customer}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentStep < 3 ? (
              <Button
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !canProceedStep1) ||
                  (currentStep === 2 && !canProceedStep2)
                }
                icon={ArrowRight}
                iconPosition="right"
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={isLoading}
                loadingText="Setting up..."
                disabled={!canCompleteOnboarding}
              >
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingPage;
