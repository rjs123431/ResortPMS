import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@components/common/ThemeToggle';
import { ServerConnectivityBanner } from '@components/common/ServerConnectivityBanner';
import { CompanyLogoHeader } from '@components/common/CompanyLogoHeader';
import { authService } from '@services/auth.service';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.sendPasswordResetCode(email);
      setSuccess(true);
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:flex-1 bg-[#0063a1] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '48px 48px'
            }}></div>
          </div>
          <div className="relative flex flex-col items-center justify-center w-full px-8">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/logo.png"
                alt="Company logo"
                className="h-14 w-auto object-contain"
              />
              <span className="text-3xl font-bold text-white">PMS</span>
            </div>
            <p className="text-blue-200 text-center text-lg">
              Smart solutions at your fingertips.
            </p>
          </div>
        </div>

        {/* Right Side - Success Message */}
        <div className="flex-1 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-20 xl:px-24 min-h-0">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <CompanyLogoHeader />

            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center lg:text-left">
                Password Reset Email Sent
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center lg:text-left">
                Check your email for password reset instructions.
              </p>
            </div>

            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
              <p className="text-sm text-green-800 dark:text-green-400">
                Password reset email has been sent to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        <ThemeToggle />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-[#0063a1] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '48px 48px'
          }}></div>
        </div>
        <div className="relative flex flex-col items-center justify-center w-full px-8">
          <div className="flex items-center space-x-3 mb-4">
            <img
              src="/logo.png"
              alt="Company logo"
              className="h-14 w-auto object-contain"
            />
            <span className="text-3xl font-bold text-white">PMS</span>
          </div>
          <p className="text-blue-200 text-center text-lg">
            Smart solutions at your fingertips.
          </p>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="flex-1 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-20 xl:px-24 min-h-0">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <CompanyLogoHeader />

          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center lg:text-left">
              Forgot Password
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center lg:text-left">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <ServerConnectivityBanner />

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Email Address<span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>

      <ThemeToggle />
    </div>
  );
};