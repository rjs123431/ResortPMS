import React from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@components/layout/MainLayout';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';

interface HomeCardProps {
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  allowed: boolean;
}

const HomeCard: React.FC<HomeCardProps> = ({ to, label, description, icon, allowed }) => {
  if (!allowed) return null;
  return (
    <Link
      to={to}
      className="flex flex-col rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all group p-6"
    >
      <span className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 mb-4">
        {icon}
      </span>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
        {label}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </Link>
  );
};

export const HomePage: React.FC = () => {
  const { user, isGranted } = useAuth();

  const displayName = [user?.name].filter(Boolean).join(' ').trim() || 'User';

  const showFrontDesk = true;
  const showHousekeeping = isGranted(PermissionNames.Pages_Rooms);
  const showMaintenance = isGranted(PermissionNames.Pages_Maintenance);
  const showReports = isGranted(PermissionNames.Pages_Reports);
  const showAdmin =
    isGranted(PermissionNames.Pages_Guests) ||
    isGranted(PermissionNames.Pages_Rooms) ||
    isGranted(PermissionNames.Pages_Admin_Users) ||
    isGranted(PermissionNames.Pages_Reports);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, {displayName}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choose an area below to get started.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HomeCard
            to="/front-desk"
            label="Front Desk"
            description="Room rack, reservations, check-in, in-house stays, and check-out."
            allowed={showFrontDesk}
            icon={
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-8 4h6m-8 6h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <HomeCard
            to="/housekeeping"
            label="Housekeeping"
            description="Room status, cleaning board, and tasks."
            allowed={showHousekeeping}
            icon={
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <HomeCard
            to="/maintenance"
            label="Maintenance"
            description="Work orders, preventive maintenance, and repair history."
            allowed={showMaintenance}
            icon={
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2M12 3v4m6.364 1.636l-1.414 1.414M20 12h-4m2.364 6.364l-1.414-1.414M12 21v-4m-6.364 1.364l1.414-1.414M4 12h4M5.636 5.636l1.414 1.414" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121a3 3 0 11-4.242-4.242 3 3 0 014.242 4.242z" />
              </svg>
            }
          />
          <HomeCard
            to="/reports"
            label="Reports"
            description="Dashboard KPIs, occupancy, revenue, and analytics."
            allowed={showReports}
            icon={
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <HomeCard
            to="/admin"
            label="Admin"
            description="Setup and administration: guests, rooms, users, roles, and more."
            allowed={showAdmin}
            icon={
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>
      </div>
    </MainLayout>
  );
};
