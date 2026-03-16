import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CalendarDaysIcon, UserGroupIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

const navItems = [
  { to: '/front-desk/room-rack', label: 'Room Rack', title: 'View room status and availability', Icon: Squares2X2Icon },
  { to: '/front-desk/reservations', label: 'Reservations', title: 'Create and manage reservations', Icon: CalendarDaysIcon },
  { to: '/front-desk/guests', label: 'Guests', title: 'Guest profiles', Icon: UserGroupIcon },
] as const;

export const FrontDeskSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="shrink-0 h-full">
      <nav className="flex h-full flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <ul className="flex flex-col gap-0.5 py-2 pr-2 pl-2 sm:pr-3 sm:min-w-[200px]">
          {navItems.map(({ to, label, title, Icon }) => {
            const isActive =
              to === '/front-desk/reservations'
                ? location.pathname === '/front-desk/reservations' || location.pathname.startsWith('/front-desk/reservations/')
                : location.pathname.startsWith(to);
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
