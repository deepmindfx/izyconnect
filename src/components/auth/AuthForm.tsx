import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/Input';
// No icon import; using brand logo image
import { secureStorage } from '../../utils/secureStorage';

interface AuthFormProps {
  isAdmin?: boolean;
}

// Removed APK download promo per request

export const AuthForm: React.FC<AuthFormProps> = ({ isAdmin = false }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const { login, register, adminLogin, resetPassword, profileLoading, authUser } = useAuth();

  // Load saved credentials on component mount and optionally auto-login
  React.useEffect(() => {
    const credentials = secureStorage.getCredentials();
    if (credentials && credentials.rememberMe) {
      setEmail(credentials.email);
      setPassword(credentials.password);
      setRememberMe(true);
      // Optional auto-login is intentionally disabled
    }
  }, []);

  // If user is already authenticated, show a message
  React.useEffect(() => {
    if (authUser) {
      console.log('User already authenticated, should redirect from login page');
    }
  }, [authUser]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');
    setError('');

    try {
      const result = await resetPassword(resetEmail);
      if (result.success) {
        setResetMessage('Password reset email sent! Please check your inbox and follow the instructions to reset your password.');
        setResetEmail('');
      } else {
        setError(result.error || 'Failed to send password reset email');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let success = false;

      if (isAdmin) {
        success = await adminLogin(email, password);
        if (!success) {
          setError('Invalid admin credentials or insufficient permissions');
        }
      } else if (isLogin) {
        const result = await login(email, password);
        success = result.success;
        if (!success) {
          setError(result.error || 'Invalid email or password. Please check your credentials and try again.');
        } else {
          // Save or clear credentials based on remember me
          secureStorage.saveCredentials(email, password, rememberMe);
        }
      } else {
        const result = await register(email, password, phone, referralCode);
        success = result.success;
        if (!success) {
          setError(result.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/10 to-orange-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-300/10 to-orange-300/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 border border-white/50 shadow-2xl shadow-orange-500/10">
          {/* Subtle loading indicator for auth check */}
          {profileLoading && (
            <div className="mb-6 p-4 bg-orange-50/80 backdrop-blur-sm border border-orange-100 rounded-2xl">
              <div className="flex items-center gap-3 text-orange-700 text-sm">
                <div className="w-4 h-4 border-2 border-[#FF5F00] border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">Checking authentication...</span>
              </div>
            </div>
          )}

          <div className="text-center mb-10">
            <div className="relative w-24 h-24 mx-auto mb-8 group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF5F00] to-[#FF9000] rounded-3xl shadow-xl shadow-orange-500/20 group-hover:shadow-orange-500/30 transition-all duration-500 rotate-6 group-hover:rotate-12"></div>
              <div className="absolute inset-0 bg-white rounded-3xl flex items-center justify-center transform transition-all duration-500 -rotate-3 group-hover:rotate-0">
                <img
                  src="/starline-logo.png"
                  alt="IzyConnect"
                  className="w-14 h-14 object-contain"
                />
              </div>
            </div>
            <h1 className={`text-4xl font-extrabold mb-3 tracking-tight ${isAdmin ? 'text-gray-900' : 'text-gray-900'}`}>
              {isAdmin ? 'Admin Portal' : (isLogin ? 'Welcome Back!' : 'Create Account')}
            </h1>
            <p className="text-gray-500 text-lg">
              {isAdmin ? 'Secure admin access' : (isLogin ? 'Sign in to manage your internet' : 'Join thousands of connected users')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter your email address"
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                required
              />

              {!isLogin && !isAdmin && (
                <Input
                  label="Phone Number"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="Enter your phone number (optional)"
                />
              )}

              {!isLogin && !isAdmin && (
                <Input
                  label="Referral Code"
                  type="text"
                  value={referralCode}
                  onChange={setReferralCode}
                  placeholder="Enter referral code (optional)"
                />
              )}
            </div>

            {isLogin && !isAdmin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#f27e31] bg-white border-gray-300 rounded focus:ring-[#f27e31] focus:ring-2"
                  />
                  <label htmlFor="rememberMe" className="text-gray-700 text-sm font-medium cursor-pointer hover:text-gray-900 transition-colors">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-[#f27e31] hover:text-[#d96d2b] font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {isLogin && !isAdmin && rememberMe && email && password && (
              <div className="text-xs text-orange-600 font-medium bg-orange-50 px-3 py-2 rounded-lg">
                ✓ Credentials will be saved for quick login
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center gap-3 text-red-700 text-sm">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF8000] hover:from-[#E65100] hover:to-[#FF6D00] disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-1 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isAdmin ? 'Access Portal' : (isLogin ? 'Sign In' : 'Create Account')}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>

            {!isAdmin && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>
            )}

            {!isAdmin && (
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="inline-flex items-center gap-2 text-gray-500 hover:text-[#FF5F00] text-sm font-semibold transition-all duration-200 group"
                >
                  {isLogin ? (
                    <>
                      Don't have an account? <span className="text-[#FF5F00] group-hover:underline">Sign up now</span>
                    </>
                  ) : (
                    <>
                      Already have an account? <span className="text-[#FF5F00] group-hover:underline">Sign in</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 border-2 border-[#f27e31]/30 shadow-2xl shadow-black/25 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
              <p className="text-gray-600">Enter your email address and we'll send you a secure link to reset your password.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                value={resetEmail}
                onChange={setResetEmail}
                placeholder="Enter your email address"
                required
                className="w-full"
              />

              {resetMessage && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                  <div className="flex items-center gap-3 text-orange-700 text-sm">
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">{resetMessage}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <div className="flex items-center gap-3 text-red-700 text-sm">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                    setResetMessage('');
                    setError('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading || !resetEmail}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#f27e31] to-[#d96d2b] hover:from-[#d96d2b] hover:to-[#b3521b] disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed"
                >
                  {resetLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};