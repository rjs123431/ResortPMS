import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePOSSession } from '@contexts/POSSessionContext';

interface POSLayoutProps {
  children: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerRight?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const POSLayout: React.FC<POSLayoutProps> = ({ children, headerCenter, headerRight, sidebar }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentSession } = usePOSSession();

  // Close sidebar when escaping or resizing to lg+
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const sidebarWithClose =
    sidebar &&
    React.isValidElement(sidebar) &&
    React.cloneElement(sidebar as React.ReactElement<{ onClose?: () => void }>, {
      onClose: () => setSidebarOpen(false),
    });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-100 dark:bg-gray-900">
      <header className="sticky top-0 z-40 flex h-14 min-h-[44px] items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 safe-area-inset-top sm:gap-4 sm:px-4">
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* Hamburger: visible only below lg */}
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 lg:hidden"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link
            to="/"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 sm:px-3"
            aria-label="POS home"
          >
            {currentSession ? (
              <span className="flex flex-col items-baseline leading-tight">
                <span className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                  {currentSession.outletName ?? currentSession.outletId}
                </span>
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                  {currentSession.terminalName ?? currentSession.terminalId}
                </span>
              </span>
            ) : (
              <span className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">POS</span>
            )}
          </Link>
        </div>
        <div className="flex min-w-0 flex-1 justify-center overflow-hidden">
          <div className="truncate text-center text-sm sm:text-base">{headerCenter}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {headerRight}
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 overflow-auto">
        {/* Backdrop for mobile/tablet drawer */}
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setSidebarOpen(false)}
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${
            sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />

        {/* Sidebar: overlay on mobile/tablet, inline on lg+ */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white shadow-xl transition-transform duration-200 ease-out dark:border-gray-700 dark:bg-gray-800 lg:static lg:z-auto lg:mt-0 lg:w-28 lg:shrink-0 lg:translate-x-0 lg:shadow-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ top: 'var(--sat)' }}
        >
          <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700 lg:hidden">
            <span className="font-semibold text-gray-900 dark:text-white">Menu</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarWithClose ?? sidebar}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-3 sm:p-4 safe-area-inset-bottom">
          {children}
        </div>
      </main>
    </div>
  );
};
