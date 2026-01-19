import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, subscriptionAPI, setAuthToken } from '../services/api';
import PaymentForm from '../components/PaymentForm';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    marketingEmails: false
  });

  const [subscriptionPlan, setSubscriptionPlan] = useState('free');
  const [paymentMethodId, setPaymentMethodId] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePlanSelect = (plan) => {
    setSubscriptionPlan(plan);
    if (plan === 'free') {
      setPaymentMethodId(null);
    }
  };

  const handlePaymentMethodReady = (paymentMethod) => {
    setPaymentMethodId(paymentMethod);
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!formData.acceptTerms) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }

    // Move to step 2
    setStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // First, register the user
      const registerData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        subscription_plan: subscriptionPlan
      };

      const registerResponse = await authAPI.register(registerData);

      // Store auth token
      if (registerResponse.authToken) {
        setAuthToken(registerResponse.authToken);
      }

      // If paid plan selected, create subscription
      if (subscriptionPlan === 'paid') {
        if (!paymentMethodId) {
          setError('Please enter your payment information');
          setLoading(false);
          return;
        }

        try {
          await subscriptionAPI.create('paid', paymentMethodId);
        } catch (subError) {
          console.error('Subscription creation error:', subError);
          // User is still registered, just subscription failed
          setError('Account created but subscription setup failed. You can set up your subscription later in your account settings.');
          // Still navigate to dashboard
          setTimeout(() => {
            navigate('/studio/overview');
          }, 2000);
          return;
        }
      }

      // Navigate to dashboard on success
      navigate('/studio/overview');
    } catch (err) {
      setError(err.message || err.data?.message || 'An error occurred during registration. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo300.png" alt="Colorist" className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 font-venti mb-2">
            {step === 1 ? 'Create Account' : 'Choose Your Plan'}
          </h1>
          <p className="text-sm text-slate-600">
            {step === 1 
              ? 'Join Colorist and start your coloring journey'
              : 'Select a plan that works for you'
            }
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-[#ea3663] text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-[#ea3663]' : 'bg-slate-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-[#ea3663] text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white shadow-sm border border-slate-200 p-8">
          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    autoComplete="given-name"
                    autoFocus
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                    style={{ focusRingColor: '#ea3663' }}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    autoComplete="family-name"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                    style={{ focusRingColor: '#ea3663' }}
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                  style={{ focusRingColor: '#ea3663' }}
                  placeholder="you@example.com"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                  style={{ focusRingColor: '#ea3663' }}
                  placeholder="Create a password"
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                  style={{ focusRingColor: '#ea3663' }}
                  placeholder="Confirm your password"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    required
                    className="mt-1 w-4 h-4 border-slate-200 rounded text-slate-600 focus:ring-2 focus:ring-offset-0 focus:ring-offset-white"
                    style={{ focusRingColor: '#ea3663' }}
                  />
                  <span className="ml-2 text-sm text-slate-600">
                    I agree to the{' '}
                    <Link
                      to="/privacy-policy"
                      className="font-medium transition-colors"
                      style={{ color: '#ea3663' }}
                      onMouseEnter={(e) => e.target.style.color = '#d12a4f'}
                      onMouseLeave={(e) => e.target.style.color = '#ea3663'}
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link
                      to="/privacy-policy"
                      className="font-medium transition-colors"
                      style={{ color: '#ea3663' }}
                      onMouseEnter={(e) => e.target.style.color = '#d12a4f'}
                      onMouseLeave={(e) => e.target.style.color = '#ea3663'}
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="marketingEmails"
                    checked={formData.marketingEmails}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 border-slate-200 rounded text-slate-600 focus:ring-2 focus:ring-offset-0 focus:ring-offset-white"
                    style={{ focusRingColor: '#ea3663' }}
                  />
                  <span className="ml-2 text-sm text-slate-600">
                    I want to receive inspiration, marketing promotions and updates via email
                  </span>
                </label>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full px-4 py-3 text-white rounded-lg text-sm font-medium transition-colors min-h-[48px]"
                style={{ backgroundColor: '#ea3663' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
              >
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              {/* Plan Selection */}
              <div className="space-y-3">
                <div
                  onClick={() => handlePlanSelect('free')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    subscriptionPlan === 'free'
                      ? 'border-[#ea3663] bg-pink-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <input
                          type="radio"
                          name="plan"
                          value="free"
                          checked={subscriptionPlan === 'free'}
                          onChange={() => handlePlanSelect('free')}
                          className="mr-3"
                        />
                        <h3 className="font-semibold text-slate-800">Free Plan</h3>
                      </div>
                      <p className="text-sm text-slate-600 ml-6">Access to basic features</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-slate-800">$0</div>
                      <div className="text-xs text-slate-500">forever</div>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handlePlanSelect('paid')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    subscriptionPlan === 'paid'
                      ? 'border-[#ea3663] bg-pink-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <input
                          type="radio"
                          name="plan"
                          value="paid"
                          checked={subscriptionPlan === 'paid'}
                          onChange={() => handlePlanSelect('paid')}
                          className="mr-3"
                        />
                        <h3 className="font-semibold text-slate-800">Premium Plan</h3>
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">7-Day Free Trial</span>
                      </div>
                      <p className="text-sm text-slate-600 ml-6">Full access to all features</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-slate-800">$0.99</div>
                      <div className="text-xs text-slate-500">per month</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Form (only for paid plan) */}
              {subscriptionPlan === 'paid' && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Payment Information</h3>
                  <PaymentForm
                    onPaymentMethodReady={handlePaymentMethodReady}
                    onError={(err) => setError(err)}
                  />
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
              )}

              {/* Navigation Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || (subscriptionPlan === 'paid' && !paymentMethodId)}
                  className="flex-1 px-4 py-3 text-white rounded-lg text-sm font-medium transition-colors min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#ea3663' }}
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#d12a4f')}
                  onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#ea3663')}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/"
                className="font-medium transition-colors"
                style={{ color: '#ea3663' }}
                onMouseEnter={(e) => e.target.style.color = '#d12a4f'}
                onMouseLeave={(e) => e.target.style.color = '#ea3663'}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
