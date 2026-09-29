import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI, subscriptionAPI, setAuthToken, isAuthenticated } from '../services/api';
import PaymentForm from '../components/PaymentForm';

const STEPS = {
  ACCOUNT: 1,
  VERIFY: 2,
  PLAN: 3,
};

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(STEPS.ACCOUNT);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [resendMessage, setResendMessage] = useState(null);
  const pollRef = useRef(null);

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

  // Resume mid-flow from query params (e.g. after email link or login of unverified user)
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'verify' && isAuthenticated()) {
      setStep(STEPS.VERIFY);
      authAPI.getUser()
        .then((user) => {
          if (user?.email) {
            setFormData((prev) => ({ ...prev, email: user.email }));
          }
          if (user?.email_verified_at) {
            setStep(STEPS.PLAN);
          }
        })
        .catch(() => {});
    } else if (stepParam === 'plan' && isAuthenticated()) {
      setStep(STEPS.PLAN);
    }
  }, [searchParams]);

  // Poll for email verification while on the verify step
  useEffect(() => {
    if (step !== STEPS.VERIFY || !isAuthenticated()) {
      return undefined;
    }

    const checkVerified = async () => {
      try {
        const status = await authAPI.getVerificationStatus();
        if (status.email_verified) {
          setStep(STEPS.PLAN);
        }
      } catch (err) {
        console.error('Verification status check failed:', err);
      }
    };

    checkVerified();
    pollRef.current = setInterval(checkVerified, 3000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [step]);

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

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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

    setLoading(true);

    try {
      const registerResponse = await authAPI.register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      });

      if (registerResponse.authToken) {
        setAuthToken(registerResponse.authToken);
      }

      setStep(STEPS.VERIFY);
    } catch (err) {
      setError(err.message || err.data?.message || 'An error occurred during registration. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setError(null);
    setResendMessage(null);

    try {
      await authAPI.resendVerificationEmail();
      setResendMessage('Verification email sent. Check your inbox.');
    } catch (err) {
      setError(err.message || err.data?.message || 'Unable to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
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
          setError('Account ready but subscription setup failed. You can set up your subscription later in your account settings.');
          try {
            await authAPI.completeOnboarding();
          } catch (_) { /* continue to app */ }
          setTimeout(() => {
            navigate('/studio/overview');
          }, 2000);
          return;
        }
      }

      await authAPI.completeOnboarding();
      navigate('/studio/overview');
    } catch (err) {
      setError(err.message || err.data?.message || 'An error occurred. Please try again.');
      console.error('Plan selection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const stepTitle = {
    [STEPS.ACCOUNT]: 'Create Account',
    [STEPS.VERIFY]: 'Verify Your Email',
    [STEPS.PLAN]: 'Choose Your Plan',
  };

  const stepSubtitle = {
    [STEPS.ACCOUNT]: 'Join Colorist and start your coloring journey',
    [STEPS.VERIFY]: 'We sent a verification link to your inbox',
    [STEPS.PLAN]: 'Select a plan that works for you',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo300.png" alt="Colorist" className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 font-venti mb-2">
            {stepTitle[step]}
          </h1>
          <p className="text-sm text-slate-600">
            {stepSubtitle[step]}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2">
            {[STEPS.ACCOUNT, STEPS.VERIFY, STEPS.PLAN].map((s, index) => (
              <React.Fragment key={s}>
                {index > 0 && (
                  <div className={`w-10 h-1 ${step >= s ? 'bg-[#ea3663]' : 'bg-slate-200'}`}></div>
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-[#ea3663] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {s}
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-1 text-xs text-slate-500">
            <span>Account</span>
            <span>Verify</span>
            <span>Plan</span>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 p-8">
          {step === STEPS.ACCOUNT && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 text-white rounded-lg text-sm font-medium transition-colors min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#ea3663' }}
                onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#d12a4f')}
                onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#ea3663')}
              >
                {loading ? 'Creating Account...' : 'Continue'}
              </button>
            </form>
          )}

          {step === STEPS.VERIFY && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" style={{ color: '#49817b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 font-venti mb-2">Check your inbox</h3>
                <p className="text-sm text-slate-600 mb-2">
                  We sent a verification link to{' '}
                  <strong>{formData.email || 'your email'}</strong>.
                </p>
                <p className="text-xs text-slate-500">
                  Click the link in the email to continue. This page will update automatically once verified.
                </p>
              </div>

              {resendMessage && (
                <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">{resendMessage}</div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
              )}

              <div className="flex flex-col space-y-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="w-full px-4 py-3 text-white rounded-lg text-sm font-medium transition-colors min-h-[48px] disabled:opacity-50"
                  style={{ backgroundColor: '#ea3663' }}
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#d12a4f')}
                  onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#ea3663')}
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
                <p className="text-xs text-slate-500">
                  Wrong email?{' '}
                  <Link to="/" className="font-medium" style={{ color: '#ea3663' }}>
                    Sign in
                  </Link>
                  {' '}with a different account once verified, or contact support.
                </p>
              </div>
            </div>
          )}

          {step === STEPS.PLAN && (
            <form onSubmit={handlePlanSubmit} className="space-y-6">
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
                      <div className="text-2xl font-bold text-slate-800">$1.99</div>
                      <div className="text-xs text-slate-500">per month</div>
                    </div>
                  </div>
                </div>
              </div>

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

              <button
                type="submit"
                disabled={loading || (subscriptionPlan === 'paid' && !paymentMethodId)}
                className="w-full px-4 py-3 text-white rounded-lg text-sm font-medium transition-colors min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#ea3663' }}
                onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#d12a4f')}
                onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#ea3663')}
              >
                {loading ? 'Finishing Setup...' : 'Continue to Colorist'}
              </button>
            </form>
          )}

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
