import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, Mail, Lock, User, Building, Chrome, Phone } from 'lucide-react';
import { Button, Input, Badge } from '../../components/ui';
import { validateEmail, validatePassword, validatePhone, validateBusinessName } from '../../utils/validators';
import { useDebouncedValidation } from '../../hooks/useDebounce';
import useAuthStore from '../../store/authStore';

const RegisterPage = () => {
  const { register, loginWithGoogle, isLoading, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Debounced validations
  const emailValidation = useDebouncedValidation(
    formData.email,
    (email) => validateEmail(email),
    500
  );

  const passwordValidation = useDebouncedValidation(
    formData.password,
    (password) => validatePassword(password),
    500
  );

  const phoneValidation = useDebouncedValidation(
    formData.phone,
    (phone) => validatePhone(phone),
    500
  );

  const businessNameValidation = useDebouncedValidation(
    formData.businessName,
    (name) => validateBusinessName(name),
    500
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }

    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      errors.password = passwordValidation.error;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.businessName.trim()) {
      errors.businessName = 'Business name is required';
    } else if (!businessNameValidation.isValid) {
      errors.businessName = businessNameValidation.error;
    }

    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const result = await register({
      displayName: formData.displayName.trim(),
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone.trim(),
      password: formData.password,
      businessName: formData.businessName.trim()
    });
    
    if (!result.success) {
      setFormErrors({ submit: result.error });
    }
  };

  const handleGoogleSignUp = async () => {
    const result = await loginWithGoogle();
    
    if (!result.success) {
      setFormErrors({ submit: result.error });
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - WholeSale Connect</title>
        <meta name="description" content="Create your WholeSale Connect account to join the B2B textile marketplace." />
      </Helmet>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Join WholeSale Connect
            </h1>
            <Badge variant="success" size="sm">Free</Badge>
          </div>
          <p className="text-gray-600">
            Create your account and start connecting with textile businesses
          </p>
        </div>

        {/* Error Display */}
        {(error || formErrors.submit) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              {error || formErrors.submit}
            </p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Display Name"
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="Your name"
              icon={User}
              error={formErrors.displayName}
              fullWidth
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+91 9876543210"
              icon={Phone}
              error={formErrors.phone}
              fullWidth
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your@email.com"
            icon={Mail}
            error={formErrors.email}
            fullWidth
            required
          />

          <Input
            label="Business Name"
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleInputChange}
            placeholder="Your business name"
            icon={Building}
            error={formErrors.businessName}
            helperText="This will be displayed on your business profile"
            fullWidth
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                icon={Lock}
                error={formErrors.password}
                fullWidth
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 p-1 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                style={{ marginTop: '8px' }}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm password"
                icon={Lock}
                error={formErrors.confirmPassword}
                fullWidth
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 p-1 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ marginTop: '8px' }}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
              className="checkbox-custom mt-0.5"
              required
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-600">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
            </label>
          </div>
          {formErrors.acceptTerms && (
            <p className="text-red-600 text-sm">{formErrors.acceptTerms}</p>
          )}

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            loadingText="Creating account..."
            className="h-12"
          >
            Create Account
          </Button>
        </form>

        {/* Divider */}
        <div className="mt-8 mb-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or sign up with
              </span>
            </div>
          </div>
        </div>

        {/* Google Sign Up */}
        <Button
          onClick={handleGoogleSignUp}
          variant="outline"
          fullWidth
          icon={Chrome}
          disabled={isLoading}
          className="h-12 mb-6"
        >
          Continue with Google
        </Button>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Password Requirements */}
        {formData.password && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Password Requirements:
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className={`flex items-center space-x-2 ${formData.password.length >= 6 ? 'text-green-600' : ''}`}>
                <span className={`w-2 h-2 rounded-full ${formData.password.length >= 6 ? 'bg-green-400' : 'bg-gray-300'}`} />
                <span>At least 6 characters</span>
              </li>
              <li className={`flex items-center space-x-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                <span className={`w-2 h-2 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-400' : 'bg-gray-300'}`} />
                <span>One uppercase letter</span>
              </li>
              <li className={`flex items-center space-x-2 ${/[0-9]/.test(formData.password) ? 'text-green-600' : ''}`}>
                <span className={`w-2 h-2 rounded-full ${/[0-9]/.test(formData.password) ? 'bg-green-400' : 'bg-gray-300'}`} />
                <span>One number</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default RegisterPage;
