import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  linkTo?: string;
  linkText?: string;
  onClick?: () => void;
  iconBgColor?: string;
  isLoading?: boolean;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  description,
  linkTo,
  onClick,
  linkText = 'View Details',
  iconBgColor = 'bg-blue-500',
  isLoading = false,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className={`${iconBgColor} p-3 rounded-lg flex-shrink-0`}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {value}
            </p>
          )}
          
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </h3>
        </div>
      </div>
      
      {description && (
        <p className="hidden md:block text-sm text-gray-500 dark:text-gray-400 mb-3">
          {description}
        </p>
      )}
      
      {linkTo && (
        <Link
          to={linkTo}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center"
        >
          {linkText}
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
      
      {onClick && !linkTo && (
        <button
          onClick={onClick}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center"
        >
          {linkText}
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};
