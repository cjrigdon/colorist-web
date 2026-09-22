import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, setAuthToken } from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [googleLoginUrl, setGoogleLoginUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    authAPI.getYoutubeRedirect()
      .then((data) => {
        if (data.url) {
          setGoogleLoginUrl(data.url);
        }
      })
      .catch((err) => console.error('Error fetching Google redirect:', err));
  }, []);

  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (googleLoginUrl) {
      window.location.href = googleLoginUrl;
      return;
    }

    setGoogleLoading(true);
    try {
      const data = await authAPI.getYoutubeRedirect();
      if (!data.url) {
        throw new Error('Google login is unavailable. Please try again.');
      }
      setGoogleLoginUrl(data.url);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || err.data?.message || 'Unable to start Google login. Please try again.');
      console.error('Google login error:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authAPI.login(email, password);

      // Store token in localStorage
      if (data.authToken || data.token) {
        const token = data.authToken || data.token;
        setAuthToken(token);
        
        // Navigate to studio overview on success
        navigate('/studio/overview');
      } else {
        throw new Error('No authentication token received from server.');
      }
    } catch (err) {
      setError(err.message || err.data?.message || 'An error occurred during login. Please try again.');
      console.error('Login error:', err);
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
          <h1 className="text-3xl font-bold text-slate-800 font-venti mb-2">Welcome Back</h1>
          <p className="text-sm text-slate-600">Sign in to continue to Colorist</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white shadow-sm border border-slate-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#ea3663' }}
                placeholder="Enter your password"
              />
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 border-slate-200 rounded text-slate-600 focus:ring-2 focus:ring-offset-0 focus:ring-offset-white"
                  style={{ focusRingColor: '#ea3663' }}
                />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium transition-colors"
                style={{ color: '#ea3663' }}
                onMouseEnter={(e) => e.target.style.color = '#d12a4f'}
                onMouseLeave={(e) => e.target.style.color = '#ea3663'}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 text-white rounded-lg text-sm font-medium transition-colors min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#d12a4f')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#ea3663')}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Connecting to Google...' : 'Login with Google'}
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium transition-colors"
                style={{ color: '#ea3663' }}
                onMouseEnter={(e) => e.target.style.color = '#d12a4f'}
                onMouseLeave={(e) => e.target.style.color = '#ea3663'}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
