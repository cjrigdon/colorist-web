import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import PaymentForm from '../components/PaymentForm';
import PremiumFeaturesList from '../components/PremiumFeaturesList';

const Subscription = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const data = await subscriptionAPI.get();
      setSubscription(data);
      setSelectedPlan(data.plan || 'free');
    } catch (err) {
      setError(err.message || 'Failed to load subscription information');
      console.error('Subscription fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (plan) => {
    setSelectedPlan(plan);
    setError(null);
    setSuccess(null);
    if (plan === 'paid') {
      setShowPaymentForm(true);
    } else {
      setShowPaymentForm(false);
      setPaymentMethodId(null);
    }
  };

  const handlePaymentMethodReady = (paymentMethod) => {
    setPaymentMethodId(paymentMethod);
  };

  const handleUpdateSubscription = async () => {
    if (selectedPlan === subscription?.plan) {
      setError('You are already on this plan');
      return;
    }

    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      if (selectedPlan === 'paid' && !paymentMethodId) {
        setError('Please enter your payment information');
        setUpdating(false);
        return;
      }

      await subscriptionAPI.update(selectedPlan, paymentMethodId);
      setSuccess('Subscription updated successfully');
      await fetchSubscription();
      setShowPaymentForm(false);
      setPaymentMethodId(null);
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to update subscription');
      console.error('Subscription update error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await subscriptionAPI.cancel();
      setSuccess('Subscription cancelled successfully');
      await fetchSubscription();
      setSelectedPlan('free');
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to cancel subscription');
      console.error('Subscription cancel error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#ea3663' }}></div>
            <p className="mt-4 text-slate-600">Loading subscription information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Subscription Management</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Current Subscription Status */}
        <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Current Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-800 capitalize">{subscription?.plan || 'Free'} Plan</p>
              {subscription?.subscription && (
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p>Status: <span className="font-medium capitalize">{subscription.subscription.status}</span></p>
                  {subscription.subscription.trial_ends_at && (
                    <p>Trial ends: {formatDate(subscription.subscription.trial_ends_at)}</p>
                  )}
                  {subscription.subscription.ends_at && (
                    <p>Access until: {formatDate(subscription.subscription.ends_at)}</p>
                  )}
                </div>
              )}
            </div>
            <div className="text-right">
              {subscription?.plan === 'paid' ? (
                <p className="text-2xl font-bold text-slate-800">$1.99<span className="text-sm font-normal text-slate-600">/month</span></p>
              ) : (
                <p className="text-2xl font-bold text-slate-800">$0<span className="text-sm font-normal text-slate-600">/forever</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Change Plan</h3>
          <div className="space-y-3">
            <div
              onClick={() => handlePlanChange('free')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPlan === 'free'
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
                      checked={selectedPlan === 'free'}
                      onChange={() => handlePlanChange('free')}
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
              onClick={() => handlePlanChange('paid')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPlan === 'paid'
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
                      checked={selectedPlan === 'paid'}
                      onChange={() => handlePlanChange('paid')}
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
              {selectedPlan === 'paid' && (
                <div className="mt-4 ml-6 pt-4 border-t border-slate-200">
                  <PremiumFeaturesList compact={true} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Form (only for paid plan) */}
        {showPaymentForm && selectedPlan === 'paid' && (
          <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {subscription?.has_payment_method ? 'Update Payment Method' : 'Payment Information'}
            </h3>
            <PaymentForm
              onPaymentMethodReady={handlePaymentMethodReady}
              onError={(err) => setError(err)}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div>
            {subscription?.plan === 'paid' && subscription?.subscription?.status === 'active' && (
              <button
                onClick={handleCancelSubscription}
                disabled={updating}
                className="px-6 py-2.5 text-red-700 bg-red-50 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {updating ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
            >
              Back to Profile
            </button>
            {selectedPlan !== subscription?.plan && (
              <button
                onClick={handleUpdateSubscription}
                disabled={updating || (selectedPlan === 'paid' && !paymentMethodId)}
                className="px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#ea3663' }}
                onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#d12a4f')}
                onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#ea3663')}
              >
                {updating ? 'Updating...' : 'Update Subscription'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;

