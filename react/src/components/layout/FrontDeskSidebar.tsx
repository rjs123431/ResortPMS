import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ArrowLeftEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  Squares2X2Icon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/front-desk', label: 'Dashboard', title: 'Front desk dashboard', Icon: HomeIcon },
  { to: '/front-desk/room-rack', label: 'Room Rack', title: 'View room status and availability', Icon: Squares2X2Icon },
  { to: '/front-desk/reservations', label: 'Reservations', title: 'Create and manage reservations', Icon: CalendarDaysIcon },
  { to: '/front-desk/check-in', label: 'Arrivals', title: 'Check in arriving guests', Icon: ArrowRightStartOnRectangleIcon },
  { to: '/front-desk/walk-in', label: 'Walk-In', title: 'Create walk-in check-ins', Icon: UsersIcon },
  { to: '/front-desk/stays', label: 'In House', title: 'Manage in-house stays', Icon: HomeIcon },
  { to: '/front-desk/check-out', label: 'Departures', title: 'Check out departing guests', Icon: ArrowLeftEndOnRectangleIcon },
  { to: '/front-desk/guests', label: 'Guests', title: 'Guest profiles', Icon: UserGroupIcon },
  { to: '/front-desk/pre-check-ins', label: 'Pre Check-In', title: 'Manage pre check-ins', Icon: ClipboardDocumentListIcon },
  { to: '/front-desk/incidents', label: 'Incidents', title: 'Log and track incidents', Icon: ExclamationTriangleIcon },
] as const;

export const FrontDeskSidebar: React.FC = () => {
  const location = useLocation();

  const isActiveFor = (to: string) => {
    if (to === '/front-desk') return location.pathname === '/front-desk' || location.pathname === '/front-desk/';
    if (to === '/front-desk/reservations') return location.pathname === '/front-desk/reservations' || location.pathname.startsWith('/front-desk/reservations/');
    if (to === '/front-desk/check-in') return location.pathname === '/front-desk/check-in' || location.pathname.startsWith('/front-desk/check-in/');
    if (to === '/front-desk/stays') return location.pathname === '/front-desk/stays' || location.pathname.startsWith('/front-desk/stays/');
    if (to === '/front-desk/check-out') return location.pathname === '/front-desk/check-out' || location.pathname.startsWith('/front-desk/check-out/');
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  return (
    <aside className="shrink-0 h-full">
      <nav className="flex h-full flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:border-r">
        <ul className="flex flex-col gap-0.5 py-2 pr-2 pl-2 sm:pr-3 sm:min-w-[200px]">
          {navItems.map(({ to, label, title, Icon }) => {
            const isActive = isActiveFor(to);

            return (
              <li key={to}>
                <NavLink
                  to={to}
                  title={title}
                  className={() =>
                    `flex min-h-[44px] min-w-[44px] items-center gap-3 rounded-lg px-0 py-2 justify-center w-14 text-xs sm:text-sm sm:w-full sm:px-4 sm:justify-start transition active:scale-[0.98] ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="truncate hidden sm:inline">{label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
