import React from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@components/layout/MainLayout';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';

interface NavCardProps {
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  allowed: boolean;
}

const NavCard: React.FC<NavCardProps> = ({ to, label, description, icon, allowed }) => {
  if (!allowed) return null;
  return (
    <Link
      to={to}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all group"
    >
      <span className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
          {label}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
    </Link>
  );
};

export const HousekeepingHubPage: React.FC = () => {
  const { isGranted } = useAuth();
  const canAccess = isGranted(PermissionNames.Pages_Rooms);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Housekeeping</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Room status, cleaning board, and tasks.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NavCard
            to="/housekeeping/room-status"
            label="Room Status"
            description="View and update housekeeping room status."
            allowed={canAccess}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2m0 0v10a2 2 0 01-2 2H8a2 2 0 01-2-2V7m4 4h4m-4 4h4" />
              </svg>
            }
          />
          <NavCard
            to="/housekeeping/cleaning-board"
            label="Cleaning Board"
            description="Manage cleaning assignments and progress."
            allowed={canAccess}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
          />
          <NavCard
            to="/housekeeping/tasks"
            label="Tasks List"
            description="View and manage housekeeping tasks."
            allowed={canAccess}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </div>
    </MainLayout>
  );
};
