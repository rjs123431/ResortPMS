import React from 'react';
import { Link } from 'react-router-dom';
import { MaintenanceLayout } from '@components/layout/MaintenanceLayout';
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

export const MaintenanceHubPage: React.FC = () => {
  const { isGranted } = useAuth();
  const canAccess = isGranted(PermissionNames.Pages_Maintenance);

  return (
    <MaintenanceLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Work orders, preventive maintenance, repair history, assets, and technician management.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NavCard
            to="/maintenance/work-orders"
            label="Work Orders"
            description="Create, assign, and track room maintenance tickets."
            allowed={canAccess}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          />
          <NavCard
            to="/maintenance/preventive"
            label="Preventive Maintenance"
            description="Schedule routine checks and preventive maintenance tasks."
            allowed={canAccess}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          />
          <NavCard
            to="/maintenance/repair-history"
            label="Repair History"
            description="Browse the log of completed repairs and maintenance work."
            allowed={canAccess}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </div>
    </MaintenanceLayout>
  );
};
