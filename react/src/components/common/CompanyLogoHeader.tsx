import React from 'react';

export const CompanyLogoHeader: React.FC = () => {
  const [imgError, setImgError] = React.useState(false);
  return (
    <div className="mb-6 sm:mb-8 flex w-full flex-col items-center justify-center gap-2 text-left sm:flex-row sm:gap-3 sm:text-center lg:justify-start">
      {!imgError ? (
        <img
          src="/logo.png"
          alt="Company logo"
          className="h-12 sm:h-20 w-auto object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 sm:h-20 w-auto object-contain"
        >
          <rect width="80" height="80" rx="16" fill="#2563EB" />
          <text x="50%" y="54%" textAnchor="middle" dy=".35em" fontSize="22" fill="white" fontFamily="Arial, Helvetica, sans-serif">CMPC</text>
        </svg>
      )}
      <span className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center">
        PMS - Property Management System
      </span>
    </div>
  );
};