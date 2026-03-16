import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export const FrontDeskTopNav: React.FC = () => {
  const location = useLocation();

  const base = '/front-desk';
  const navItems = [
    { to: `${base}`, label: 'Dashboard' },
    { to: `${base}/room-rack`, label: 'Room Rack' },
    { to: `${base}/reservations`, label: 'Reservations' },
    { to: `${base}/check-in`, label: 'Arrivals' },
    { to: `${base}/walk-in`, label: 'Walk-In' },
    { to: `${base}/stays`, label: 'In House' },
    { to: `${base}/check-out`, label: 'Departures' },
    { to: `${base}/guests`, label: 'Guests' },
  ] as const;

  const isActiveFor = (to: string) => {
    if (to === base) return location.pathname === '/front-desk' || location.pathname === '/front-desk/';
    if (to === `${base}/reservations`) return location.pathname === '/front-desk/reservations' || location.pathname.startsWith('/front-desk/reservations/');
    if (to === `${base}/check-in`) return location.pathname === '/front-desk/check-in' || location.pathname.startsWith('/front-desk/check-in/');
    if (to === `${base}/stays`) return location.pathname === '/front-desk/stays' || location.pathname.startsWith('/front-desk/stays/');
    if (to === `${base}/check-out`) return location.pathname === '/front-desk/check-out' || location.pathname.startsWith('/front-desk/check-out/');
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  return (
    <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <nav className="px-2 sm:px-3 lg:px-4" aria-label="Front desk navigation">
        <ul className="flex gap-1 overflow-x-auto py-2">
          {navItems.map(({ to, label }) => {
            const isActive = isActiveFor(to);

            return (
              <li key={to}>
                <NavLink
                  to={to}
                  className={() =>
                    `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

