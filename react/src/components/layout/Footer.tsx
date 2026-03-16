import React from 'react';
import { useAuth } from '@contexts/AuthContext';

export const Footer: React.FC = () => {
  const { application } = useAuth();

  const formatDateToYYYYMMDD = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 safe-area-inset">
      <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-gray-600 dark:text-gray-400 text-xs sm:text-sm text-center sm:text-left">
          <div className="break-words">
            © {new Date().getFullYear()} PMS. All rights reserved.
          </div>
          {application && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span>Version {application.version}</span>
              {application.releaseDate && (
                <span>[{formatDateToYYYYMMDD(application.releaseDate)}]</span>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
