import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { isAuthenticated } from '../services/api';

/**
 * Landing page after the user clicks the verification link in their email.
 * The API verifies the address then redirects here with ?status=...
 */
export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status') || 'success';
  const [countdown, setCountdown] = useState(3);

  const isSuccess = status === 'success' || status === 'already';
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (!isSuccess) {
      return undefined;
    }

    const target = authenticated ? '/register?step=plan' : '/';
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(target);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, authenticated, navigate]);

  const messages = {
    success: {
      title: 'Email Verified',
      body: 'Your email address has been verified successfully.',
    },
    already: {
      title: 'Already Verified',
      body: 'Your email was already verified. You can continue setting up your account.',
    },
    invalid: {
      title: 'Invalid Link',
      body: 'This verification link is invalid or has expired. Please request a new one.',
    },
  };

  const content = messages[status] || messages.invalid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo300.png" alt="Colorist" className="h-16 w-16" />
          </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center">
            {isSuccess ? (
              <svg className="w-8 h-8" style={{ color: '#49817b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800 font-venti mb-2">{content.title}</h1>
            <p className="text-sm text-slate-600">{content.body}</p>
            {isSuccess && (
              <p className="text-xs text-slate-500 mt-3">
                {authenticated
                  ? `Continuing to plan selection in ${countdown}...`
                  : `Sign in to choose your subscription plan. Redirecting in ${countdown}...`}
              </p>
            )}
          </div>

          {isSuccess ? (
            <button
              type="button"
              onClick={() => navigate(authenticated ? '/register?step=plan' : '/')}
              className="w-full px-4 py-3 text-white rounded-lg text-sm font-medium transition-colors min-h-[48px]"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              {authenticated ? 'Choose Your Plan' : 'Sign In'}
            </button>
          ) : (
            <div className="space-y-3">
              <Link
                to="/register?step=verify"
                className="block w-full px-4 py-3 text-white rounded-lg text-sm font-medium transition-colors min-h-[48px]"
                style={{ backgroundColor: '#ea3663' }}
              >
                Resend Verification
              </Link>
              <Link
                to="/"
                className="block w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors hover:bg-slate-50"
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
