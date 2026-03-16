import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';

const navClass =
  'px-3 py-2 text-sm font-medium rounded-md transition-colors border-b-2 border-transparent';
const activeClass =
  'text-white bg-white/20 border-white';
const inactiveClass =
  'text-white/90 hover:text-white hover:bg-white/10';

export const TopNav: React.FC = () => {
  const { isGranted } = useAuth();

  const showReports = isGranted(PermissionNames.Pages_Reports);
  const showAdmin =
    isGranted(PermissionNames.Pages_Guests) ||
    isGranted(PermissionNames.Pages_Rooms) ||
    isGranted(PermissionNames.Pages_Admin_Users) ||
    isGranted(PermissionNames.Pages_Reports);

  return (
    <nav className="flex items-center gap-1" aria-label="Main navigation">
      <NavLink
        to="/front-desk"
        end
        className={({ isActive }) =>
          [navClass, isActive ? activeClass : inactiveClass].join(' ')
        }
      >
        Front Desk
      </NavLink>
      <NavLink
        to="/housekeeping"
        className={({ isActive }) =>
          [navClass, isActive ? activeClass : inactiveClass].join(' ')
        }
      >
        Housekeeping
      </NavLink>
      {showReports && (
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            [navClass, isActive ? activeClass : inactiveClass].join(' ')
          }
        >
          Reports
        </NavLink>
      )}
      {showAdmin && (
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            [navClass, isActive ? activeClass : inactiveClass].join(' ')
          }
        >
          Admin
        </NavLink>
      )}
    </nav>
  );
};
