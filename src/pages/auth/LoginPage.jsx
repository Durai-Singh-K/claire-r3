import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, Mail, Lock, Chrome, Sparkles, CheckCircle2, MessageSquare, Globe, Mic, TrendingUp } from 'lucide-react';
import { validateEmail, validatePassword } from '../../utils/validators';
import { useDebouncedValidation } from '../../hooks/useDebounce';
import useAuthStore from '../../store/authStore';

const LoginPage = () => {
  const { login, loginWithGoogle, isLoading, error } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  // Debounced validation
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = {};

    if (!emailValidation.isValid && emailValidation.hasValue) {
      errors.email = emailValidation.error;
    }

    if (!passwordValidation.isValid && passwordValidation.hasValue) {
      errors.password = passwordValidation.error;
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const result = await login(formData);

    if (!result.success) {
      setFormErrors({ submit: result.error });
    }
  };

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();

    if (!result.success) {
      setFormErrors({ submit: result.error });
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - Claire B2B</title>
        <meta name="description" content="Sign in to your Claire B2B account to access the B2B textile marketplace." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-app">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-8 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-purple rounded-3xl shadow-2xl mb-6 glow-purple float-animation">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gradient mb-2 flex items-center justify-center gap-3">
              Claire B2B
              <span className="glass-badge text-purple-700 text-xs font-bold px-3 py-1">Beta</span>
            </h1>
            <p className="text-gray-700 text-lg font-medium">
              Welcome back! Sign in to continue
            </p>
          </div>

          {/* Login Card */}
          <div className="glass-card-strong p-8 animate-scaleIn">
            {/* Error Display */}
            {(error || formErrors.submit) && (
              <div className="mb-6 glass-card p-4 bg-red-50/50 border border-red-200/50 animate-fadeIn">
                <p className="text-red-600 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  {error || formErrors.submit}
                </p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="glass-input w-full pl-11"
                    required
                  />
                </div>
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="glass-input w-full pl-11 pr-11"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 glass-card hover:glass-card-medium p-2 rounded-lg transition-all"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-purple-600" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 transition-colors">
                    Remember me
                  </span>
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="glass-button w-full py-4 text-base font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 inline-block mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/40" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 glass-card text-gray-700 font-semibold">
                    Or continue with
                  </span>
                </div>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="glass-card hover:glass-card-medium w-full py-4 flex items-center justify-center gap-3 font-semibold text-gray-900 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Chrome className="w-5 h-5 text-purple-600" />
              Continue with Google
            </button>

            {/* Sign Up Link */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-700">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-bold text-purple-600 hover:text-purple-800 transition-colors"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 glass-card p-6 animate-fadeIn" style={{ animationDelay: '200ms' }}>
            <div className="text-center mb-4">
              <h3 className="text-sm font-bold text-gradient flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Why choose Claire B2B?
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-3 hover:glass-card-medium transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-gray-900">Direct B2B</span>
                </div>
                <p className="text-xs text-gray-600">Connect directly</p>
              </div>

              <div className="glass-card p-3 hover:glass-card-medium transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-gray-900">Multi-language</span>
                </div>
                <p className="text-xs text-gray-600">10+ languages</p>
              </div>

              <div className="glass-card p-3 hover:glass-card-medium transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-gradient-purple rounded-lg flex items-center justify-center shadow-md">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-gray-900">Real-time Chat</span>
                </div>
                <p className="text-xs text-gray-600">Instant messaging</p>
              </div>

              <div className="glass-card p-3 hover:glass-card-medium transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-gray-900">Voice Support</span>
                </div>
                <p className="text-xs text-gray-600">Tamil translation</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-xs text-purple-600 font-medium">
            © 2024 Claire B2B. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
