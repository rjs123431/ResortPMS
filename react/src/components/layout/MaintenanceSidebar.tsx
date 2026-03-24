import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/maintenance', label: 'Overview', title: 'Maintenance overview', Icon: HomeIcon },
  { to: '/maintenance/work-orders', label: 'Work Orders', title: 'Room maintenance tickets', Icon: WrenchScrewdriverIcon },
  { to: '/maintenance/preventive', label: 'Preventive', title: 'Preventive maintenance schedules', Icon: ArrowPathIcon },
  { to: '/maintenance/repair-history', label: 'Repair History', title: 'Completed repairs history', Icon: ClockIcon },
] as const;

export const MaintenanceSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="shrink-0 h-full">
      <nav className="flex h-full flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:border-r">
        <ul className="flex flex-col gap-0.5 py-2 pr-2 pl-2 sm:pr-3 sm:min-w-[200px]">
          {navItems.map(({ to, label, title, Icon }) => {
            const isActive =
              to === '/maintenance'
                ? location.pathname === '/maintenance'
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
