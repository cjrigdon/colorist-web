import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, setAuthToken } from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [youtubeLoginUrl, setYoutubeLoginUrl] = useState(null);
  const [googleLoginUrl, setGoogleLoginUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch YouTube OAuth URL
    authAPI.getYoutubeRedirect()
      .then((data) => setYoutubeLoginUrl(data.url))
      .catch((error) => console.error('Error fetching YouTube redirect:', error));
  }, []);

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
            {/* YouTube Sign In */}
            {youtubeLoginUrl && (
              <a
                href={youtubeLoginUrl}
                className="w-full flex items-center justify-center px-4 py-3 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[48px]"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Sign in with YouTube
              </a>
            )}
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
