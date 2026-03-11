import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { authService } from '@services/auth.service';
import { useSignalR } from '@contexts/SignalRContext';
import { HeaderNotifications } from './HeaderNotifications';

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSignalR();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBackToAdminLoading, setIsBackToAdminLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    window.location.assign('/login');
  };

  const isAdmin = (user?.userName || '').trim().toLowerCase() === 'admin';
  const impersonatorUserId = authService.getImpersonatorUserId();
  const isImpersonated = Boolean(impersonatorUserId);

  const handleImpersonatePage = () => {
    setIsDropdownOpen(false);
    navigate('/impersonate');
  };

  const handleBackToAdmin = async () => {
    if (isBackToAdminLoading) {
      return;
    }

    setIsBackToAdminLoading(true);
    try {
      const backResult = await authService.backToImpersonator();
      const authResult = await authService.impersonatedAuthenticate(backResult.impersonationToken);
      authService.setAuthToken(authResult.accessToken, authResult.expireInSeconds, authResult.encryptedAccessToken);

      setIsDropdownOpen(false);
      window.location.assign('/');
    } catch (error) {
      console.error('Failed to return to impersonator:', error);
    } finally {
      setIsBackToAdminLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isDropdownOpen) {
      // Close any nested menu state here if added in the future.
    }
  }, [isDropdownOpen]);

  return (
    <header className="bg-[#016fb3] shadow-sm sticky top-0 z-50 border-b border-[#015a8c] safe-area-inset">
      <div className="px-4">
        <div className="flex justify-between items-center h-14 sm:h-16 min-h-[3.5rem]">
          <div className="flex items-center min-w-0">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="Company logo"
                    className="h-8 sm:h-10 w-auto object-contain max-h-full"
                  />
                </div>
                <h1 className="text-base sm:text-xl font-bold text-white truncate">PMS</h1>
              </Link>
              <button
                type="button"
                onClick={onMenuClick}
                aria-label="Toggle menu"
                className="lg:hidden flex-shrink-0 p-2 -m-2 ml-1 text-white hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/50 rounded touch-manipulation"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isSidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:space-x-4 flex-shrink-0">
            {user && (
              <>
                <HeaderNotifications />
                <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 text-white font-medium text-sm uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 touch-manipulation"
                  aria-label="User menu"
                  title={isConnected ? 'Real-time notifications active' : 'Real-time notifications inactive'}
                >
                  {(() => {
                    const first = (user.name || '').trim().charAt(0) || '';
                    const last = (user.surname || '').trim().charAt(0) || '';
                    const initials = (first + last).toUpperCase() || '?';
                    return initials;
                  })()}
                  {/* SignalR connection indicator */}
                  {isConnected && (
                    <span className="absolute bottom-0.5 right-0.5 inline-block w-2 h-2 bg-green-400 rounded-full ring-2 ring-[#016fb3]"></span>
                  )}
                </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      {isImpersonated && (
                        <>
                          <button
                            onClick={handleBackToAdmin}
                            className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            disabled={isBackToAdminLoading}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7m-7 7h18" />
                            </svg>
                            <span>{isBackToAdminLoading ? 'Returning...' : 'Back to Admin'}</span>
                          </button>
                          <div className="my-1 h-px bg-gray-100 dark:bg-gray-700" />
                        </>
                      )}

                      <Link
                        to="/my-account"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Manage Account</span>
                      </Link>
                      <Link
                        to="/change-password"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <span>Change Password</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
