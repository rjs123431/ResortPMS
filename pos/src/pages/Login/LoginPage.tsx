import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { ThemeToggle } from '@components/common/ThemeToggle';
import { ServerConnectivityBanner } from '@components/common/ServerConnectivityBanner';
import { CompanyLogoHeader } from '@components/common/CompanyLogoHeader';
const FALLBACK_VERSION = '';

function formatDateToYYYYMMDD(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appVersion, setAppVersion] = useState<string>(FALLBACK_VERSION);
  const [releaseDate, setReleaseDate] = useState<string | null>(null);

  const { login, isAuthenticated, application } = useAuth();

  useEffect(() => {
    if (application?.version) setAppVersion(application.version);
    if (application?.releaseDate) setReleaseDate(application.releaseDate);
  }, [application]);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract returnUrl from query params
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('returnUrl') || (location.state as any)?.from?.pathname || '/';

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={returnUrl} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login({
        userNameOrEmailAddress: email,
        password,
        rememberClient: rememberMe,
        returnUrl: returnUrl
      });

      // Use returnUrl from response if available, otherwise use the one from params
      const targetUrl = response?.result?.returnUrl || returnUrl;
      navigate(targetUrl, { replace: true });
    } catch (err: any) {
      console.log('Login error:', err.response || err);
      setError(err.response?.data?.error?.details || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-20 xl:px-24 min-h-0">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <CompanyLogoHeader />

          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center lg:text-left">
              Sign In
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center lg:text-left">
              Enter your username and password to sign in!
            </p>
          </div>

          <ServerConnectivityBanner />

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Username<span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Password<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Keep me logged in
                </label>
              </div>

              <div className="text-sm flex items-center gap-2">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot password?
                </Link>
              </div>
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
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
            Powered by{' '}
            <a
              href="https://simplesweldo.com"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              PMS
            </a>{' '}
            {appVersion}
            {releaseDate && <span> [{formatDateToYYYYMMDD(releaseDate)}]</span>}
          </p>
        </div>
      </div>

      <ThemeToggle />
    </div>
  );
};
