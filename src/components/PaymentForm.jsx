import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const PaymentFormElement = forwardRef(({ onError }, ref) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);

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

  // Resolves to a Stripe payment method ID, or null if the card couldn't be used (the error is shown inline)
  useImperativeHandle(ref, () => ({
    createPaymentMethod: async () => {
      if (!stripe || !elements) {
        const message = 'Payment form is still loading. Please try again.';
        setError(message);
        onError?.(message);
        return null;
      }

      setError(null);
      try {
        const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: elements.getElement(CardElement),
        });

        if (createError) {
          setError(createError.message);
          onError?.(createError.message);
          return null;
        }

        return paymentMethod.id;
      } catch (err) {
        setError(err.message);
        onError?.(err.message);
        return null;
      }
    },
  }), [stripe, elements, onError]);

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
    <div className="space-y-2">
      <div className="p-4 border border-slate-200 rounded-lg bg-white">
        <CardElement options={cardElementOptions} />
      </div>
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
    </div>
  );
});

const PaymentForm = forwardRef(({ onError }, ref) => {
  if (!stripePromise) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700 text-sm">
        Stripe is not configured. Please set REACT_APP_STRIPE_PUBLISHABLE_KEY in your environment variables.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormElement ref={ref} onError={onError} />
    </Elements>
  );
});

export default PaymentForm;
