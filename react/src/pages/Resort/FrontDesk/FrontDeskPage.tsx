import React from 'react';
import { Link } from 'react-router-dom';
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

export const FrontDeskPage: React.FC = () => {
  const { isGranted } = useAuth();

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Front Desk</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Room rack, reservations, check-in, in-house stays, and check-out.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NavCard
            to="/front-desk/room-rack"
            label="Room Rack"
            description="View and manage room status and availability."
            allowed={isGranted(PermissionNames.Pages_Rooms)}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2m0 0v10a2 2 0 01-2 2H8a2 2 0 01-2-2V7m4 4h4m-4 4h4" />
              </svg>
            }
          />
          <NavCard
            to="/front-desk/reservations"
            label="Reservations"
            description="Create and manage reservations."
            allowed={isGranted(PermissionNames.Pages_Reservations)}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <NavCard
            to="/front-desk/check-in"
            label="Check-In"
            description="Check in reservations and walk-ins."
            allowed={isGranted(PermissionNames.Pages_CheckIn)}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 8l2 2 4-4" />
              </svg>
            }
          />
          <NavCard
            to="/front-desk/stays"
            label="In-House"
            description="View and manage current in-house stays."
            allowed={isGranted(PermissionNames.Pages_Stays)}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-6 4h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          <NavCard
            to="/front-desk/check-out"
            label="Check-Out"
            description="Process check-outs and settlements."
            allowed={isGranted(PermissionNames.Pages_CheckOut)}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V7m-6 14h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>
      </div>
    </>
  );
};
