import React from 'react';
import { Link } from 'react-router-dom';

interface POSLayoutProps {
  children: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerRight?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const POSLayout: React.FC<POSLayoutProps> = ({ children, headerCenter, headerRight, sidebar }) => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-900">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex shrink-0 items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to PMS
          </Link>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">POS (F&B)</span>
        </div>
        <div className="flex min-w-0 flex-1 justify-center">
          {headerCenter}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerRight}
        </div>
      </header>
      <main className="flex min-h-0 flex-1 overflow-auto">
        {sidebar}
        <div className="flex min-h-0 flex-1 flex-col p-4">
          {children}
        </div>
      </main>
    </div>
  );
};
