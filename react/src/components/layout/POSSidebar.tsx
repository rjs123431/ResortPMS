import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  TableCellsIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/pos', label: 'Home', title: 'POS Order Page', Icon: HomeIcon },
  { to: '/pos/tables', label: 'Tables', title: 'Manage tables of an outlet', Icon: TableCellsIcon },
  { to: '/pos/orders', label: 'Orders', title: 'View list of orders, manage it', Icon: ClipboardDocumentListIcon },
  { to: '/pos/reports', label: 'Reports', title: 'Show reports', Icon: ChartBarIcon },
  { to: '/pos/settings', label: 'Settings', title: 'Manage outlets, tables, menu items', Icon: Cog6ToothIcon },
] as const;

export const POSSidebar: React.FC = () => {
  const location = useLocation();
  const isOrderPage = location.pathname === '/pos' || location.pathname.startsWith('/pos/order/');

  return (
    <nav className="flex w-28 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      
      <ul className="flex flex-col gap-0.5 p-2">
        {navItems.map(({ to, label, title, Icon }) => {
          const isActive = to === '/pos' ? isOrderPage : location.pathname.startsWith(to);
          return (
            <li key={to}>
              <NavLink
                to={to}
                title={title}
                className={() =>
                  `flex flex-col items-center gap-1 rounded-lg px-3 py-3 text-center text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`
                }
              >
                <Icon className="h-6 w-6 shrink-0" aria-hidden />
                <span>{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
