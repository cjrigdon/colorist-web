import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const PaymentFormElement = ({ onPaymentMethodReady, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (stripe && elements) {
      const cardElement = elements.getElement(CardElement);
      if (cardElement) {
        cardElement.on('change', (event) => {
          if (event.error) {
            setError(event.error.message);
          } else {
            setError(null);
          }
        });
      }
    }
  }, [stripe, elements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (createError) {
        setError(createError.message);
        onError(createError.message);
        setProcessing(false);
        return;
      }

      onPaymentMethodReady(paymentMethod.id);
      setProcessing(false);
    } catch (err) {
      setError(err.message);
      onError(err.message);
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1e293b',
        '::placeholder': {
          color: '#94a3b8',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-slate-200 rounded-lg bg-white">
        <CardElement options={cardElementOptions} />
      </div>
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full px-4 py-3 text-white rounded-lg text-sm font-medium transition-colors min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#ea3663' }}
        onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#d12a4f')}
        onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#ea3663')}
      >
        {processing ? 'Processing...' : 'Continue'}
      </button>
    </form>
  );
};

const PaymentForm = ({ onPaymentMethodReady, onError }) => {
  if (!stripePromise) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700 text-sm">
        Stripe is not configured. Please set REACT_APP_STRIPE_PUBLISHABLE_KEY in your environment variables.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormElement 
        onPaymentMethodReady={onPaymentMethodReady}
        onError={onError}
      />
    </Elements>
  );
};

export default PaymentForm;

